import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";

const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage/RegisterPage"));
const DetailJobPage = lazy(() => import("./pages/DetailJobPage/DetailJobPage"));
const DetailCompanyPage = lazy(() => import("./pages/DetailCompanyPage/DetailCompanyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage/ProfilePage"));
const HistoryAppliedPage = lazy(() => import("./pages/HistoryAppliedPage/HistoryAppliedPage"));
const SuggestedJobs = lazy(() => import("./pages/SuggestedJobsPage/SuggestedJobsPage"));
const RecruiterDashboardPage = lazy(() => import("./pages/RecruiterDashboardPage/RecruiterDashboardPage"));
const JobApplicationsPage = lazy(() => import("./pages/JobApplicationsPage/JobApplicationsPage"));
const JobFormPage = lazy(() => import("./pages/JobFormPage/JobFormPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage/AdminDashboardPage"));
const CompanyRequestsPage = lazy(() => import("./pages/CompanyRequestsPage/CompanyRequestsPage"));
const ManageTagsPage = lazy(() => import("./pages/ManageTagsPage/ManageTagsPage"));
const ManageUsersPage = lazy(() => import("./pages/ManageUsersPage/ManageUsersPage"));
const ManageCompaniesPage = lazy(() => import("./pages/ManageCompaniesPage/ManageCompaniesPage"));
const ManageLocationsPage = lazy(() => import("./pages/ManageLocationsPage/ManageLocationsPage"));
const ForeCast = lazy(() => import("./pages/ForeCastPage/ForeCastPage"));
const SavedJobsPage = lazy(() => import("./pages/SavedJobsPage/SavedJobsPage"));
const ManageCompanyProfilePage = lazy(() => import("./pages/ManageCompanyProfilePage/ManageCompanyProfilePage"));

const PageLoader = () => (
    <div className="flex justify-center items-center h-64 text-olive text-lg font-medium animate-pulse">
        Đang tải trang... 🌿
    </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
                    <Route path="/company/profile" element={<ProtectedRoute allowedRoles={['Company']}><ManageCompanyProfilePage /></ProtectedRoute>} />
                    <Route path="/company/requests" element={<ProtectedRoute allowedRoles={['Company']}><CompanyRequestsPage /></ProtectedRoute>} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} />
                    <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['Admin']}><ManageCompaniesPage /></ProtectedRoute>} />
                    <Route path="/admin/locations" element={<ProtectedRoute allowedRoles={['Admin']}><ManageLocationsPage /></ProtectedRoute>} />
                    <Route path="/admin/tags" element={<ProtectedRoute allowedRoles={['Admin']}><ManageTagsPage /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><ManageUsersPage /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
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
                            fontWeight: '500',
                            borderRadius: '16px',
                        },
                        success: { iconTheme: { primary: '#8a9a86', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
