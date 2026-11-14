import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { API_URLS } from '../../api/api';
import { useChatStore } from '../../stores/useChatStore';
import NotificationDropdown from './NotificationDropdown';

function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const data = await axiosClient.get(`${API_URLS.NOTIFICATIONS}/me/unread-count`);
                setUnreadCount(data.count !== undefined ? data.count : data);
            } catch (error) {
                console.error('Lỗi lấy số thông báo:', error);
            }
        };
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        const handleRealtimeNotification = (event) => {
            const notif = event.detail;
            if (!notif) return;

            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => {
                const incomingId = notif.notificationId || notif.NotificationId || notif.id;
                if (incomingId && prev.some((n) => (n.notificationId || n.id) === incomingId)) return prev;
                return [{ ...notif, isRead: false }, ...prev];
            });
            toast(notif.title || notif.content || 'Bạn có thông báo mới!', { icon: '🔔' });
        };

        const handleRealtimeChatMessage = (event) => {
            const msg = event.detail;
            if (!msg) return;
            const { activePartner, isOpen: isChatOpen } = useChatStore.getState();
            const isViewingSender = isChatOpen && activePartner && Number(activePartner.partnerId) === Number(msg.senderId);
            if (isViewingSender) return;

            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [{
                notificationId: `chat-${msg.messageId || Date.now()}`,
                type: 'Chat',
                partnerId: msg.senderId,
                partnerName: msg.senderName,
                partnerAvatar: msg.senderAvatar,
                title: `Tin nhắn mới từ ${msg.senderName}`,
                content: msg.content,
                isRead: false,
                createdAt: msg.sentAt || new Date().toISOString()
            }, ...prev]);
        };

        window.addEventListener('signalr:notification', handleRealtimeNotification);
        window.addEventListener('signalr:chat-message', handleRealtimeChatMessage);
        return () => {
            window.removeEventListener('signalr:notification', handleRealtimeNotification);
            window.removeEventListener('signalr:chat-message', handleRealtimeChatMessage);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleBell = async () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);

        if (nextOpen) {
            setIsLoading(true);
            try {
                const data = await axiosClient.get(`${API_URLS.NOTIFICATIONS}/me`);
                setNotifications(Array.isArray(data) ? data : (data.items || []));
            } catch {
                toast.error('Không thể tải thông báo lúc này.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axiosClient.patch(`${API_URLS.NOTIFICATIONS}/read-all`);
            setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu đọc tất cả!');
        } catch {
            toast.error('Có lỗi xảy ra khi cập nhật.');
        }
    };

    const handleNotificationClick = async (notif) => {
        const currentId = notif.notificationId || notif.NotificationId || notif.id;
        const isVirtualChat = typeof currentId === 'string' && currentId.startsWith('chat-');

        if (!notif.isRead && currentId) {
            if (!isVirtualChat) {
                try {
                    await axiosClient.patch(`${API_URLS.NOTIFICATIONS}/${currentId}/read`);
                } catch (error) {
                    console.error('Lỗi cập nhật thông báo:', error);
                }
            }
            setNotifications((prev) =>
                prev.map((n) => ((n.notificationId || n.NotificationId || n.id) === currentId ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        setIsOpen(false);

        const text = `${notif.title || ''} ${notif.message || notif.content || ''}`.toLowerCase();
        if (notif.type === 'Chat' || notif.partnerId || text.includes('tin nhắn')) {
            const chatStore = useChatStore.getState();
            if (notif.partnerId) {
                chatStore.openChatWith({
                    partnerId: notif.partnerId,
                    partnerName: notif.partnerName || 'Người dùng',
                    partnerAvatar: notif.partnerAvatar || null
                });
            } else {
                chatStore.setIsOpen(true);
            }
            return;
        }

        if (text.includes('application') || text.includes('ứng tuyển') || text.includes('hồ sơ')) {
            navigate('/history-applied');
        } else if (notif.link) {
            navigate(notif.link);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggleBell}
                className="relative p-2 text-gray-500 hover:text-olive transition-colors rounded-full hover:bg-cream"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown
                    unreadCount={unreadCount}
                    notifications={notifications}
                    isLoading={isLoading}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onNotificationClick={handleNotificationClick}
                />
            )}
        </div>
    );
}

export default NotificationBell;
