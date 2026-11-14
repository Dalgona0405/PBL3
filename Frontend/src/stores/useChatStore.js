import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import { API_URLS } from '../api/api';
import axiosClient, { getAccessToken, HUB_BASE_URL } from '../api/axiosClient';
import {
    appendUniqueMessage,
    mergeConversationWithPartner,
    registerChatHubHandlers,
    updateConversationList
} from './chatStoreHelpers';

export const useChatStore = create((set, get) => ({
    connection: null,
    isConnected: false,
    isOpen: false,
    activePartner: null,
    conversations: [],
    messages: [],
    typingUsers: {},
    isLoadingConversations: false,
    isLoadingMessages: false,

    setIsOpen: (isOpen) => set({ isOpen }),

    connect: async () => {
        const token = getAccessToken();
        if (!token) return;

        const currentConn = get().connection;
        if (currentConn && currentConn.state !== signalR.HubConnectionState.Disconnected) return;

        const conn = new signalR.HubConnectionBuilder()
            .withUrl(`${HUB_BASE_URL}/hubs/chat`, { accessTokenFactory: () => getAccessToken() || '' })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        registerChatHubHandlers(conn, set, get);

        set({ connection: conn });
        try {
            await conn.start();
            set({ isConnected: true });
            get().fetchConversations();
        } catch (err) {
            console.error('SignalR connection error:', err);
            set({ isConnected: false });
        }
    },

    disconnect: async () => {
        const conn = get().connection;
        if (conn) {
            try { await conn.stop(); } catch { /* ignore */ }
        }
        set({ connection: null, isConnected: false, isOpen: false, activePartner: null, conversations: [], messages: [], typingUsers: {} });
    },

    fetchConversations: async () => {
        set({ isLoadingConversations: true });
        try {
            const data = await axiosClient.get(`${API_URLS.MESSAGES}/conversations`);
            set({ conversations: Array.isArray(data) ? data : [] });
        } catch (err) {
            console.error('Lỗi lấy danh sách hội thoại:', err);
        } finally {
            set({ isLoadingConversations: false });
        }
    },

    selectPartner: async (partner) => {
        if (!partner?.partnerId) return;
        set((state) => ({
            activePartner: partner,
            isLoadingMessages: true,
            conversations: state.conversations.map((c) => (Number(c.partnerId) === Number(partner.partnerId) ? { ...c, unreadCount: 0 } : c))
        }));

        try {
            const res = await axiosClient.get(`${API_URLS.MESSAGES}/history/${partner.partnerId}?page=1&pageSize=50`);
            const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
            set({ messages: items });
            const conn = get().connection;
            if (conn?.state === signalR.HubConnectionState.Connected) {
                conn.invoke('MarkConversationAsRead', Number(partner.partnerId)).catch(() => {});
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử chat:', err);
            set({ messages: [] });
        } finally {
            set({ isLoadingMessages: false });
        }
    },

    openChatWith: async (partnerInfo) => {
        if (!partnerInfo?.partnerId) return;
        set((state) => ({
            isOpen: true,
            conversations: mergeConversationWithPartner(state.conversations, partnerInfo)
        }));
        await get().selectPartner(partnerInfo);
    },

    sendMessage: async (content) => {
        const trimmed = content?.trim();
        const { activePartner, connection, conversations, messages } = get();
        if (!trimmed || !activePartner?.partnerId) return false;

        const payload = {
            receiverId: Number(activePartner.partnerId),
            jobId: activePartner.jobId ? Number(activePartner.jobId) : null,
            content: trimmed
        };

        try {
            if (connection?.state === signalR.HubConnectionState.Connected) {
                await connection.invoke('SendMessage', payload);
            } else {
                const sentMsg = await axiosClient.post(API_URLS.MESSAGES, payload);
                set({
                    messages: appendUniqueMessage(messages, sentMsg),
                    conversations: updateConversationList(conversations, payload.receiverId, sentMsg, false, activePartner)
                });
            }
            return true;
        } catch {
            toast.error('Không thể gửi tin nhắn. Vui lòng thử lại!');
            return false;
        }
    },

    sendTyping: (isTyping) => {
        const { activePartner, connection } = get();
        if (activePartner?.partnerId && connection?.state === signalR.HubConnectionState.Connected) {
            connection.invoke('SendTypingIndicator', Number(activePartner.partnerId), Boolean(isTyping)).catch(() => {});
        }
    }
}));
