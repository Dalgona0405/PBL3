import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DetailJobPage from "./pages/DetailJobPage";
import DetailCompanyPage from "./pages/DetailCompanyPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryAppliedPage from "./pages/HistoryAppliedPage";
import SuggestedJobs from "./pages/SuggestedJobs";
import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";
import JobApplicationsPage from "./pages/JobApplicationsPage";
import JobFormPage from "./pages/JobFormPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CompanyRequestsPage from "./pages/CompanyRequestsPage";
import ManageTagsPage from "./pages/ManageTags";
import ManageUsersPage from "./pages/ManageUsersPage";
import ManageCompaniesPage from "./pages/ManageCompaniesPage";
import ForeCast from "./pages/ForeCast";

// Component con để bảo vệ các trang bắt buộc đăng nhập (Route Guard)
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useAuth();
    
    if (!user) return <Navigate to="/login" />;
    if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/forecast" element={<ForeCast />} />
                <Route path="/detail-job/:id" element={<DetailJobPage />} />
                <Route path="/detail-company/:id" element={<DetailCompanyPage />} />

                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/history-applied" element={<ProtectedRoute allowedRole="Candidate"><HistoryAppliedPage /></ProtectedRoute>} />
                <Route path="/suggested-jobs" element={<ProtectedRoute allowedRole="Candidate"><SuggestedJobs /></ProtectedRoute>} />
                <Route path="/recruiter-dashboard" element={<ProtectedRoute allowedRole="Recruiter"><RecruiterDashboardPage /></ProtectedRoute>} />
                <Route path="/recruiter/jobs/:jobId/applications" element={<ProtectedRoute allowedRole="Recruiter"><JobApplicationsPage /></ProtectedRoute>} />
                <Route path="/recruiter/jobs/create" element={<ProtectedRoute allowedRole="Recruiter"><JobFormPage /></ProtectedRoute>} />
                <Route path="/recruiter/jobs/edit/:jobId" element={<ProtectedRoute allowedRole="Recruiter"><JobFormPage /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="Admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/company-requests" element={<ProtectedRoute allowedRole="Admin"><CompanyRequestsPage /></ProtectedRoute>} />
                <Route path="/admin/companies" element={<ProtectedRoute allowedRole="Admin"><ManageCompaniesPage /></ProtectedRoute>} />
                <Route path="/admin/tags" element={<ProtectedRoute allowedRole="Admin"><ManageTagsPage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRole="Admin"><ManageUsersPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#faf9f6',
                            color: '#4a4a4a',
                            border: '1px solid #8a9a86',
                            fontweight: '500',
                            borderRadius: '16px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#8a9a86',
                                secondary: '#fff'
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff'
                            },
                        },
                    }}
                />
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;