import { create } from 'zustand';

// Maximum number of actions to keep in history to prevent memory leaks
const MAX_HISTORY = 100;

// Discriminated union types for type-safe action data
type EditAction =
  | {
      type: 'text-edit';
      timestamp: number;
      data: {
        pageNumber: number;
        text: string;
        position: { x: number; y: number };
      };
    }
  | {
      type: 'page-delete';
      timestamp: number;
      data: {
        pageNumber: number;
      };
    }
  | {
      type: 'page-insert';
      timestamp: number;
      data: {
        afterPageNumber: number;
      };
    }
  | {
      type: 'page-replace';
      timestamp: number;
      data: {
        pageNumber: number;
        imageData?: string;
      };
    }
  | {
      type: 'image-insert';
      timestamp: number;
      data: {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | {
      type: 'text-insert';
      timestamp: number;
      data: {
        pageIndex: number;
        text: string;
        x: number;
        y: number;
        fontSize: number;
        color: { r: number; g: number; b: number };
      };
    };

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
  clearHistory: () => void;
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
    // Truncate history after current index (discard "future" when new action is added)
    const newHistory = state.history.slice(0, state.currentIndex + 1);
    newHistory.push(action);

    // Enforce MAX_HISTORY limit to prevent memory leaks
    const trimmedHistory = newHistory.slice(-MAX_HISTORY);

    return {
      history: trimmedHistory,
      currentIndex: trimmedHistory.length - 1,
      hasUnsavedChanges: true,
    };
  }),

  // NOTE: undo/redo currently only update the currentIndex pointer.
  // This is a foundation for future implementation where consumers will
  // read history[currentIndex] to apply the action state. Full undo/redo
  // functionality will be implemented in a future phase when the application
  // can reconstruct document state from the action history.
  undo: () => set((state) => ({
    currentIndex: Math.max(-1, state.currentIndex - 1),
  })),

  redo: () => set((state) => ({
    currentIndex: Math.min(state.history.length - 1, state.currentIndex + 1),
  })),

  markAsSaved: () => set({ hasUnsavedChanges: false }),

  markAsUnsaved: () => set({ hasUnsavedChanges: true }),

  clearHistory: () => set({
    history: [],
    currentIndex: -1,
    hasUnsavedChanges: false,
    isEditing: false,
    editMode: 'none',
  }),

  canUndo: () => get().currentIndex >= 0,

  canRedo: () => get().currentIndex < get().history.length - 1,
}));
