import { useState } from "react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DetailJobPage from "./pages/DetailJobPage";
import './App.css';

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/detail-job/:id" element={<DetailJobPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;