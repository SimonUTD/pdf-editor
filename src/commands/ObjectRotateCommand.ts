import { Command } from './BaseCommand';
import { InsertedObject } from '@/types/objects';

export class ObjectRotateCommand extends Command {
  constructor(
    private object: InsertedObject,
    private oldRotation: number,
    private newRotation: number,
    private onRotate: (id: string, rotation: number) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    this.onRotate(this.object.id, this.newRotation);
  }

  async undo(): Promise<void> {
    this.onRotate(this.object.id, this.oldRotation);
  }
}
