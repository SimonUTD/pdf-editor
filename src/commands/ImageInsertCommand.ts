import { PDFDocument } from 'pdf-lib';
import { Command } from './BaseCommand';
import { ImageObject } from '@/types/objects';

export class ImageInsertCommand extends Command {
  constructor(
    private pdfDoc: PDFDocument,
    private imageObject: ImageObject,
    private imageBytes: Uint8Array,
    private onExecute?: (obj: ImageObject) => void,
    private onUndo?: (id: string) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 1. 在 PDF 上绘制图片
    const page = this.pdfDoc.getPage(this.imageObject.pageIndex);
    const image = await this.pdfDoc.embedPng(this.imageBytes);

    page.drawImage(image, {
      x: this.imageObject.position.x,
      y: this.imageObject.position.y,
      width: this.imageObject.size.width,
      height: this.imageObject.size.height,
    });

    // 2. 添加到对象存储
    if (this.onExecute) {
      this.onExecute(this.imageObject);
    }
  }

  async undo(): Promise<void> {
    // TODO: 从 PDF 移除图片（需要重新生成页面）
    // 临时方案：从对象存储移除
    if (this.onUndo) {
      this.onUndo(this.imageObject.id);
    }
  }
}
