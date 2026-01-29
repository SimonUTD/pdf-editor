/**
 * Object store for managing inserted images and text
 * Uses Zustand for state management
 */

import { create } from 'zustand';
import { InsertedObject } from '@/types/objects';

interface ObjectStore {
  objects: InsertedObject[];
  selectedObjectId: string | null;

  // Actions
  addObject: (object: InsertedObject) => void;
  updateObject: (id: string, updates: Partial<InsertedObject>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  clearObjects: () => void;
  getObjectsByPage: (pageIndex: number) => InsertedObject[];
}

export const useObjectStore = create<ObjectStore>((set, get) => ({
  objects: [],
  selectedObjectId: null,

  addObject: (object) => set({ objects: [...get().objects, object] }),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map((obj) =>
      obj.id === id ? { ...obj, ...updates } as InsertedObject : obj
    ),
  })),

  deleteObject: (id) => set((state) => ({
    objects: state.objects.filter((obj) => obj.id !== id),
  })),

  selectObject: (id) => set({ selectedObjectId: id }),

  clearObjects: () => set({ objects: [], selectedObjectId: null }),

  getObjectsByPage: (pageIndex) => {
    const state = get();
    return state.objects.filter((obj) => obj.pageIndex === pageIndex);
  },
}));
