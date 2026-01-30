import { PDFDocument } from 'pdf-lib';

export class PDFPageNumberService {
  /**
   * Add page numbers to PDF
   * TODO: Implement in Stage 5
   */
  static async addPageNumbers(
    doc: PDFDocument,
    options: {
      position?: 'top' | 'bottom' | 'left' | 'right';
      startFrom?: number;
      format?: '1' | '1 of N' | 'Page 1' | 'Page 1 of N';
      fontSize?: number;
    } = {}
  ): Promise<PDFDocument> {
    throw new Error('PDFPageNumberService.addPageNumbers not implemented yet');
  }

  /**
   * Remove page numbers from PDF
   * TODO: Implement in Stage 5
   */
  static async removePageNumbers(doc: PDFDocument): Promise<PDFDocument> {
    throw new Error('PDFPageNumberService.removePageNumbers not implemented yet');
  }
}
