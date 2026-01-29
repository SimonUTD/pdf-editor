/**
 * ObjectLayer - Renders all inserted objects for a specific page
 * Maps objects to DraggableImage/DraggableText components
 */

import React from 'react';
import { useObjectStore } from '@/stores';
import { InsertedObject } from '@/types/objects';
import { DraggableImage } from '../Objects/DraggableImage';
import { DraggableText } from '../Objects/DraggableText';

interface ObjectLayerProps {
  pageIndex: number;
  pdfZoom: number;
  onObjectUpdate?: () => void;
}

export const ObjectLayer: React.FC<ObjectLayerProps> = ({
  pageIndex,
  pdfZoom,
  onObjectUpdate,
}) => {
  const { objects, selectObject, updateObject, deleteObject } = useObjectStore();
  const pageObjects = objects.filter((obj) => obj.pageIndex === pageIndex);

  const handleUpdate = (id: string, updates: Partial<InsertedObject>) => {
    updateObject(id, updates);
    if (onObjectUpdate) {
      onObjectUpdate();
    }
  };

  const handleSelect = (id: string | null) => {
    selectObject(id);
  };

  const handleDelete = (id: string) => {
    deleteObject(id);
    if (onObjectUpdate) {
      onObjectUpdate();
    }
  };

  return (
    <>
      {pageObjects.map((obj) => (
        obj.type === 'image' ? (
          <DraggableImage
            key={obj.id}
            object={obj}
            onUpdate={(updates) => handleUpdate(obj.id, updates)}
            onSelect={handleSelect}
            onDelete={() => handleDelete(obj.id)}
            pdfZoom={pdfZoom}
          />
        ) : (
          <DraggableText
            key={obj.id}
            object={obj}
            onUpdate={(updates) => handleUpdate(obj.id, updates)}
            onSelect={handleSelect}
            onDelete={() => handleDelete(obj.id)}
            pdfZoom={pdfZoom}
          />
        )
      ))}
    </>
  );
};
