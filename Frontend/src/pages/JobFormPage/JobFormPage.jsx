import React from 'react';
import { useParams } from 'react-router-dom';
import { useJobForm } from './hooks/useJobForm';
import JobBasicInfoSection from './components/JobBasicInfoSection';
import JobDetailAndTagsSection from './components/JobDetailAndTagsSection';

function JobFormPage() {
    const { jobId } = useParams();
    const {
        isEditMode, locations, formData, fieldErrors, selectedTags,
        tagKeyword, setTagKeyword, tagSuggestions, isSuggesting,
        showTagDropdown, setShowTagDropdown, isLoading, isSaving, error,
        handleChange, handleSelectTag, handleRemoveTag, handleSave, goBack
    } = useJobForm(jobId);

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang chuẩn bị biểu mẫu tuyển dụng... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8">
                <button
                    type="button"
                    onClick={goBack}
                    className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-4 transition-colors"
                >
                    ⬅ Quay lại Dashboard
                </button>
                <div className="border-b-2 border-olive pb-4">
                    <h2 className="text-3xl font-bold text-textmain mb-2">
                        {isEditMode ? '✏️ Cập nhật Tin tuyển dụng' : '✨ Đăng Tin tuyển dụng mới'}
                    </h2>
                    <p className="text-gray-500">Điền đầy đủ thông tin để thu hút những ứng viên tài năng nhất.</p>
                </div>
            </div>

            <form onSubmit={handleSave} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <JobBasicInfoSection
                    formData={formData}
                    locations={locations}
                    errors={fieldErrors}
                    onChange={handleChange}
                />
                <JobDetailAndTagsSection
                    formData={formData}
                    onChange={handleChange}
                    selectedTags={selectedTags}
                    tagKeyword={tagKeyword}
                    onTagKeywordChange={setTagKeyword}
                    tagSuggestions={tagSuggestions}
                    isSuggesting={isSuggesting}
                    showTagDropdown={showTagDropdown}
                    onSetShowTagDropdown={setShowTagDropdown}
                    onSelectTag={handleSelectTag}
                    onRemoveTag={handleRemoveTag}
                    isEditMode={isEditMode}
                    isSaving={isSaving}
                />
            </form>
        </div>
    );
}

export default JobFormPage;
