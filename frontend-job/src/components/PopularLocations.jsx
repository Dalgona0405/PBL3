import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

function PopularLocations({ onSelectLocation }) {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await axiosClient.get('/Locations/popular?limit=4');
                setLocations(Array.isArray(data) ? data : (data.items || []));
            } catch (error) {
                console.error("Lỗi lấy địa điểm nổi bật", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLocations();
    }, []);

    if (isLoading || locations.length === 0) return null;

    return (
        <div className="mb-12 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-textmain mb-6 flex items-center gap-2">
                🌟 Địa điểm nổi bật
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {locations.map(loc => (
                    <div 
                        key={loc.locationId}
                        onClick={() => onSelectLocation(loc.locationId)}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-earth hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center transform hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                            🏙️
                        </div>
                        <h3 className="font-bold text-olive group-hover:text-earth transition-colors text-lg">
                            {loc.locationName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            {loc.jobCount || 0} việc làm
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PopularLocations;