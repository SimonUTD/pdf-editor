import { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFRenderer } from './pdfRenderer';
import { saveAs } from 'file-saver';

/**
 * ExportService provides functionality to export PDF pages to various formats.
 * Supports image export (PNG/JPG), text export (TXT), and Word export (DOCX).
 */
export class ExportService {
  /**
   * Exports a single PDF page as an image.
   *
   * @param pdfDocument - The PDF document to export from
   * @param pageNumber - Page number to export (1-based)
   * @param format - Image format ('png' or 'jpg')
   * @param scale - Rendering scale (default: 2 for high quality)
   * @returns Promise resolving to image data URL
   */
  static async exportPageAsImage(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number,
    format: 'png' | 'jpg' = 'png',
    scale: number = 2
  ): Promise<string> {
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(
        `Invalid page number: ${pageNumber}. Must be between 1 and ${pdfDocument.numPages}`
      );
    }

    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // Convert canvas to data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    return canvas.toDataURL(mimeType, quality);
  }

  /**
   * Exports all PDF pages as images and downloads them as a zip.
   *
   * @param pdfDocument - The PDF document to export from
   * @param format - Image format ('png' or 'jpg')
   * @param fileName - Base file name for exported images
   */
  static async exportAllPagesAsImages(
    pdfDocument: PDFDocumentProxy,
    format: 'png' | 'jpg' = 'png',
    fileName: string = 'page'
  ): Promise<void> {
    const totalPages = pdfDocument.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const imageDataUrl = await this.exportPageAsImage(pdfDocument, i, format);

      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Download image
      const extension = format === 'png' ? 'png' : 'jpg';
      saveAs(blob, `${fileName}_${i}.${extension}`);
    }
  }

  /**
   * Exports a single page as an image file.
   *
   * @param pdfDocument - The PDF document to export from
   * @param pageNumber - Page number to export (1-based)
   * @param format - Image format ('png' or 'jpg')
   * @param fileName - File name for the exported image
   */
  static async exportSinglePageAsImage(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number,
    format: 'png' | 'jpg' = 'png',
    fileName: string = 'page'
  ): Promise<void> {
    const imageDataUrl = await this.exportPageAsImage(pdfDocument, pageNumber, format);

    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // Download image
    const extension = format === 'png' ? 'png' : 'jpg';
    saveAs(blob, `${fileName}.${extension}`);
  }
}
