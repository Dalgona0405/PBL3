import { useState, useEffect } from "react";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DetailJobPage from "./pages/DetailJobPage";
import DetailCompanyPage from "./pages/DetailCompanyPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryAppliedPage from "./pages/HistoryAppliedPage";
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <BrowserRouter>
      <Header user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />
        <Route path="/detail-job/:id" element={<DetailJobPage />} />
        <Route path="/detail-company/:id" element={<DetailCompanyPage />} />
        <Route 
          path="/profile" 
          element={user ? <ProfilePage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/history-applied" 
          element={user ? <HistoryAppliedPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/recruiter-dashboard" 
          element={user?.role === 'Recruiter' ? <div style={{padding: '50px'}}>Giao diện của Nhà Tuyển Dụng (Đang xây)</div> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;