# Phase 2: Basic Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add basic PDF editing capabilities including text editing, save/save-as, print, page deletion, and blank page insertion.

**Architecture:** Extend existing Electron + React architecture with pdf-lib for PDF manipulation. Add edit mode state management, implement IPC handlers for save/print operations, and create UI components for page management.

**Tech Stack:** Electron, React, TypeScript, pdf-lib, Zustand, Ant Design

---

## Task 1: Add Edit Store for Editing State

**Files:**
- Create: `src/stores/editStore.ts`
- Modify: `src/stores/index.ts`

**Step 1: Create edit store**

Create `src/stores/editStore.ts`:
```typescript
import { create } from 'zustand';

interface EditAction {
  type: 'text-edit' | 'page-delete' | 'page-insert' | 'page-replace';
  timestamp: number;
  data: any;
}

interface EditStore {
  // Edit history for undo/redo
  history: EditAction[];
  currentIndex: number;

  // Editing state
  isEditing: boolean;
  editMode: 'text' | 'image' | 'none';
  hasUnsavedChanges: boolean;

  // Actions
  setEditMode: (mode: 'text' | 'image' | 'none') => void;
  addToHistory: (action: EditAction) => void;
  undo: () => void;
  redo: () => void;
  markAsSaved: () => void;
  markAsUnsaved: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditStore = create<EditStore>((set, get) => ({
  history: [],
  currentIndex: -1,
  isEditing: false,
  editMode: 'none',
  hasUnsavedChanges: false,

  setEditMode: (mode) => set({ editMode: mode, isEditing: mode !== 'none' }),

  addToHistory: (action) => set((state) => {
    const newHistory = state.history.slice(0, state.currentIndex + 1);
    newHistory.push(action);
    return {
      history: newHistory,
      currentIndex: newHistory.length - 1,
      hasUnsavedChanges: true,
    };
  }),

  undo: () => set((state) => ({
    currentIndex: Math.max(-1, state.currentIndex - 1),
  })),

  redo: () => set((state) => ({
    currentIndex: Math.min(state.history.length - 1, state.currentIndex + 1),
  })),

  markAsSaved: () => set({ hasUnsavedChanges: false }),

  markAsUnsaved: () => set({ hasUnsavedChanges: true }),

  canUndo: () => get().currentIndex >= 0,

  canRedo: () => get().currentIndex < get().history.length - 1,
}));
```

**Step 2: Export edit store**

Modify `src/stores/index.ts`:
```typescript
export { usePDFStore } from './pdfStore';
export { useUIStore } from './uiStore';
export { useEditStore } from './editStore';
```

**Step 3: Commit edit store**

```bash
git add src/stores/
git commit -m "feat: add edit store for editing state management

- Create edit store with history tracking
- Add undo/redo functionality
- Track unsaved changes
- Export edit store

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add PDF Editor Service

**Files:**
- Create: `src/services/pdfEditor.ts`

**Step 1: Create PDF editor service**

Create `src/services/pdfEditor.ts`:
```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PDFEditor {
  static async createFromBytes(bytes: Uint8Array): Promise<PDFDocument> {
    return await PDFDocument.load(bytes);
  }

  static async deletePage(pdfDoc: PDFDocument, pageIndex: number): Promise<void> {
    pdfDoc.removePage(pageIndex);
  }

  static async insertBlankPage(
    pdfDoc: PDFDocument,
    afterIndex: number,
    width: number = 595,
    height: number = 842
  ): Promise<void> {
    const page = pdfDoc.insertPage(afterIndex + 1, [width, height]);
    // Optionally add a watermark or grid
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Blank Page', {
      x: 50,
      y: height - 50,
      size: 12,
      font: font,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  static async saveToBytes(pdfDoc: PDFDocument): Promise<Uint8Array> {
    return await pdfDoc.save();
  }

  static async copyPages(
    sourcePdf: PDFDocument,
    targetPdf: PDFDocument,
    pageIndices: number[]
  ): Promise<void> {
    const copiedPages = await targetPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => {
      targetPdf.addPage(page);
    });
  }
}
```

**Step 2: Commit PDF editor service**

```bash
git add src/services/pdfEditor.ts
git commit -m "feat: add PDF editor service for PDF manipulation

- Create PDFEditor service using pdf-lib
- Add page deletion functionality
- Add blank page insertion
- Add save to bytes functionality
- Add page copying functionality

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Save and Print IPC Handlers

**Files:**
- Modify: `electron/ipc/file.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`

**Step 1: Update file IPC handlers**

Modify `electron/ipc/file.ts` to add save-as and print handlers:
```typescript
import { dialog, ipcMain, BrowserWindow } from 'electron';
import fs from 'fs/promises';

export function setupFileHandlers() {
  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const buffer = await fs.readFile(filePath);

    return {
      filePath,
      buffer: buffer.buffer,
      fileName: filePath.split('/').pop() || filePath.split('\\').pop(),
    };
  });

  ipcMain.handle('save-file', async (_event, filePath: string, data: ArrayBuffer) => {
    try {
      await fs.writeFile(filePath, Buffer.from(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('save-file-as', async (_event, data: ArrayBuffer) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      defaultPath: 'document.pdf',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      await fs.writeFile(result.filePath, Buffer.from(data));
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('print-pdf', async (_event) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.print({}, (success, errorType) => {
        if (!success) {
          console.error('Print failed:', errorType);
        }
      });
    }
    return { success: true };
  });
}
```

**Step 2: Update preload script**

Modify `electron/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron';

export interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

export interface SaveResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke('open-file'),
  saveFile: (filePath: string, data: ArrayBuffer): Promise<SaveResult> =>
    ipcRenderer.invoke('save-file', filePath, data),
  saveFileAs: (data: ArrayBuffer): Promise<SaveResult> =>
    ipcRenderer.invoke('save-file-as', data),
  printPDF: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('print-pdf'),
});
```

**Step 3: Update type definitions**

Modify `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

interface SaveResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

interface Window {
  electronAPI: {
    openFile: () => Promise<FileData | null>;
    saveFile: (filePath: string, data: ArrayBuffer) => Promise<SaveResult>;
    saveFileAs: (data: ArrayBuffer) => Promise<SaveResult>;
    printPDF: () => Promise<{ success: boolean }>;
  };
}
```

**Step 4: Commit IPC handlers**

```bash
git add electron/ipc/file.ts electron/preload.ts src/vite-env.d.ts
git commit -m "feat: add save and print IPC handlers

- Add save-file handler for overwriting existing file
- Add save-file-as handler with dialog
- Add print-pdf handler
- Update preload script with new APIs
- Update TypeScript definitions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update Toolbar with Save and Print Buttons

**Files:**
- Modify: `src/components/Layout/Toolbar.tsx`

**Step 1: Update Toolbar component**

Modify `src/components/Layout/Toolbar.tsx`:
```typescript
import React from 'react';
import { Button, Space, Typography, Divider } from 'antd';
import {
  FileOutlined,
  SaveOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';

const { Text } = Typography;

interface ToolbarProps {
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onPrint: () => void;
  fileName: string | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onSave,
  onSaveAs,
  onPrint,
  fileName,
  hasUnsavedChanges,
  canSave,
}) => {
  const { zoom, zoomIn, zoomOut, resetZoom } = useUIStore();

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
git commit -m "feat: add save and print buttons to toolbar

- Add Save, Save As, and Print buttons
- Show unsaved changes indicator (*)
- Disable buttons when no PDF is loaded
- Add visual dividers between button groups

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Page Context Menu

**Files:**
- Create: `src/components/PDFViewer/PageContextMenu.tsx`
- Modify: `src/components/PDFViewer/PageThumbnail.tsx`

**Step 1: Create page context menu component**

Create `src/components/PDFViewer/PageContextMenu.tsx`:
```typescript
import React from 'react';
import { Dropdown, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  FileAddOutlined,
} from '@ant-design/icons';

interface PageContextMenuProps {
  pageNumber: number;
  onDeletePage: (pageNumber: number) => void;
  onInsertBlankPage: (afterPageNumber: number) => void;
  children: React.ReactNode;
}

export const PageContextMenu: React.FC<PageContextMenuProps> = ({
  pageNumber,
  onDeletePage,
  onInsertBlankPage,
  children,
}) => {
  const items: MenuProps['items'] = [
    {
      key: 'insert',
      label: 'Insert Blank Page After',
      icon: <FileAddOutlined />,
      onClick: () => onInsertBlankPage(pageNumber),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete Page',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeletePage(pageNumber),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  );
};
```

**Step 2: Update PageThumbnail to use context menu**

Modify `src/components/PDFViewer/PageThumbnail.tsx`:
```typescript
import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';
import { PageContextMenu } from './PageContextMenu';

interface PageThumbnailProps {
  pdfDocument: any;
  pageNumber: number;
  onClick: () => void;
  onDeletePage: (pageNumber: number) => void;
  onInsertBlankPage: (afterPageNumber: number) => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pdfDocument,
  pageNumber,
  onClick,
  onDeletePage,
  onInsertBlankPage,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedPageIndex } = useUIStore();

  const isSelected = selectedPageIndex === pageNumber - 1;

  useEffect(() => {
    if (!pdfDocument) return;

    let cancelled = false;

    const generateThumbnail = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const thumbnailData = await PDFRenderer.generateThumbnail(page, 150);
        setThumbnail(thumbnailData);
        setLoading(false);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        setLoading(false);
      }
    };

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, pageNumber]);

  return (
    <PageContextMenu
      pageNumber={pageNumber}
      onDeletePage={onDeletePage}
      onInsertBlankPage={onInsertBlankPage}
    >
      <Card
        hoverable
        onClick={onClick}
        style={{
          margin: '8px',
          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          cursor: 'pointer',
        }}
        bodyStyle={{ padding: 8 }}
      >
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : (
          <>
            <img
              src={thumbnail || ''}
              alt={`Page ${pageNumber}`}
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
              Page {pageNumber}
            </div>
          </>
        )}
      </Card>
    </PageContextMenu>
  );
};
```

**Step 3: Commit context menu**

```bash
git add src/components/PDFViewer/
git commit -m "feat: add page context menu for page operations

- Create PageContextMenu component
- Add delete page option
- Add insert blank page option
- Update PageThumbnail to use context menu

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Sidebar with Page Operations

**Files:**
- Modify: `src/components/PDFViewer/Sidebar.tsx`

**Step 1: Update Sidebar component**

Modify `src/components/PDFViewer/Sidebar.tsx`:
```typescript
import React from 'react';
import { Empty } from 'antd';
import { PageThumbnail } from './PageThumbnail';
import { useUIStore } from '@/stores';

interface SidebarProps {
  pdfDocument: any;
  totalPages: number;
  onDeletePage: (pageNumber: number) => void;
  onInsertBlankPage: (afterPageNumber: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pdfDocument,
  totalPages,
  onDeletePage,
  onInsertBlankPage,
}) => {
  const { selectPage } = useUIStore();

  if (!pdfDocument || totalPages === 0) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description="No pages" />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {Array.from({ length: totalPages }, (_, index) => (
        <PageThumbnail
          key={index}
          pdfDocument={pdfDocument}
          pageNumber={index + 1}
          onClick={() => selectPage(index)}
          onDeletePage={onDeletePage}
          onInsertBlankPage={onInsertBlankPage}
        />
      ))}
    </div>
  );
};
```

**Step 2: Commit sidebar updates**

```bash
git add src/components/PDFViewer/Sidebar.tsx
git commit -m "feat: update sidebar with page operation handlers

- Pass delete and insert handlers to PageThumbnail
- Update Sidebar props interface

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---
## Task 7: Integrate All Features into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout/MainLayout.tsx`

**Step 1: Update MainLayout props**

Modify `src/components/Layout/MainLayout.tsx`:
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

**Step 2: Update App component with all features**

Modify `src/App.tsx`:
```typescript
import React, { useState, useCallback } from 'react';
import { ConfigProvider, theme, Empty, message, Modal } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';
import { Sidebar } from './components/PDFViewer/Sidebar';
import { PDFCanvas } from './components/PDFViewer/PDFCanvas';
import { PDFRenderer } from './services/pdfRenderer';
import { PDFEditor } from './services/pdfEditor';
import { usePDFStore, useUIStore, useEditStore } from './stores';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex, selectPage } = useUIStore();
  const { hasUnsavedChanges, markAsSaved, markAsUnsaved, addToHistory } = useEditStore();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  const handleOpenFile = async () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to continue?',
        onOk: async () => {
          await loadFile();
        },
      });
    } else {
      await loadFile();
    }
  };

  const loadFile = async () => {
    try {
      setLoading(true);
      const fileData = await window.electronAPI.openFile();

      if (!fileData) {
        setLoading(false);
        return;
      }

      const document = await PDFRenderer.loadDocument(fileData.buffer);
      const numPages = document.numPages;

      loadPDF(fileData.filePath, document, numPages);
      setPdfBytes(new Uint8Array(fileData.buffer));
      markAsSaved();
      message.success(`Loaded ${fileData.fileName} (${numPages} pages)`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      message.error('Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pdfBytes || !filePath) {
      message.error('No file to save');
      return;
    }

    try {
      const result = await window.electronAPI.saveFile(filePath, pdfBytes.buffer);
      if (result.success) {
        markAsSaved();
        message.success('File saved successfully');
      } else {
        message.error(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      message.error('Failed to save PDF file');
    }
  };

  const handleSaveAs = async () => {
    if (!pdfBytes) {
      message.error('No file to save');
      return;
    }

    try {
      const result = await window.electronAPI.saveFileAs(pdfBytes.buffer);
      if (result.success && result.filePath) {
        loadPDF(result.filePath, pdfDocument, totalPages);
        markAsSaved();
        message.success('File saved successfully');
      } else if (!result.canceled) {
        message.error(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      message.error('Failed to save PDF file');
    }
  };

  const handlePrint = async () => {
    try {
      await window.electronAPI.printPDF();
    } catch (error) {
      console.error('Error printing PDF:', error);
      message.error('Failed to print PDF');
    }
  };

  const handleDeletePage = useCallback(async (pageNumber: number) => {
    if (!pdfBytes || totalPages <= 1) {
      message.warning('Cannot delete the last page');
      return;
    }

    Modal.confirm({
      title: 'Delete Page',
      content: `Are you sure you want to delete page ${pageNumber}?`,
      onOk: async () => {
        try {
          const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
          await PDFEditor.deletePage(pdfDoc, pageNumber - 1);
          const newBytes = await PDFEditor.saveToBytes(pdfDoc);

          setPdfBytes(newBytes);
          const document = await PDFRenderer.loadDocument(newBytes.buffer);
          loadPDF(filePath || '', document, document.numPages);

          addToHistory({
            type: 'page-delete',
            timestamp: Date.now(),
            data: { pageNumber },
          });
          markAsUnsaved();

          // Adjust selected page if necessary
          if (selectedPageIndex >= document.numPages) {
            selectPage(document.numPages - 1);
          }

          message.success(`Page ${pageNumber} deleted`);
        } catch (error) {
          console.error('Error deleting page:', error);
          message.error('Failed to delete page');
        }
      },
    });
  }, [pdfBytes, totalPages, filePath, selectedPageIndex, loadPDF, selectPage, addToHistory, markAsUnsaved]);

  const handleInsertBlankPage = useCallback(async (afterPageNumber: number) => {
    if (!pdfBytes) {
      message.error('No PDF loaded');
      return;
    }

    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.insertBlankPage(pdfDoc, afterPageNumber - 1);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);

      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(newBytes.buffer);
      loadPDF(filePath || '', document, document.numPages);

      addToHistory({
        type: 'page-insert',
        timestamp: Date.now(),
        data: { afterPageNumber },
      });
      markAsUnsaved();

      message.success(`Blank page inserted after page ${afterPageNumber}`);
    } catch (error) {
      console.error('Error inserting blank page:', error);
      message.error('Failed to insert blank page');
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : null;

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
    </ConfigProvider>
  );
};

export default App;
```

**Step 3: Commit integration**

```bash
git add src/App.tsx src/components/Layout/MainLayout.tsx
git commit -m "feat: integrate all Phase 2 features into App

- Add save, save-as, and print handlers
- Add page deletion with confirmation
- Add blank page insertion
- Track unsaved changes
- Update MainLayout with new props
- Add confirmation dialog for unsaved changes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update PDF Store for Reloading

**Files:**
- Modify: `src/stores/pdfStore.ts`

**Step 1: Add reload functionality to PDF store**

Modify `src/stores/pdfStore.ts`:
```typescript
import { create } from 'zustand';

interface PDFPage {
  pageNumber: number;
  thumbnail: string | null;
}

interface PDFStore {
  // State
  filePath: string | null;
  pdfDocument: any | null;
  pages: PDFPage[];
  totalPages: number;
  
  // Actions
  loadPDF: (filePath: string, document: any, totalPages: number) => void;
  reloadPDF: (document: any, totalPages: number) => void;
  setPages: (pages: PDFPage[]) => void;
  closePDF: () => void;
}

export const usePDFStore = create<PDFStore>((set) => ({
  filePath: null,
  pdfDocument: null,
  pages: [],
  totalPages: 0,
  
  loadPDF: (filePath, document, totalPages) => 
    set({ filePath, pdfDocument: document, totalPages, pages: [] }),
  
  reloadPDF: (document, totalPages) =>
    set((state) => ({ pdfDocument: document, totalPages, pages: [], filePath: state.filePath })),
  
  setPages: (pages) => set({ pages }),
  
  closePDF: () => 
    set({ filePath: null, pdfDocument: null, pages: [], totalPages: 0 }),
}));
```

**Step 2: Commit PDF store update**

```bash
git add src/stores/pdfStore.ts
git commit -m "feat: add reload functionality to PDF store

- Add reloadPDF action for updating document without changing file path
- Useful for page operations that modify the PDF

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Keyboard Shortcuts

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`
- Modify: `src/App.tsx`

**Step 1: Create keyboard shortcuts hook**

Create `src/hooks/useKeyboardShortcuts.ts`:
```typescript
import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onSaveAs?: () => void;
  onPrint?: () => void;
  onOpen?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (modifier && event.key === 's') {
        event.preventDefault();
        if (event.shiftKey && shortcuts.onSaveAs) {
          shortcuts.onSaveAs();
        } else if (shortcuts.onSave) {
          shortcuts.onSave();
        }
      } else if (modifier && event.key === 'p') {
        event.preventDefault();
        if (shortcuts.onPrint) {
          shortcuts.onPrint();
        }
      } else if (modifier && event.key === 'o') {
        event.preventDefault();
        if (shortcuts.onOpen) {
          shortcuts.onOpen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
```

**Step 2: Use keyboard shortcuts in App**

Modify `src/App.tsx` to add keyboard shortcuts (add after imports):
```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Inside App component, after all handlers:
useKeyboardShortcuts({
  onSave: handleSave,
  onSaveAs: handleSaveAs,
  onPrint: handlePrint,
  onOpen: handleOpenFile,
});
```

**Step 3: Commit keyboard shortcuts**

```bash
git add src/hooks/ src/App.tsx
git commit -m "feat: add keyboard shortcuts for common operations

- Create useKeyboardShortcuts hook
- Add Ctrl/Cmd+S for save
- Add Ctrl/Cmd+Shift+S for save as
- Add Ctrl/Cmd+P for print
- Add Ctrl/Cmd+O for open
- Support both Mac and Windows/Linux

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update README for Phase 2

**Files:**
- Modify: `README.md`

**Step 1: Update README with Phase 2 features**

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

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Ant Design** - UI component library
- **Zustand** - State management
- **PDF.js** - PDF rendering
- **pdf-lib** - PDF manipulation

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
│   ├── services/     # Business logic
│   ├── stores/       # Zustand stores
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Utility functions
├── docs/             # Documentation
└── dist/             # Build output
\`\`\`

## Roadmap

- [x] Phase 1: Core Viewer
- [x] Phase 2: Basic Editing
- [ ] Phase 3: Advanced Editing
- [ ] Phase 4: Advanced Features

## License

MIT
```

**Step 2: Commit README update**

```bash
git add README.md
git commit -m "docs: update README with Phase 2 features

- Add Phase 2 features list
- Add keyboard shortcuts section
- Update roadmap
- Add hooks to project structure

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 3: Push to remote**

```bash
git push origin main
```

---

## Phase 2 Complete!

You now have a fully functional PDF editor with basic editing capabilities:

1. ✅ Save and Save As functionality
2. ✅ Print PDF documents
3. ✅ Delete pages with confirmation dialog
4. ✅ Insert blank pages after any page
5. ✅ Unsaved changes tracking with indicator
6. ✅ Keyboard shortcuts for common operations
7. ✅ Context menu on page thumbnails
8. ✅ Edit history tracking (foundation for undo/redo)

**Next Steps:**

Ready to move to Phase 3 (Advanced Editing)? This will add:
- Insert images and text with free positioning
- Export to Word (.docx)
- Export to TXT (plain text)
- Export pages as images (PNG/JPG)

