import { PDFDocument } from 'pdf-lib';

export class PDFExtractService {
  /**
   * Extract text content from PDF
   * TODO: Implement in Stage 3
   */
  static async extractText(doc: PDFDocument): Promise<string> {
    throw new Error('PDFExtractService.extractText not implemented yet');
  }

  /**
   * Extract images from PDF
   * TODO: Implement in Stage 3
   */
  static async extractImages(doc: PDFDocument): Promise<Uint8Array[]> {
    throw new Error('PDFExtractService.extractImages not implemented yet');
  }
}
