import { PDFDocument } from 'pdf-lib';

export class ImageToPDFService {
  /**
   * Convert a single image to PDF
   * TODO: Implement in Stage 3
   */
  static async convertImageToPDF(imageBytes: Uint8Array): Promise<PDFDocument> {
    throw new Error('ImageToPDFService.convertImageToPDF not implemented yet');
  }

  /**
   * Convert multiple images to a single PDF
   * TODO: Implement in Stage 3
   */
  static async convertImagesToSinglePDF(
    imageBytesArray: Uint8Array[],
    options?: { onePerPage?: boolean }
  ): Promise<PDFDocument> {
    throw new Error('ImageToPDFService.convertImagesToSinglePDF not implemented yet');
  }
}
