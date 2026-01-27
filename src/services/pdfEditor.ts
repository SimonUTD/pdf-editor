import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PDFEditor {
  static async createFromBytes(bytes: Uint8Array): Promise<PDFDocument> {
    return await PDFDocument.load(bytes);
  }

  static async deletePage(pdfDoc: PDFDocument, pageIndex: number): Promise<void> {
    pdfDoc.removePage(pageIndex);
  }

  static async insertBlankPage(
    pdfDoc: PDFDocument,
    afterIndex: number,
    width: number = 595,
    height: number = 842
  ): Promise<void> {
    const page = pdfDoc.insertPage(afterIndex + 1, [width, height]);
    // Optionally add a watermark or grid
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Blank Page', {
      x: 50,
      y: height - 50,
      size: 12,
      font: font,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  static async saveToBytes(pdfDoc: PDFDocument): Promise<Uint8Array> {
    return await pdfDoc.save();
  }

  static async copyPages(
    sourcePdf: PDFDocument,
    targetPdf: PDFDocument,
    pageIndices: number[]
  ): Promise<void> {
    const copiedPages = await targetPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => {
      targetPdf.addPage(page);
    });
  }
}
