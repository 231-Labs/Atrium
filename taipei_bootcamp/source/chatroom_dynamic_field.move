module atrium::chatroom {
    use std::string::String;
    use sui::{
        event,
        clock::Clock,
        dynamic_field as df,
    };

    // ===== Error Codes =====
    const ENotParticipant: u64 = 0;
    const EChatRoomNotFound: u64 = 1;
    const EEmptyMessage: u64 = 2;

    // ===== Structs =====

    /// Message key for dynamic field
    public struct MessageKey has store, copy, drop {
        index: u64,
    }

    /// Single message stored in dynamic field
    public struct Message has store {
        sender: address,
        username: String,
        content: String,
        timestamp: u64,
        profile_image: String,
    }

    /// Chatroom object - 訊息存在 dynamic field 裡
    public struct ChatRoom has key {
        id: UID,
        name: String,
        participants: vector<address>,
        created_at: u64,
        message_count: u64,  // 也是下一個訊息的 index
    }

    // ===== Events =====

    public struct ChatRoomCreated has copy, drop {
        room_id: ID,
        name: String,
        creator: address,
        created_at: u64,
    }

    public struct MessageSent has copy, drop {
        room_id: ID,
        message_index: u64,
        sender: address,
        username: String,
        content: String,
        timestamp: u64,
    }

    public struct ParticipantJoined has copy, drop {
        room_id: ID,
        participant: address,
        username: String,
    }

    // ===== Public Functions =====

    /// 建立聊天室
    public fun create_chatroom(
        name: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let room = ChatRoom {
            id: object::new(ctx),
            name,
            participants: vector::empty(),
            created_at: clock.timestamp_ms(),
            message_count: 0,
        };

        let room_id = object::id(&room);

        event::emit(ChatRoomCreated {
            room_id,
            name: room.name,
            creator: ctx.sender(),
            created_at: room.created_at,
        });

        transfer::share_object(room);
    }

    /// 發送訊息
    public fun send_message(
        room: &mut ChatRoom,
        username: String,
        profile_image: String,
        content: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        
        assert!(!content.is_empty(), EEmptyMessage);

        // 自動加入參與者列表
        if (!room.participants.contains(&sender)) {
            room.participants.push_back(sender);
            
            event::emit(ParticipantJoined {
                room_id: object::id(room),
                participant: sender,
                username,
            });
        };

        // 建立訊息並存到 dynamic field
        let message = Message {
            sender,
            username,
            content,
            timestamp: clock.timestamp_ms(),
            profile_image,
        };

        let message_index = room.message_count;
        df::add(&mut room.id, MessageKey { index: message_index }, message);
        
        room.message_count = room.message_count + 1;

        event::emit(MessageSent {
            room_id: object::id(room),
            message_index,
            sender,
            username,
            content: message.content,
            timestamp: message.timestamp,
        });
    }

    // ===== Getter Functions =====

    public fun name(room: &ChatRoom): String {
        room.name
    }

    public fun message_count(room: &ChatRoom): u64 {
        room.message_count
    }

    public fun created_at(room: &ChatRoom): u64 {
        room.created_at
    }

    public fun participants(room: &ChatRoom): &vector<address> {
        &room.participants
    }

    /// 取得特定訊息（需要知道 index）
    public fun get_message(room: &ChatRoom, index: u64): &Message {
        df::borrow(&room.id, MessageKey { index })
    }

    /// 檢查訊息是否存在
    public fun has_message(room: &ChatRoom, index: u64): bool {
        df::exists_(&room.id, MessageKey { index })
    }

    // Message getters
    public fun message_sender(msg: &Message): address {
        msg.sender
    }

    public fun message_username(msg: &Message): String {
        msg.username
    }

    public fun message_content(msg: &Message): String {
        msg.content
    }

    public fun message_timestamp(msg: &Message): u64 {
        msg.timestamp
    }

    public fun message_profile_image(msg: &Message): String {
        msg.profile_image
    }
}