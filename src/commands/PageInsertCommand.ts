import { PDFDocument } from 'pdf-lib';
import { Command } from './BaseCommand';

export class PageInsertCommand extends Command {
  constructor(
    private pdfDoc: PDFDocument,
    private insertIndex: number,
    private onInsert?: (index: number) => void,
    private onRemove?: (index: number) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 1. 在 PDF 文档中插入空白页
    this.pdfDoc.insertPage(this.insertIndex);

    // 2. 通知 UI 更新
    if (this.onInsert) {
      this.onInsert(this.insertIndex);
    }
  }

  async undo(): Promise<void> {
    // 删除插入的页面
    this.pdfDoc.removePage(this.insertIndex);

    if (this.onRemove) {
      this.onRemove(this.insertIndex);
    }
  }
}
