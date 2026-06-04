import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

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
      <aside className="w-64 bg-olive shadow-lg flex flex-col">
        <div className="h-20 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-cream cursor-pointer" onClick={() => navigate('/')}>
            🌿 IT Job Hunter
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => navigate('/')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
            🏠 <span className="ml-3 font-medium">Trang chủ</span>
          </button>
          <button onClick={() => navigate('/forecast')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
            📊 <span className="ml-3 font-medium">Dự báo thị trường</span>
          </button>

          {user && (
            <button onClick={() => navigate('/profile')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
              👤 <span className="ml-3 font-medium">Hồ sơ của tôi</span>
            </button>
          )}

          {user?.role === 'Candidate' && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-bold text-cream uppercase tracking-wider">Người tìm việc</p>
              </div>
              <button onClick={() => navigate('/suggested-jobs')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                🎯 <span className="ml-3 font-medium">Việc làm gợi ý</span>
              </button>
              <button onClick={() => navigate('/history-applied')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                📤 <span className="ml-3 font-medium">Danh sách ứng tuyển</span>
              </button>
              <button onClick={() => navigate('/saved-jobs')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
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
              <button onClick={() => navigate('/recruiter-dashboard')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                🏢 <span className="ml-3 font-medium">Quản lý bài đăng</span>
              </button>

              {user?.role === 'Company' && (
                <>
                  <button onClick={() => navigate('/company/profile')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                    🏢 <span className="ml-3 font-medium">Hồ sơ Doanh nghiệp</span>
                  </button>
                  <button onClick={() => navigate('/company/requests')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
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
              <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                🎯 <span className="ml-3 font-medium">Bảng điều khiển</span>
              </button>
              <button onClick={() => navigate('/admin/companies')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                🏢 <span className="ml-3 font-medium">Quản lý Công ty</span>
              </button>
              <button onClick={() => navigate('/admin/locations')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                📍 <span className="ml-3 font-medium">Quản lý Địa điểm</span>
              </button>
              <button onClick={() => navigate('/admin/tags')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
                🏷️ <span className="ml-3 font-medium">Quản lý Tags</span>
              </button>
              <button onClick={() => navigate('/admin/users')} className="w-full flex items-center px-4 py-3 text-cream hover:bg-earth hover:text-white rounded-xl transition-all">
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
              <div className="flex items-center gap-6">
                <span className="font-medium text-earth">Chào {user.name || user.fullName}!</span>
                <NotificationBell />
                <button onClick={handleLogout} className="px-5 py-2 text-sm bg-olive text-white hover:bg-red-500 rounded-lg transition-all">
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

        <main className="flex-1 bg-white overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;