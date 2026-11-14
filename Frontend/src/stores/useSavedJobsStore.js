import { create } from 'zustand';

export const useSavedJobsStore = create((set) => ({
    savedJobIds: [],

    setSavedJobIds: (jobsOrIds) => {
        const ids = Array.isArray(jobsOrIds)
            ? jobsOrIds.map((item) => (typeof item === 'object' && item !== null ? item.jobId : item)).filter(Boolean)
            : [];
        set({ savedJobIds: ids });
    },

    setJobSavedState: (jobId, isSaved) =>
        set((state) => {
            const exists = state.savedJobIds.includes(jobId);
            if (isSaved && !exists) {
                return { savedJobIds: [...state.savedJobIds, jobId] };
            }
            if (!isSaved && exists) {
                return { savedJobIds: state.savedJobIds.filter((id) => id !== jobId) };
            }
            return state;
        }),

    clearSavedJobs: () => set({ savedJobIds: [] })
}));
