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
      // 使用本地资源，不联网
      useSystemFonts: true,
      useWorkerFetch: false
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
    textContent.items.forEach((item: any, index: number) => {
      const textDiv = document.createElement('div');
      textDiv.className = 'pdf-text-layer-text';

      // 设置样式
      const tx = pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );
      const fontSize = Math.abs(item.transform[0]) * scale;
      const fontFamily = item.fontName || 'sans-serif';

      // PDF坐标系：原点在左下角，需要转换为HTML坐标系（原点在左上角）
      const x = tx[4];
      const y = tx[5];
      const height = item.height || fontSize; // 使用文本高度或字号

      textDiv.style.position = 'absolute';
      textDiv.style.left = `${x}px`;
      textDiv.style.top = `${y - height}px`; // 调整基线位置，使选择高亮与文字对齐
      textDiv.style.fontSize = `${fontSize}px`;
      textDiv.style.fontFamily = fontFamily;
      textDiv.style.color = 'transparent';
      textDiv.style.userSelect = 'text';
      textDiv.style.cursor = 'text';
      textDiv.style.whiteSpace = 'pre';
      textDiv.style.transformOrigin = '0 0';
      textDiv.style.pointerEvents = 'auto';
      textDiv.style.lineHeight = '1';

      // 添加文本内容
      const textItem = document.createElement('span');
      let textContent = item.str;

      // 检查是否需要在文本后添加换行或空格
      const nextItem = textContent.items[index + 1];
      if (nextItem) {
        const nextY = pdfjsLib.Util.transform(
          viewport.transform,
          nextItem.transform
        )[5];

        // 如果下一个文本项的Y坐标明显不同（新行），添加换行符
        // 使用阈值判断是否为新行（考虑字体大小）
        const lineHeightThreshold = fontSize * 0.5;
        if (Math.abs(nextY - y) > lineHeightThreshold) {
          textContent += '\n';
        } else if (item.hasEOL) {
          // PDF标记有行结束符
          textContent += '\n';
        } else {
          // 同一行，添加空格（如果PDF中没有显式空格）
          // 检查文本末尾是否已有空格
          if (!textContent.endsWith(' ')) {
            textContent += ' ';
          }
        }
      }

      textItem.textContent = textContent;
      textDiv.appendChild(textItem);

      container.appendChild(textDiv);
      textDivs.push(textDiv);
    });
  }
}
