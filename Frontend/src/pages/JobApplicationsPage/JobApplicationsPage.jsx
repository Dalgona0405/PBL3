import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CandidateDetailModal from '../../components/common/CandidateDetailModal';
import ApplicationStatsBar from './components/ApplicationStatsBar';
import ApplicationFilterBar from './components/ApplicationFilterBar';
import KanbanBoard from './components/KanbanBoard';
import ApplicationTable from './components/ApplicationTable';
import UpdateStatusModal from './components/UpdateStatusModal';
import ViewFeedbackModal from './components/ViewFeedbackModal';
import { useJobApplications } from './hooks/useJobApplications';

function JobApplicationsPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [selectedApplication, setSelectedApplication] = useState(null);
    const [viewFeedbackModal, setViewFeedbackModal] = useState({ isOpen: false, data: null });

    const {
        applications,
        filteredApplications,
        availableSkills,
        jobDetail,
        stats,
        isLoading,
        error,
        viewMode,
        setViewMode,
        filters,
        updateFilter,
        resetFilters,
        statusModal,
        closeStatusModal,
        statusForm,
        handleStatusFormChange,
        isUpdating,
        handleOpenStatusModal,
        handleConfirmUpdateStatus,
    } = useJobApplications(jobId, user, navigate);

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải danh sách ứng viên... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    const jobTitle = jobDetail?.title || (applications.length > 0 ? applications[0].job?.title : 'Công việc này');

    return (
        <div className="max-w-7xl mx-auto w-full pb-12 relative">
            <div className="mb-6">
                <button onClick={() => navigate('/recruiter-dashboard')} className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-4 transition-colors">
                    ⬅ Quay lại Dashboard
                </button>
                <div className="border-b-2 border-olive pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textmain mb-1">👥 ATS Pipeline &amp; Ứng viên</h2>
                        <p className="text-gray-500">Vị trí tuyển dụng: <strong className="text-earth">{jobTitle}</strong></p>
                    </div>
                    <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-500 font-medium whitespace-nowrap">
                        Tổng số CV: <strong className="text-olive">{applications.length}</strong>
                    </span>
                </div>
            </div>

            <ApplicationStatsBar stats={stats} />

            <ApplicationFilterBar
                filters={filters}
                availableSkills={availableSkills}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterChange={updateFilter}
                onResetFilters={resetFilters}
                totalCount={applications.length}
                filteredCount={filteredApplications.length}
            />

            {viewMode === 'kanban' ? (
                <KanbanBoard
                    applications={filteredApplications}
                    onDropStage={handleOpenStatusModal}
                    onSelectCandidate={setSelectedApplication}
                    onOpenStatusModal={handleOpenStatusModal}
                    onViewFeedback={(data) => setViewFeedbackModal({ isOpen: true, data })}
                />
            ) : (
                <ApplicationTable
                    applications={filteredApplications}
                    onSelectCandidate={setSelectedApplication}
                    onOpenStatusModal={handleOpenStatusModal}
                    onViewFeedback={(data) => setViewFeedbackModal({ isOpen: true, data })}
                />
            )}

            {statusModal.isOpen && (
                <UpdateStatusModal
                    candidateName={statusModal.candidateName}
                    statusForm={statusForm}
                    isUpdating={isUpdating}
                    onChange={handleStatusFormChange}
                    onClose={closeStatusModal}
                    onConfirm={handleConfirmUpdateStatus}
                />
            )}

            {viewFeedbackModal.isOpen && viewFeedbackModal.data && (
                <ViewFeedbackModal
                    data={viewFeedbackModal.data}
                    onClose={() => setViewFeedbackModal({ isOpen: false, data: null })}
                />
            )}

            {selectedApplication && (
                <CandidateDetailModal
                    candidateId={selectedApplication.candidate?.userId || selectedApplication.userId}
                    application={selectedApplication}
                    jobRequiredSkills={jobDetail?.tags || []}
                    onClose={() => setSelectedApplication(null)}
                />
            )}
        </div>
    );
}

export default JobApplicationsPage;
