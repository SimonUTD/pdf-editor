# Phase 3: Advanced Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add advanced PDF editing capabilities including image insertion, text insertion, and multi-format export (Word, TXT, images).

**Architecture:** Extend existing Electron + React architecture with additional pdf-lib features for content insertion and new export services for multi-format output. Add UI components for image/text insertion with free positioning.

**Tech Stack:** Electron, React, TypeScript, pdf-lib, PDF.js, Zustand, Ant Design, docx, file-saver

---

## Task 1: Install Required Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install docx and file-saver libraries**

Run the following command to install required dependencies:
```bash
pnpm add docx file-saver
pnpm add -D @types/file-saver
```

**Step 2: Verify installation**

Check that `package.json` includes:
```json
{
  "dependencies": {
    "docx": "^8.5.0",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

**Step 3: Commit dependency installation**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add docx and file-saver dependencies for Phase 3

- Add docx library for Word export
- Add file-saver for download handling
- Add type definitions for file-saver

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Image Insertion Service

**Files:**
- Modify: `src/services/pdfEditor.ts`

**Step 1: Add image insertion method to PDFEditor**

Add the following method to the `PDFEditor` class in `src/services/pdfEditor.ts`:

```typescript
/**
 * Inserts an image into a PDF page at the specified position.
 *
 * @param pdfDoc - The PDF document to modify
 * @param pageIndex - Zero-based index of the page to insert image on
 * @param imageBytes - The image file content as Uint8Array
 * @param imageType - Type of image ('png' or 'jpg')
 * @param x - X coordinate for image placement (in points)
 * @param y - Y coordinate for image placement (in points)
 * @param width - Image width (in points, default: 200)
 * @param height - Image height (in points, default: 200)
 * @throws Error if pageIndex is out of bounds or image embedding fails
 */
static async insertImage(
  pdfDoc: PDFDocument,
  pageIndex: number,
  imageBytes: Uint8Array,
  imageType: 'png' | 'jpg',
  x: number,
  y: number,
  width: number = 200,
  height: number = 200
): Promise<void> {
  const pageCount = pdfDoc.getPageCount();

  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(
      `Invalid pageIndex: ${pageIndex}. Must be between 0 and ${pageCount - 1}`
    );
  }

  if (width <= 0 || height <= 0) {
    throw new Error(
      `Invalid dimensions: width (${width}) and height (${height}) must be positive`
    );
  }

  const page = pdfDoc.getPage(pageIndex);
  const pageHeight = page.getHeight();

  // Embed the image based on type
  let image;
  if (imageType === 'png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (imageType === 'jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    throw new Error(`Unsupported image type: ${imageType}`);
  }

  // Draw image at specified position (convert y to PDF coordinate system)
  page.drawImage(image, {
    x,
    y: pageHeight - y - height, // PDF coordinates start from bottom-left
    width,
    height,
  });
}
```

**Step 2: Commit image insertion service**

```bash
git add src/services/pdfEditor.ts
git commit -m "feat: add image insertion service to PDFEditor

- Add insertImage method with position and size parameters
- Support PNG and JPG image formats
- Handle coordinate system conversion (top-left to bottom-left)
- Add validation for page index and dimensions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Text Insertion Service

**Files:**
- Modify: `src/services/pdfEditor.ts`

**Step 1: Add text insertion method to PDFEditor**

Add the following method to the `PDFEditor` class in `src/services/pdfEditor.ts`:

```typescript
/**
 * Inserts text into a PDF page at the specified position.
 *
 * @param pdfDoc - The PDF document to modify
 * @param pageIndex - Zero-based index of the page to insert text on
 * @param text - The text content to insert
 * @param x - X coordinate for text placement (in points)
 * @param y - Y coordinate for text placement (in points)
 * @param fontSize - Font size (default: 12)
 * @param color - RGB color object (default: black)
 * @throws Error if pageIndex is out of bounds
 */
static async insertText(
  pdfDoc: PDFDocument,
  pageIndex: number,
  text: string,
  x: number,
  y: number,
  fontSize: number = 12,
  color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
): Promise<void> {
  const pageCount = pdfDoc.getPageCount();

  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(
      `Invalid pageIndex: ${pageIndex}. Must be between 0 and ${pageCount - 1}`
    );
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text content cannot be empty');
  }

  if (fontSize <= 0) {
    throw new Error(`Invalid fontSize: ${fontSize}. Must be positive`);
  }

  const page = pdfDoc.getPage(pageIndex);
  const pageHeight = page.getHeight();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw text at specified position (convert y to PDF coordinate system)
  page.drawText(text, {
    x,
    y: pageHeight - y - fontSize, // PDF coordinates start from bottom-left
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}
```

**Step 2: Commit text insertion service**

```bash
git add src/services/pdfEditor.ts
git commit -m "feat: add text insertion service to PDFEditor

- Add insertText method with position, size, and color parameters
- Use Helvetica font for text rendering
- Handle coordinate system conversion
- Add validation for page index, text content, and font size

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add Export Service for Images

**Files:**
- Create: `src/services/exportService.ts`

**Step 1: Create export service with image export**

Create `src/services/exportService.ts`:
```typescript
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFRenderer } from './pdfRenderer';
import { saveAs } from 'file-saver';

/**
 * ExportService provides functionality to export PDF pages to various formats.
 * Supports image export (PNG/JPG), text export (TXT), and Word export (DOCX).
 */
export class ExportService {
  /**
   * Exports a single PDF page as an image.
   *
   * @param pdfDocument - The PDF document to export from
   * @param pageNumber - Page number to export (1-based)
   * @param format - Image format ('png' or 'jpg')
   * @param scale - Rendering scale (default: 2 for high quality)
   * @returns Promise resolving to image data URL
   */
  static async exportPageAsImage(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number,
    format: 'png' | 'jpg' = 'png',
    scale: number = 2
  ): Promise<string> {
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(
        `Invalid page number: ${pageNumber}. Must be between 1 and ${pdfDocument.numPages}`
      );
    }

    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // Convert canvas to data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    return canvas.toDataURL(mimeType, quality);
  }

  /**
   * Exports all PDF pages as images and downloads them as a zip.
   *
   * @param pdfDocument - The PDF document to export from
   * @param format - Image format ('png' or 'jpg')
   * @param fileName - Base file name for exported images
   */
  static async exportAllPagesAsImages(
    pdfDocument: PDFDocumentProxy,
    format: 'png' | 'jpg' = 'png',
    fileName: string = 'page'
  ): Promise<void> {
    const totalPages = pdfDocument.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const imageDataUrl = await this.exportPageAsImage(pdfDocument, i, format);
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Download image
      const extension = format === 'png' ? 'png' : 'jpg';
      saveAs(blob, `${fileName}_${i}.${extension}`);
    }
  }

  /**
   * Exports a single page as an image file.
   *
   * @param pdfDocument - The PDF document to export from
   * @param pageNumber - Page number to export (1-based)
   * @param format - Image format ('png' or 'jpg')
   * @param fileName - File name for the exported image
   */
  static async exportSinglePageAsImage(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number,
    format: 'png' | 'jpg' = 'png',
    fileName: string = 'page'
  ): Promise<void> {
    const imageDataUrl = await this.exportPageAsImage(pdfDocument, pageNumber, format);
    
    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    // Download image
    const extension = format === 'png' ? 'png' : 'jpg';
    saveAs(blob, `${fileName}.${extension}`);
  }
}
```

**Step 2: Commit image export service**

```bash
git add src/services/exportService.ts
git commit -m "feat: add image export service

- Create ExportService class for multi-format export
- Add exportPageAsImage for single page rendering
- Add exportAllPagesAsImages for batch export
- Add exportSinglePageAsImage with file download
- Support PNG and JPG formats with quality control

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Text Export Service

**Files:**
- Modify: `src/services/exportService.ts`

**Step 1: Add text extraction and export methods**

Add the following methods to the `ExportService` class in `src/services/exportService.ts`:

```typescript
/**
 * Extracts text content from a PDF page.
 *
 * @param pdfDocument - The PDF document to extract from
 * @param pageNumber - Page number to extract text from (1-based)
 * @returns Promise resolving to extracted text
 */
static async extractTextFromPage(
  pdfDocument: PDFDocumentProxy,
  pageNumber: number
): Promise<string> {
  if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
    throw new Error(
      `Invalid page number: ${pageNumber}. Must be between 1 and ${pdfDocument.numPages}`
    );
  }

  const page = await pdfDocument.getPage(pageNumber);
  const textContent = await page.getTextContent();
  
  // Combine text items into a single string
  const text = textContent.items
    .map((item: any) => item.str)
    .join(' ');
  
  return text;
}

/**
 * Exports entire PDF as plain text file.
 *
 * @param pdfDocument - The PDF document to export from
 * @param fileName - File name for the exported text file
 */
static async exportAsText(
  pdfDocument: PDFDocumentProxy,
  fileName: string = 'document'
): Promise<void> {
  const totalPages = pdfDocument.numPages;
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    const pageText = await this.extractTextFromPage(pdfDocument, i);
    fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
  }

  // Create blob and download
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileName}.txt`);
}
```

**Step 2: Commit text export service**

```bash
git add src/services/exportService.ts
git commit -m "feat: add text export service

- Add extractTextFromPage for text extraction
- Add exportAsText for full document text export
- Use PDF.js getTextContent API
- Format output with page separators
- Download as .txt file

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Add Word Export Service

**Files:**
- Modify: `src/services/exportService.ts`

**Step 1: Add Word export method**

Add the following method to the `ExportService` class in `src/services/exportService.ts`:

```typescript
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Exports PDF as Word document (.docx).
 *
 * @param pdfDocument - The PDF document to export from
 * @param fileName - File name for the exported Word document
 */
static async exportAsWord(
  pdfDocument: PDFDocumentProxy,
  fileName: string = 'document'
): Promise<void> {
  const totalPages = pdfDocument.numPages;
  const paragraphs: Paragraph[] = [];

  // Extract text from all pages
  for (let i = 1; i <= totalPages; i++) {
    const pageText = await this.extractTextFromPage(pdfDocument, i);
    
    // Add page header
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Page ${i}`,
            bold: true,
            size: 24,
          }),
        ],
        spacing: {
          before: 200,
          after: 100,
        },
      })
    );

    // Split text into paragraphs (by line breaks or periods)
    const lines = pageText.split(/\n+/).filter(line => line.trim().length > 0);
    
    lines.forEach(line => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 22,
            }),
          ],
          spacing: {
            after: 100,
          },
        })
      );
    });
  }

  // Create Word document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
}
```

**Step 2: Update imports at the top of exportService.ts**

Make sure the imports section includes:
```typescript
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFRenderer } from './pdfRenderer';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
```

**Step 3: Commit Word export service**

```bash
git add src/services/exportService.ts
git commit -m "feat: add Word export service

- Add exportAsWord method using docx library
- Extract text from all pages
- Format with page headers and paragraphs
- Generate .docx file with proper styling
- Download using file-saver

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add Image Insertion UI Component

**Files:**
- Create: `src/components/Editors/ImageInserter.tsx`

**Step 1: Create ImageInserter component**

Create `src/components/Editors/ImageInserter.tsx`:
```typescript
import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, message, Upload } from 'antd';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

interface ImageInserterProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (
    imageBytes: Uint8Array,
    imageType: 'png' | 'jpg',
    x: number,
    y: number,
    width: number,
    height: number
  ) => Promise<void>;
}

export const ImageInserter: React.FC<ImageInserterProps> = ({
  visible,
  onClose,
  onInsert,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [x, setX] = useState<number>(50);
  const [y, setY] = useState<number>(50);
  const [width, setWidth] = useState<number>(200);
  const [height, setHeight] = useState<number>(200);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setImageFile(file);
    }
  };

  const handleInsert = async () => {
    if (!imageFile) {
      message.error('Please select an image file');
      return;
    }

    // Validate image type
    const fileType = imageFile.type;
    if (!fileType.includes('png') && !fileType.includes('jpeg') && !fileType.includes('jpg')) {
      message.error('Only PNG and JPG images are supported');
      return;
    }

    try {
      setLoading(true);

      // Read file as ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);
      const imageType = fileType.includes('png') ? 'png' : 'jpg';

      // Call insert handler
      await onInsert(imageBytes, imageType, x, y, width, height);

      message.success('Image inserted successfully');
      handleClose();
    } catch (error) {
      console.error('Error inserting image:', error);
      message.error('Failed to insert image');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setX(50);
    setY(50);
    setWidth(200);
    setHeight(200);
    onClose();
  };

  return (
    <Modal
      title="Insert Image"
      open={visible}
      onCancel={handleClose}
      onOk={handleInsert}
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload
          accept="image/png,image/jpeg,image/jpg"
          maxCount={1}
          beforeUpload={() => false}
          onChange={handleFileChange}
        >
          <Button icon={<UploadOutlined />}>Select Image (PNG/JPG)</Button>
        </Upload>

        {imageFile && (
          <div>
            <strong>Selected:</strong> {imageFile.name}
          </div>
        )}

        <div>
          <strong>Position (from top-left):</strong>
          <Space style={{ marginTop: 8 }}>
            <span>X:</span>
            <InputNumber
              min={0}
              max={1000}
              value={x}
              onChange={(value) => setX(value || 0)}
              style={{ width: 100 }}
            />
            <span>Y:</span>
            <InputNumber
              min={0}
              max={1000}
              value={y}
              onChange={(value) => setY(value || 0)}
              style={{ width: 100 }}
            />
          </Space>
        </div>

        <div>
          <strong>Size:</strong>
          <Space style={{ marginTop: 8 }}>
            <span>Width:</span>
            <InputNumber
              min={10}
              max={1000}
              value={width}
              onChange={(value) => setWidth(value || 100)}
              style={{ width: 100 }}
            />
            <span>Height:</span>
            <InputNumber
              min={10}
              max={1000}
              value={height}
              onChange={(value) => setHeight(value || 100)}
              style={{ width: 100 }}
            />
          </Space>
        </div>
      </Space>
    </Modal>
  );
};
```

**Step 2: Commit ImageInserter component**

```bash
git add src/components/Editors/
git commit -m "feat: add ImageInserter UI component

- Create modal dialog for image insertion
- Support PNG and JPG file upload
- Add position controls (X, Y coordinates)
- Add size controls (width, height)
- Validate image type before insertion
- Show loading state during insertion

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Text Insertion UI Component

**Files:**
- Create: `src/components/Editors/TextInserter.tsx`

**Step 1: Create TextInserter component**

Create `src/components/Editors/TextInserter.tsx`:
```typescript
import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, message, Input, ColorPicker } from 'antd';
import { FontSizeOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';

const { TextArea } = Input;

interface TextInserterProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: { r: number; g: number; b: number }
  ) => Promise<void>;
}

export const TextInserter: React.FC<TextInserterProps> = ({
  visible,
  onClose,
  onInsert,
}) => {
  const [text, setText] = useState<string>('');
  const [x, setX] = useState<number>(50);
  const [y, setY] = useState<number>(50);
  const [fontSize, setFontSize] = useState<number>(12);
  const [color, setColor] = useState<Color | string>('#000000');
  const [loading, setLoading] = useState(false);

  const handleInsert = async () => {
    if (!text || text.trim().length === 0) {
      message.error('Please enter text content');
      return;
    }

    try {
      setLoading(true);

      // Parse color
      const colorStr = typeof color === 'string' ? color : color.toHexString();
      const rgb = hexToRgb(colorStr);

      // Call insert handler
      await onInsert(text, x, y, fontSize, rgb);

      message.success('Text inserted successfully');
      handleClose();
    } catch (error) {
      console.error('Error inserting text:', error);
      message.error('Failed to insert text');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText('');
    setX(50);
    setY(50);
    setFontSize(12);
    setColor('#000000');
    onClose();
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  return (
    <Modal
      title="Insert Text"
      open={visible}
      onCancel={handleClose}
      onOk={handleInsert}
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <strong>Text Content:</strong>
          <TextArea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to insert..."
            style={{ marginTop: 8 }}
          />
        </div>

        <div>
          <strong>Position (from top-left):</strong>
          <Space style={{ marginTop: 8 }}>
            <span>X:</span>
            <InputNumber
              min={0}
              max={1000}
              value={x}
              onChange={(value) => setX(value || 0)}
              style={{ width: 100 }}
            />
            <span>Y:</span>
            <InputNumber
              min={0}
              max={1000}
              value={y}
              onChange={(value) => setY(value || 0)}
              style={{ width: 100 }}
            />
          </Space>
        </div>

        <div>
          <strong>Font Size:</strong>
          <InputNumber
            min={6}
            max={72}
            value={fontSize}
            onChange={(value) => setFontSize(value || 12)}
            style={{ width: 100, marginLeft: 8 }}
          />
        </div>

        <div>
          <strong>Text Color:</strong>
          <ColorPicker
            value={color}
            onChange={setColor}
            showText
            style={{ marginLeft: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
};
```

**Step 2: Commit TextInserter component**

```bash
git add src/components/Editors/
git commit -m "feat: add TextInserter UI component

- Create modal dialog for text insertion
- Add text area for content input
- Add position controls (X, Y coordinates)
- Add font size control (6-72pt)
- Add color picker for text color
- Convert hex color to RGB for pdf-lib
- Show loading state during insertion

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Export Menu to Toolbar

**Files:**
- Modify: `src/components/Layout/Toolbar.tsx`

**Step 1: Update Toolbar with export menu**

Modify `src/components/Layout/Toolbar.tsx` to add export dropdown:

```typescript
import React from 'react';
import { Button, Space, Typography, Divider, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  FileOutlined,
  SaveOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  ExportOutlined,
  PictureOutlined,
  FontSizeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileWordOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';

const { Text } = Typography;

interface ToolbarProps {
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onPrint: () => void;
  onInsertImage: () => void;
  onInsertText: () => void;
  onExportAsImages: () => void;
  onExportAsText: () => void;
  onExportAsWord: () => void;
  fileName: string | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onSave,
  onSaveAs,
  onPrint,
  onInsertImage,
  onInsertText,
  onExportAsImages,
  onExportAsText,
  onExportAsWord,
  fileName,
  hasUnsavedChanges,
  canSave,
}) => {
  const { zoom, zoomIn, zoomOut, resetZoom } = useUIStore();

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'export-images',
      label: 'Export as Images (PNG)',
      icon: <FileImageOutlined />,
      onClick: onExportAsImages,
    },
    {
      key: 'export-text',
      label: 'Export as Text (TXT)',
      icon: <FileTextOutlined />,
      onClick: onExportAsText,
    },
    {
      key: 'export-word',
      label: 'Export as Word (DOCX)',
      icon: <FileWordOutlined />,
      onClick: onExportAsWord,
    },
  ];

  return (
    <div
      style={{
        height: 56,
        borderBottom: '1px solid #f0f0f0',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
      }}
    >
      <Space split={<Divider type="vertical" />}>
        <Space>
          <Button icon={<FileOutlined />} onClick={onOpenFile}>
            Open
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={onSave}
            disabled={!canSave || !hasUnsavedChanges}
          >
            Save
          </Button>
          <Button onClick={onSaveAs} disabled={!canSave}>
            Save As
          </Button>
          <Button icon={<PrinterOutlined />} onClick={onPrint} disabled={!canSave}>
            Print
          </Button>
        </Space>

        <Space>
          <Button
            icon={<PictureOutlined />}
            onClick={onInsertImage}
            disabled={!canSave}
          >
            Insert Image
          </Button>
          <Button
            icon={<FontSizeOutlined />}
            onClick={onInsertText}
            disabled={!canSave}
          >
            Insert Text
          </Button>
        </Space>

        <Space>
          <Dropdown menu={{ items: exportMenuItems }} disabled={!canSave}>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Dropdown>
        </Space>

        <Space>
          {fileName && (
            <Text type="secondary">
              {fileName}
              {hasUnsavedChanges && ' *'}
            </Text>
          )}
        </Space>
      </Space>

      <Space>
        <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
        <Text style={{ minWidth: 60, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Text>
        <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
        <Button icon={<FullscreenOutlined />} onClick={resetZoom}>
          Fit
        </Button>
      </Space>
    </div>
  );
};
```

**Step 2: Commit toolbar updates**

```bash
git add src/components/Layout/Toolbar.tsx
git commit -m "feat: add insert and export buttons to toolbar

- Add Insert Image button
- Add Insert Text button
- Add Export dropdown menu with three options
- Export as Images (PNG)
- Export as Text (TXT)
- Export as Word (DOCX)
- Disable buttons when no PDF is loaded
- Add visual dividers between button groups

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Integrate All Features into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout/MainLayout.tsx`

**Step 1: Update MainLayout props**

Modify `src/components/Layout/MainLayout.tsx` to add new props:

```typescript
import React from 'react';
import { Layout } from 'antd';
import { Toolbar } from './Toolbar';

const { Sider, Content } = Layout;

interface MainLayoutProps {
  fileName: string | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onPrint: () => void;
  onInsertImage: () => void;
  onInsertText: () => void;
  onExportAsImages: () => void;
  onExportAsText: () => void;
  onExportAsWord: () => void;
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  fileName,
  hasUnsavedChanges,
  canSave,
  onOpenFile,
  onSave,
  onSaveAs,
  onPrint,
  onInsertImage,
  onInsertText,
  onExportAsImages,
  onExportAsText,
  onExportAsWord,
  sidebar,
  content,
}) => {
  return (
    <Layout style={{ height: '100vh' }}>
      <Toolbar
        onOpenFile={onOpenFile}
        onSave={onSave}
        onSaveAs={onSaveAs}
        onPrint={onPrint}
        onInsertImage={onInsertImage}
        onInsertText={onInsertText}
        onExportAsImages={onExportAsImages}
        onExportAsText={onExportAsText}
        onExportAsWord={onExportAsWord}
        fileName={fileName}
        hasUnsavedChanges={hasUnsavedChanges}
        canSave={canSave}
      />
      <Layout>
        <Sider
          width={200}
          style={{
            backgroundColor: '#fafafa',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
          }}
        >
          {sidebar}
        </Sider>
        <Content
          style={{
            backgroundColor: '#525659',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 16,
          }}
        >
          {content}
        </Content>
      </Layout>
    </Layout>
  );
};
```

**Step 2: Update App component with all Phase 3 features**

Modify `src/App.tsx` to add Phase 3 handlers:

```typescript
import React, { useState, useCallback } from 'react';
import { ConfigProvider, theme, Empty, message, Modal } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';
import { Sidebar } from './components/PDFViewer/Sidebar';
import { PDFCanvas } from './components/PDFViewer/PDFCanvas';
import { ImageInserter } from './components/Editors/ImageInserter';
import { TextInserter } from './components/Editors/TextInserter';
import { PDFRenderer } from './services/pdfRenderer';
import { PDFEditor } from './services/pdfEditor';
import { ExportService } from './services/exportService';
import { usePDFStore, useUIStore, useEditStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex, selectPage } = useUIStore();
  const { hasUnsavedChanges, markAsSaved, markAsUnsaved, addToHistory } = useEditStore();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [imageInserterVisible, setImageInserterVisible] = useState(false);
  const [textInserterVisible, setTextInserterVisible] = useState(false);

  // ... (keep existing handlers: handleOpenFile, loadFile, handleSave, handleSaveAs, handlePrint, handleDeletePage, handleInsertBlankPage)

  const handleInsertImage = useCallback(
    async (
      imageBytes: Uint8Array,
      imageType: 'png' | 'jpg',
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      if (!pdfBytes) {
        message.error('No PDF loaded');
        return;
      }

      try {
        const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
        await PDFEditor.insertImage(
          pdfDoc,
          selectedPageIndex,
          imageBytes,
          imageType,
          x,
          y,
          width,
          height
        );
        const newBytes = await PDFEditor.saveToBytes(pdfDoc);

        setPdfBytes(newBytes);
        const document = await PDFRenderer.loadDocument(newBytes.buffer);
        loadPDF(filePath || '', document, document.numPages);

        addToHistory({
          type: 'image-insert',
          timestamp: Date.now(),
          data: { pageIndex: selectedPageIndex, x, y, width, height },
        });
        markAsUnsaved();

        message.success('Image inserted successfully');
      } catch (error) {
        console.error('Error inserting image:', error);
        message.error('Failed to insert image');
        throw error;
      }
    },
    [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]
  );

  const handleInsertText = useCallback(
    async (
      text: string,
      x: number,
      y: number,
      fontSize: number,
      color: { r: number; g: number; b: number }
    ) => {
      if (!pdfBytes) {
        message.error('No PDF loaded');
        return;
      }

      try {
        const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
        await PDFEditor.insertText(
          pdfDoc,
          selectedPageIndex,
          text,
          x,
          y,
          fontSize,
          color
        );
        const newBytes = await PDFEditor.saveToBytes(pdfDoc);

        setPdfBytes(newBytes);
        const document = await PDFRenderer.loadDocument(newBytes.buffer);
        loadPDF(filePath || '', document, document.numPages);

        addToHistory({
          type: 'text-insert',
          timestamp: Date.now(),
          data: { pageIndex: selectedPageIndex, text, x, y, fontSize, color },
        });
        markAsUnsaved();

        message.success('Text inserted successfully');
      } catch (error) {
        console.error('Error inserting text:', error);
        message.error('Failed to insert text');
        throw error;
      }
    },
    [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]
  );

  const handleExportAsImages = useCallback(async () => {
    if (!pdfDocument) {
      message.error('No PDF loaded');
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'page' : 'page';
      await ExportService.exportAllPagesAsImages(pdfDocument, 'png', fileName);
      message.success(`Exported ${totalPages} pages as images`);
    } catch (error) {
      console.error('Error exporting as images:', error);
      message.error('Failed to export as images');
    }
  }, [pdfDocument, filePath, totalPages]);

  const handleExportAsText = useCallback(async () => {
    if (!pdfDocument) {
      message.error('No PDF loaded');
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'document' : 'document';
      await ExportService.exportAsText(pdfDocument, fileName);
      message.success('Exported as text file');
    } catch (error) {
      console.error('Error exporting as text:', error);
      message.error('Failed to export as text');
    }
  }, [pdfDocument, filePath]);

  const handleExportAsWord = useCallback(async () => {
    if (!pdfDocument) {
      message.error('No PDF loaded');
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'document' : 'document';
      await ExportService.exportAsWord(pdfDocument, fileName);
      message.success('Exported as Word document');
    } catch (error) {
      console.error('Error exporting as Word:', error);
      message.error('Failed to export as Word');
    }
  }, [pdfDocument, filePath]);

  useKeyboardShortcuts({
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onPrint: handlePrint,
    onOpen: handleOpenFile,
  });

  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\\\').pop() : null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MainLayout
        fileName={fileName || null}
        hasUnsavedChanges={hasUnsavedChanges}
        canSave={!!pdfDocument}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPrint={handlePrint}
        onInsertImage={() => setImageInserterVisible(true)}
        onInsertText={() => setTextInserterVisible(true)}
        onExportAsImages={handleExportAsImages}
        onExportAsText={handleExportAsText}
        onExportAsWord={handleExportAsWord}
        sidebar={
          <Sidebar
            pdfDocument={pdfDocument}
            totalPages={totalPages}
            onDeletePage={handleDeletePage}
            onInsertBlankPage={handleInsertBlankPage}
          />
        }
        content={
          pdfDocument ? (
            <PDFCanvas
              pdfDocument={pdfDocument}
              pageNumber={selectedPageIndex + 1}
            />
          ) : (
            <Empty
              description="Open a PDF file to get started"
              style={{ marginTop: 100 }}
            />
          )
        }
      />

      <ImageInserter
        visible={imageInserterVisible}
        onClose={() => setImageInserterVisible(false)}
        onInsert={handleInsertImage}
      />

      <TextInserter
        visible={textInserterVisible}
        onClose={() => setTextInserterVisible(false)}
        onInsert={handleInsertText}
      />
    </ConfigProvider>
  );
};

export default App;
```

**Step 3: Update edit store types**

Modify `src/stores/editStore.ts` to add new action types:

```typescript
interface EditAction {
  type: 'text-edit' | 'page-delete' | 'page-insert' | 'page-replace' | 'image-insert' | 'text-insert';
  timestamp: number;
  data: any;
}
```

**Step 4: Commit integration**

```bash
git add src/App.tsx src/components/Layout/MainLayout.tsx src/stores/editStore.ts
git commit -m "feat: integrate Phase 3 features into App

- Add image insertion handler with modal
- Add text insertion handler with modal
- Add export handlers for images, text, and Word
- Update MainLayout with new props
- Add ImageInserter and TextInserter modals to App
- Update edit store with new action types
- Wire up all Phase 3 features to toolbar

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update README for Phase 3

**Files:**
- Modify: `README.md`

**Step 1: Update README with Phase 3 features**

Modify `README.md`:
```markdown
# PDF Editor

A cross-platform desktop PDF editor built with Electron, React, and TypeScript.

## Features

### Phase 1: Core Viewer ✅
- ✅ Open and view PDF files
- ✅ Split-pane layout with thumbnail navigation
- ✅ Zoom in/out/fit controls
- ✅ Natural scrolling through pages
- ✅ Page selection via thumbnails

### Phase 2: Basic Editing ✅
- ✅ Save and Save As functionality
- ✅ Print PDF documents
- ✅ Delete pages with confirmation
- ✅ Insert blank pages
- ✅ Unsaved changes tracking
- ✅ Keyboard shortcuts (Ctrl/Cmd+S, Ctrl/Cmd+P, etc.)

### Phase 3: Advanced Editing ✅
- ✅ Insert images (PNG/JPG) with free positioning
- ✅ Insert text with free positioning and styling
- ✅ Export to Word (.docx)
- ✅ Export to plain text (.txt)
- ✅ Export pages as images (PNG)

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Ant Design** - UI component library
- **Zustand** - State management
- **PDF.js** - PDF rendering and text extraction
- **pdf-lib** - PDF manipulation
- **docx** - Word document generation
- **file-saver** - File download handling

## Development

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Run Development Mode

\`\`\`bash
pnpm run electron:dev
\`\`\`

### Build for Production

\`\`\`bash
pnpm run electron:build
\`\`\`

Builds will be in the `release/` directory.

## Keyboard Shortcuts

- **Ctrl/Cmd+O** - Open PDF file
- **Ctrl/Cmd+S** - Save
- **Ctrl/Cmd+Shift+S** - Save As
- **Ctrl/Cmd+P** - Print

## Project Structure

\`\`\`
pdf-editor/
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   ├── preload.ts    # Preload script
│   └── ipc/          # IPC handlers
├── src/              # React application
│   ├── components/   # React components
│   │   ├── Layout/   # Layout components
│   │   ├── PDFViewer/# PDF viewing components
│   │   └── Editors/  # Editing components
│   ├── services/     # Business logic
│   │   ├── pdfRenderer.ts  # PDF.js wrapper
│   │   ├── pdfEditor.ts    # pdf-lib wrapper
│   │   └── exportService.ts# Export functionality
│   ├── stores/       # Zustand stores
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Utility functions
├── docs/             # Documentation
└── dist/             # Build output
\`\`\`

## Roadmap

- [x] Phase 1: Core Viewer
- [x] Phase 2: Basic Editing
- [x] Phase 3: Advanced Editing
- [ ] Phase 4: Advanced Features (merge, watermarks, headers/footers)

## License

MIT
```

**Step 2: Commit README update**

```bash
git add README.md
git commit -m "docs: update README with Phase 3 features

- Add Phase 3 features list
- Add docx and file-saver to tech stack
- Update project structure with Editors folder
- Update roadmap to show Phase 3 complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3 Complete!

You now have a fully functional PDF editor with advanced editing capabilities:

1. ✅ Insert images (PNG/JPG) with customizable position and size
2. ✅ Insert text with customizable position, font size, and color
3. ✅ Export to Word (.docx) with formatted text
4. ✅ Export to plain text (.txt) with page separators
5. ✅ Export pages as PNG images (single or batch)
6. ✅ Modal dialogs for image and text insertion
7. ✅ Export dropdown menu in toolbar
8. ✅ Full integration with existing Phase 1 and Phase 2 features

**Key Capabilities:**

- **Image Insertion**: Upload PNG/JPG images and place them anywhere on the current page with custom dimensions
- **Text Insertion**: Add text with custom position, font size (6-72pt), and color selection
- **Multi-Format Export**: Export your PDF to Word, plain text, or image formats
- **Professional UI**: Clean modal dialogs with validation and loading states
- **Edit History**: All insertions are tracked in the edit history for future undo/redo support

**Next Steps:**

Ready to move to Phase 4 (Advanced Features)? This will add:
- PDF merge with drag-to-reorder
- Add/remove watermarks
- Add/edit/remove headers and footers
- Erase specific content
- Replace pages
- Reverse page order
- Highlight text and regions

