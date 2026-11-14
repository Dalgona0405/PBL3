import React from 'react';
import { useParams } from 'react-router-dom';
import { useDetailJob } from './hooks/useDetailJob';
import JobHeaderSection from './components/JobHeaderSection';
import JobContentSection from './components/JobContentSection';
import ApplyJobModal from './components/ApplyJobModal';

function DetailJobPage() {
    const { id } = useParams();
    const {
        user, jobDetail, matchResult, showModal, setShowModal,
        cvOption, setCvOption, isSubmitting, isOpeningChat, candidateProfile,
        handleOpenModal, handleFileChange, handleConfirmApply, handleOpenChatWithRecruiter,
        goBack, goToCompany
    } = useDetailJob(id);

    if (!jobDetail) {
        return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải thông tin công việc... 🌿</div>;
    }

    return (
        <div className="max-w-6xl mx-auto w-full pb-12 relative">
            <button
                type="button"
                onClick={goBack}
                className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-6 transition-colors"
            >
                ⬅ Quay lại
            </button>

            <JobHeaderSection jobDetail={jobDetail} onNavigateCompany={goToCompany} />

            <JobContentSection
                jobDetail={jobDetail}
                matchResult={matchResult}
                user={user}
                onOpenApplyModal={handleOpenModal}
                onChatWithHr={handleOpenChatWithRecruiter}
                isOpeningChat={isOpeningChat}
            />

            {showModal && (
                <ApplyJobModal
                    jobTitle={jobDetail.title}
                    candidateProfile={candidateProfile}
                    cvOption={cvOption}
                    isSubmitting={isSubmitting}
                    onChangeOption={setCvOption}
                    onFileChange={handleFileChange}
                    onClose={() => setShowModal(false)}
                    onConfirm={handleConfirmApply}
                />
            )}
        </div>
    );
}

export default DetailJobPage;
