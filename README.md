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

```bash
pnpm install
```

### Run Development Mode

```bash
pnpm run electron:dev
```

### Build for Production

```bash
pnpm run electron:build
```

Builds will be in the `release/` directory.

## Keyboard Shortcuts

- **Ctrl/Cmd+O** - Open PDF file
- **Ctrl/Cmd+S** - Save
- **Ctrl/Cmd+Shift+S** - Save As
- **Ctrl/Cmd+P** - Print

## Project Structure

```
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
```

## Roadmap

- [x] Phase 1: Core Viewer
- [x] Phase 2: Basic Editing
- [x] Phase 3: Advanced Editing
- [ ] Phase 4: Advanced Features (merge, watermarks, headers/footers)

## License

MIT
