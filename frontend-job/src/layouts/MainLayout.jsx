import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const MainLayout = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    // Khung to nhất bao trọn màn hình, nền trắng kem
    <div className="flex h-screen bg-cream font-sans">
      
      {/* SIDEBAR (Thanh menu bên trái) - Cố định */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-2xl font-bold text-olive cursor-pointer" onClick={() => navigate('/')}>
            🌿 IT Job Hunter
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => navigate('/')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
            🏠 <span className="ml-3 font-medium">Trang chủ</span>
          </button>
          
          {user && (
            <button onClick={() => navigate('/profile')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
              👤 <span className="ml-3 font-medium">Hồ sơ của tôi</span>
            </button>
          )}

          {user?.role === 'Candidate' && (
            <button onClick={() => navigate('/history-applied')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
              📤 <span className="ml-3 font-medium">Đã ứng tuyển</span>
            </button>
          )}

          {user?.role === 'Recruiter' && (
            <button onClick={() => navigate('/recruiter-dashboard')} className="w-full flex items-center px-4 py-3 text-textmain hover:bg-olive hover:text-white rounded-xl transition-all">
              🏢 <span className="ml-3 font-medium">Quản lý tuyển dụng</span>
            </button>
          )}
        </nav>
      </aside>

      {/* KHU VỰC BÊN PHẢI (Gồm Header và Nội dung thay đổi) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header trên cùng */}
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8">
          <div className="text-gray-400 text-sm">
            {/* Chỗ này sau này mình có thể để thanh Search nhỏ hoặc Breadcrumb */}
            Chào mừng bạn đến với hệ thống dự báo IT
          </div>

          {/* Góc phải Header: Thông tin User */}
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="font-medium text-earth">Chào {user.name}!</span>
                <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all">
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

        {/* NỘI DUNG CHÍNH (Phần này sẽ thay đổi tùy theo URL) */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Outlet chính là cái "lỗ hổng" để React Router nhét các trang (Home, Profile...) vào đây */}
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default MainLayout;