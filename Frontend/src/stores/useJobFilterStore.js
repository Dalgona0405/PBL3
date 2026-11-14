import { create } from 'zustand';

export const INITIAL_JOB_FILTERS = {
    keyword: '',
    locationId: '',
    tagId: '',
    minSalary: '',
    maxSalary: '',
    level: '',
    expYear: ''
};

export const useJobFilterStore = create((set) => ({
    filters: { ...INITIAL_JOB_FILTERS },
    currentPage: 1,

    setFilters: (nextFilters) =>
        set((state) => ({
            filters: typeof nextFilters === 'function' ? nextFilters(state.filters) : { ...INITIAL_JOB_FILTERS, ...nextFilters },
            currentPage: 1
        })),

    setFilterField: (field, value) =>
        set((state) => ({
            filters: { ...state.filters, [field]: value },
            currentPage: 1
        })),

    removeFilters: (keys) =>
        set((state) => {
            const next = { ...state.filters };
            keys.forEach((k) => {
                next[k] = '';
            });
            return { filters: next, currentPage: 1 };
        }),

    resetFilters: () => set({ filters: { ...INITIAL_JOB_FILTERS }, currentPage: 1 }),

    setCurrentPage: (page) => set({ currentPage: page })
}));
