export interface RedactionMark {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class RedactCommand {
  constructor(
    private marks: RedactionMark[],
    private originalBytes: Uint8Array,
    private onExecute: (marks: RedactionMark[]) => Promise<void>,
    private onUndo: (originalBytes: Uint8Array) => Promise<void>
  ) {}

  async execute(): Promise<void> {
    await this.onExecute(this.marks);
  }

  async undo(): Promise<void> {
    await this.onUndo(this.originalBytes);
  }

  async redo(): Promise<void> {
    await this.onExecute(this.marks);
  }
}
