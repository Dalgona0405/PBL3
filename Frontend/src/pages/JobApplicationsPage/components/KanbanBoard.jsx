import React, { useState } from 'react';
import { APPLICATION_STATUS, APPLICATION_STATUS_OPTIONS } from '../../../constants/applicationStatus';
import KanbanCard from './KanbanCard';

function KanbanBoard({ applications, onDropStage, onSelectCandidate, onOpenStatusModal, onViewFeedback }) {
    const [activeMobileStage, setActiveMobileStage] = useState(APPLICATION_STATUS.APPLIED);
    const [dragOverStage, setDragOverStage] = useState(null);

    const handleDragStart = (e, app) => {
        e.dataTransfer.setData('text/plain', String(app.applicationId));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e, targetStage) => {
        e.preventDefault();
        setDragOverStage(null);
        const appId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const draggedApp = applications.find((a) => a.applicationId === appId);
        if (!draggedApp || Number(draggedApp.status) === targetStage) return;
        onDropStage(draggedApp, targetStage);
    };

    const grouped = APPLICATION_STATUS_OPTIONS.reduce((acc, stage) => {
        acc[stage.value] = applications.filter((a) => (a.status === 0 ? APPLICATION_STATUS.APPLIED : Number(a.status)) === stage.value);
        return acc;
    }, {});

    if (applications.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 text-gray-500">
                Không có hồ sơ ứng viên nào khớp với bộ lọc hiện tại. 🌿
            </div>
        );
    }

    const mobileStageInfo = APPLICATION_STATUS_OPTIONS.find((s) => s.value === activeMobileStage) || APPLICATION_STATUS_OPTIONS[0];

    return (
        <div>
            {/* Mobile Tab Navigation (NFR 4.3) */}
            <div className="md:hidden mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {APPLICATION_STATUS_OPTIONS.map((stage) => {
                        const count = grouped[stage.value]?.length || 0;
                        const active = activeMobileStage === stage.value;
                        return (
                            <button
                                key={stage.value}
                                type="button"
                                onClick={() => setActiveMobileStage(stage.value)}
                                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${active ? 'bg-olive text-white border-olive shadow-sm' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {stage.shortLabel} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className={`bg-gray-50 rounded-2xl p-3 border-t-4 ${mobileStageInfo.borderClass} space-y-3`}>
                    {(grouped[activeMobileStage] || []).map((app) => (
                        <KanbanCard
                            key={app.applicationId}
                            app={app}
                            onDragStart={handleDragStart}
                            onSelectCandidate={onSelectCandidate}
                            onOpenStatusModal={onOpenStatusModal}
                            onViewFeedback={onViewFeedback}
                        />
                    ))}
                    {(grouped[activeMobileStage] || []).length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-6 italic">Chưa có ứng viên ở bước này.</p>
                    )}
                </div>
            </div>

            {/* Desktop Drag-and-Drop Columns */}
            <div className="hidden md:flex gap-4 overflow-x-auto pb-4 items-start">
                {APPLICATION_STATUS_OPTIONS.map((stage) => {
                    const columnApps = grouped[stage.value] || [];
                    const isOver = dragOverStage === stage.value;
                    return (
                        <div
                            key={stage.value}
                            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.value); }}
                            onDragLeave={() => setDragOverStage((prev) => (prev === stage.value ? null : prev))}
                            onDrop={(e) => handleDrop(e, stage.value)}
                            className={`min-w-[280px] w-[280px] shrink-0 rounded-2xl p-3 border-t-4 ${stage.borderClass} transition-colors ${isOver ? 'bg-blue-50/80 ring-2 ring-earth' : 'bg-gray-100/80'}`}
                        >
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className={`text-sm font-bold ${stage.textClass}`}>{stage.label}</h3>
                                <span className="bg-white text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm border border-gray-200">
                                    {columnApps.length}
                                </span>
                            </div>

                            <div className="space-y-3 min-h-[240px]">
                                {columnApps.map((app) => (
                                    <KanbanCard
                                        key={app.applicationId}
                                        app={app}
                                        onDragStart={handleDragStart}
                                        onSelectCandidate={onSelectCandidate}
                                        onOpenStatusModal={onOpenStatusModal}
                                        onViewFeedback={onViewFeedback}
                                    />
                                ))}
                                {columnApps.length === 0 && (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                                        Kéo thả hồ sơ vào đây
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default KanbanBoard;
