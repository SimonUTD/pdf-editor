import { Command } from './BaseCommand';
import { InsertedObject } from '@/types/objects';

export class ObjectResizeCommand extends Command {
  constructor(
    private object: InsertedObject,
    private oldPosition: { x: number; y: number },
    private newPosition: { x: number; y: number },
    private oldSize: { width: number; height: number },
    private newSize: { width: number; height: number },
    private onResize: (id: string, updates: { position: { x: number; y: number }; size: { width: number; height: number } }) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    this.onResize(this.object.id, {
      position: this.newPosition,
      size: this.newSize,
    });
  }

  async undo(): Promise<void> {
    this.onResize(this.object.id, {
      position: this.oldPosition,
      size: this.oldSize,
    });
  }
}
