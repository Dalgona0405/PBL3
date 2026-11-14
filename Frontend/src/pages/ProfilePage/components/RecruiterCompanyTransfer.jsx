import React, { useState, useEffect, useRef } from 'react';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import toast from 'react-hot-toast';

function RecruiterCompanyTransfer({ currentCompanyName }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [companyResults, setCompanyResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedNewCompany, setSelectedNewCompany] = useState(null);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchCompany = async (keyword) => {
        setSearchTerm(keyword);
        setSelectedNewCompany(null);
        if (keyword.length < 2) {
            setCompanyResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);
        try {
            const data = await axiosClient.get(`${API_URLS.COMPANIES}/search?keyword=${encodeURIComponent(keyword)}`);
            setCompanyResults(data.items || data.Items || []);
        } catch (err) {
            console.error("Lỗi tìm công ty:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCompany = (company) => {
        setSearchTerm(company.companyName);
        setSelectedNewCompany(company);
        setShowDropdown(false);
    };

    const handleSendCompanyRequest = async () => {
        if (!selectedNewCompany) return;
        setIsSendingRequest(true);

        try {
            const data = await axiosClient.post(API_URLS.COMPANY_REQUESTS, {
                companyId: selectedNewCompany.companyId
            });
            setSelectedNewCompany(null);
            setSearchTerm('');
            toast.success(data.message || "Đã gửi yêu cầu gia nhập doanh nghiệp.");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "⚠️ Có lỗi xảy ra khi gửi yêu cầu.";
            toast.error(errorMessage);
        } finally {
            setIsSendingRequest(false);
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <p className="w-32 font-medium text-gray-600">🏢 Công ty hiện tại:</p>
                <div className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 font-medium">
                    {currentCompanyName || "Chưa thuộc công ty nào"}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 relative mt-6 pt-6 border-t border-dashed border-gray-200" ref={dropdownRef}>
                <p className="w-32 font-medium text-olive mt-3">🔄 Đổi công ty:</p>
                <div className="flex-1 relative">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Gõ tên công ty muốn gia nhập..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                            value={searchTerm}
                            onChange={(e) => handleSearchCompany(e.target.value)}
                            onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                        />
                        {selectedNewCompany && (
                            <button
                                onClick={handleSendCompanyRequest}
                                disabled={isSendingRequest}
                                className="bg-earth hover:bg-olive text-white font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
                            >
                                {isSendingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        )}
                    </div>

                    {showDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-gray-500 text-center text-sm">Đang tìm kiếm... 🌿</div>
                            ) : companyResults.length > 0 ? (
                                companyResults.map((company) => (
                                    <div
                                        key={company.companyId}
                                        className="p-3 hover:bg-cream cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                        onClick={() => handleSelectCompany(company)}
                                    >
                                        <p className="font-bold text-olive">{company.companyName}</p>
                                        {company.website && <p className="text-xs text-gray-500">{company.website}</p>}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-gray-500 text-center text-sm">Không tìm thấy công ty nào.</div>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2 italic">
                        * Yêu cầu gia nhập sẽ được Công ty phê duyệt. Trong lúc chờ, bạn vẫn thuộc công ty cũ.
                    </p>
                </div>
            </div>
        </>
    );
}

export default RecruiterCompanyTransfer;
