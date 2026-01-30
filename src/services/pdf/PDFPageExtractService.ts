import { PDFDocument } from 'pdf-lib';

export class PDFPageExtractService {
  /**
   * Extract specific pages from PDF
   * TODO: Implement in Stage 4
   */
  static async extractPages(
    doc: PDFDocument,
    pageNumbers: number[]
  ): Promise<PDFDocument> {
    throw new Error('PDFPageExtractService.extractPages not implemented yet');
  }

  /**
   * Delete specific pages from PDF
   * TODO: Implement in Stage 4
   */
  static async deletePages(
    doc: PDFDocument,
    pageNumbers: number[]
  ): Promise<PDFDocument> {
    throw new Error('PDFPageExtractService.deletePages not implemented yet');
  }
}
