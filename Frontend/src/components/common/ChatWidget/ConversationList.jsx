import React from 'react';

const ROLE_LABELS = {
    Candidate: 'Ứng viên',
    Recruiter: 'Nhà tuyển dụng',
    Company: 'Doanh nghiệp'
};

function ConversationList({ conversations, activePartnerId, isLoading, onSelect }) {
    if (isLoading && conversations.length === 0) {
        return <div className="p-6 text-center text-sm text-gray-400 animate-pulse">Đang tải hội thoại...</div>;
    }

    if (conversations.length === 0) {
        return (
            <div className="p-6 text-center text-sm text-gray-400 flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">📭</span>
                Chưa có cuộc trò chuyện nào.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.map((conv) => {
                const isActive = Number(activePartnerId) === Number(conv.partnerId);
                return (
                    <button
                        type="button"
                        key={conv.partnerId}
                        onClick={() => onSelect(conv)}
                        className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${isActive ? 'bg-white border-l-4 border-olive shadow-sm' : 'hover:bg-white/80'}`}
                    >
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-full bg-cream border border-gray-200 flex items-center justify-center overflow-hidden">
                                {conv.partnerAvatar ? (
                                    <img src={conv.partnerAvatar} alt={conv.partnerName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg">👤</span>
                                )}
                            </div>
                            <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${conv.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                                title={conv.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-sm text-textmain truncate">{conv.partnerName}</p>
                                {conv.unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                            {conv.partnerRole && (
                                <p className="text-[11px] text-earth font-medium">
                                    {ROLE_LABELS[conv.partnerRole] || conv.partnerRole}
                                </p>
                            )}
                            <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-bold text-textmain' : 'text-gray-400'}`}>
                                {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

export default ConversationList;
