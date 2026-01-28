import { Command } from './BaseCommand';
import { InsertedObject } from '@/types/objects';

export class ObjectMoveCommand extends Command {
  constructor(
    private object: InsertedObject,
    private oldPosition: { x: number; y: number },
    private newPosition: { x: number; y: number },
    private onMove: (id: string, position: { x: number; y: number }) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    this.onMove(this.object.id, this.newPosition);
  }

  async undo(): Promise<void> {
    this.onMove(this.object.id, this.oldPosition);
  }
}
