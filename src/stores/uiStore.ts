import { create } from 'zustand';

interface UIStore {
  // State
  zoom: number;
  selectedPageIndex: number;
  sidebarWidth: number;

  // Actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  selectPage: (index: number) => void;
  setSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  zoom: 1.0,
  selectedPageIndex: 0,
  sidebarWidth: 200,

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3.0, zoom)) }),

  zoomIn: () => set((state) => ({
    zoom: Math.min(3.0, state.zoom + 0.1)
  })),

  zoomOut: () => set((state) => ({
    zoom: Math.max(0.5, state.zoom - 0.1)
  })),

  resetZoom: () => set({ zoom: 1.0 }),

  selectPage: (index) => set({ selectedPageIndex: index }),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
}));
