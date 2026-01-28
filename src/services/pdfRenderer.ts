import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - 使用本地 worker 文件，无需联网
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PDFRenderOptions {
  scale?: number;
  rotation?: number;
}

export class PDFRenderer {
  static async loadDocument(data: ArrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({
      data,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.120/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.120/'
    });
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

  static async getTextContent(page: any): Promise<any> {
    return await page.getTextContent();
  }

  /**
   * 渲染文本层到容器
   * @param page - PDF.js 页面对象
   * @param viewport - 视口信息
   * @param container - 容器 DOM 元素
   * @param scale - 缩放比例
   * @param textDivs - 文本 DIV 数组
   */
  static async renderTextLayer(
    page: any,
    viewport: any,
    container: HTMLDivElement,
    scale: number,
    textDivs: HTMLDivElement[]
  ): Promise<void> {
    const textContent = await page.getTextContent();

    if (!textContent || !textContent.items) {
      console.warn('No text content found');
      return;
    }

    // 清空容器
    container.innerHTML = '';
    textDivs.length = 0;

    // 渲染每个文本项
    textContent.items.forEach((item: any) => {
      const textDiv = document.createElement('div');
      textDiv.className = 'pdf-text-layer-text';

      // 设置样式
      const tx = pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );
      const fontSize = item.transform[0] * scale;
      const fontFamily = item.fontName || 'sans-serif';

      textDiv.style.position = 'absolute';
      textDiv.style.left = `${tx[4]}px`;
      textDiv.style.top = `${tx[5] - tx[1]}px`; // PDF坐标系转换
      textDiv.style.fontSize = `${fontSize}px`;
      textDiv.style.fontFamily = fontFamily;
      textDiv.style.color = 'transparent';
      textDiv.style.userSelect = 'text';
      textDiv.style.cursor = 'text';
      textDiv.style.whiteSpace = 'pre';
      textDiv.style.transformOrigin = '0 0';
      textDiv.style.pointerEvents = 'auto';

      // 添加文本内容
      const textItem = document.createElement('span');
      textItem.textContent = item.str;
      textDiv.appendChild(textItem);

      container.appendChild(textDiv);
      textDivs.push(textDiv);
    });
  }
}
