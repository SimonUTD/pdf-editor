import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFRenderOptions {
  scale?: number;
  rotation?: number;
}

export class PDFRenderer {
  static async loadDocument(data: ArrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data });
    return await loadingTask.promise;
  }

  static async renderPageToCanvas(
    page: any,
    canvas: HTMLCanvasElement,
    options: PDFRenderOptions = {}
  ): Promise<void> {
    const { scale = 1.0, rotation = 0 } = options;
    const viewport = page.getViewport({ scale, rotation });

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  }

  static async generateThumbnail(
    page: any,
    maxWidth: number = 150
  ): Promise<string> {
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / viewport.width;
    const thumbnailViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = thumbnailViewport.width;
    canvas.height = thumbnailViewport.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get canvas context');

    await page.render({
      canvasContext: context,
      viewport: thumbnailViewport,
    }).promise;

    return canvas.toDataURL('image/png');
  }
}
