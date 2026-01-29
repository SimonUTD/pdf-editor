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
  onMoveComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }) => void;
  onResizeComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }, oldSize: { width: number; height: number }, newSize: { width: number; height: number }) => void;
  onRotateComplete?: (id: string, oldRotation: number, newRotation: number) => void;
}

export const DraggableImage: React.FC<DraggableImageProps> = ({
  object,
  onUpdate,
  onSelect,
  onDelete,
  pdfZoom,
  onMoveComplete,
  onResizeComplete,
  onRotateComplete,
}) => {
  return (
    <DraggableObject
      object={object}
      onUpdate={onUpdate}
      onSelect={onSelect}
      onDelete={onDelete}
      pdfZoom={pdfZoom}
      onMoveComplete={onMoveComplete}
      onResizeComplete={onResizeComplete}
      onRotateComplete={onRotateComplete}
    />
  );
};
