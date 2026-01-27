import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * PDFEditor service provides PDF manipulation functionality using pdf-lib.
 * All methods are static and handle PDF operations like page deletion, insertion, and copying.
 */
export class PDFEditor {
  /**
   * Loads a PDF document from a Uint8Array of bytes.
   *
   * @param bytes - The PDF file content as Uint8Array
   * @returns Promise resolving to a PDFDocument instance
   * @throws Error if the bytes cannot be parsed as a valid PDF
   */
  static async createFromBytes(bytes: Uint8Array): Promise<PDFDocument> {
    if (!bytes || bytes.length === 0) {
      throw new Error('Invalid input: bytes cannot be empty');
    }
    return PDFDocument.load(bytes);
  }

  /**
   * Deletes a page from the PDF document at the specified index.
   *
   * @param pdfDoc - The PDF document to modify
   * @param pageIndex - Zero-based index of the page to delete
   * @throws Error if pageIndex is out of bounds
   */
  static async deletePage(pdfDoc: PDFDocument, pageIndex: number): Promise<void> {
    const pageCount = pdfDoc.getPageCount();

    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(
        `Invalid pageIndex: ${pageIndex}. Must be between 0 and ${pageCount - 1}`
      );
    }

    pdfDoc.removePage(pageIndex);
  }

  /**
   * Inserts a blank page into the PDF document after the specified index.
   *
   * @param pdfDoc - The PDF document to modify
   * @param afterIndex - Zero-based index after which to insert the page (-1 to insert at beginning)
   * @param width - Page width in points (default: 595 for A4)
   * @param height - Page height in points (default: 842 for A4)
   * @param watermarkText - Optional watermark text to add to the page (default: empty string for no watermark)
   * @throws Error if afterIndex is out of bounds or dimensions are invalid
   */
  static async insertBlankPage(
    pdfDoc: PDFDocument,
    afterIndex: number,
    width: number = 595,
    height: number = 842,
    watermarkText: string = ''
  ): Promise<void> {
    const pageCount = pdfDoc.getPageCount();

    if (afterIndex < -1 || afterIndex >= pageCount) {
      throw new Error(
        `Invalid afterIndex: ${afterIndex}. Must be between -1 and ${pageCount - 1}`
      );
    }

    if (width <= 0 || height <= 0) {
      throw new Error(
        `Invalid dimensions: width (${width}) and height (${height}) must be positive`
      );
    }

    const page = pdfDoc.insertPage(afterIndex + 1, [width, height]);

    // Add watermark if text is provided
    if (watermarkText.trim()) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(watermarkText, {
        x: 50,
        y: height - 50,
        size: 12,
        font: font,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
  }

  /**
   * Saves the PDF document to a Uint8Array of bytes.
   *
   * @param pdfDoc - The PDF document to save
   * @returns Promise resolving to the PDF content as Uint8Array
   */
  static async saveToBytes(pdfDoc: PDFDocument): Promise<Uint8Array> {
    return pdfDoc.save();
  }

  /**
   * Copies specified pages from a source PDF to a target PDF.
   *
   * @param sourcePdf - The source PDF document to copy pages from
   * @param targetPdf - The target PDF document to copy pages to
   * @param pageIndices - Array of zero-based page indices to copy
   * @throws Error if any pageIndex is out of bounds in the source PDF
   */
  static async copyPages(
    sourcePdf: PDFDocument,
    targetPdf: PDFDocument,
    pageIndices: number[]
  ): Promise<void> {
    if (!pageIndices || pageIndices.length === 0) {
      throw new Error('Invalid input: pageIndices cannot be empty');
    }

    const sourcePageCount = sourcePdf.getPageCount();

    // Validate all page indices before copying
    for (const index of pageIndices) {
      if (index < 0 || index >= sourcePageCount) {
        throw new Error(
          `Invalid pageIndex: ${index}. Must be between 0 and ${sourcePageCount - 1}`
        );
      }
    }

    const copiedPages = await targetPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => {
      targetPdf.addPage(page);
    });
  }

  /**
   * Inserts an image into a PDF page at the specified position.
   *
   * @param pdfDoc - The PDF document to modify
   * @param pageIndex - Zero-based index of the page to insert image on
   * @param imageBytes - The image file content as Uint8Array
   * @param imageType - Type of image ('png' or 'jpg')
   * @param x - X coordinate for image placement (in points)
   * @param y - Y coordinate for image placement (in points)
   * @param width - Image width (in points, default: 200)
   * @param height - Image height (in points, default: 200)
   * @throws Error if pageIndex is out of bounds or image embedding fails
   */
  static async insertImage(
    pdfDoc: PDFDocument,
    pageIndex: number,
    imageBytes: Uint8Array,
    imageType: 'png' | 'jpg',
    x: number,
    y: number,
    width: number = 200,
    height: number = 200
  ): Promise<void> {
    const pageCount = pdfDoc.getPageCount();

    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(
        `Invalid pageIndex: ${pageIndex}. Must be between 0 and ${pageCount - 1}`
      );
    }

    if (width <= 0 || height <= 0) {
      throw new Error(
        `Invalid dimensions: width (${width}) and height (${height}) must be positive`
      );
    }

    if (!imageBytes || imageBytes.length === 0) {
      throw new Error('Invalid input: imageBytes cannot be empty');
    }

    const page = pdfDoc.getPage(pageIndex);
    const pageHeight = page.getHeight();

    // Embed the image based on type
    let image;
    if (imageType === 'png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (imageType === 'jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error(`Unsupported image type: ${imageType}`);
    }

    // Draw image at specified position (convert y to PDF coordinate system)
    page.drawImage(image, {
      x,
      y: pageHeight - y - height, // PDF coordinates start from bottom-left
      width,
      height,
    });
  }
}
