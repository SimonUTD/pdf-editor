/**
 * Object types for inserted images and text
 * These represent draggable objects on PDF pages
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseObject {
  id: string;
  type: 'image' | 'text';
  pageIndex: number;
  position: Position;  // PDF coordinates (not screen coordinates)
  size: Size;          // PDF dimensions
  zIndex: number;
  selected: boolean;
  rotation?: number;   // Rotation angle in degrees (0-360)
}

export interface ImageObject extends BaseObject {
  type: 'image';
  content: string; // base64 data URL
  opacity?: number;
}

export interface TextObject extends BaseObject {
  type: 'text';
  content: string;
  style: {
    fontSize: number;
    color: string;
    fontFamily?: string;
    fontWeight?: string;
    opacity?: number;
  };
}

export type InsertedObject = ImageObject | TextObject;
