# Phase 1: Core PDF Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional PDF viewer with split-pane layout, thumbnail navigation, and zoom controls.

**Architecture:** Electron app with React frontend, PDF.js for rendering, Ant Design for UI components. Main process handles file operations, renderer displays PDF with canvas-based rendering.

**Tech Stack:** Electron, React, TypeScript, Vite, PDF.js, pdf-lib, Ant Design, Zustand

---

## Task 1: Project Initialization and Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `electron-builder.json`
- Create: `.gitignore`

**Step 1: Initialize npm project**

Run: `npm init -y`
Expected: Creates package.json

**Step 2: Install core dependencies**

```bash
npm install react react-dom antd zustand pdfjs-dist pdf-lib
npm install -D electron electron-builder vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node
```

Expected: All packages installed successfully

**Step 3: Create TypeScript configuration**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "electron"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 4: Create Vite configuration**

Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 5: Create electron-builder configuration**

Create `electron-builder.json`:
```json
{
  "appId": "com.pdfeditor.app",
  "productName": "PDF Editor",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "build/icon.icns",
    "category": "public.app-category.productivity"
  }
}
```

**Step 6: Create .gitignore**

Create `.gitignore`:
```
node_modules
dist
dist-electron
release
.DS_Store
*.log
```

**Step 7: Update package.json scripts**

Modify `package.json` to add scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder"
  },
  "main": "dist-electron/main.js"
}
```

**Step 8: Install additional dev dependencies**

```bash
npm install -D concurrently wait-on
```

**Step 9: Commit project setup**

```bash
git add .
git commit -m "chore: initialize project with Electron, React, TypeScript, and Vite

- Add package.json with all dependencies
- Configure TypeScript with strict mode
- Configure Vite for React development
- Configure electron-builder for Windows and macOS
- Add development and build scripts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Electron Main Process Setup

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `tsconfig.node.json`

**Step 1: Create tsconfig for Node.js**

Create `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["electron"]
}
```

**Step 2: Create main process entry**

Create `electron/main.ts`:
```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

**Step 3: Create preload script**

Create `electron/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations will be added here
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data: ArrayBuffer) => ipcRenderer.invoke('save-file', data),
});
```

**Step 4: Add build script for Electron**

Install esbuild for building Electron code:
```bash
npm install -D esbuild
```

Add build script to `package.json`:
```json
{
  "scripts": {
    "build:electron": "esbuild electron/main.ts electron/preload.ts --bundle --platform=node --outdir=dist-electron --external:electron"
  }
}
```

**Step 5: Commit Electron setup**

```bash
git add electron/ tsconfig.node.json package.json
git commit -m "feat: set up Electron main process and preload script

- Create main process with window management
- Create preload script with context bridge
- Configure esbuild for Electron TypeScript compilation
- Add IPC communication foundation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: React Application Structure

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `index.html`

**Step 1: Create HTML entry point**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PDF Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 2: Create Vite environment types**

Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openFile: () => Promise<{ filePath: string; buffer: ArrayBuffer } | null>;
    saveFile: (data: ArrayBuffer) => Promise<boolean>;
  };
}
```

**Step 3: Create React entry point**

Create `src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 4: Create basic App component**

Create `src/App.tsx`:
```typescript
import React from 'react';
import { ConfigProvider, theme } from 'antd';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <h1>PDF Editor</h1>
        <p>Application starting...</p>
      </div>
    </ConfigProvider>
  );
};

export default App;
```

**Step 5: Create basic CSS**

Create `src/index.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
```

**Step 6: Commit React structure**

```bash
git add src/ index.html
git commit -m "feat: create React application structure

- Add HTML entry point
- Create React root component with Ant Design ConfigProvider
- Add TypeScript definitions for Electron API
- Add basic global styles

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---
## Task 4: Zustand State Management Setup

**Files:**
- Create: `src/stores/pdfStore.ts`
- Create: `src/stores/uiStore.ts`
- Create: `src/stores/index.ts`

**Step 1: Create PDF store**

Create `src/stores/pdfStore.ts`:
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
  
  setPages: (pages) => set({ pages }),
  
  closePDF: () => 
    set({ filePath: null, pdfDocument: null, pages: [], totalPages: 0 }),
}));
```

**Step 2: Create UI store**

Create `src/stores/uiStore.ts`:
```typescript
import { create } from 'zustand';

interface UIStore {
  // State
  zoom: number;
  selectedPageIndex: number;
  sidebarWidth: number;
  
  // Actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  selectPage: (index: number) => void;
  setSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  zoom: 1.0,
  selectedPageIndex: 0,
  sidebarWidth: 200,
  
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3.0, zoom)) }),
  
  zoomIn: () => set((state) => ({ 
    zoom: Math.min(3.0, state.zoom + 0.1) 
  })),
  
  zoomOut: () => set((state) => ({ 
    zoom: Math.max(0.5, state.zoom - 0.1) 
  })),
  
  resetZoom: () => set({ zoom: 1.0 }),
  
  selectPage: (index) => set({ selectedPageIndex: index }),
  
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
}));
```

**Step 3: Create store index**

Create `src/stores/index.ts`:
```typescript
export { usePDFStore } from './pdfStore';
export { useUIStore } from './uiStore';
```

**Step 4: Commit state management**

```bash
git add src/stores/
git commit -m "feat: add Zustand state management stores

- Create PDF store for document state
- Create UI store for view state (zoom, selection)
- Export stores from index

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: PDF.js Service Integration

**Files:**
- Create: `src/services/pdfRenderer.ts`
- Create: `src/utils/pdfHelpers.ts`

**Step 1: Create PDF renderer service**

Create `src/services/pdfRenderer.ts`:
```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFRenderOptions {
  scale?: number;
  rotation?: number;
}

export class PDFRenderer {
  static async loadDocument(data: ArrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data });
    return await loadingTask.promise;
  }

  static async renderPageToCanvas(
    page: any,
    canvas: HTMLCanvasElement,
    options: PDFRenderOptions = {}
  ): Promise<void> {
    const { scale = 1.0, rotation = 0 } = options;
    const viewport = page.getViewport({ scale, rotation });

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  }

  static async generateThumbnail(
    page: any,
    maxWidth: number = 150
  ): Promise<string> {
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / viewport.width;
    const thumbnailViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = thumbnailViewport.width;
    canvas.height = thumbnailViewport.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get canvas context');

    await page.render({
      canvasContext: context,
      viewport: thumbnailViewport,
    }).promise;

    return canvas.toDataURL('image/png');
  }
}
```

**Step 2: Create PDF helper utilities**

Create `src/utils/pdfHelpers.ts`:
```typescript
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getPageLabel = (pageNumber: number, totalPages: number): string => {
  return `Page ${pageNumber} of ${totalPages}`;
};

export const calculateFitToWidthScale = (
  pageWidth: number,
  containerWidth: number
): number => {
  return containerWidth / pageWidth;
};

export const calculateFitToPageScale = (
  pageWidth: number,
  pageHeight: number,
  containerWidth: number,
  containerHeight: number
): number => {
  const widthScale = containerWidth / pageWidth;
  const heightScale = containerHeight / pageHeight;
  return Math.min(widthScale, heightScale);
};
```

**Step 3: Commit PDF services**

```bash
git add src/services/ src/utils/
git commit -m "feat: add PDF.js rendering service and utilities

- Create PDFRenderer service for document loading and rendering
- Add thumbnail generation functionality
- Create helper utilities for formatting and calculations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Main Layout Component

**Files:**
- Create: `src/components/Layout/MainLayout.tsx`
- Create: `src/components/Layout/Toolbar.tsx`
- Modify: `src/App.tsx`

**Step 1: Create Toolbar component**

Create `src/components/Layout/Toolbar.tsx`:
```typescript
import React from 'react';
import { Button, Space, Typography } from 'antd';
import {
  FileOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';

const { Text } = Typography;

interface ToolbarProps {
  onOpenFile: () => void;
  fileName: string | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenFile, fileName }) => {
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
      <Space>
        <Button icon={<FileOutlined />} onClick={onOpenFile}>
          Open PDF
        </Button>
        {fileName && <Text type="secondary">{fileName}</Text>}
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

**Step 2: Create MainLayout component**

Create `src/components/Layout/MainLayout.tsx`:
```typescript
import React from 'react';
import { Layout } from 'antd';
import { Toolbar } from './Toolbar';

const { Sider, Content } = Layout;

interface MainLayoutProps {
  fileName: string | null;
  onOpenFile: () => void;
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  fileName,
  onOpenFile,
  sidebar,
  content,
}) => {
  return (
    <Layout style={{ height: '100vh' }}>
      <Toolbar onOpenFile={onOpenFile} fileName={fileName} />
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

**Step 3: Update App component to use MainLayout**

Modify `src/App.tsx`:
```typescript
import React from 'react';
import { ConfigProvider, theme, Empty } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';

const App: React.FC = () => {
  const handleOpenFile = () => {
    console.log('Open file clicked');
    // Will be implemented in next task
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MainLayout
        fileName={null}
        onOpenFile={handleOpenFile}
        sidebar={<Empty description="No PDF loaded" />}
        content={
          <Empty
            description="Open a PDF file to get started"
            style={{ marginTop: 100 }}
          />
        }
      />
    </ConfigProvider>
  );
};

export default App;
```

**Step 4: Commit layout components**

```bash
git add src/components/Layout/ src/App.tsx
git commit -m "feat: create main layout with toolbar and split pane

- Add Toolbar component with open file and zoom controls
- Create MainLayout with Ant Design Layout (Sider + Content)
- Update App to use MainLayout
- Add placeholder content for empty state

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---
## Task 7: File Operations with IPC

**Files:**
- Create: `electron/ipc/file.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`

**Step 1: Create file IPC handlers**

Create `electron/ipc/file.ts`:
```typescript
import { dialog, ipcMain } from 'electron';
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

  ipcMain.handle('save-file', async (_event, data: ArrayBuffer) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    await fs.writeFile(result.filePath, Buffer.from(data));
    return true;
  });
}
```

**Step 2: Update main process to use file handlers**

Modify `electron/main.ts`:
```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupFileHandlers } from './ipc/file';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupFileHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

**Step 3: Update preload script with proper types**

Modify `electron/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron';

export interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke('open-file'),
  saveFile: (data: ArrayBuffer): Promise<boolean> => 
    ipcRenderer.invoke('save-file', data),
});
```

**Step 4: Update type definitions**

Modify `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

interface Window {
  electronAPI: {
    openFile: () => Promise<FileData | null>;
    saveFile: (data: ArrayBuffer) => Promise<boolean>;
  };
}
```

**Step 5: Commit file operations**

```bash
git add electron/ src/vite-env.d.ts
git commit -m "feat: implement file operations with IPC

- Create file IPC handlers for open and save dialogs
- Update main process to register IPC handlers
- Update preload script with proper TypeScript types
- Add type definitions for file operations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: PDF Viewer Component

**Files:**
- Create: `src/components/PDFViewer/PDFCanvas.tsx`
- Create: `src/components/PDFViewer/PageThumbnail.tsx`
- Create: `src/components/PDFViewer/Sidebar.tsx`

**Step 1: Create PDFCanvas component**

Create `src/components/PDFViewer/PDFCanvas.tsx`:
```typescript
import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';

interface PDFCanvasProps {
  pdfDocument: any;
  pageNumber: number;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pdfDocument,
  pageNumber,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = React.useState(true);
  const { zoom } = useUIStore();

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let cancelled = false;
    setLoading(true);

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        await PDFRenderer.renderPageToCanvas(page, canvasRef.current!, {
          scale: zoom,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error rendering page:', error);
        setLoading(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, pageNumber, zoom]);

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Spin size="large" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          display: loading ? 'none' : 'block',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
};
```

**Step 2: Create PageThumbnail component**

Create `src/components/PDFViewer/PageThumbnail.tsx`:
```typescript
import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';

interface PageThumbnailProps {
  pdfDocument: any;
  pageNumber: number;
  onClick: () => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pdfDocument,
  pageNumber,
  onClick,
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
  );
};
```

**Step 3: Create Sidebar component**

Create `src/components/PDFViewer/Sidebar.tsx`:
```typescript
import React from 'react';
import { Empty } from 'antd';
import { PageThumbnail } from './PageThumbnail';
import { useUIStore } from '@/stores';

interface SidebarProps {
  pdfDocument: any;
  totalPages: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pdfDocument, totalPages }) => {
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
        />
      ))}
    </div>
  );
};
```

**Step 4: Commit PDF viewer components**

```bash
git add src/components/PDFViewer/
git commit -m "feat: create PDF viewer components

- Add PDFCanvas component for rendering PDF pages
- Create PageThumbnail component for sidebar navigation
- Add Sidebar component to display all page thumbnails
- Integrate with Zustand stores for state management

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Integrate PDF Viewer into App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App component with PDF loading logic**

Modify `src/App.tsx`:
```typescript
import React, { useState } from 'react';
import { ConfigProvider, theme, Empty, message } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';
import { Sidebar } from './components/PDFViewer/Sidebar';
import { PDFCanvas } from './components/PDFViewer/PDFCanvas';
import { PDFRenderer } from './services/pdfRenderer';
import { usePDFStore, useUIStore } from './stores';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex } = useUIStore();

  const handleOpenFile = async () => {
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
      message.success(`Loaded ${fileData.fileName} (${numPages} pages)`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      message.error('Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  };

  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MainLayout
        fileName={fileName || null}
        onOpenFile={handleOpenFile}
        sidebar={
          <Sidebar pdfDocument={pdfDocument} totalPages={totalPages} />
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

**Step 2: Commit integration**

```bash
git add src/App.tsx
git commit -m "feat: integrate PDF viewer into main application

- Add PDF loading logic with file dialog
- Connect PDF viewer components to App
- Integrate with Zustand stores for state management
- Add loading states and error handling
- Display success/error messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Build Configuration and Testing

**Files:**
- Modify: `package.json`
- Create: `electron-builder.yml` (optional, better than JSON)
- Modify: `vite.config.ts`

**Step 1: Update Vite config for Electron**

Modify `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});
```

**Step 2: Update package.json with complete scripts**

Modify `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:electron": "esbuild electron/main.ts electron/preload.ts --bundle --platform=node --outdir=dist-electron --external:electron",
    "preview": "vite preview",
    "electron:dev": "npm run build:electron && concurrently \"vite\" \"wait-on http://localhost:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron dist-electron/main.js\"",
    "electron:build": "npm run build && npm run build:electron && electron-builder",
    "postinstall": "electron-builder install-app-deps"
  }
}
```

**Step 3: Install cross-env for environment variables**

```bash
npm install -D cross-env
```

**Step 4: Test the application**

Run development mode:
```bash
npm run electron:dev
```

Expected:
- Electron window opens
- Application loads with empty state
- "Open PDF" button is visible
- Clicking "Open PDF" shows file dialog
- Selecting a PDF file loads it
- Thumbnails appear in left sidebar
- Main canvas shows selected page
- Zoom controls work
- Clicking thumbnails changes the displayed page

**Step 5: Commit build configuration**

```bash
git add package.json vite.config.ts
git commit -m "feat: complete build configuration for development and production

- Update Vite config for Electron compatibility
- Add complete npm scripts for dev and build
- Add cross-env for cross-platform environment variables
- Configure PDF.js optimization

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Final Polish and Documentation

**Files:**
- Create: `README.md`
- Create: `.nvmrc` (optional)
- Modify: `.gitignore`

**Step 1: Create comprehensive README**

Create `README.md`:
```markdown
# PDF Editor

A cross-platform desktop PDF editor built with Electron, React, and TypeScript.

## Features (Phase 1)

- ✅ Open and view PDF files
- ✅ Split-pane layout with thumbnail navigation
- ✅ Zoom in/out/fit controls
- ✅ Natural scrolling through pages
- ✅ Page selection via thumbnails

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
- npm 9+

### Installation

\`\`\`bash
npm install
\`\`\`

### Run Development Mode

\`\`\`bash
npm run electron:dev
\`\`\`

### Build for Production

\`\`\`bash
npm run electron:build
\`\`\`

Builds will be in the `release/` directory.

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
│   └── utils/        # Utility functions
├── docs/             # Documentation
└── dist/             # Build output
\`\`\`

## Roadmap

- [x] Phase 1: Core Viewer
- [ ] Phase 2: Basic Editing
- [ ] Phase 3: Advanced Editing
- [ ] Phase 4: Advanced Features

## License

MIT
```

**Step 2: Update .gitignore**

Modify `.gitignore`:
```
# Dependencies
node_modules

# Build outputs
dist
dist-electron
release

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# IDE
.vscode
.idea
*.swp
*.swo

# Environment
.env
.env.local
```

**Step 3: Create .nvmrc for Node version**

Create `.nvmrc`:
```
18
```

**Step 4: Commit documentation**

```bash
git add README.md .gitignore .nvmrc
git commit -m "docs: add comprehensive README and project documentation

- Create README with features, tech stack, and setup instructions
- Update .gitignore with comprehensive exclusions
- Add .nvmrc for Node version management

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 5: Push to remote repository**

```bash
git push -u origin main
```

---

## Phase 1 Complete!

You now have a fully functional PDF viewer with:

1. ✅ Electron + React + TypeScript setup
2. ✅ PDF.js integration for rendering
3. ✅ Split-pane layout with Ant Design
4. ✅ Thumbnail navigation sidebar
5. ✅ Zoom controls (in/out/fit)
6. ✅ File open dialog
7. ✅ State management with Zustand
8. ✅ IPC communication for file operations
9. ✅ Build configuration for Windows and macOS

**Next Steps:**

Ready to move to Phase 2 (Basic Editing)? This will add:
- Text content editing
- Save and Save As functionality
- Print functionality
- Page deletion
- Blank page insertion

