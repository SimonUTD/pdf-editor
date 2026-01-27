import { PDFDocument, rgb, StandardFonts, RotationTypes } from 'pdf-lib';

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

  /**
   * Inserts text into a PDF page at the specified position.
   *
   * @param pdfDoc - The PDF document to modify
   * @param pageIndex - Zero-based index of the page to insert text on
   * @param text - The text content to insert
   * @param x - X coordinate for text placement (in points)
   * @param y - Y coordinate for text placement (in points)
   * @param fontSize - Font size (default: 12)
   * @param color - RGB color object (default: black)
   * @throws Error if pageIndex is out of bounds
   */
  static async insertText(
    pdfDoc: PDFDocument,
    pageIndex: number,
    text: string,
    x: number,
    y: number,
    fontSize: number = 12,
    color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
  ): Promise<void> {
    const pageCount = pdfDoc.getPageCount();

    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(
        `Invalid pageIndex: ${pageIndex}. Must be between 0 and ${pageCount - 1}`
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text content cannot be empty');
    }

    if (fontSize <= 0) {
      throw new Error(`Invalid fontSize: ${fontSize}. Must be positive`);
    }

    const page = pdfDoc.getPage(pageIndex);
    const pageHeight = page.getHeight();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw text at specified position (convert y to PDF coordinate system)
    page.drawText(text, {
      x,
      y: pageHeight - y - fontSize, // PDF coordinates start from bottom-left
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  /**
   * Merges multiple PDF documents into a single PDF.
   *
   * @param pdfBytesArray - Array of PDF file contents as Uint8Array
   * @param pageOrders - Optional array of page indices for each PDF (null = all pages in order)
   * @returns Promise resolving to merged PDF bytes
   * @throws Error if any PDF cannot be loaded
   */
  static async mergePDFs(
    pdfBytesArray: Uint8Array[],
    pageOrders?: (number[] | null)[]
  ): Promise<Uint8Array> {
    if (!pdfBytesArray || pdfBytesArray.length === 0) {
      throw new Error('At least one PDF is required for merging');
    }

    // Create new PDF document for merged result
    const mergedPdf = await PDFDocument.create();

    // Load all source PDFs
    const sourcePdfs = await Promise.all(
      pdfBytesArray.map(bytes => PDFDocument.load(bytes))
    );

    // Copy pages from each source PDF
    for (let i = 0; i < sourcePdfs.length; i++) {
      const sourcePdf = sourcePdfs[i];
      const pageOrder = pageOrders?.[i];

      // Determine which pages to copy
      const pagesToCopy = pageOrder || Array.from(
        { length: sourcePdf.getPageCount() },
        (_, idx) => idx
      );

      // Copy pages in specified order
      const copiedPages = await mergedPdf.copyPages(sourcePdf, pagesToCopy);
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    return mergedPdf.save();
  }

  /**
   * Reorders pages in a PDF document.
   *
   * @param pdfDoc - The PDF document to reorder
   * @param newOrder - Array of page indices in desired order (0-based)
   * @throws Error if newOrder is invalid
   */
  static async reorderPages(
    pdfDoc: PDFDocument,
    newOrder: number[]
  ): Promise<void> {
    const pageCount = pdfDoc.getPageCount();

    if (newOrder.length !== pageCount) {
      throw new Error(
        `Invalid newOrder length: ${newOrder.length}. Must match page count: ${pageCount}`
      );
    }

    // Validate all indices are present
    const sortedOrder = [...newOrder].sort((a, b) => a - b);
    for (let i = 0; i < pageCount; i++) {
      if (sortedOrder[i] !== i) {
        throw new Error('Invalid newOrder: must contain all page indices exactly once');
      }
    }

    // Create temporary PDF with pages in new order
    const tempPdf = await PDFDocument.create();
    const copiedPages = await tempPdf.copyPages(pdfDoc, newOrder);
    copiedPages.forEach(page => tempPdf.addPage(page));

    // Remove all pages from original
    for (let i = pageCount - 1; i >= 0; i--) {
      pdfDoc.removePage(i);
    }

    // Copy pages back in new order
    const reorderedPages = await pdfDoc.copyPages(tempPdf,
      Array.from({ length: pageCount }, (_, i) => i)
    );
    reorderedPages.forEach(page => pdfDoc.addPage(page));
  }

  /**
   * Reverses the order of all pages in a PDF document.
   *
   * @param pdfDoc - The PDF document to reverse
   */
  static async reversePages(pdfDoc: PDFDocument): Promise<void> {
    const pageCount = pdfDoc.getPageCount();
    const reversedOrder = Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
    await this.reorderPages(pdfDoc, reversedOrder);
  }

  /**
   * Adds a text watermark to all pages in a PDF document.
   *
   * @param pdfDoc - The PDF document to add watermark to
   * @param text - Watermark text
   * @param options - Watermark options (position, size, opacity, rotation)
   */
  static async addTextWatermark(
    pdfDoc: PDFDocument,
    text: string,
    options: {
      fontSize?: number;
      opacity?: number;
      rotation?: number;
      color?: { r: number; g: number; b: number };
      position?: 'center' | 'diagonal' | 'top' | 'bottom';
    } = {}
  ): Promise<void> {
    const {
      fontSize = 48,
      opacity = 0.3,
      rotation = -45,
      color = { r: 0.7, g: 0.7, b: 0.7 },
      position = 'diagonal',
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('Watermark text cannot be empty');
    }

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      let x: number, y: number, rotate: number;

      switch (position) {
        case 'center':
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
          rotate = 0;
          break;
        case 'diagonal':
          x = width / 2;
          y = height / 2;
          rotate = rotation;
          break;
        case 'top':
          x = (width - textWidth) / 2;
          y = height - textHeight - 20;
          rotate = 0;
          break;
        case 'bottom':
          x = (width - textWidth) / 2;
          y = 20;
          rotate = 0;
          break;
        default:
          x = width / 2;
          y = height / 2;
          rotate = rotation;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: { angle: rotate, type: RotationTypes.Degrees },
      });
    }
  }

  /**
   * Adds an image watermark to all pages in a PDF document.
   *
   * @param pdfDoc - The PDF document to add watermark to
   * @param imageBytes - The watermark image as Uint8Array
   * @param imageType - Type of image ('png' or 'jpg')
   * @param options - Watermark options (position, size, opacity)
   */
  static async addImageWatermark(
    pdfDoc: PDFDocument,
    imageBytes: Uint8Array,
    imageType: 'png' | 'jpg',
    options: {
      width?: number;
      height?: number;
      opacity?: number;
      position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    } = {}
  ): Promise<void> {
    const {
      width = 200,
      height = 200,
      opacity = 0.3,
      position = 'center',
    } = options;

    // Embed the image
    let image;
    if (imageType === 'png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (imageType === 'jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error(`Unsupported image type: ${imageType}`);
    }

    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width: pageWidth, height: pageHeight } = page.getSize();

      let x: number, y: number;

      switch (position) {
        case 'center':
          x = (pageWidth - width) / 2;
          y = (pageHeight - height) / 2;
          break;
        case 'top-left':
          x = 20;
          y = pageHeight - height - 20;
          break;
        case 'top-right':
          x = pageWidth - width - 20;
          y = pageHeight - height - 20;
          break;
        case 'bottom-left':
          x = 20;
          y = 20;
          break;
        case 'bottom-right':
          x = pageWidth - width - 20;
          y = 20;
          break;
        default:
          x = (pageWidth - width) / 2;
          y = (pageHeight - height) / 2;
      }

      page.drawImage(image, {
        x,
        y,
        width,
        height,
        opacity,
      });
    }
  }

  /**
   * Adds headers to all pages in a PDF document.
   *
   * @param pdfDoc - The PDF document to add headers to
   * @param text - Header text (use {page} for page number, {total} for total pages)
   * @param options - Header options (fontSize, color, alignment)
   */
  static async addHeader(
    pdfDoc: PDFDocument,
    text: string,
    options: {
      fontSize?: number;
      color?: { r: number; g: number; b: number };
      alignment?: 'left' | 'center' | 'right';
      marginTop?: number;
    } = {}
  ): Promise<void> {
    const {
      fontSize = 10,
      color = { r: 0, g: 0, b: 0 },
      alignment = 'center',
      marginTop = 20,
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('Header text cannot be empty');
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();

      // Replace placeholders
      const headerText = text
        .replace('{page}', String(index + 1))
        .replace('{total}', String(totalPages));

      const textWidth = font.widthOfTextAtSize(headerText, fontSize);

      let x: number;
      switch (alignment) {
        case 'left':
          x = 50;
          break;
        case 'right':
          x = width - textWidth - 50;
          break;
        case 'center':
        default:
          x = (width - textWidth) / 2;
      }

      const y = height - marginTop;

      page.drawText(headerText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });
    });
  }

  /**
   * Adds footers to all pages in a PDF document.
   *
   * @param pdfDoc - The PDF document to add footers to
   * @param text - Footer text (use {page} for page number, {total} for total pages)
   * @param options - Footer options (fontSize, color, alignment)
   */
  static async addFooter(
    pdfDoc: PDFDocument,
    text: string,
    options: {
      fontSize?: number;
      color?: { r: number; g: number; b: number };
      alignment?: 'left' | 'center' | 'right';
      marginBottom?: number;
    } = {}
  ): Promise<void> {
    const {
      fontSize = 10,
      color = { r: 0, g: 0, b: 0 },
      alignment = 'center',
      marginBottom = 20,
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('Footer text cannot be empty');
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width } = page.getSize();

      // Replace placeholders
      const footerText = text
        .replace('{page}', String(index + 1))
        .replace('{total}', String(totalPages));

      const textWidth = font.widthOfTextAtSize(footerText, fontSize);

      let x: number;
      switch (alignment) {
        case 'left':
          x = 50;
          break;
        case 'right':
          x = width - textWidth - 50;
          break;
        case 'center':
        default:
          x = (width - textWidth) / 2;
      }

      const y = marginBottom;

      page.drawText(footerText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });
    });
  }

  /**
   * Erases content in a rectangular region by drawing a white rectangle.
   *
   * @param pdfDoc - The PDF document to modify
   * @param pageIndex - Zero-based index of the page
   * @param x - X coordinate of top-left corner
   * @param y - Y coordinate of top-left corner
   * @param width - Width of region to erase
   * @param height - Height of region to erase
   */
  static async eraseRegion(
    pdfDoc: PDFDocument,
    pageIndex: number,
    x: number,
    y: number,
    width: number,
    height: number
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

    const page = pdfDoc.getPage(pageIndex);
    const pageHeight = page.getHeight();

    // Draw white rectangle to erase content
    page.drawRectangle({
      x,
      y: pageHeight - y - height, // Convert to PDF coordinate system
      width,
      height,
      color: rgb(1, 1, 1), // White
      opacity: 1,
    });
  }

  /**
   * Replaces a page in the target PDF with a page from a source PDF.
   *
   * @param targetPdf - The PDF document to modify
   * @param targetPageIndex - Zero-based index of page to replace
   * @param sourcePdfBytes - Source PDF bytes
   * @param sourcePageIndex - Zero-based index of page to copy from source
   */
  static async replacePage(
    targetPdf: PDFDocument,
    targetPageIndex: number,
    sourcePdfBytes: Uint8Array,
    sourcePageIndex: number = 0
  ): Promise<void> {
    const targetPageCount = targetPdf.getPageCount();

    if (targetPageIndex < 0 || targetPageIndex >= targetPageCount) {
      throw new Error(
        `Invalid targetPageIndex: ${targetPageIndex}. Must be between 0 and ${targetPageCount - 1}`
      );
    }

    // Load source PDF
    const sourcePdf = await PDFDocument.load(sourcePdfBytes);
    const sourcePageCount = sourcePdf.getPageCount();

    if (sourcePageIndex < 0 || sourcePageIndex >= sourcePageCount) {
      throw new Error(
        `Invalid sourcePageIndex: ${sourcePageIndex}. Must be between 0 and ${sourcePageCount - 1}`
      );
    }

    // Copy page from source
    const [copiedPage] = await targetPdf.copyPages(sourcePdf, [sourcePageIndex]);

    // Remove old page and insert new one at same position
    targetPdf.removePage(targetPageIndex);
    targetPdf.insertPage(targetPageIndex, copiedPage);
  }

  /**
   * Adds a highlight annotation to a PDF page.
   *
   * @param pdfDoc - The PDF document to modify
   * @param pageIndex - Zero-based index of the page
   * @param x - X coordinate of top-left corner
   * @param y - Y coordinate of top-left corner
   * @param width - Width of highlight region
   * @param height - Height of highlight region
   * @param color - RGB color object (default: yellow)
   * @param opacity - Opacity of highlight (default: 0.3)
   */
  static async addHighlight(
    pdfDoc: PDFDocument,
    pageIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    color: { r: number; g: number; b: number } = { r: 1, g: 1, b: 0 },
    opacity: number = 0.3
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

    if (opacity < 0 || opacity > 1) {
      throw new Error(`Invalid opacity: ${opacity}. Must be between 0 and 1`);
    }

    const page = pdfDoc.getPage(pageIndex);
    const pageHeight = page.getHeight();

    // Draw semi-transparent rectangle for highlight
    page.drawRectangle({
      x,
      y: pageHeight - y - height, // Convert to PDF coordinate system
      width,
      height,
      color: rgb(color.r, color.g, color.b),
      opacity,
      borderWidth: 0,
    });
  }
}
