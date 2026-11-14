import React, { useState, useEffect, useRef } from 'react';

function ChatMessageArea({
    currentUserId,
    activePartner,
    messages,
    isPartnerTyping,
    isLoading,
    onBackMobile,
    onClose,
    onSendMessage,
    onTyping
}) {
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isPartnerTyping]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    if (!activePartner) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                <span className="text-5xl mb-3">💬</span>
                <p className="font-bold text-gray-600">Chọn một cuộc hội thoại để bắt đầu</p>
                <p className="text-xs text-gray-400 mt-1">Trao đổi trực tiếp tức thì giữa Ứng viên và Nhà tuyển dụng.</p>
            </div>
        );
    }

    const handleInputChange = (e) => {
        setText(e.target.value);
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => onTyping(false), 1200);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || isSending) return;

        setIsSending(true);
        onTyping(false);
        const ok = await onSendMessage(text);
        if (ok) setText('');
        setIsSending(false);
    };

    return (
        <>
            <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button type="button" onClick={onBackMobile} className="sm:hidden text-olive font-bold text-lg">⬅</button>
                    <div className="w-10 h-10 rounded-full bg-cream border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {activePartner.partnerAvatar ? (
                            <img src={activePartner.partnerAvatar} alt={activePartner.partnerName} className="w-full h-full object-cover" />
                        ) : (
                            <span>👤</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-textmain text-sm truncate">{activePartner.partnerName}</h4>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                            <span className={activePartner.isOnline ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                {activePartner.isOnline ? '● Đang hoạt động' : '○ Ngoại tuyến'}
                            </span>
                            {activePartner.jobTitle && <span className="text-earth truncate">• {activePartner.jobTitle}</span>}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {isLoading ? (
                    <div className="text-center text-gray-400 text-sm py-10 animate-pulse">Đang tải lịch sử tin nhắn...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-10">Hãy gửi lời chào để bắt đầu trao đổi!</div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = Number(msg.senderId) === Number(currentUserId);
                        return (
                            <div key={msg.messageId || index} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                {msg.jobTitle && index === 0 && (
                                    <span className="text-[11px] bg-cream text-olive px-3 py-1 rounded-full mb-2 border border-gray-200">
                                        📌 Vị trí: {msg.jobTitle}
                                    </span>
                                )}
                                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words ${isMine ? 'bg-olive text-white rounded-br-none' : 'bg-white text-textmain border border-gray-100 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    {isMine && (msg.isRead ? ' • Đã xem ✔️✔️' : ' • Đã gửi')}
                                </span>
                            </div>
                        );
                    })
                )}
                {isPartnerTyping && (
                    <div className="text-xs text-olive italic animate-pulse pl-1">
                        {activePartner.partnerName} đang nhập tin nhắn...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:border-earth outline-none text-sm bg-gray-50 focus:bg-white"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || isSending}
                    className="bg-olive hover:bg-earth disabled:bg-gray-300 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors shadow-sm"
                >
                    Gửi
                </button>
            </form>
        </>
    );
}

export default ChatMessageArea;
