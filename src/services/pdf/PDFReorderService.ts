import { PDFDocument } from 'pdf-lib';

export class PDFReorderService {
  /**
   * Reorder pages in PDF
   * TODO: Implement in Stage 4
   */
  static async reorderPages(
    doc: PDFDocument,
    newOrder: number[]
  ): Promise<PDFDocument> {
    throw new Error('PDFReorderService.reorderPages not implemented yet');
  }

  /**
   * Reverse page order in PDF
   * TODO: Implement in Stage 4
   */
  static async reversePages(doc: PDFDocument): Promise<PDFDocument> {
    throw new Error('PDFReorderService.reversePages not implemented yet');
  }
}
