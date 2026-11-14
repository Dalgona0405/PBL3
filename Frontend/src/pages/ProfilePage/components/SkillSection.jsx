import React, { useState, useEffect } from 'react';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import toast from 'react-hot-toast';
import SelectField from '../../../components/ui/SelectField';
import Button from '../../../components/ui/Button';

function SkillSection({ userId }) {
    const [allTags, setAllTags] = useState([]);
    const [userTags, setUserTags] = useState([]);
    const [selectedTagId, setSelectedTagId] = useState('');
    const [selectedProficiency, setSelectedProficiency] = useState('Khá');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchSkillsData = async () => {
            try {
                setIsLoading(true);
                const [skillsRes, languagesRes, rolesRes, domainsRes, userSkillsData] = await Promise.all([
                    axiosClient.get(`${API_URLS.TAGS}/type/Skill`).catch(() => []),
                    axiosClient.get(`${API_URLS.TAGS}/type/Language`).catch(() => []),
                    axiosClient.get(`${API_URLS.TAGS}/type/Role`).catch(() => []),
                    axiosClient.get(`${API_URLS.TAGS}/type/Domain`).catch(() => []),
                    axiosClient.get(`${API_URLS.CANDIDATE}/${userId}/skills`).catch(() => [])
                ]);

                const validTags = [...(skillsRes || []), ...(languagesRes || []), ...(rolesRes || []), ...(domainsRes || [])];
                setAllTags(validTags);
                setUserTags(userSkillsData || []);
            } catch (error) {
                console.error("Lỗi tải dữ liệu kỹ năng:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSkillsData();
    }, [userId]);

    const handleAddSkill = async () => {
        if (!selectedTagId) {
            toast.error("Vui lòng chọn một kỹ năng trước!");
            return;
        }

        const parsedTagId = parseInt(selectedTagId, 10);
        if (userTags.some((t) => t.tagId === parsedTagId)) {
            toast.error("Kỹ năng này đã có trong hồ sơ của bạn!");
            return;
        }

        const tagToAdd = allTags.find((t) => t.tagId === parsedTagId);
        if (!tagToAdd) return;

        const updatedSkills = [
            ...userTags,
            { tagId: tagToAdd.tagId, tagName: tagToAdd.tagName, proficiency: selectedProficiency }
        ];

        const toastId = toast.loading("Đang thêm kỹ năng... 🌿");
        try {
            const payload = updatedSkills.map((t) => ({ tagId: t.tagId, proficiency: t.proficiency }));
            await axiosClient.put(API_URLS.CANDIDATE_TAGS, payload);

            setUserTags(updatedSkills);
            setSelectedTagId('');
            toast.success("Đã thêm kỹ năng thành công!", { id: toastId });
        } catch {
            toast.error("Lỗi khi thêm kỹ năng. Vui lòng thử lại!", { id: toastId });
        }
    };

    const handleRemoveSkill = async (tagIdToRemove) => {
        const updatedSkills = userTags.filter((t) => t.tagId !== tagIdToRemove);
        const toastId = toast.loading("Đang xóa kỹ năng... 🌿");

        try {
            const payload = updatedSkills.map((t) => ({ tagId: t.tagId, proficiency: t.proficiency }));
            await axiosClient.put(API_URLS.CANDIDATE_TAGS, payload);

            setUserTags(updatedSkills);
            toast.success("Đã xóa kỹ năng!", { id: toastId });
        } catch {
            toast.error("Lỗi khi xóa kỹ năng. Vui lòng thử lại!", { id: toastId });
        }
    };

    if (isLoading) return <div className="animate-pulse text-olive py-4">Đang tải dữ liệu kỹ năng... 🌿</div>;

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-olive">
            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                🧩 Kỹ năng chuyên môn
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
                <div className="md:col-span-2">
                    <SelectField
                        label="Chọn kỹ năng muốn thêm"
                        value={selectedTagId}
                        onChange={(e) => setSelectedTagId(e.target.value)}
                        options={allTags.map((tag) => ({ label: tag.tagName, value: tag.tagId }))}
                    />
                </div>

                <div className="md:col-span-1">
                    <SelectField
                        label="Trình độ"
                        value={selectedProficiency}
                        onChange={(e) => setSelectedProficiency(e.target.value)}
                        options={[
                            { label: 'Cơ bản', value: 'Cơ bản' },
                            { label: 'Khá', value: 'Khá' },
                            { label: 'Tốt', value: 'Tốt' },
                            { label: 'Xuất sắc', value: 'Xuất sắc' }
                        ]}
                    />
                </div>

                <div className="md:col-span-1 pb-1">
                    <Button onClick={handleAddSkill}>+ Thêm</Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                {userTags.length > 0 ? (
                    userTags.map((tag) => (
                        <div key={tag.tagId} className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                            <span className="px-4 py-2 text-textmain font-bold bg-tan border-r border-gray-200">
                                {tag.tagName}
                            </span>
                            <span className="px-4 py-2 text-earth font-medium text-sm">
                                {tag.proficiency || 'Chưa đánh giá'}
                            </span>
                            <button
                                className="px-3 py-2 bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border-l border-gray-100"
                                onClick={() => handleRemoveSkill(tag.tagId)}
                                title="Xóa kỹ năng này"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="w-full text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 italic">
                            Bạn chưa cập nhật kỹ năng. Hãy thêm kỹ năng để AI gợi ý việc làm chuẩn xác hơn!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SkillSection;
