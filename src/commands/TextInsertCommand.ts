import { Command } from './BaseCommand';
import { TextObject } from '@/types/objects';

export class TextInsertCommand extends Command {
  constructor(
    private textObject: TextObject,
    private onExecute?: (obj: TextObject) => void,
    private onUndo?: (id: string) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 仅添加到对象存储，不渲染到 PDF
    // PDF 渲染将在用户点击 Save 按钮时进行
    if (this.onExecute) {
      this.onExecute(this.textObject);
    }
  }

  async undo(): Promise<void> {
    // 从对象存储移除
    if (this.onUndo) {
      this.onUndo(this.textObject.id);
    }
  }
}
