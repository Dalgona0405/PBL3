import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DetailJobPage from "./pages/DetailJobPage";
import DetailCompanyPage from "./pages/DetailCompanyPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryAppliedPage from "./pages/HistoryAppliedPage";
import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        {/* Các trang KHÔNG cần Layout */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />

        {/* Các trang CÓ Layout (Sidebar + Header) */}
        <Route element={<MainLayout user={user} setUser={setUser} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/detail-job/:id" element={<DetailJobPage />} />
          <Route path="/detail-company/:id" element={<DetailCompanyPage />} />
          
          {/* Các trang cần đăng nhập */}
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/history-applied" element={user ? <HistoryAppliedPage /> : <Navigate to="/login" />} />
          <Route path="/recruiter-dashboard" element={user?.role === 'Recruiter' ? <RecruiterDashboardPage /> : <Navigate to="/login" />} />
        </Route>

        {/* Bắt lỗi 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;