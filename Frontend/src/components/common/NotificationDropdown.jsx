import React from 'react';

function NotificationDropdown({
    unreadCount,
    notifications,
    isLoading,
    onMarkAllAsRead,
    onNotificationClick
}) {
    return (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-cream">
                <h3 className="font-bold text-olive text-lg">Thông báo</h3>
                {unreadCount > 0 && (
                    <button type="button" onClick={onMarkAllAsRead} className="text-xs font-bold text-earth hover:text-olive transition-colors">
                        Đánh dấu đọc hết ✔️
                    </button>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-6 text-center text-gray-400 animate-pulse">Đang tải thông báo... 🌿</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <span className="text-4xl block mb-2">📭</span>
                        Bạn chưa có thông báo nào.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notif, index) => {
                            const currentId = notif.notificationId || notif.NotificationId || notif.id;
                            const timestamp = notif.createdAt || notif.createdDate;
                            return (
                                <div
                                    key={currentId || index}
                                    onClick={() => onNotificationClick(notif)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-4 ${notif.isRead ? 'opacity-60 bg-white' : 'bg-orange-50/30'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0 text-lg">
                                        {notif.type === 'Application' ? '📄' : notif.type === 'System' ? '⚙️' : '💬'}
                                    </div>
                                    <div className="min-w-0">
                                        {notif.title && <p className="text-xs font-bold text-olive mb-0.5 truncate">{notif.title}</p>}
                                        <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-textmain font-bold'}`}>
                                            {notif.content || notif.message || notif.title}
                                        </p>
                                        {timestamp && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(timestamp).toLocaleString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationDropdown;
