import { create } from 'zustand';
import type { ViewMode } from '../services/viewer/ViewModeService';

type ToolMode = 'view' | 'erase' | 'highlight' | 'insert-image' | 'insert-text';

interface UIStore {
  // State
  zoom: number;
  selectedPageIndex: number;
  sidebarWidth: number;
  toolMode: ToolMode;
  pageRotations: number[]; // 存储每页的旋转角度 (0, 90, 180, 270)
  viewMode: ViewMode;
  showToolsPanel: boolean;
  searchQuery: string;
  searchResults: any[];
  currentMatchIndex: number;

  // Actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToPage: () => void; // "适应"按钮 - 切换到fit-page模式
  selectPage: (index: number) => void;
  setSidebarWidth: (width: number) => void;
  setToolMode: (mode: ToolMode) => void;
  setPageRotation: (pageIndex: number, rotation: number) => void;
  rotatePageLeft: (pageIndex: number) => void;
  rotatePageRight: (pageIndex: number) => void;
  flipPage: (pageIndex: number) => void;
  getPageRotation: (pageIndex: number) => number;
  setViewMode: (mode: ViewMode) => void;
  toggleToolsPanel: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setCurrentMatchIndex: (index: number) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  zoom: 1.0,
  selectedPageIndex: 0,
  sidebarWidth: 200,
  toolMode: 'view',
  pageRotations: [], // 初始化为空数组，加载PDF时填充
  viewMode: 'fit-width',
  showToolsPanel: false,
  searchQuery: '',
  searchResults: [],
  currentMatchIndex: 0,

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3.0, zoom)) }),

  zoomIn: () => set((state) => ({
    zoom: Math.min(3.0, state.zoom + 0.1)
  })),

  zoomOut: () => set((state) => ({
    zoom: Math.max(0.5, state.zoom - 0.1)
  })),

  resetZoom: () => set({ zoom: 1.0 }),

  fitToPage: () => set({ viewMode: 'fit-page' }),

  selectPage: (index) => set({ selectedPageIndex: index }),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  setToolMode: (mode) => set({ toolMode: mode }),

  setPageRotation: (pageIndex, rotation) =>
    set((state) => {
      const newRotations = [...state.pageRotations];
      newRotations[pageIndex] = rotation;
      return { pageRotations: newRotations };
    }),

  rotatePageLeft: (pageIndex) =>
    set((state) => {
      const newRotations = [...state.pageRotations];
      const currentRotation = newRotations[pageIndex] || 0;
      // 左转90度（减90）
      newRotations[pageIndex] = (currentRotation - 90 + 360) % 360;
      return { pageRotations: newRotations };
    }),

  rotatePageRight: (pageIndex) =>
    set((state) => {
      const newRotations = [...state.pageRotations];
      const currentRotation = newRotations[pageIndex] || 0;
      // 右转90度（加90）
      newRotations[pageIndex] = (currentRotation + 90) % 360;
      return { pageRotations: newRotations };
    }),

  flipPage: (pageIndex) =>
    set((state) => {
      const newRotations = [...state.pageRotations];
      const currentRotation = newRotations[pageIndex] || 0;
      // 翻转（加180度）
      newRotations[pageIndex] = (currentRotation + 180) % 360;
      return { pageRotations: newRotations };
    }),

  getPageRotation: (pageIndex) => {
    return get().pageRotations[pageIndex] || 0;
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleToolsPanel: () =>
    set((state) => ({ showToolsPanel: !state.showToolsPanel })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setCurrentMatchIndex: (index) => set({ currentMatchIndex: index }),
}));

export type { ViewMode };
