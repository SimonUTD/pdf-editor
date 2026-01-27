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
│   ├── services/     # Business logic
│   ├── stores/       # Zustand stores
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Utility functions
├── docs/             # Documentation
└── dist/             # Build output
```

## Roadmap

- [x] Phase 1: Core Viewer
- [x] Phase 2: Basic Editing
- [ ] Phase 3: Advanced Editing
- [ ] Phase 4: Advanced Features

## License

MIT
