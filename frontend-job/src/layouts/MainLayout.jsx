import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-cream font-sans">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-2xl font-bold text-olive cursor-pointer" onClick={() => navigate('/')}>
            🌿 IT Job Hunter
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => navigate('/')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
            🏠 <span className="ml-3 font-medium">Trang chủ</span>
          </button>
          <button onClick={() => navigate('/forecast')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
            📊 <span className="ml-3 font-medium">Dự báo thị trường</span>
          </button>

          {user && (
            <button onClick={() => navigate('/profile')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
              👤 <span className="ml-3 font-medium">Hồ sơ của tôi</span>
            </button>
          )}

          {user?.role === 'Candidate' && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Người tìm việc</p>
              </div>
              <button onClick={() => navigate('/suggested-jobs')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                🎯 <span className="ml-3 font-medium">Việc làm gợi ý</span>
              </button>
              <button onClick={() => navigate('/history-applied')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                📤 <span className="ml-3 font-medium">Lịch sử ứng tuyển</span>
              </button>
            </>
          )}

          {user?.role === 'Recruiter' && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nhà tuyển dụng</p>
              </div>
              <button onClick={() => navigate('/recruiter-dashboard')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                🏢 <span className="ml-3 font-medium">Quản lý tuyển dụng</span>
              </button>
            </>
          )}

          {user?.role === 'Admin' && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quản trị viên</p>
              </div>
              <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                🎯 <span className="ml-3 font-medium">Bảng điều khiển</span>
              </button>
              <button onClick={() => navigate('/admin/company-requests')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                🛡️ <span className="ml-3 font-medium">Duyệt Công ty</span>
              </button>
              <button onClick={() => navigate('/admin/companies')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                🏢 <span className="ml-3 font-medium">Quản lý Công ty</span>
              </button>
              <button onClick={() => navigate('/admin/tags')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                🏷️ <span className="ml-3 font-medium">Quản lý Kỹ năng</span>
              </button>
              <button onClick={() => navigate('/admin/users')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
                👥 <span className="ml-3 font-medium">Quản lý Người dùng</span>
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8">
          <div className="text-gray-400 text-sm">              
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="font-medium text-earth">Chào {user.name || user.fullName}!</span>
                <button onClick={handleLogout} className="px-5 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => navigate('/login')} className="px-5 py-2 bg-earth text-white font-medium rounded-full shadow-md hover:bg-olive transition-all hover:-translate-y-1">
                  Đăng nhập
                </button>
                <button onClick={() => navigate('/register')} className="px-5 py-2 bg-earth text-white font-medium rounded-full shadow-md hover:bg-olive transition-all hover:-translate-y-1">
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;