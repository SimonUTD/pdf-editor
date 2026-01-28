import { PDFDocument } from 'pdf-lib';
import { Command } from './BaseCommand';

export class PageDeleteCommand extends Command {
  constructor(
    private pdfDoc: PDFDocument,
    private pageIndex: number,
    private deletedPageBytes: Uint8Array,
    private onDelete?: (index: number) => void,
    private onRestore?: (index: number, pageBytes: Uint8Array) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 1. 从 PDF 文档删除页面
    this.pdfDoc.removePage(this.pageIndex);

    // 2. 通知 UI 更新
    if (this.onDelete) {
      this.onDelete(this.pageIndex);
    }
  }

  async undo(): Promise<void> {
    // TODO: 恢复删除的页面
    // 这需要重新插入页面内容，比较复杂
    // 临时方案：使用保存的页面字节数据
    if (this.onRestore) {
      this.onRestore(this.pageIndex, this.deletedPageBytes);
    }
  }
}
