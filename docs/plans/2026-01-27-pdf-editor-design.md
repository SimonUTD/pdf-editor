# PDF Editor Design Document

**Date:** 2026-01-27
**Project:** Cross-platform PDF Editor
**Target Platforms:** Windows, macOS

## Overview

A comprehensive desktop PDF editor application with 15 core features including viewing, editing, merging, watermarking, and exporting capabilities.

## Technology Stack

### Core Technologies
- **Framework**: Electron + React + TypeScript
- **UI Library**: Ant Design
- **State Management**: Zustand
- **PDF Libraries**:
  - PDF.js (Mozilla) - PDF rendering and text extraction
  - pdf-lib - PDF creation and manipulation
- **Build Tool**: Vite
- **Packaging**: electron-builder

### Rationale
- **Electron + React**: Proven stack for cross-platform desktop apps with complex UIs
- **Ant Design**: Enterprise-grade components with built-in split panes, context menus, and professional desktop UI
- **Zustand**: Lightweight state management, minimal boilerplate, perfect for desktop app complexity
- **PDF.js + pdf-lib**: Pure JavaScript solution, no external dependencies, covers all 15 features

## Architecture

### Three-Layer Architecture

1. **Main Process** (Node.js environment)
   - Window management and lifecycle
   - File system operations (open, save, export)
   - Native OS integrations (print dialogs, file pickers)
   - IPC communication handlers

2. **Renderer Process** (Browser environment)
   - React UI components
   - PDF.js rendering engine
   - User interactions and editing
   - Zustand state management

3. **Preload Script** (Secure Bridge)
   - Secure IPC communication
   - Exposes safe APIs to renderer
   - File operations, print, export functions

## Project Structure

```
pdf-editor/
├── electron/
│   ├── main.ts              # Main process entry
│   ├── preload.ts           # Preload script (IPC bridge)
│   └── ipc/                 # IPC handlers
│       ├── file.ts          # File operations
│       ├── pdf.ts           # PDF operations
│       └── export.ts        # Export operations
├── src/
│   ├── App.tsx              # Root component
│   ├── main.tsx             # React entry point
│   ├── stores/              # Zustand stores
│   │   ├── pdfStore.ts      # PDF state (current doc, pages)
│   │   ├── uiStore.ts       # UI state (zoom, selection)
│   │   └── editStore.ts     # Edit history/undo
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx      # Split pane layout
│   │   │   ├── Sidebar.tsx         # Left thumbnail pane
│   │   │   └── Toolbar.tsx         # Top toolbar
│   │   ├── PDFViewer/
│   │   │   ├── PDFCanvas.tsx       # Main PDF renderer
│   │   │   ├── PageThumbnail.tsx   # Thumbnail component
│   │   │   └── ZoomControls.tsx    # Zoom UI
│   │   └── Editors/
│   │       ├── TextEditor.tsx      # Text editing overlay
│   │       ├── ImageInserter.tsx   # Image insertion
│   │       └── AnnotationTools.tsx # Highlight, erase tools
│   ├── services/
│   │   ├── pdfRenderer.ts   # PDF.js wrapper
│   │   ├── pdfEditor.ts     # pdf-lib wrapper
│   │   └── exportService.ts # Export to Word/TXT/images
│   └── utils/
│       ├── fileHelpers.ts
│       └── pdfHelpers.ts
├── package.json
├── vite.config.ts
├── electron-builder.json    # Build configuration
└── tsconfig.json
```

## State Management

### Zustand Store Architecture

#### pdfStore.ts
```typescript
interface PDFStore {
  // Current document state
  currentPDF: PDFDocument | null;
  filePath: string | null;
  pages: PDFPage[];
  totalPages: number;

  // Actions
  loadPDF: (file: File) => Promise<void>;
  savePDF: () => Promise<void>;
  saveAsPDF: (path: string) => Promise<void>;
  closePDF: () => void;

  // Page operations
  deletePage: (pageIndex: number) => void;
  insertBlankPage: (afterIndex: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  reversePagesOrder: () => void;
  replacePage: (pageIndex: number, pdfFile: File) => void;
}
```

#### uiStore.ts
```typescript
interface UIStore {
  // View state
  zoom: number;
  selectedPageIndex: number;
  scrollPosition: number;
  sidebarWidth: number;

  // UI actions
  setZoom: (zoom: number) => void;
  selectPage: (index: number) => void;
  setScrollPosition: (position: number) => void;
}
```

#### editStore.ts
```typescript
interface EditStore {
  // Edit history for undo/redo
  history: EditAction[];
  currentIndex: number;

  // Editing state
  isEditing: boolean;
  editMode: 'text' | 'image' | 'highlight' | 'erase' | null;
  annotations: Annotation[];

  // Actions
  undo: () => void;
  redo: () => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
}
```

## Data Flow

### Opening PDF
1. User clicks "Open" button
2. Main process shows native file picker
3. File path sent to renderer via IPC
4. `pdfStore.loadPDF()` called
5. PDF.js parses PDF file
6. Pages rendered to canvas elements
7. Thumbnails generated for sidebar

### Editing
1. User makes change (edit text, add image, etc.)
2. `editStore` records action in history
3. `pdfStore` updates document state
4. React components re-render
5. Change visible immediately in UI

### Saving
1. User clicks "Save" or "Save As"
2. `pdfStore.savePDF()` or `saveAsPDF()` called
3. pdf-lib generates modified PDF bytes
4. IPC message to main process with PDF data
5. Main process writes file to disk
6. Success notification shown to user

## Feature Implementation Phases

### Phase 1: Core Viewer (Features 1-2)
**Goal:** Basic PDF viewing with split pane and zoom

**Features:**
1. Open and view PDF files
2. Split pane layout (thumbnails left, content right)
3. Natural scrolling
4. Zoom in/out/fit controls

**Components:**
- `MainLayout`: Ant Design `Layout` with `Sider`
- `Sidebar`: Scrollable thumbnail list
- `PDFCanvas`: Canvas-based PDF rendering
- `ZoomControls`: Zoom UI controls
- `Toolbar`: Basic menu bar

**Technical Implementation:**
- Use PDF.js `pdfjsLib.getDocument()` to load PDF
- Render pages to HTML5 canvas elements
- Implement virtual scrolling for large PDFs
- Store zoom level in `uiStore`

### Phase 2: Basic Editing (Features 3-5)
**Goal:** Text editing and page management

**Features:**
3. Edit text content
4. Save (overwrite) and Save As
5. Print functionality
6. Right-click delete page
7. Right-click insert blank page

**Components:**
- `TextEditor`: Overlay for text editing
- `PageContextMenu`: Right-click menu on thumbnails

**Technical Implementation:**
- Extract text positions with PDF.js `getTextContent()`
- Overlay editable HTML divs for text editing
- Use pdf-lib to update PDF with modified text
- Use pdf-lib `removePage()` and `addPage()` for page operations
- Use Electron print API for printing

### Phase 3: Advanced Editing (Features 6-8)
**Goal:** Content insertion and export capabilities

**Features:**
7. Insert images with free positioning
8. Insert text with free positioning
9. Export to Word (.docx)
10. Export to TXT (plain text)
11. Export pages as images (PNG/JPG)

**Components:**
- `ImageInserter`: Drag-and-drop image placement
- `TextInserter`: Click-to-place text boxes
- `ExportService`: Multi-format export handler

**Technical Implementation:**
- Use pdf-lib `embedPng()`, `embedJpg()`, `drawText()` for insertions
- Export to images: PDF.js renders to canvas, `canvas.toDataURL()` saves as image
- Export to Word: Use `docx` library with extracted text
- Export to TXT: Extract text with PDF.js, write plain text

### Phase 4: Advanced Features (Features 9-15)
**Goal:** Professional PDF manipulation tools

**Features:**
9. PDF merge with drag-to-reorder
10. Remove watermarks
11. Add watermarks
12. Add/edit/remove headers and footers
13. Erase specific content
14. Replace page with another PDF
15. Reverse page order
16. Highlight text and regions

**Components:**
- `PDFMerger`: Multi-file merge dialog
- `WatermarkEditor`: Add/remove watermark UI
- `HeaderFooterEditor`: Header/footer management
- `AnnotationTools`: Highlight and erase tools

**Technical Implementation:**
- Merge: Use pdf-lib `copyPages()` to combine PDFs
- Watermark: Draw text/image with transparency on each page
- Headers/Footers: Draw text at fixed positions using pdf-lib
- Erase: Draw white rectangles or remove content operators
- Replace page: `removePage()` + `copyPages()` from source
- Reverse: Reorder pages array, regenerate PDF
- Highlight: Store as PDF annotations using pdf-lib

## Technical Challenges & Solutions

### 1. Text Editing in PDFs
**Challenge:** PDFs store text as positioned glyphs, not editable text blocks

**Solution:**
- Extract text with positions using PDF.js `getTextContent()`
- Overlay editable HTML elements at exact positions
- Use pdf-lib to redraw text at same positions when saving
- Maintain font information for accurate rendering

### 2. Performance with Large PDFs
**Challenge:** Rendering 100+ page PDFs can be slow and memory-intensive

**Solution:**
- Implement virtual scrolling (only render visible pages + 2-3 buffer)
- Lazy-load thumbnails on demand
- Use web workers for PDF parsing to avoid blocking UI
- Cache rendered pages in memory with LRU eviction

### 3. Watermark Removal
**Challenge:** Watermarks can be embedded in various ways (text, images, vectors)

**Solution:**
- Best-effort approach for common watermark patterns
- Detect repeated text/images on all pages
- Provide manual selection tool for complex watermarks
- May not work for all watermark types (limitation documented)

### 4. Cross-platform File Dialogs
**Challenge:** Native file pickers differ between Windows and macOS

**Solution:**
- Use Electron's `dialog.showOpenDialog()` and `dialog.showSaveDialog()`
- These APIs handle platform differences automatically
- Consistent user experience across platforms

### 5. Undo/Redo for Complex Operations
**Challenge:** Some operations (merge, reverse pages) are complex to undo

**Solution:**
- Store operation history with sufficient data to reverse each action
- Implement command pattern for all edit operations
- Limit history to last 50 operations to manage memory
- Provide "Revert to Saved" option for major mistakes

## Build and Distribution

### Packaging Strategy
- Use `electron-builder` for creating installers
- **Windows**: `.exe` installer with NSIS
- **macOS**: `.dmg` with code signing (requires Apple Developer account)

### Bundle Size
- Expected size: ~150-200MB
- Includes: Electron runtime, Chromium, PDF.js, all dependencies

### Distribution
- Direct download from website
- Future: Auto-update support with `electron-updater`
- Code signing required for macOS distribution (avoid Gatekeeper warnings)

### Build Configuration
```json
{
  "appId": "com.yourcompany.pdfeditor",
  "productName": "PDF Editor",
  "directories": {
    "output": "dist"
  },
  "files": [
    "dist-electron/**/*",
    "dist/**/*"
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

## Development Workflow

### Phase 1 Development
1. Set up Electron + React + Vite project
2. Configure TypeScript and build tools
3. Implement basic window and file opening
4. Integrate PDF.js for rendering
5. Build split pane layout with Ant Design
6. Implement zoom and scroll controls
7. Test with various PDF files

### Phase 2 Development
1. Integrate pdf-lib for PDF manipulation
2. Implement text extraction and editing overlay
3. Build save and save-as functionality
4. Add page deletion and insertion
5. Implement print functionality
6. Test editing workflow end-to-end

### Phase 3 Development
1. Implement image and text insertion
2. Build export service for images
3. Integrate `docx` library for Word export
4. Implement TXT export
5. Test all export formats

### Phase 4 Development
1. Build PDF merge dialog with drag-drop
2. Implement watermark add/remove
3. Build header/footer editor
4. Implement erase and highlight tools
5. Add page replacement and reversal
6. Comprehensive testing of all 15 features

## Testing Strategy

### Unit Tests
- Test Zustand stores in isolation
- Test PDF service functions
- Test utility functions

### Integration Tests
- Test IPC communication between main and renderer
- Test PDF loading and saving workflow
- Test export functionality

### Manual Testing
- Test on Windows and macOS
- Test with various PDF types (text-heavy, image-heavy, forms)
- Test with large PDFs (100+ pages)
- Test all 15 features end-to-end

## Future Enhancements

Potential features for future versions:
- OCR support for scanned PDFs
- Form filling and editing
- Digital signatures
- Cloud storage integration
- Collaborative editing
- Mobile companion app
- Plugin system for extensions

## Conclusion

This design provides a comprehensive roadmap for building a professional cross-platform PDF editor with all 15 requested features. The phased approach ensures steady progress with working software at each milestone, while the technology choices (Electron + React + PDF.js + pdf-lib) provide a solid foundation for all required functionality.
