import { Command } from './BaseCommand';
import { InsertedObject } from '@/types/objects';

export class ObjectDeleteCommand extends Command {
  constructor(
    private object: InsertedObject,
    private onDelete: (id: string) => void,
    private onRestore: (obj: InsertedObject) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    this.onDelete(this.object.id);
  }

  async undo(): Promise<void> {
    this.onRestore(this.object);
  }
}
