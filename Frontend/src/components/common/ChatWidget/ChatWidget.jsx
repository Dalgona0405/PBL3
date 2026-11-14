import React, { useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatStore } from '../../../stores/useChatStore';
import ConversationList from './ConversationList';
import ChatMessageArea from './ChatMessageArea';

function ChatWidget() {
    const { user } = useAuth();
    const {
        isOpen, isConnected, conversations, activePartner, messages, typingUsers,
        isLoadingConversations, isLoadingMessages,
        connect, disconnect, setIsOpen, fetchConversations, selectPartner, sendMessage, sendTyping
    } = useChatStore();

    useEffect(() => {
        if (user) {
            connect();
        } else {
            disconnect();
        }
        return () => {
            disconnect();
        };
    }, [user, connect, disconnect]);

    if (!user || !['Candidate', 'Recruiter', 'Company'].includes(user.role)) {
        return null;
    }

    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

    const handleToggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) {
            fetchConversations();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {isOpen && (
                <div className="mb-4 w-[92vw] sm:w-[680px] h-[520px] max-h-[75vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex overflow-hidden animate-fade-in-up">
                    <div className={`${activePartner ? 'hidden sm:flex' : 'flex'} w-full sm:w-64 flex-col border-r border-gray-100 bg-gray-50/70`}>
                        <div className="p-4 border-b border-gray-100 bg-cream flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-olive text-base flex items-center gap-2">
                                    💬 Tin nhắn
                                </h3>
                                <span className={`text-[11px] font-medium ${isConnected ? 'text-green-600' : 'text-amber-600'}`}>
                                    {isConnected ? '● Trực tuyến' : '○ Đang kết nối...'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="sm:hidden text-gray-500 hover:text-gray-700 text-lg font-bold px-2"
                            >
                                ✕
                            </button>
                        </div>

                        <ConversationList
                            conversations={conversations}
                            activePartnerId={activePartner?.partnerId}
                            isLoading={isLoadingConversations}
                            onSelect={selectPartner}
                        />
                    </div>

                    <div className={`${activePartner ? 'flex' : 'hidden sm:flex'} flex-1 flex-col bg-white`}>
                        <ChatMessageArea
                            currentUserId={user.id}
                            activePartner={activePartner}
                            messages={messages}
                            isPartnerTyping={activePartner ? Boolean(typingUsers[Number(activePartner.partnerId)]) : false}
                            isLoading={isLoadingMessages}
                            onBackMobile={() => useChatStore.setState({ activePartner: null })}
                            onClose={() => setIsOpen(false)}
                            onSendMessage={sendMessage}
                            onTyping={sendTyping}
                        />
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={handleToggle}
                className="relative flex items-center gap-2.5 bg-olive hover:bg-earth text-white font-bold px-5 py-3.5 rounded-full shadow-xl transition-all transform hover:-translate-y-1"
                title="Mở hộp thoại trò chuyện trực tuyến"
            >
                <span className="text-xl">💬</span>
                <span className="hidden sm:inline text-sm">Trao đổi trực tiếp</span>
                {totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>
        </div>
    );
}

export default ChatWidget;
