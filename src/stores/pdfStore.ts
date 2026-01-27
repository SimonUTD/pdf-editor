import { create } from 'zustand';

interface PDFPage {
  pageNumber: number;
  thumbnail: string | null;
}

interface PDFStore {
  // State
  filePath: string | null;
  pdfDocument: any | null;
  pages: PDFPage[];
  totalPages: number;

  // Actions
  loadPDF: (filePath: string, document: any, totalPages: number) => void;
  reloadPDF: (document: any, totalPages: number) => void;
  setPages: (pages: PDFPage[]) => void;
  closePDF: () => void;
}

export const usePDFStore = create<PDFStore>((set) => ({
  filePath: null,
  pdfDocument: null,
  pages: [],
  totalPages: 0,

  loadPDF: (filePath, document, totalPages) =>
    set({ filePath, pdfDocument: document, totalPages, pages: [] }),

  reloadPDF: (document, totalPages) =>
    set((state) => ({ pdfDocument: document, totalPages, pages: [], filePath: state.filePath })),

  setPages: (pages) => set({ pages }),

  closePDF: () =>
    set({ filePath: null, pdfDocument: null, pages: [], totalPages: 0 }),
}));
