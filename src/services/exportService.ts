import { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFRenderer } from './pdfRenderer';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

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
      canvas,
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

  /**
   * Extracts text content from a PDF page.
   *
   * @param pdfDocument - The PDF document to extract from
   * @param pageNumber - Page number to extract text from (1-based)
   * @returns Promise resolving to extracted text
   */
  static async extractTextFromPage(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(
        `Invalid page number: ${pageNumber}. Must be between 1 and ${pdfDocument.numPages}`
      );
    }

    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    // Combine text items into a single string
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    return text;
  }

  /**
   * Exports entire PDF as plain text file.
   *
   * @param pdfDocument - The PDF document to export from
   * @param fileName - File name for the exported text file
   */
  static async exportAsText(
    pdfDocument: PDFDocumentProxy,
    fileName: string = 'document'
  ): Promise<void> {
    const totalPages = pdfDocument.numPages;
    let fullText = '';

    for (let i = 1; i <= totalPages; i++) {
      const pageText = await this.extractTextFromPage(pdfDocument, i);
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    // Create blob and download
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${fileName}.txt`);
  }

  /**
   * Exports PDF as Word document (.docx) with improved formatting.
   *
   * @param pdfDocument - The PDF document to export from
   * @param fileName - File name for the exported Word document
   */
  static async exportAsWord(
    pdfDocument: PDFDocumentProxy,
    fileName: string = 'document'
  ): Promise<void> {
    const totalPages = pdfDocument.numPages;
    const paragraphs: Paragraph[] = [];

    // Extract text from all pages
    for (let i = 1; i <= totalPages; i++) {
      const pageText = await this.extractTextFromPage(pdfDocument, i);

      // Add page header
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Page ${i}`,
              bold: true,
              size: 28,
              color: '2E74B5',
            }),
          ],
          spacing: {
            before: 240,
            after: 120,
          },
          border: {
            bottom: {
              color: '2E74B5',
              space: 1,
              style: 'single',
              size: 6,
            },
          },
        })
      );

      // Improved text splitting: preserve paragraph structure
      const lines = pageText.split(/\n+/).filter(line => line.trim().length > 0);

      lines.forEach(line => {
        const trimmedLine = line.trim();
        // Detect potential headings (shorter lines, often ALL CAPS or end with colon)
        const isHeading = trimmedLine.length < 50 &&
                         (trimmedLine === trimmedLine.toUpperCase() ||
                          trimmedLine.endsWith(':'));

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: isHeading ? 26 : 22,
                bold: isHeading,
              }),
            ],
            spacing: {
              before: isHeading ? 160 : 80,
              after: 80,
            },
            indent: isHeading ? undefined : {
              firstLine: 320,
            },
          })
        );
      });
    }

    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  }

  /**
   * Exports PDF as HTML document.
   *
   * @param pdfDocument - The PDF document to export from
   * @param fileName - File name for the exported HTML document
   */
  static async exportAsHTML(
    pdfDocument: PDFDocumentProxy,
    fileName: string = 'document'
  ): Promise<void> {
    const totalPages = pdfDocument.numPages;
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
        }
        .page-break {
            page-break-before: always;
            border-top: 2px solid #2E74B5;
            margin-top: 40px;
            padding-top: 20px;
        }
        .page-header {
            color: #2E74B5;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 1px solid #2E74B5;
            padding-bottom: 10px;
        }
        .paragraph {
            margin: 12px 0;
            text-align: justify;
        }
        .heading {
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0 10px 0;
            color: #444;
        }
        @media print {
            body {
                margin: 0;
                padding: 15mm;
            }
        }
    </style>
</head>
<body>
`;

    // Extract text from all pages
    for (let i = 1; i <= totalPages; i++) {
      const pageText = await this.extractTextFromPage(pdfDocument, i);

      // Add page separator
      if (i > 1) {
        htmlContent += '    <div class="page-break">\n';
      }

      // Add page header
      htmlContent += `        <div class="page-header">Page ${i}</div>\n`;

      // Split text into paragraphs
      const lines = pageText.split(/\n+/).filter(line => line.trim().length > 0);

      lines.forEach(line => {
        const trimmedLine = line.trim();
        // Detect potential headings
        const isHeading = trimmedLine.length < 50 &&
                         (trimmedLine === trimmedLine.toUpperCase() ||
                          trimmedLine.endsWith(':'));

        if (isHeading) {
          htmlContent += `        <div class="heading">${this.escapeHTML(trimmedLine)}</div>\n`;
        } else {
          htmlContent += `        <div class="paragraph">${this.escapeHTML(trimmedLine)}</div>\n`;
        }
      });

      if (i > 1) {
        htmlContent += '    </div>\n';
      }
    }

    htmlContent += `</body>
</html>`;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${fileName}.html`);
  }

  /**
   * Helper method to escape HTML special characters.
   *
   * @param text - Text to escape
   * @returns Escaped text safe for HTML
   */
  private static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
