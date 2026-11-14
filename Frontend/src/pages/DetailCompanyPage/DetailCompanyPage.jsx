import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import JobList from '../../components/common/JobList';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import CompanyBanner from './components/CompanyBanner';

function DetailCompanyPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: companyDetail = null, isLoading } = useQuery({
        queryKey: ['companyDetail', id],
        queryFn: () => axiosClient.get(`${API_URLS.COMPANIES}/${id}`),
        enabled: Boolean(id)
    });

    if (isLoading || !companyDetail) {
        return (
            <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">
                Đang tải thông tin công ty... 🌿
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto w-full pb-12 px-4 md:px-0">
            <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-6 transition-colors"
            >
                ⬅ Quay lại
            </button>

            <CompanyBanner companyDetail={companyDetail} />

            <div className="bg-white rounded-3xl shadow-sm p-6">
                <div className="mb-6 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-olive pl-3 border-l-4 border-earth">
                        Tuyển dụng từ {companyDetail.companyName}
                    </h2>
                    <p className="text-gray-500 mt-2 pl-4 text-sm">Khám phá các cơ hội nghề nghiệp hấp dẫn đang mở tuyển.</p>
                </div>

                <JobList
                    companyId={id}
                    companyInfo={{
                        companyName: companyDetail.companyName,
                        logoImg: companyDetail.logoImg
                    }}
                />
            </div>
        </div>
    );
}

export default DetailCompanyPage;
