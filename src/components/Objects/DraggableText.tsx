/**
 * DraggableText - Wrapper for draggable text objects
 */

import React from 'react';
import { DraggableObject } from './DraggableObject';
import { TextObject, InsertedObject } from '@/types/objects';

interface DraggableTextProps {
  object: TextObject;
  onUpdate: (updates: Partial<InsertedObject>) => void;
  onSelect: (id: string | null) => void;
  onDelete: () => void;
  pdfZoom: number;
}

export const DraggableText: React.FC<DraggableTextProps> = ({
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
