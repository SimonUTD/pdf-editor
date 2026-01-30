import { PDFDocument } from 'pdf-lib';

export class PDFConvertService {
  /**
   * Convert PDF to images
   * TODO: Implement in Stage 3
   */
  static async convertToImages(
    doc: PDFDocument,
    format: 'png' | 'jpeg' | 'webp'
  ): Promise<Uint8Array[]> {
    throw new Error('PDFConvertService.convertToImages not implemented yet');
  }

  /**
   * Convert images to PDF
   * TODO: Implement in Stage 3
   */
  static async convertImagesToPDF(
    images: Uint8Array[]
  ): Promise<PDFDocument> {
    throw new Error('PDFConvertService.convertImagesToPDF not implemented yet');
  }
}
