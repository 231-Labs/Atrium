module atrium::identity {
    use std::string::{Self, String};
    use sui::{
        event,
        clock::Clock,
        display,
        package,
        table::{Self, Table},
    };

    // ===== Error Codes =====
    const EIdentityAlreadyExists: u64 = 0;
    const ENotIdentityOwner: u64 = 1;
    const EImageRequired: u64 = 2;

    // ===== Structs =====

    /// One-time witness for the module
    public struct IDENTITY has drop {}

    /// Identity NFT - represents a user in the Atrium platform
    public struct Identity has key, store {
        id: UID,
        owner: address,
        username: String,
        bio: String,
        avatar_blob_id: option::Option<String>,  // Walrus blob id for GLB avatar
        image_blob_id: String,                    // Walrus blob id for 2D profile image (required for display)
        created_at: u64,
        is_creator: bool,
    }

    /// Global registry to track all identities
    public struct IdentityRegistry has key {
        id: UID,
        identities: Table<address, ID>,  // address -> Identity object ID
        total_identities: u64,
        total_creators: u64,
    }

    // ===== Events =====

    public struct IdentityMinted has copy, drop {
        identity_id: ID,
        owner: address,
        username: String,
        created_at: u64,
    }

    public struct AvatarBound has copy, drop {
        identity_id: ID,
        owner: address,
        avatar_blob_id: String,
    }

    // ===== Init Function =====

    #[allow(lint(share_owned))]
    fun init(otw: IDENTITY, ctx: &mut TxContext) {
        let registry = IdentityRegistry {
            id: object::new(ctx),
            identities: table::new(ctx),
            total_identities: 0,
            total_creators: 0,
        };
        transfer::share_object(registry);

        let publisher = package::claim(otw, ctx);
        let mut display = display::new<Identity>(&publisher, ctx);
        
        display.add(b"name".to_string(), b"Atrium Identity - {username}".to_string());
        display.add(b"description".to_string(), b"{bio}".to_string());
        display.add(b"image_url".to_string(), b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/{image_blob_id}".to_string());
        display.add(b"project_url".to_string(), b"https://atrium.app".to_string());
        display.update_version();

        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());
    }

    // ===== Public Entry Functions =====

    /// Mint a new Identity NFT
    public fun mint_identity(
        registry: &mut IdentityRegistry,
        username: String,
        bio: String,
        avatar_blob_id: String,
        image_blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): Identity {
        let sender = ctx.sender();
        assert!(!registry.identities.contains(sender), EIdentityAlreadyExists);
        assert!(!string::is_empty(&image_blob_id), EImageRequired);
        
        let avatar_opt = if (string::is_empty(&avatar_blob_id)) {
            option::none()
        } else {
            option::some(avatar_blob_id)
        };

        let identity = Identity {
            id: object::new(ctx),
            owner: sender,
            username,
            bio,
            avatar_blob_id: avatar_opt,
            image_blob_id,
            created_at: clock.timestamp_ms(),
            is_creator: false,
        };

        let identity_id = object::id(&identity);
        registry.identities.add(sender, identity_id);
        registry.total_identities = registry.total_identities + 1;

        event::emit(IdentityMinted {
            identity_id,
            owner: sender,
            username: identity.username,
            created_at: identity.created_at,
        });

        identity
    }

    /// Bind a 3D avatar to the identity
    public fun bind_avatar(
        identity: &mut Identity,
        avatar_blob_id: String,
        ctx: &TxContext
    ) {
        assert!(identity.owner == ctx.sender(), ENotIdentityOwner);
        identity.avatar_blob_id = option::some(avatar_blob_id);

        event::emit(AvatarBound {
            identity_id: object::id(identity),
            owner: identity.owner,
            avatar_blob_id,
        });
    }

    public fun update_image(
        identity: &mut Identity,
        image_blob_id: String,
        ctx: &TxContext
    ) {
        assert!(identity.owner == ctx.sender(), ENotIdentityOwner);
        assert!(!string::is_empty(&image_blob_id), EImageRequired);
        identity.image_blob_id = image_blob_id;
    }

    public fun update_bio(
        identity: &mut Identity,
        bio: String,
        ctx: &TxContext
    ) {
        assert!(identity.owner == ctx.sender(), ENotIdentityOwner);
        identity.bio = bio;
    }

    // ===== Getter Functions =====

    public fun get_identity_id(registry: &IdentityRegistry, addr: address): option::Option<ID> {
        if (registry.identities.contains(addr)) {
            option::some(*registry.identities.borrow(addr))
        } else {
            option::none()
        }
    }

    public fun has_identity(registry: &IdentityRegistry, addr: address): bool {
        registry.identities.contains(addr)
    }

    public fun total_identities(registry: &IdentityRegistry): u64 {
        registry.total_identities
    }

    public fun total_creators(registry: &IdentityRegistry): u64 {
        registry.total_creators
    }

    public fun owner(identity: &Identity): address {
        identity.owner
    }

    public fun username(identity: &Identity): String {
        identity.username
    }

    public fun bio(identity: &Identity): String {
        identity.bio
    }

    public fun avatar_blob_id(identity: &Identity): option::Option<String> {
        identity.avatar_blob_id
    }

    public fun image_blob_id(identity: &Identity): String {
        identity.image_blob_id
    }

    public fun is_creator(identity: &Identity): bool {
        identity.is_creator
    }

    public fun created_at(identity: &Identity): u64 {
        identity.created_at
    }

    public(package) fun increment_creator_count(registry: &mut IdentityRegistry) {
        registry.total_creators = registry.total_creators + 1;
    }
}

