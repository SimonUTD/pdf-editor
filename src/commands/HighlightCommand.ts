import { Command } from './BaseCommand';

export interface HighlightRect {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export class HighlightCommand extends Command {
  constructor(
    private highlights: HighlightRect[],
    private onHighlight?: (rects: HighlightRect[]) => void,
    private onRemove?: (rects: HighlightRect[]) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 执行高亮操作
    if (this.onHighlight) {
      this.onHighlight(this.highlights);
    }
  }

  async undo(): Promise<void> {
    // 移除高亮
    if (this.onRemove) {
      this.onRemove(this.highlights);
    }
  }
}
