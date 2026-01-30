import { PDFDocument } from 'pdf-lib';

export class PDFSplitService {
  /**
   * Split PDF from specified page into two PDFs
   * TODO: Implement in Stage 4
   */
  static async splitPDF(
    doc: PDFDocument,
    splitPage: number
  ): Promise<[PDFDocument, PDFDocument]> {
    throw new Error('PDFSplitService.splitPDF not implemented yet');
  }
}
