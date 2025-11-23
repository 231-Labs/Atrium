module atrium::space {
    use std::string::String;
    use sui::{
        event,
        clock::Clock,
        coin::Coin,
        sui::SUI,
        kiosk::Kiosk,
        table::{Self, Table},
    };
    use atrium::identity::{Self, IdentityRegistry};

    // ===== Error Codes =====
    const EInsufficientPayment: u64 = 0;
    const ENotOwner: u64 = 1;

    // ===== Constants =====
    const SPACE_INIT_FEE: u64 = 100_000_000; // 0.1 SUI
    

    // ===== Structs =====

    /// Space object - shared object representing a creator's 3D space
    public struct Space has key {
        id: UID,
        name: String,
        description: String,
        cover_image: String,         // 2D cover image blob id
        config_quilt: String,         // Walrus quilt for scene config JSON
        video_blob_ids: vector<String>,
        subscription_price: u64,      // Price in MIST
        creator: address,
        marketplace_kiosk_id: ID,     // Kiosk ID for NFT marketplace in 3D scene
        created_at: u64,
        updated_at: u64,
    }

    /// SpaceOwnership NFT - proves ownership of a Space (can be transferred)
    public struct SpaceOwnership has key, store {
        id: UID,
        space_id: ID,
    }

    /// Fan avatar information
    public struct FanAvatar has store, copy, drop {
        owner: address,
        avatar_blob_id: String,
    }

    /// FanRegistry - shared object managing all fan avatars across spaces
    public struct FanRegistry has key {
        id: UID,
        // space_id -> Table<fan_address, FanAvatar>
        fans: Table<ID, Table<address, FanAvatar>>,
    }

    /// Global space registry
    public struct SpaceRegistry has key {
        id: UID,
        spaces: vector<ID>,          // List of all space IDs
        total_spaces: u64,
    }

    // ===== Events =====

    public struct SpaceInitialized has copy, drop {
        space_id: ID,
        marketplace_kiosk_id: ID,
        creator: address,
        name: String,
        subscription_price: u64,
        created_at: u64,
    }

    public struct SpaceConfigUpdated has copy, drop {
        space_id: ID,
        creator: address,
        config_quilt: String,
        updated_at: u64,
    }

    public struct FanAvatarAdded has copy, drop {
        space_id: ID,
        fan_address: address,
        avatar_blob_id: String,
    }


    public struct ContentAdded has copy, drop {
        space_id: ID,
        blob_object_id: ID,
        blob_id: String,
        content_type: u8,        // 1=video, 2=essay, 3=image
        title: String,
        description: String,
        encrypted: bool,
        price: u64,              // MIST
        tags: vector<String>,
        creator: address,
        created_at: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let registry = SpaceRegistry {
            id: object::new(ctx),
            spaces: vector::empty(),
            total_spaces: 0,
        };
        transfer::share_object(registry);

        let fan_registry = FanRegistry {
            id: object::new(ctx),
            fans: table::new(ctx),
        };
        transfer::share_object(fan_registry);
    }

    // ===== Public Functions =====

    /// Initialize a new space with marketplace kiosk
    public fun initialize_space(
        registry: &mut SpaceRegistry,
        identity_registry: &mut IdentityRegistry,
        name: String,
        description: String,
        cover_image: String,
        config_quilt: String,
        subscription_price: u64,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): (SpaceOwnership, Coin<SUI>, Kiosk, sui::kiosk::KioskOwnerCap) {
        let sender = ctx.sender();

        assert!(payment.value() >= SPACE_INIT_FEE, EInsufficientPayment);

        let fee = payment.split(SPACE_INIT_FEE, ctx);
        transfer::public_transfer(fee, @protocol_treasury);

        let (marketplace_kiosk, marketplace_kiosk_cap) = sui::kiosk::new(ctx);
        let marketplace_kiosk_id = object::id(&marketplace_kiosk);
        let space = Space {
            id: object::new(ctx),
            name,
            description,
            cover_image,
            config_quilt,
            video_blob_ids: vector::empty(),
            subscription_price,
            creator: sender,
            marketplace_kiosk_id,
            created_at: clock.timestamp_ms(),
            updated_at: clock.timestamp_ms(),
        };

        let space_id = object::id(&space);
        let space_name = space.name;
        let created_at_time = space.created_at;

        registry.spaces.push_back(space_id);
        registry.total_spaces = registry.total_spaces + 1;

        // Increment creator count in IdentityRegistry
        identity::increment_creator_count(identity_registry);

        let ownership = SpaceOwnership {
            id: object::new(ctx),
            space_id,
        };

        transfer::share_object(space);

        event::emit(SpaceInitialized {
            space_id,
            marketplace_kiosk_id,
            creator: sender,
            name: space_name,
            subscription_price,
            created_at: created_at_time,
        });

        (ownership, payment, marketplace_kiosk, marketplace_kiosk_cap)
    }

    /// Update space configuration (requires SpaceOwnership NFT)
    public fun update_space_config(
        space: &mut Space,
        ownership: &SpaceOwnership,
        new_name: option::Option<String>,
        new_description: option::Option<String>,
        new_cover_image: option::Option<String>,
        new_config_quilt: option::Option<String>,
        new_subscription_price: option::Option<u64>,
        clock: &Clock,
    ) {
        let space_id = object::id(space);
        assert!(ownership.space_id == space_id, ENotOwner);
        if (new_name.is_some()) {
            space.name = new_name.destroy_some();
        };
        if (new_description.is_some()) {
            space.description = new_description.destroy_some();
        };
        if (new_cover_image.is_some()) {
            space.cover_image = new_cover_image.destroy_some();
        };
        if (new_config_quilt.is_some()) {
            let quilt = new_config_quilt.destroy_some();
            space.config_quilt = quilt;
        };
        if (new_subscription_price.is_some()) {
            space.subscription_price = new_subscription_price.destroy_some();
        };

        space.updated_at = clock.timestamp_ms();
        
        event::emit(SpaceConfigUpdated {
            space_id,
            creator: space.creator,
            config_quilt: space.config_quilt,
            updated_at: space.updated_at,
        });
    }

    /// Add a fan's avatar to the FanRegistry
    public fun add_fan_avatar(
        fan_registry: &mut FanRegistry,
        space: &Space,
        fan_address: address,
        avatar_blob_id: String,
        ctx: &mut TxContext,
    ) {
        let space_id = object::id(space);

        let fan_avatar = FanAvatar {
            owner: fan_address,
            avatar_blob_id,
        };

        if (!fan_registry.fans.contains(space_id)) {
            fan_registry.fans.add(space_id, table::new(ctx));
        };

        let space_fans = fan_registry.fans.borrow_mut(space_id);
        if (space_fans.contains(fan_address)) {
            space_fans.remove(fan_address);
        };
        space_fans.add(fan_address, fan_avatar);

        event::emit(FanAvatarAdded {
            space_id,
            fan_address,
            avatar_blob_id,
        });
    }

    /// Add video blob ID to space
    public fun add_video(
        space: &mut Space,
        ownership: &SpaceOwnership,
        video_blob_id: String,
        clock: &Clock,
    ) {
        assert!(ownership.space_id == object::id(space), ENotOwner);
        space.video_blob_ids.push_back(video_blob_id);
        space.updated_at = clock.timestamp_ms();
    }

    /// Record content upload
    public fun record_content(
        space: &Space,
        ownership: &SpaceOwnership,
        blob_object_id: ID,
        blob_id: String,
        content_type: u8,
        title: String,
        description: String,
        encrypted: bool,
        price: u64,
        tags: vector<String>,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let space_id = object::id(space);
        assert!(ownership.space_id == space_id, ENotOwner);
        
        event::emit(ContentAdded {
            space_id,
            blob_object_id,
            blob_id,
            content_type,
            title,
            description,
            encrypted,
            price,
            tags,
            creator: ctx.sender(),
            created_at: clock.timestamp_ms(),
        });
    }

    // ===== Public Read Functions =====

    public fun subscription_price(space: &Space): u64 {
        space.subscription_price
    }

    public fun creator(space: &Space): address {
        space.creator
    }

    public fun marketplace_kiosk_id(space: &Space): ID {
        space.marketplace_kiosk_id
    }

    public fun get_space_ownership_space_id(ownership: &SpaceOwnership): ID {
        ownership.space_id
    }

    public fun total_spaces(registry: &SpaceRegistry): u64 {
        registry.total_spaces
    }

    public fun all_spaces(registry: &SpaceRegistry): vector<ID> {
        registry.spaces
    }

    // ===== Test Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

