import { PDFDocument } from 'pdf-lib';
import { StandardFonts } from 'pdf-lib';
import { Command } from './BaseCommand';
import { TextObject } from '@/types/objects';

export class TextInsertCommand extends Command {
  constructor(
    private pdfDoc: PDFDocument,
    private textObject: TextObject,
    private onExecute?: (obj: TextObject) => void,
    private onUndo?: (id: string) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 1. 在 PDF 上绘制文本
    const page = this.pdfDoc.getPage(this.textObject.pageIndex);

    // 使用标准字体
    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(this.textObject.content, {
      x: this.textObject.position.x,
      y: this.textObject.position.y,
      size: this.textObject.style.fontSize,
      font: font,
      opacity: this.textObject.style.opacity || 1,
    });

    // 2. 添加到对象存储
    if (this.onExecute) {
      this.onExecute(this.textObject);
    }
  }

  async undo(): Promise<void> {
    // TODO: 从 PDF 移除文本（需要重新生成页面）
    // 临时方案：从对象存储移除
    if (this.onUndo) {
      this.onUndo(this.textObject.id);
    }
  }
}
