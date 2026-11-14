import React from 'react';

function LocationForm({ formData, editingId, isSaving, onChange, onSave, onCancelEdit }) {
    return (
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth sticky top-8">
                <h3 className="text-xl font-bold text-olive mb-4">
                    {editingId ? '✏️ Sửa Địa điểm' : '✨ Thêm Địa điểm mới'}
                </h3>
                <form onSubmit={onSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tên tỉnh / thành phố</label>
                        <input
                            type="text"
                            name="locationName"
                            required
                            value={formData.locationName}
                            onChange={onChange}
                            placeholder="VD: Hà Nội, Hồ Chí Minh..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                            >
                                Hủy
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isSaving ? 'bg-gray-400' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}
                        >
                            {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LocationForm;
