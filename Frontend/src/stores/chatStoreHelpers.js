import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';

export const appendUniqueMessage = (list, msg) => {
    if (msg.messageId && list.some((m) => m.messageId === msg.messageId)) return list;
    return [...list, msg];
};

export const updateConversationList = (conversations, partnerId, msg, isUnreadIncrement, partnerFallback = {}) => {
    const idx = conversations.findIndex((c) => Number(c.partnerId) === Number(partnerId));
    if (idx === -1) {
        const created = {
            partnerId: Number(partnerId),
            partnerName: partnerFallback.partnerName || msg.senderName || 'Người dùng',
            partnerAvatar: partnerFallback.partnerAvatar ?? msg.senderAvatar ?? null,
            partnerRole: partnerFallback.partnerRole || '',
            lastMessage: msg.content,
            lastMessageTime: msg.sentAt || new Date().toISOString(),
            unreadCount: isUnreadIncrement ? 1 : 0,
            isOnline: true
        };
        return [created, ...conversations];
    }

    const existing = conversations[idx];
    const updated = {
        ...existing,
        lastMessage: msg.content,
        lastMessageTime: msg.sentAt || new Date().toISOString(),
        unreadCount: isUnreadIncrement ? (existing.unreadCount || 0) + 1 : 0
    };
    return [updated, ...conversations.filter((_, i) => i !== idx)];
};

export const mergeConversationWithPartner = (conversations, partnerInfo) => {
    const exists = conversations.find((c) => Number(c.partnerId) === Number(partnerInfo.partnerId));
    if (exists) return conversations;

    const newPartner = {
        partnerId: Number(partnerInfo.partnerId),
        partnerName: partnerInfo.partnerName || 'Người dùng',
        partnerAvatar: partnerInfo.partnerAvatar || null,
        partnerRole: partnerInfo.partnerRole || '',
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false,
        ...partnerInfo
    };
    return [newPartner, ...conversations];
};

export const registerChatHubHandlers = (conn, set, get) => {
    conn.on('ReceiveMessage', (msg) => {
        const { activePartner, isOpen, conversations, connection } = get();
        const isViewingPartner = isOpen && activePartner && Number(activePartner.partnerId) === Number(msg.senderId);

        set({
            conversations: updateConversationList(conversations, msg.senderId, msg, !isViewingPartner, {
                partnerName: msg.senderName,
                partnerAvatar: msg.senderAvatar
            }),
            messages: isViewingPartner ? appendUniqueMessage(get().messages, { ...msg, isRead: true }) : get().messages
        });

        if (isViewingPartner && connection?.state === signalR.HubConnectionState.Connected) {
            connection.invoke('MarkConversationAsRead', Number(msg.senderId)).catch(() => {});
        } else {
            toast(`💬 ${msg.senderName}: ${msg.content.slice(0, 60)}`, { duration: 3500 });
        }
        window.dispatchEvent(new CustomEvent('signalr:chat-message', { detail: msg }));
    });

    conn.on('MessageSent', (msg) => {
        const { activePartner, conversations, messages } = get();
        const isViewing = activePartner && Number(activePartner.partnerId) === Number(msg.receiverId);
        set({
            conversations: updateConversationList(conversations, msg.receiverId, msg, false, {
                partnerName: activePartner?.partnerName,
                partnerAvatar: activePartner?.partnerAvatar,
                partnerRole: activePartner?.partnerRole
            }),
            messages: isViewing ? appendUniqueMessage(messages, msg) : messages
        });
    });

    conn.on('UserTyping', ({ senderId, isTyping }) => {
        set((state) => ({ typingUsers: { ...state.typingUsers, [Number(senderId)]: Boolean(isTyping) } }));
    });

    conn.on('MessagesRead', ({ readerId }) => {
        set((state) => ({
            messages: state.messages.map((m) => (Number(m.receiverId) === Number(readerId) ? { ...m, isRead: true } : m))
        }));
    });

    conn.on('UserStatusChanged', ({ userId, isOnline }) => {
        set((state) => ({
            conversations: state.conversations.map((c) => (Number(c.partnerId) === Number(userId) ? { ...c, isOnline } : c)),
            activePartner: state.activePartner && Number(state.activePartner.partnerId) === Number(userId)
                ? { ...state.activePartner, isOnline }
                : state.activePartner
        }));
    });

    conn.on('ReceiveNotification', (notif) => {
        window.dispatchEvent(new CustomEvent('signalr:notification', { detail: notif }));
    });

    conn.onreconnected(() => {
        set({ isConnected: true });
        get().fetchConversations();
    });
    conn.onclose(() => set({ isConnected: false }));
};
