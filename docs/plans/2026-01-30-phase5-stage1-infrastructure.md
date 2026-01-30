# Phase 5 Stage 1: Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundation for Phase 5 features - service layer structure, tools panel UI, and command system integration.

**Architecture:** Create a modular service layer for PDF operations, build a unified tools panel UI component, integrate all new tools into the existing undo/redo command system.

**Tech Stack:** TypeScript, React, Zustand, pdf-lib, PDF.js, Ant Design

---

## Task 1: Create Service Layer Directory Structure

**Files:**
- Create: `src/services/pdf/` (directory)
- Create: `src/services/viewer/` (directory)

**Step 1: Create PDF services directory**

```bash
mkdir -p src/services/pdf
```

**Step 2: Create viewer services directory**

```bash
mkdir -p src/services/viewer
```

**Step 3: Add index barrel files**

Create: `src/services/pdf/index.ts`

```typescript
// PDF services barrel file
export * from './PDFSplitService';
export * from './PDFCompressService';
export * from './PDFSignatureService';
export * from './PDFConvertService';
export * from './PDFExtractService';
export * from './PDFSecurityService';
export * from './PDFPageExtractService';
export * from './PDFReorderService';
export * from './PDFPageNumberService';
export * from './PDFOptimizeService';
export * from './PDFRedactService';
export * from './PDFSearchService';
export * from './ImageToPDFService';
```

Create: `src/services/viewer/index.ts`

```typescript
// Viewer services barrel file
export * from './ViewModeService';
export * from './NavigationService';
```

**Step 4: Commit**

```bash
git add src/services/
git commit -m "feat: create service layer directory structure for Phase 5"
```

---

## Task 2: Create ViewModeService

**Files:**
- Create: `src/services/viewer/ViewModeService.ts`
- Modify: `src/stores/uiStore.ts:5-26`

**Step 1: Write ViewModeService**

Create: `src/services/viewer/ViewModeService.ts`

```typescript
export type ViewMode = 'actual' | 'fit-page' | 'fit-width' | 'two-page';

export interface ViewModeConfig {
  mode: ViewMode;
  zoom: number;
}

export class ViewModeService {
  /**
   * Calculate zoom level for given view mode
   */
  static calculateZoom(
    mode: ViewMode,
    pageWidth: number,
    pageHeight: number,
    containerWidth: number,
    containerHeight: number
  ): number {
    switch (mode) {
      case 'actual':
        return 1.0;

      case 'fit-page':
        return Math.min(
          containerWidth / pageWidth,
          containerHeight / pageHeight
        );

      case 'fit-width':
        return containerWidth / pageWidth;

      case 'two-page':
        // Two-page mode: fit two pages side by side
        const twoPageWidth = pageWidth * 2 + 20; // 20px gap
        return Math.min(
          twoPageWidth / containerWidth,
          containerHeight / pageHeight
        );

      default:
        return 1.0;
    }
  }

  /**
   * Check if mode requires special rendering
   */
  static isSpecialMode(mode: ViewMode): boolean {
    return mode === 'two-page';
  }
}
```

**Step 2: Add view mode to UI store**

Modify: `src/stores/uiStore.ts`

Add to interface (after line 10):

```typescript
viewMode: ViewMode;
setViewMode: (mode: ViewMode) => void;
```

Add to initial state (after line 33):

```typescript
viewMode: 'fit-page',
```

Add to store methods (after line 51):

```typescript
setViewMode: (mode) => set({ viewMode: mode }),
```

**Step 3: Commit**

```bash
git add src/services/viewer/ViewModeService.ts src/stores/uiStore.ts
git commit -m "feat: add ViewModeService and view mode state to uiStore"
```

---

## Task 3: Create NavigationService

**Files:**
- Create: `src/services/viewer/NavigationService.ts`

**Step 1: Write NavigationService**

Create: `src/services/viewer/NavigationService.ts`

```typescript
export class NavigationService {
  /**
   * Validate page number
   */
  static validatePageNumber(page: number, totalPages: number): number {
    const validated = Math.max(1, Math.min(page, totalPages));
    return validated;
  }

  /**
   * Calculate target page with bounds checking
   */
  static jumpToPage(currentPage: number, targetPage: number, totalPages: number): number {
    return this.validatePageNumber(targetPage, totalPages);
  }

  /**
   * Get page display text
   */
  static getPageDisplayText(currentPage: number, totalPages: number): string {
    return `${currentPage} / ${totalPages}`;
  }
}
```

**Step 2: Commit**

```bash
git add src/services/viewer/NavigationService.ts
git commit -m "feat: add NavigationService for page jumping"
```

---

## Task 4: Create ToolsPanel Component

**Files:**
- Create: `src/components/Tools/ToolsPanel.tsx`
- Create: `src/components/Tools/index.ts`

**Step 1: Write ToolsPanel component**

Create: `src/components/Tools/ToolsPanel.tsx`

```typescript
import React from 'react';
import { Card, Collapse, Space, Typography } from 'antd';
import {
  FileSearchOutlined,
  ScissorOutlined,
  CompressOutlined,
  SwapOutlined,
  SafetyOutlined,
  ToolOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined,
  KeyOutlined,
  SettingOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Title } = Typography;

interface ToolsPanelProps {
  onToolSelect: (tool: string) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ onToolSelect }) => {
  const tools = [
    {
      category: '查看增强',
      icon: <EyeOutlined />,
      items: [
        { key: 'view-modes', label: '查看模式', icon: <EyeOutlined /> },
        { key: 'quick-jump', label: '快捷跳转', icon: <SearchOutlined /> },
        { key: 'text-search', label: '文本搜索', icon: <FileSearchOutlined /> },
      ],
    },
    {
      category: '转换工具',
      icon: <SwapOutlined />,
      items: [
        { key: 'pdf-convert', label: 'PDF转换器', icon: <SwapOutlined /> },
        { key: 'image-to-pdf', label: '图片转PDF', icon: <FileImageOutlined /> },
        { key: 'extract-images', label: '提取图像', icon: <DownloadOutlined /> },
      ],
    },
    {
      category: '编辑工具',
      icon: <EditOutlined />,
      items: [
        { key: 'pdf-split', label: 'PDF拆分', icon: <ScissorOutlined /> },
        { key: 'extract-pages', label: '页面提取', icon: <DownloadOutlined /> },
        { key: 'reorder-pages', label: '页面重排', icon: <SwapOutlined /> },
        { key: 'page-numbers', label: '添加页码', icon: <ToolOutlined /> },
        { key: 'redact', label: '标记密文', icon: <SafetyOutlined /> },
      ],
    },
    {
      category: '高级功能',
      icon: <SettingOutlined />,
      items: [
        { key: 'compress', label: 'PDF压缩', icon: <CompressOutlined /> },
        { key: 'signature', label: 'PDF签署', icon: <EditOutlined /> },
        { key: 'security', label: '密码保护', icon: <KeyOutlined /> },
        { key: 'optimize', label: 'PDF优化', icon: <SettingOutlined /> },
      ],
    },
  ];

  return (
    <Card title={<Title level={4}>工具箱</Title>}>
      <Collapse accordion>
        {tools.map((category) => (
          <Panel
            header={
              <Space>
                {category.icon}
                <span>{category.category}</span>
              </Space>
            }
            key={category.category}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {category.items.map((item) => (
                <div
                  key={item.key}
                  onClick={() => onToolSelect(item.key)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Space>
                    {item.icon}
                    <span>{item.label}</span>
                  </Space>
                </div>
              ))}
            </Space>
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
};
```

**Step 2: Create barrel file**

Create: `src/components/Tools/index.ts`

```typescript
export * from './ToolsPanel';
```

**Step 3: Commit**

```bash
git add src/components/Tools/
git commit -m "feat: add ToolsPanel component with all Phase 5 tools"
```

---

## Task 5: Integrate ToolsPanel into MainLayout

**Files:**
- Modify: `src/components/Layout/MainLayout.tsx`
- Modify: `src/stores/uiStore.ts`

**Step 1: Add tools panel state to uiStore**

Modify: `src/stores/uiStore.ts`

Add to interface:

```typescript
showToolsPanel: boolean;
toggleToolsPanel: () => void;
```

Add to initial state:

```typescript
showToolsPanel: false,
```

Add to methods:

```typescript
toggleToolsPanel: () => set((state) => ({ showToolsPanel: !state.showToolsPanel })),
```

**Step 2: Update MainLayout to include ToolsPanel**

Read: `src/components/Layout/MainLayout.tsx` to understand current structure

Add import:

```typescript
import { ToolsPanel } from '@/components/Tools';
import { useUIStore } from '@/stores';
```

Add toolbar button (in toolbar section):

```typescript
const { showToolsPanel, toggleToolsPanel } = useUIStore();

// In toolbar buttons:
<Button
  icon={<AppstoreOutlined />}
  onClick={toggleToolsPanel}
  type={showToolsPanel ? 'primary' : 'default'}
>
  工具箱
</Button>
```

Add ToolsPanel drawer (after main content):

```typescript
<Drawer
  title="工具箱"
  placement="right"
  width={320}
  onClose={toggleToolsPanel}
  open={showToolsPanel}
>
  <ToolsPanel onToolSelect={handleToolSelect} />
</Drawer>
```

**Step 3: Add tool selection handler**

Add to MainLayout component:

```typescript
const handleToolSelect = (tool: string) => {
  message.info(`打开工具: ${tool}`);
  // TODO: Open specific tool modal based on tool key
};
```

**Step 4: Commit**

```bash
git add src/components/Layout/MainLayout.tsx src/stores/uiStore.ts
git commit -m "feat: integrate ToolsPanel into MainLayout with drawer"
```

---

## Task 6: Create Placeholder Service Files

**Files:**
- Create: `src/services/pdf/PDFSplitService.ts`
- Create: `src/services/pdf/PDFCompressService.ts`
- Create: `src/services/pdf/PDFSignatureService.ts`
- Create: `src/services/pdf/PDFConvertService.ts`
- Create: `src/services/pdf/PDFExtractService.ts`
- Create: `src/services/pdf/PDFSecurityService.ts`
- Create: `src/services/pdf/PDFPageExtractService.ts`
- Create: `src/services/pdf/PDFReorderService.ts`
- Create: `src/services/pdf/PDFPageNumberService.ts`
- Create: `src/services/pdf/PDFOptimizeService.ts`
- Create: `src/services/pdf/PDFRedactService.ts`
- Create: `src/services/pdf/PDFSearchService.ts`
- Create: `src/services/pdf/ImageToPDFService.ts`

**Step 1: Create placeholder service files**

Create each file with basic structure:

Example for `src/services/pdf/PDFSplitService.ts`:

```typescript
import { PDFDocument } from 'pdf-lib';

export class PDFSplitService {
  /**
   * Split PDF from specified page into two PDFs
   * TODO: Implement in Stage 4
   */
  static async splitPDF(
    doc: PDFDocument,
    splitPage: number
  ): Promise<[PDFDocument, PDFDocument]> {
    throw new Error('PDFSplitService not implemented yet');
  }
}
```

Repeat pattern for all 13 service files with appropriate TODO comments.

**Step 2: Update barrel file**

Update: `src/services/pdf/index.ts`

Remove the export lines that were added in Task 1 (replace with actual exports from created files).

**Step 3: Commit**

```bash
git add src/services/pdf/
git commit -m "feat: create placeholder PDF service files for Phase 5"
```

---

## Task 7: Test TypeScript Compilation

**Files:**
- None

**Step 1: Run TypeScript compiler**

```bash
pnpm run build
```

Expected: Build succeeds without errors

**Step 2: Check for any type errors**

If there are type errors, fix them and re-run build.

**Step 3: Commit if fixes were needed**

```bash
git add -A
git commit -m "fix: resolve TypeScript compilation errors in infrastructure"
```

---

## Task 8: Update README with Phase 5 Preview

**Files:**
- Modify: `README.md`

**Step 1: Add Phase 5 section to README**

Add after Phase 4 section:

```markdown
### Phase 5: Complete Feature Enhancement 🚧 (In Development)
- 🚧 View modes (1:1, fit page, fit width, two-page)
- 🚧 Quick page navigation
- 🚧 Text search in PDF
- 🚧 PDF converter (to TXT, Word, Images)
- 🚧 Images to PDF converter
- 🚧 Extract images from PDF
- 🚧 Split PDF
- 🚧 Extract pages
- 🚧 Reorder pages
- 🚧 Add page numbers
- 🚧 Redact sensitive content
- 🚧 Compress PDF
- 🚧 Add signature
- 🚧 Password protection
- 🚧 Optimize PDF
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Phase 5 features to README"
```

---

## Summary

Stage 1 creates the foundation for all Phase 5 features:
- ✅ Service layer structure
- ✅ ViewModeService and NavigationService
- ✅ ToolsPanel UI component
- ✅ Integration into MainLayout
- ✅ Placeholder service files

**Estimated time:** 3-4 hours

**Next:** Stage 2 - Implement viewing enhancements (view modes, quick jump, text search)
