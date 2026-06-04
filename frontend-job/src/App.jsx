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
import ManageTagsPage from "./pages/ManageTagsPage";
import ManageUsersPage from "./pages/ManageUsersPage";
import ManageCompaniesPage from "./pages/ManageCompaniesPage";
import ManageLocationsPage from "./pages/ManageLocationsPage";
import ForeCast from "./pages/ForeCast";
import SavedJobsPage from "./pages/SavedJobsPage";
import ManageCompanyProfilePage from "./pages/ManageCompanyProfilePage";

// Component con để bảo vệ các trang bắt buộc đăng nhập (Route Guard)
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role))
        return <Navigate to="/" />;

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
                <Route path="/history-applied" element={<ProtectedRoute allowedRoles={['Candidate']}><HistoryAppliedPage /></ProtectedRoute>} />
                <Route path="/suggested-jobs" element={<ProtectedRoute allowedRoles={['Candidate']}><SuggestedJobs /></ProtectedRoute>} />
                <Route path="/saved-jobs" element={<ProtectedRoute allowedRoles={['Candidate']}><SavedJobsPage /></ProtectedRoute>} />
                <Route path="/recruiter-dashboard" element={<ProtectedRoute allowedRoles={['Recruiter', 'Company']}><RecruiterDashboardPage /></ProtectedRoute>} />
                <Route path="/recruiter/jobs/:jobId/applications" element={<ProtectedRoute allowedRoles={['Recruiter', 'Company']}><JobApplicationsPage /></ProtectedRoute>} />
                <Route path="/recruiter/jobs/create" element={<ProtectedRoute allowedRoles={['Recruiter', 'Company']}><JobFormPage /></ProtectedRoute>} />
                <Route path="/recruiter/jobs/edit/:jobId" element={<ProtectedRoute allowedRoles={['Recruiter', 'Company']}><JobFormPage /></ProtectedRoute>} />
                <Route path="/company/company-requests" element={<ProtectedRoute allowedRoles={['Company']}><CompanyRequestsPage /></ProtectedRoute>} />
                <Route path="/company/profile" element={<ProtectedRoute allowedRoles={['Company']}><ManageCompanyProfilePage /></ProtectedRoute>} />                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['Admin']}><ManageCompaniesPage /></ProtectedRoute>} />
                <Route path="/admin/locations" element={<ProtectedRoute allowedRoles={['Admin']}><ManageLocationsPage /></ProtectedRoute>} />
                <Route path="/admin/tags" element={<ProtectedRoute allowedRoles={['Admin']}><ManageTagsPage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><ManageUsersPage /></ProtectedRoute>} />
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