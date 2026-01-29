import { Command } from './BaseCommand';

/**
 * Command for rotating a PDF page
 * 旋转PDF页面的命令
 */
export class PageRotateCommand extends Command {
  constructor(
    private pageIndex: number,
    private oldRotation: number,
    private newRotation: number,
    private setRotation: (pageIndex: number, rotation: number) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    this.setRotation(this.pageIndex, this.newRotation);
  }

  async undo(): Promise<void> {
    this.setRotation(this.pageIndex, this.oldRotation);
  }

  getDescription(): string {
    return `旋转第 ${this.pageIndex + 1} 页 (${this.oldRotation}° → ${this.newRotation}°)`;
  }
}
