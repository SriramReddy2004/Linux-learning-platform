import { create } from 'zustand';

export const useContainerStore = create((set) => ({
  containers: [],
  activeContainer: null,
  loading: false,

  setContainers: (containers) => set({ containers }),

  setActiveContainer: (container) => set({ activeContainer: container }),

  addContainer: (container) => 
    set((state) => ({ 
      containers: [container, ...state.containers] 
    })),

  updateContainer: (containerId, updates) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c._id === containerId ? { ...c, ...updates } : c
      ),
    })),

  removeContainer: (containerId) =>
    set((state) => ({
      containers: state.containers.filter((c) => c._id !== containerId),
    })),

  setLoading: (loading) => set({ loading }),
}));
