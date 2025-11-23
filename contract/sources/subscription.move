module atrium::subscription {
    use sui::{
        event,
        clock::Clock,
        coin::Coin,
        table::{Self, Table},
    };
    use sui::sui::SUI;
    use atrium::identity::{Self, Identity};
    use atrium::space::{Self, Space, FanRegistry, add_fan_avatar};

    // ===== Error Codes =====
    const EInsufficientPayment: u64 = 0;
    const ENoIdentity: u64 = 1;
    const ENoAvatar: u64 = 2;
    const EAlreadySubscribed: u64 = 3;
    // const ESubscriptionExpired: u64 = 4; // Unused
    const ENotSubscriber: u64 = 5;
    const ENotOwner: u64 = 6;

    // ===== Constants =====
    const ONE_DAY_MS: u64 = 86_400_000;     // 24 hours in milliseconds
    // const ONE_MONTH_MS: u64 = 2_592_000_000; // Unused

    // ===== Structs =====

    /// Subscription NFT - proves active subscription
    public struct Subscription has key, store {
        id: UID,
        space_id: ID,
        subscriber: address,
        subscribed_at: u64,
        expires_at: u64,
        duration_days: u64,
    }

    /// Global subscription registry
    public struct SubscriptionRegistry has key {
        id: UID,
        // Nested table: space_id -> (subscriber_address -> subscription_id)
        subscriptions: Table<ID, Table<address, ID>>,
        total_subscriptions: u64,
        active_subscriptions: u64,
    }

    // ===== Events =====

    public struct SubscriptionCreated has copy, drop {
        subscription_id: ID,
        space_id: ID,
        subscriber: address,
        expires_at: u64,
        amount_paid: u64,
    }

    public struct SubscriptionRenewed has copy, drop {
        subscription_id: ID,
        new_expires_at: u64,
        amount_paid: u64,
    }

    #[allow(unused_field)]
    public struct SubscriptionExpiredEvent has copy, drop {
        subscription_id: ID,
        space_id: ID,
        subscriber: address,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let registry = SubscriptionRegistry {
            id: object::new(ctx),
            subscriptions: table::new(ctx),
            total_subscriptions: 0,
            active_subscriptions: 0,
        };
        transfer::share_object(registry);
    }

    // ===== Public Entry Functions =====

    /// Create a lifetime subscription for the space creator
    public fun create_creator_subscription(
        registry: &mut SubscriptionRegistry,
        space: &Space,
        creator: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): Subscription {
        let space_id = object::id(space);
        let subscription = Subscription {
            id: object::new(ctx),
            space_id,
            subscriber: creator,
            subscribed_at: clock.timestamp_ms(),
            expires_at: 18446744073709551615,
            duration_days: 0,
        };

        let subscription_id = object::id(&subscription);

        if (!registry.subscriptions.contains(space_id)) {
            registry.subscriptions.add(space_id, table::new(ctx));
        };
        
        let space_subs = registry.subscriptions.borrow_mut(space_id);
        space_subs.add(creator, subscription_id);
        
        registry.total_subscriptions = registry.total_subscriptions + 1;
        registry.active_subscriptions = registry.active_subscriptions + 1;

        event::emit(SubscriptionCreated {
            subscription_id,
            space_id,
            subscriber: creator,
            expires_at: 18446744073709551615,
            amount_paid: 0,
        });

        subscription
    }

    /// Subscribe to a creator's space
    public fun subscribe(
        registry: &mut SubscriptionRegistry,
        fan_registry: &mut FanRegistry,
        space: &Space,
        identity: &Identity,
        mut payment: Coin<SUI>,
        duration_days: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): (Subscription, Coin<SUI>, Coin<SUI>) {
        let sender = ctx.sender();
        let space_id = object::id(space);
        
        assert!(identity::owner(identity) == sender, ENoIdentity);
        assert!(identity::avatar_blob_id(identity).is_some(), ENoAvatar);

        if (is_subscribed_internal(registry, sender, space_id)) {
            abort EAlreadySubscribed
        };

        let subscription_price = space::subscription_price(space);
        let total_price = subscription_price * duration_days;
        assert!(payment.value() >= total_price, EInsufficientPayment);

        let payment_amount = payment.split(total_price, ctx);
        let current_time = clock.timestamp_ms();
        let expires_at = current_time + (duration_days * ONE_DAY_MS);

        let subscription = Subscription {
            id: object::new(ctx),
            space_id,
            subscriber: sender,
            subscribed_at: current_time,
            expires_at,
            duration_days,
        };

        let subscription_id = object::id(&subscription);

        if (!registry.subscriptions.contains(space_id)) {
            registry.subscriptions.add(space_id, table::new(ctx));
        };
        
        let space_subs = registry.subscriptions.borrow_mut(space_id);
        space_subs.add(sender, subscription_id);
        
        registry.total_subscriptions = registry.total_subscriptions + 1;
        registry.active_subscriptions = registry.active_subscriptions + 1;

        let avatar_blob_id = identity::avatar_blob_id(identity).destroy_some();
        add_fan_avatar(fan_registry, space, sender, avatar_blob_id, ctx);

        event::emit(SubscriptionCreated {
            subscription_id,
            space_id,
            subscriber: sender,
            expires_at,
            amount_paid: total_price,
        });

        (subscription, payment_amount, payment)
    }

    /// Renew an existing subscription
    public fun renew_subscription(
        _registry: &mut SubscriptionRegistry,
        subscription: &mut Subscription,
        mut payment: Coin<SUI>,
        space: &Space,
        additional_days: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): (Coin<SUI>, Coin<SUI>) {
        assert!(subscription.subscriber == ctx.sender(), ENotSubscriber);

        let subscription_price = space::subscription_price(space);
        let total_price = subscription_price * additional_days;
        assert!(payment.value() >= total_price, EInsufficientPayment);

        let payment_amount = payment.split(total_price, ctx);
        let current_time = clock.timestamp_ms();
        let extension = additional_days * ONE_DAY_MS;
        
        if (subscription.expires_at < current_time) {
            subscription.expires_at = current_time + extension;
        } else {
            subscription.expires_at = subscription.expires_at + extension;
        };

        subscription.duration_days = subscription.duration_days + additional_days;

        event::emit(SubscriptionRenewed {
            subscription_id: object::id(subscription),
            new_expires_at: subscription.expires_at,
            amount_paid: total_price,
        });

        (payment_amount, payment)
    }

    // ===== Public Read Functions =====

    public fun is_subscribed(
        registry: &SubscriptionRegistry,
        subscriber: address,
        space_kiosk_id: ID,
        _clock: &Clock
    ): bool {
        is_subscribed_internal(registry, subscriber, space_kiosk_id)
    }

    public(package) fun is_subscribed_internal(
        registry: &SubscriptionRegistry,
        subscriber: address,
        space_kiosk_id: ID,
    ): bool {
        if (!registry.subscriptions.contains(space_kiosk_id)) {
            return false
        };

        let space_subs = registry.subscriptions.borrow(space_kiosk_id);
        space_subs.contains(subscriber)
    }

    public fun expires_at(subscription: &Subscription): u64 {
        subscription.expires_at
    }

    public fun is_expired(subscription: &Subscription, clock: &Clock): bool {
        subscription.expires_at < clock.timestamp_ms()
    }

    public fun space_id(subscription: &Subscription): ID {
        subscription.space_id
    }

    public fun subscriber(subscription: &Subscription): address {
        subscription.subscriber
    }

    public fun total_subscriptions(registry: &SubscriptionRegistry): u64 {
        registry.total_subscriptions
    }

    public fun active_subscriptions(registry: &SubscriptionRegistry): u64 {
        registry.active_subscriptions
    }

    // ===== Seal Protocol Integration =====

    /// Seal approve for content decryption - Creator version
    entry fun seal_approve_as_creator(
        _id: vector<u8>,
        space: &Space,
        ownership: &space::SpaceOwnership,
    ) {
        assert!(
            space::get_space_ownership_space_id(ownership) == object::id(space),
            ENotOwner
        );
    }

    /// Seal approve for content decryption - Subscriber version
    entry fun seal_approve_as_subscriber(
        _id: vector<u8>,
        space: &Space,
        subscription: &Subscription,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let space_id = object::id(space);
        assert!(subscription.subscriber == ctx.sender(), ENotSubscriber);
        assert!(subscription.space_id == space_id, ENotSubscriber);
        assert!(!is_expired(subscription, clock), ENotSubscriber);
    }

    // ===== Test Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

