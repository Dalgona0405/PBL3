import React from 'react';
import { APPLICATION_STATUS_OPTIONS } from '../../../constants/applicationStatus';

function ApplicationStatsBar({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-fade-in-up">
            {APPLICATION_STATUS_OPTIONS.map((stage) => (
                <div
                    key={stage.value}
                    className={`bg-white p-4 rounded-2xl shadow-sm border-t-4 ${stage.borderClass} flex flex-col items-center justify-center text-center`}
                >
                    <span className={`${stage.titleClass} text-sm font-bold mb-1`}>{stage.label}</span>
                    <span className={`text-2xl font-bold ${stage.textClass}`}>{stats[stage.key] || 0}</span>
                </div>
            ))}
        </div>
    );
}

export default ApplicationStatsBar;
