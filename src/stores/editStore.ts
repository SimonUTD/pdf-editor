import { create } from 'zustand';
import type { InsertedObject } from '@/types/objects';

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
        pageNumber?: number;
        targetPageIndex?: number;
        sourcePageIndex?: number;
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
    }
  | {
      type: 'pdf-merge';
      timestamp: number;
      data: {
        count: number;
      };
    }
  | {
      type: 'watermark-add';
      timestamp: number;
      data: {
        text?: string;
        type?: string;
      };
    }
  | {
      type: 'header-add';
      timestamp: number;
      data: {
        text: string;
      };
    }
  | {
      type: 'footer-add';
      timestamp: number;
      data: {
        text: string;
      };
    }
  | {
      type: 'page-numbers-add';
      timestamp: number;
      data: {
        options: any;
      };
    }
  | {
      type: 'redaction-apply';
      timestamp: number;
      data: {
        count: number;
      };
    }
  | {
      type: 'content-erase';
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
      type: 'highlight-add';
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
      type: 'redaction-apply';
      timestamp: number;
      data: {
        count: number;
      };
    }
  | {
      type: 'pages-reverse';
      timestamp: number;
      data: Record<string, never>;
    }
  | {
      type: 'page-numbers-add';
      timestamp: number;
      data: {
        options: {
          position: string;
          format: string;
          startNumber: number;
          fontSize: number;
        };
      };
    }
  | {
      type: 'object-move';
      timestamp: number;
      data: {
        objectId: string;
        oldPosition: { x: number; y: number };
        newPosition: { x: number; y: number };
      };
    }
  | {
      type: 'object-resize';
      timestamp: number;
      data: {
        objectId: string;
        oldSize: { width: number; height: number };
        newSize: { width: number; height: number };
      };
    }
  | {
      type: 'object-rotate';
      timestamp: number;
      data: {
        objectId: string;
        oldRotation: number;
        newRotation: number;
      };
    }
  | {
      type: 'object-delete';
      timestamp: number;
      data: {
        object: InsertedObject;
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
  executeUndo: () => Promise<void>;
  executeRedo: () => Promise<void>;
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

  executeUndo: async () => {
    const state = get();
    if (!state.canUndo()) return;

    const action = state.history[state.currentIndex];

    // Execute undo based on action type
    switch (action.type) {
      case 'image-insert':
        // TODO: Remove the inserted image
        break;
      case 'text-insert':
        // TODO: Remove the inserted text
        break;
      case 'object-move':
        // TODO: Restore object position
        break;
      case 'object-resize':
        // TODO: Restore object size
        break;
      case 'object-rotate':
        // TODO: Restore object rotation angle
        break;
      case 'object-delete':
        // TODO: Restore the deleted object
        break;
      case 'content-erase':
        // TODO: Restore erased content (requires saving original content)
        break;
      case 'highlight-add':
        // TODO: Remove highlight
        break;
      case 'page-delete':
        // TODO: Restore deleted page
        break;
      case 'page-insert':
        // TODO: Remove inserted page
        break;
      case 'page-replace':
        // TODO: Restore replaced page
        break;
      case 'text-edit':
        // TODO: Restore original text content
        break;
      case 'pdf-merge':
        // TODO: Remove merged PDFs
        break;
      case 'watermark-add':
        // TODO: Remove watermark
        break;
      case 'header-add':
        // TODO: Remove header
        break;
      case 'footer-add':
        // TODO: Remove footer
        break;
      case 'pages-reverse':
        // TODO: Reverse page order back
        break;
    }

    // Update index
    set((state) => ({
      currentIndex: state.currentIndex - 1,
    }));
  },

  executeRedo: async () => {
    const state = get();
    if (!state.canRedo()) return;

    const action = state.history[state.currentIndex + 1];

    // Execute redo based on action type
    switch (action.type) {
      case 'image-insert':
        // TODO: Re-insert image
        break;
      case 'text-insert':
        // TODO: Re-insert text
        break;
      case 'object-move':
        // TODO: Re-move object
        break;
      case 'object-resize':
        // TODO: Re-resize object
        break;
      case 'object-rotate':
        // TODO: Re-rotate object
        break;
      case 'object-delete':
        // TODO: Re-delete object
        break;
      case 'content-erase':
        // TODO: Re-erase content
        break;
      case 'highlight-add':
        // TODO: Re-add highlight
        break;
      case 'page-delete':
        // TODO: Re-delete page
        break;
      case 'page-insert':
        // TODO: Re-insert page
        break;
      case 'page-replace':
        // TODO: Re-replace page
        break;
      case 'text-edit':
        // TODO: Re-edit text
        break;
      case 'pdf-merge':
        // TODO: Re-merge PDFs
        break;
      case 'watermark-add':
        // TODO: Re-add watermark
        break;
      case 'header-add':
        // TODO: Re-add header
        break;
      case 'footer-add':
        // TODO: Re-add footer
        break;
      case 'pages-reverse':
        // TODO: Re-reverse page order
        break;
    }

    // Update index
    set((state) => ({
      currentIndex: state.currentIndex + 1,
    }));
  },

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
