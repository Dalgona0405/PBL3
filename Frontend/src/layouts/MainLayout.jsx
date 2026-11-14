import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/common/NotificationBell';
import ChatWidget from '../components/common/ChatWidget/ChatWidget';

const MainLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleNavigate = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    const handleLogout = () => {
        setIsSidebarOpen(false);
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-cream font-sans overflow-hidden">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-olive shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shrink-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="h-20 flex items-center justify-between px-5 md:justify-center">
                    <h1 className="text-2xl font-bold text-cream cursor-pointer" onClick={() => handleNavigate('/')}>
                        🌿 IT Job Hunter
                    </h1>
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-cream hover:text-white p-1.5 rounded-lg hover:bg-earth transition-colors"
                        aria-label="Đóng menu điều hướng"
                    >
                        ✕
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => handleNavigate('/')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                        🏠 <span className="ml-3 font-medium">Trang chủ</span>
                    </button>
                    <button onClick={() => handleNavigate('/forecast')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                        📊 <span className="ml-3 font-medium">Dự báo thị trường</span>
                    </button>

                    {user && (
                        <button onClick={() => handleNavigate('/profile')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                            👤 <span className="ml-3 font-medium">Hồ sơ của tôi</span>
                        </button>
                    )}

                    {user?.role === 'Candidate' && (
                        <>
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-xs font-bold text-cream uppercase tracking-wider">Người tìm việc</p>
                            </div>
                            <button onClick={() => handleNavigate('/suggested-jobs')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                🎯 <span className="ml-3 font-medium">Việc làm gợi ý</span>
                            </button>
                            <button onClick={() => handleNavigate('/history-applied')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                📤 <span className="ml-3 font-medium">Danh sách ứng tuyển</span>
                            </button>
                            <button onClick={() => handleNavigate('/saved-jobs')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                📚 <span className="ml-3 font-medium">Việc làm đã lưu</span>
                            </button>
                        </>
                    )}

                    {(user?.role === 'Recruiter' || user?.role === 'Company') && (
                        <>
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-xs font-bold text-cream uppercase tracking-wider">
                                    {user?.role === 'Company' ? 'Chủ doanh nghiệp' : 'Nhà tuyển dụng'}
                                </p>
                            </div>
                            <button onClick={() => handleNavigate('/recruiter-dashboard')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                🏢 <span className="ml-3 font-medium">Quản lý bài đăng</span>
                            </button>

                            {user?.role === 'Company' && (
                                <>
                                    <button onClick={() => handleNavigate('/company/profile')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                        🏢 <span className="ml-3 font-medium">Hồ sơ Doanh nghiệp</span>
                                    </button>
                                    <button onClick={() => handleNavigate('/company/requests')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                        🛡️ <span className="ml-3 font-medium">Duyệt nhân viên HR</span>
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {user?.role === 'Admin' && (
                        <>
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-xs font-bold text-cream uppercase tracking-wider">Quản trị viên</p>
                            </div>
                            <button onClick={() => handleNavigate('/admin/dashboard')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                🎯 <span className="ml-3 font-medium">Bảng điều khiển</span>
                            </button>
                            <button onClick={() => handleNavigate('/admin/companies')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                🏢 <span className="ml-3 font-medium">Quản lý Công ty</span>
                            </button>
                            <button onClick={() => handleNavigate('/admin/locations')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                📍 <span className="ml-3 font-medium">Quản lý Địa điểm</span>
                            </button>
                            <button onClick={() => handleNavigate('/admin/tags')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                🏷️ <span className="ml-3 font-medium">Quản lý Tags</span>
                            </button>
                            <button onClick={() => handleNavigate('/admin/users')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                                👥 <span className="ml-3 font-medium">Quản lý Người dùng</span>
                            </button>
                        </>
                    )}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="h-20 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 rounded-xl text-olive hover:bg-cream transition-colors"
                            aria-label="Mở menu điều hướng"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span className="md:hidden font-bold text-olive text-lg cursor-pointer" onClick={() => handleNavigate('/')}>
                            🌿 IT Job Hunter
                        </span>
                    </div>

                    <div>
                        {user ? (
                            <div className="flex items-center gap-3 md:gap-6">
                                <span className="hidden sm:inline font-medium text-earth">Chào {user.name || user.fullName}!</span>
                                <NotificationBell />
                                <button onClick={handleLogout} className="px-4 md:px-5 py-2 text-sm bg-olive text-white hover:bg-red-500 rounded-lg transition-all">
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 md:gap-3">
                                <button onClick={() => handleNavigate('/login')} className="px-4 md:px-5 py-2 bg-earth text-white text-sm md:text-base font-medium rounded-full shadow-md hover:bg-olive transition-all hover:-translate-y-1">
                                    Đăng nhập
                                </button>
                                <button onClick={() => handleNavigate('/register')} className="px-4 md:px-5 py-2 bg-earth text-white text-sm md:text-base font-medium rounded-full shadow-md hover:bg-olive transition-all hover:-translate-y-1">
                                    Đăng ký
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 bg-white overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
            {user && <ChatWidget />}
        </div>
    );
};

export default MainLayout;
