/**
 * DraggableImage - Wrapper for draggable image objects
 */

import React from 'react';
import { DraggableObject } from './DraggableObject';
import { ImageObject, InsertedObject } from '@/types/objects';

interface DraggableImageProps {
  object: ImageObject;
  onUpdate: (updates: Partial<InsertedObject>) => void;
  onSelect: (id: string | null) => void;
  onDelete: () => void;
  pdfZoom: number;
}

export const DraggableImage: React.FC<DraggableImageProps> = ({
  object,
  onUpdate,
  onSelect,
  onDelete,
  pdfZoom,
}) => {
  return (
    <DraggableObject
      object={object}
      onUpdate={onUpdate}
      onSelect={onSelect}
      onDelete={onDelete}
      pdfZoom={pdfZoom}
    />
  );
};
