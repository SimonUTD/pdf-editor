/**
 * DraggableObject - Base component for draggable objects (images and text)
 * Handles mouse events for dragging, selection, deletion, resizing, and rotation
 */

import React, { useRef, useEffect, useState } from 'react';
import { InsertedObject } from '@/types/objects';

interface DraggableObjectProps {
  object: InsertedObject;
  onUpdate: (updates: Partial<InsertedObject>) => void;
  onSelect: (id: string | null) => void;
  onDelete: () => void;
  pdfZoom: number;
  onMoveComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }) => void;
  onResizeComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }, oldSize: { width: number; height: number }, newSize: { width: number; height: number }) => void;
  onRotateComplete?: (id: string, oldRotation: number, newRotation: number) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const DraggableObject: React.FC<DraggableObjectProps> = ({
  object,
  onUpdate,
  onSelect,
  onDelete,
  pdfZoom,
  onMoveComplete,
  onResizeComplete,
  onRotateComplete,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startRotation, setStartRotation] = useState(0);
  const rotation = object.rotation || 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on a resize handle or rotation handle
    if ((e.target as HTMLElement).dataset.handle) {
      return;
    }
    e.stopPropagation(); // Prevent triggering PDF region selection
    setIsDragging(true);
    onSelect(object.id);

    const rect = elementRef.current!.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Store initial position for command
    setStartPos({ x: object.position.x, y: object.position.y });
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    onSelect(object.id);

    setStartSize({
      width: object.size.width,
      height: object.size.height,
    });
    setStartPos({
      x: object.position.x,
      y: object.position.y,
    });
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    onSelect(object.id);

    // Store initial rotation for command
    setStartRotation(object.rotation || 0);
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const containerRect = elementRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate new position in screen coordinates
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      // Convert to PDF coordinates (divide by zoom)
      onUpdate({
        position: {
          x: newX / pdfZoom,
          y: newY / pdfZoom,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Commit move command if position changed
      if (onMoveComplete) {
        const newPos = { x: object.position.x, y: object.position.y };
        if (newPos.x !== startPos.x || newPos.y !== startPos.y) {
          onMoveComplete(object.id, startPos, newPos);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onUpdate, pdfZoom, onMoveComplete, object, startPos]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const containerRect = elementRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // Current object bounds in screen coordinates
      const objLeft = object.position.x * pdfZoom;
      const objTop = object.position.y * pdfZoom;
      const objRight = objLeft + object.size.width * pdfZoom;
      const objBottom = objTop + object.size.height * pdfZoom;

      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;

      // Minimum size in PDF coordinates
      const minSize = 20 / pdfZoom;

      // Calculate new size and position based on handle
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(minSize, (mouseX - objLeft) / pdfZoom);
      }
      if (resizeHandle.includes('w')) {
        const newWidthCalc = Math.max(minSize, (objRight - mouseX) / pdfZoom);
        newX = startPos.x + startSize.width - newWidthCalc;
        newWidth = newWidthCalc;
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(minSize, (mouseY - objTop) / pdfZoom);
      }
      if (resizeHandle.includes('n')) {
        const newHeightCalc = Math.max(minSize, (objBottom - mouseY) / pdfZoom);
        newY = startPos.y + startSize.height - newHeightCalc;
        newHeight = newHeightCalc;
      }

      onUpdate({
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);

      // Commit resize command if size or position changed
      if (onResizeComplete) {
        const newPos = { x: object.position.x, y: object.position.y };
        const newSize = { width: object.size.width, height: object.size.height };
        if (
          newPos.x !== startPos.x ||
          newPos.y !== startPos.y ||
          newSize.width !== startSize.width ||
          newSize.height !== startSize.height
        ) {
          onResizeComplete(object.id, startPos, newPos, startSize, newSize);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, startSize, startPos, object, pdfZoom, onUpdate, onResizeComplete]);

  // Handle rotation
  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate angle from center to mouse position
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

      // Adjust angle so 0 is at top
      let adjustedAngle = angle + 90;
      if (adjustedAngle < 0) adjustedAngle += 360;

      onUpdate({ rotation: adjustedAngle % 360 });
    };

    const handleMouseUp = () => {
      setIsRotating(false);

      // Commit rotate command if rotation changed
      if (onRotateComplete) {
        const newRotation = object.rotation || 0;
        if (newRotation !== startRotation) {
          onRotateComplete(object.id, startRotation, newRotation);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRotating, onUpdate, onRotateComplete, object, startRotation]);

  // Keyboard shortcuts: Delete to delete, ESC to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!object.selected) return;

      // Support both Delete (Windows) and Backspace (macOS) keys
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (confirm('确定要删除此对象吗？')) {
          onDelete();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelect(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [object.selected, onDelete, onSelect]);

  const renderContent = () => {
    if (object.type === 'image') {
      return (
        <img
          src={object.content}
          alt="插入的图片"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: object.opacity ?? 1,
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block',
          }}
        />
      );
    } else {
      return (
        <div
          style={{
            fontSize: `${object.style.fontSize * pdfZoom}px`,
            color: object.style.color,
            fontFamily: object.style.fontFamily || 'sans-serif',
            fontWeight: object.style.fontWeight,
            opacity: object.style.opacity ?? 1,
            whiteSpace: 'pre-wrap',
            userSelect: 'text',
            pointerEvents: 'auto',
            cursor: 'text',
            minWidth: '50px',
            minHeight: '20px',
            width: '100%',
            height: '100%',
          }}
        >
          {object.content}
        </div>
      );
    }
  };

  // Render resize handles
  const renderResizeHandles = () => {
    if (!object.selected) return null;

    const handles: { handle: ResizeHandle; style: React.CSSProperties }[] = [
      { handle: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
      { handle: 'n', style: { top: -4, left: 'calc(50% - 4px)', cursor: 'n-resize' } },
      { handle: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
      { handle: 'e', style: { top: 'calc(50% - 4px)', right: -4, cursor: 'e-resize' } },
      { handle: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
      { handle: 's', style: { bottom: -4, left: 'calc(50% - 4px)', cursor: 's-resize' } },
      { handle: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
      { handle: 'w', style: { top: 'calc(50% - 4px)', left: -4, cursor: 'w-resize' } },
    ];

    return handles.map(({ handle, style }) => (
      <div
        key={handle}
        data-handle={handle}
        onMouseDown={(e) => handleResizeStart(e, handle)}
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: '#1890ff',
          borderRadius: '50%',
          border: '1px solid white',
          zIndex: 10,
          ...style,
        }}
      />
    ));
  };

  // Render rotation handle
  const renderRotationHandle = () => {
    if (!object.selected) return null;

    return (
      <div
        data-handle="rotate"
        onMouseDown={handleRotateStart}
        style={{
          position: 'absolute',
          top: -30,
          left: 'calc(50% - 8px)',
          width: 16,
          height: 16,
          backgroundColor: '#1890ff',
          borderRadius: '50%',
          border: '2px solid white',
          cursor: 'grab',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          style={{ pointerEvents: 'none' }}
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </div>
    );
  };

  // Render font selector for text objects
  const renderFontSelector = () => {
    if (!object.selected || object.type !== 'text') return null;

    const fonts = [
      { value: 'sans-serif', label: 'Sans Serif' },
      { value: 'serif', label: 'Serif' },
      { value: 'monospace', label: 'Monospace' },
      { value: 'Arial', label: 'Arial' },
      { value: 'Times New Roman', label: 'Times New Roman' },
      { value: 'Courier New', label: 'Courier New' },
      { value: 'Georgia', label: 'Georgia' },
      { value: 'Verdana', label: 'Verdana' },
    ];

    return (
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: 0,
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          padding: '4px 8px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: 12, color: '#666' }}>Font:</span>
        <select
          value={object.style.fontFamily || 'sans-serif'}
          onChange={(e) => {
            onUpdate({
              style: {
                ...object.style,
                fontFamily: e.target.value,
              },
            });
          }}
          style={{
            padding: '2px 4px',
            fontSize: 12,
            border: '1px solid #d9d9d9',
            borderRadius: 2,
            cursor: 'pointer',
          }}
        >
          {fonts.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>Size:</span>
        <input
          type="number"
          min={8}
          max={72}
          value={object.style.fontSize}
          onChange={(e) => {
            const newSize = Math.max(8, Math.min(72, parseInt(e.target.value) || 16));
            onUpdate({
              style: {
                ...object.style,
                fontSize: newSize,
              },
            });
          }}
          style={{
            width: 50,
            padding: '2px 4px',
            fontSize: 12,
            border: '1px solid #d9d9d9',
            borderRadius: 2,
          }}
        />
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: object.position.x * pdfZoom,
        top: object.position.y * pdfZoom,
        width: object.size.width * pdfZoom,
        height: object.size.height * pdfZoom,
        cursor: isDragging ? 'grabbing' : 'grab',
        border: object.selected ? '2px solid #1890ff' : '2px solid transparent',
        borderRadius: 4,
        padding: 2,
        boxSizing: 'border-box',
        zIndex: object.zIndex,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {renderContent()}

      {/* Resize handles */}
      {renderResizeHandles()}

      {/* Rotation handle */}
      {renderRotationHandle()}

      {/* Font selector for text objects */}
      {renderFontSelector()}

      {/* Show rotation degree when rotating */}
      {object.selected && rotation !== 0 && (
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '2px 4px',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        >
          {Math.round(rotation)}°
        </div>
      )}
    </div>
  );
};
