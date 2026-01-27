import { create } from 'zustand';

interface EditAction {
  type: 'text-edit' | 'page-delete' | 'page-insert' | 'page-replace';
  timestamp: number;
  data: any;
}

interface EditStore {
  // Edit history for undo/redo
  history: EditAction[];
  currentIndex: number;

  // Editing state
  isEditing: boolean;
  editMode: 'text' | 'image' | 'none';
  hasUnsavedChanges: boolean;

  // Actions
  setEditMode: (mode: 'text' | 'image' | 'none') => void;
  addToHistory: (action: EditAction) => void;
  undo: () => void;
  redo: () => void;
  markAsSaved: () => void;
  markAsUnsaved: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditStore = create<EditStore>((set, get) => ({
  history: [],
  currentIndex: -1,
  isEditing: false,
  editMode: 'none',
  hasUnsavedChanges: false,

  setEditMode: (mode) => set({ editMode: mode, isEditing: mode !== 'none' }),

  addToHistory: (action) => set((state) => {
    const newHistory = state.history.slice(0, state.currentIndex + 1);
    newHistory.push(action);
    return {
      history: newHistory,
      currentIndex: newHistory.length - 1,
      hasUnsavedChanges: true,
    };
  }),

  undo: () => set((state) => ({
    currentIndex: Math.max(-1, state.currentIndex - 1),
  })),

  redo: () => set((state) => ({
    currentIndex: Math.min(state.history.length - 1, state.currentIndex + 1),
  })),

  markAsSaved: () => set({ hasUnsavedChanges: false }),

  markAsUnsaved: () => set({ hasUnsavedChanges: true }),

  canUndo: () => get().currentIndex >= 0,

  canRedo: () => get().currentIndex < get().history.length - 1,
}));
