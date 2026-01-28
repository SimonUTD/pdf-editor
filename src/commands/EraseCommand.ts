import { Command } from './BaseCommand';

export interface ErasePath {
  pageIndex: number;
  path: Array<{ x: number; y: number }>;
  strokeWidth: number;
}

export class EraseCommand extends Command {
  constructor(
    private erasedPaths: ErasePath[],
    private originalContent: Map<string, Uint8Array>, // key: pageIndex
    private onErase?: (paths: ErasePath[]) => void,
    private onRestore?: (pageIndex: number, content: Uint8Array) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    // 执行擦除操作
    if (this.onErase) {
      this.onErase(this.erasedPaths);
    }
  }

  async undo(): Promise<void> {
    // 恢复擦除的内容
    if (this.onRestore) {
      for (const [pageIndexStr, content] of this.originalContent) {
        const pageIndex = parseInt(pageIndexStr, 10);
        this.onRestore(pageIndex, content);
      }
    }
  }
}
