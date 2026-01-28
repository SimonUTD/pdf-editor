export interface BaseCommand {
  execute(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}

export abstract class Command implements BaseCommand {
  abstract execute(): Promise<void>;
  abstract undo(): Promise<void>;

  async redo(): Promise<void> {
    // 默认 redo 与 execute 相同
    return this.execute();
  }
}
