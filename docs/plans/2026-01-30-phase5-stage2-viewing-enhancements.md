# Phase 5 Stage 2: Viewing Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three viewing enhancement features: view mode switching (1:1, fit page, fit width, two-page), quick page jump, and in-PDF text search.

**Architecture:** Extend existing viewer with view modes, add navigation controls to toolbar, implement text search with PDF.js text layer integration.

**Tech Stack:** TypeScript, React, PDF.js, Ant Design, Zustand

---

## Task 1: Implement View Mode Switching UI

**Files:**
- Create: `src/components/Layout/ViewModeSelector.tsx`
- Modify: `src/components/Layout/Toolbar.tsx`

**Step 1: Write ViewModeSelector component**

Create: `src/components/Layout/ViewModeSelector.tsx`

```typescript
import React from 'react';
import { Select } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useUIStore, ViewMode } from '@/stores';
import { ViewModeService } from '@/services/viewer';

const { Option } = Select;

export const ViewModeSelector: React.FC = () => {
  const { viewMode, setViewMode, zoom } = useUIStore();

  const handleChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Zoom will be calculated by PDFCanvasInteractive
  };

  return (
    <Select
      value={viewMode}
      onChange={handleChange}
      style={{ width: 120 }}
      placeholder="查看模式"
    >
      <Option value="actual">
        <EyeOutlined /> 1:1
      </Option>
      <Option value="fit-page">
        <EyeOutlined /> 完整页面
      </Option>
      <Option value="fit-width">
        <EyeOutlined /> 宽度100%
      </Option>
      <Option value="two-page">
        <EyeOutlined /> 双页并排
      </Option>
    </Select>
  );
};
```

**Step 2: Add ViewModeSelector to Toolbar**

Modify: `src/components/Layout/Toolbar.tsx`

Add import:

```typescript
import { ViewModeSelector } from './ViewModeSelector';
```

Add to toolbar (in the controls section):

```typescript
<Col flex="0 0 auto">
  <ViewModeSelector />
</Col>
```

**Step 3: Commit**

```bash
git add src/components/Layout/ViewModeSelector.tsx src/components/Layout/Toolbar.tsx
git commit -m "feat: add ViewModeSelector component to toolbar"
```

---

## Task 2: Implement View Mode Calculation in PDFCanvasInteractive

**Files:**
- Modify: `src/components/PDFViewer/PDFCanvasInteractive.tsx`

**Step 1: Add view mode effect**

Modify: `src/components/PDFViewer/PDFCanvasInteractive.tsx`

Read the file to understand current structure, then add after the existing zoom effect:

```typescript
// Calculate zoom based on view mode
useEffect(() => {
  if (!containerRef.current || !pdfDocument) return;

  const updateZoomForViewMode = async () => {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0, rotation });

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const newZoom = ViewModeService.calculateZoom(
      viewMode,
      viewport.width,
      viewport.height,
      containerWidth,
      containerHeight
    );

    setZoom(newZoom);
  };

  updateZoomForViewMode();
}, [viewMode, pdfDocument, pageNumber, rotation]);
```

**Step 2: Add viewMode to imports**

Add to imports:

```typescript
import { ViewModeService } from '@/services/viewer';
```

**Step 3: Commit**

```bash
git add src/components/PDFViewer/PDFCanvasInteractive.tsx
git commit -m "feat: calculate zoom based on view mode in PDFCanvasInteractive"
```

---

## Task 3: Implement Two-Page View Mode

**Files:**
- Create: `src/components/PDFViewer/TwoPageView.tsx`
- Modify: `src/components/PDFViewer/PDFCanvasInteractive.tsx`

**Step 1: Create TwoPageView component**

Create: `src/components/PDFViewer/TwoPageView.tsx`

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';

interface TwoPageViewProps {
  pdfDocument: any;
  leftPageNumber: number;
  rightPageNumber: number;
}

export const TwoPageView: React.FC<TwoPageViewProps> = ({
  pdfDocument,
  leftPageNumber,
  rightPageNumber,
}) => {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const { zoom, pageRotations } = useUIStore();

  useEffect(() => {
    if (!pdfDocument) return;

    let cancelled = false;
    setLoading(true);

    const renderPages = async () => {
      try {
        if (leftCanvasRef.current && leftPageNumber > 0) {
          const leftPage = await pdfDocument.getPage(leftPageNumber);
          await PDFRenderer.renderPageToCanvas(leftPage, leftCanvasRef.current!, {
            scale: zoom,
            rotation: pageRotations[leftPageNumber - 1] || 0,
          });
        }

        if (rightCanvasRef.current && rightPageNumber > 0) {
          const rightPage = await pdfDocument.getPage(rightPageNumber);
          await PDFRenderer.renderPageToCanvas(rightPage, rightCanvasRef.current!, {
            scale: zoom,
            rotation: pageRotations[rightPageNumber - 1] || 0,
          });
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error rendering two-page view:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, leftPageNumber, rightPageNumber, zoom, pageRotations]);

  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
      {loading && <Spin size="large" />}

      {leftPageNumber > 0 && leftCanvasRef.current && (
        <canvas
          ref={leftCanvasRef}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: loading ? 'none' : 'block' }}
        />
      )}

      {rightPageNumber > 0 && rightCanvasRef.current && (
        <canvas
          ref={rightCanvasRef}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: loading ? 'none' : 'block' }}
        />
      )}
    </div>
  );
};
```

**Step 2: Update PDFCanvasInteractive to conditionally render two-page view**

Modify: `src/components/PDFViewer/PDFCanvasInteractive.tsx`

Add import:

```typescript
import { TwoPageView } from './TwoPageView';
```

Add logic in component body (before return):

```typescript
// Calculate two-page layout
const shouldShowTwoPage = viewMode === 'two-page';
const leftPageNumber = shouldShowTwoPage && pageNumber % 2 === 1 ? pageNumber : pageNumber - 1;
const rightPageNumber = leftPageNumber + 1;
```

Update return statement (wrap canvas in conditional):

```typescript
return (
  <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', cursor: getCursor() }} ...>
    {/* Existing loading spinner */}

    {viewMode === 'two-page' ? (
      <TwoPageView
        pdfDocument={pdfDocument}
        leftPageNumber={leftPageNumber}
        rightPageNumber={rightPageNumber}
      />
    ) : (
      <>
        {/* Existing PDF canvas, text layer, object layer, overlay */}
      </>
    )}
  </div>
);
```

**Step 3: Commit**

```bash
git add src/components/PDFViewer/TwoPageView.tsx src/components/PDFViewer/PDFCanvasInteractive.tsx
git commit -m "feat: implement two-page view mode"
```

---

## Task 4: Implement Quick Page Jump UI

**Files:**
- Create: `src/components/Layout/PageJumpControl.tsx`
- Modify: `src/components/Layout/Toolbar.tsx`

**Step 1: Write PageJumpControl component**

Create: `src/components/Layout/PageJumpControl.tsx`

```typescript
import React, { useState } from 'react';
import { InputNumber, Space, Typography } from 'antd';
import { JumpIcon } from '@ant-design/icons';
import { useUIStore } from '@/stores';
import { NavigationService } from '@/services/viewer';

const { Text } = Typography;

export const PageJumpControl: React.FC = () => {
  const { selectedPageIndex, pdfDocument, selectPage } = useUIStore();
  const [inputValue, setInputValue] = useState<number | null>(null);

  if (!pdfDocument) return null;

  const currentPage = selectedPageIndex + 1;
  const totalPages = pdfDocument.numPages;

  const handleJump = (value: number | null) => {
    if (value === null) return;

    const targetPage = NavigationService.jumpToPage(currentPage, value, totalPages);
    selectPage(targetPage - 1);
    setInputValue(null);
  };

  return (
    <Space align="center">
      <Text>{NavigationService.getPageDisplayText(currentPage, totalPages)}</Text>
      <InputNumber
        size="small"
        min={1}
        max={totalPages}
        value={inputValue}
        onChange={(value) => setInputValue(value)}
        onPressEnter={() => handleJump(inputValue)}
        placeholder="跳转到"
        style={{ width: 80 }}
      />
    </Space>
  );
};
```

**Step 2: Add PageJumpControl to Toolbar**

Modify: `src/components/Layout/Toolbar.tsx`

Add import:

```typescript
import { PageJumpControl } from './PageJumpControl';
```

Add to toolbar:

```typescript
<Col flex="0 0 auto">
  <PageJumpControl />
</Col>
```

**Step 3: Commit**

```bash
git add src/components/Layout/PageJumpControl.tsx src/components/Layout/Toolbar.tsx
git commit -m "feat: add page jump control to toolbar"
```

---

## Task 5: Implement PDFSearchService

**Files:**
- Modify: `src/services/pdf/PDFSearchService.ts`

**Step 1: Implement PDFSearchService**

Modify: `src/services/pdf/PDFSearchService.ts`

```typescript
import * as pdfjsLib from 'pdfjs-dist';

export interface SearchResult {
  pageIndex: number;
  pageNumber: number;
  items: Array<{
    text: string;
    transform: number[];
    bbox: number[];  // [x0, y0, x1, y1]
  }>;
}

export class PDFSearchService {
  private static searchCache: Map<string, SearchResult[]> = new Map();

  /**
   * Clear search cache (call when PDF changes)
   */
  static clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Search for text in all pages
   */
  static async searchPDF(
    pdfDocument: any,
    searchText: string
  ): Promise<SearchResult[]> {
    if (!searchText.trim()) {
      return [];
    }

    const cacheKey = `${pdfDocument.fingerprints[0]}_${searchText}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const results: SearchResult[] = [];
    const totalPages = pdfDocument.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageResults: SearchResult['items'] = [];

      textContent.items.forEach((item: any) => {
        const str = item.str.toLowerCase();
        const searchLower = searchText.toLowerCase();

        if (str.includes(searchLower)) {
          pageResults.push({
            text: item.str,
            transform: item.transform,
            bbox: [
              item.transform[4],
              item.transform[5] - item.transform[0],
              item.transform[4] + item.transform[0] * item.str.length * 0.6, // Approximate width
              item.transform[5],
            ],
          });
        }
      });

      if (pageResults.length > 0) {
        results.push({
          pageIndex: i - 1,
          pageNumber: i,
          items: pageResults,
        });
      }
    }

    this.searchCache.set(cacheKey, results);
    return results;
  }

  /**
   * Get total match count
   */
  static getTotalMatchCount(results: SearchResult[]): number {
    return results.reduce((sum, result) => sum + result.items.length, 0);
  }
}
```

**Step 2: Commit**

```bash
git add src/services/pdf/PDFSearchService.ts
git commit -m "feat: implement PDFSearchService with caching"
```

---

## Task 6: Implement Text Search UI

**Files:**
- Create: `src/components/Tools/SearchPanel.tsx`
- Create: `src/components/PDFViewer/SearchHighlightLayer.tsx`
- Modify: `src/stores/uiStore.ts`

**Step 1: Add search state to uiStore**

Modify: `src/stores/uiStore.ts`

Add to interface:

```typescript
searchQuery: string;
searchResults: any[];
currentMatchIndex: number;
setSearchQuery: (query: string) => void;
setCurrentMatchIndex: (index: number) => void;
```

Add to initial state:

```typescript
searchQuery: '',
searchResults: [],
currentMatchIndex: 0,
```

Add to methods:

```typescript
setSearchQuery: (query) => set({ searchQuery: query }),
setCurrentMatchIndex: (index) => set({ currentMatchIndex: index }),
```

**Step 2: Write SearchPanel component**

Create: `src/components/Tools/SearchPanel.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Input, Button, Space, Typography, Badge } from 'antd';
import { SearchOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useUIStore } from '@/stores';
import { PDFSearchService, SearchResult } from '@/services/pdf/PDFSearchService';
import { message } from 'antd';

const { Text } = Typography;

export const SearchPanel: React.FC = () => {
  const {
    pdfDocument,
    searchQuery,
    searchResults,
    currentMatchIndex,
    setSearchQuery,
    setCurrentMatchIndex,
    selectPage,
  } = useUIStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!pdfDocument || !searchQuery.trim()) {
        setSearchQuery('');
        return;
      }

      setLoading(true);
      try {
        const results = await PDFSearchService.searchPDF(pdfDocument, searchQuery);
        // Store results in global state (need to add to uiStore)
        setCurrentMatchIndex(0);

        if (results.length > 0) {
          message.success(`找到 ${PDFSearchService.getTotalMatchCount(results)} 个匹配项`);
        } else {
          message.info('未找到匹配项');
        }
      } catch (error) {
        console.error('Search failed:', error);
        message.error('搜索失败');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, pdfDocument]);

  const totalMatches = searchResults.reduce((sum: number, r: SearchResult) => sum + r.items.length, 0);

  const goToNextMatch = () => {
    if (totalMatches === 0) return;

    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);

    // Navigate to the page containing this match
    let count = 0;
    for (const result of searchResults) {
      if (count + result.items.length > nextIndex) {
        selectPage(result.pageIndex);
        break;
      }
      count += result.items.length;
    }
  };

  const goToPrevMatch = () => {
    if (totalMatches === 0) return;

    const prevIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prevIndex);

    // Navigate to the page containing this match
    let count = 0;
    for (const result of searchResults) {
      if (count + result.items.length > prevIndex) {
        selectPage(result.pageIndex);
        break;
      }
      count += result.items.length;
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="搜索文本..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          loading={loading}
          allowClear
        />

        {totalMatches > 0 && (
          <>
            <Space>
              <Text>
                {currentMatchIndex + 1} / {totalMatches}
              </Text>
              <Button
                size="small"
                icon={<UpOutlined />}
                onClick={goToPrevMatch}
              >
                上一个
              </Button>
              <Button
                size="small"
                icon={<DownOutlined />}
                onClick={goToNextMatch}
              >
                下一个
              </Button>
            </Space>
          </>
        )}
      </Space>
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add src/components/Tools/SearchPanel.tsx src/stores/uiStore.ts
git commit -m "feat: implement search panel with navigation"
```

---

## Task 7: Add Search Highlight Layer

**Files:**
- Modify: `src/components/PDFViewer/PDFCanvasInteractive.tsx`

**Step 1: Add highlight rendering for search results**

Modify: `src/components/PDFViewer/PDFCanvasInteractive.tsx`

Add effect after the existing drag selection effect:

```typescript
// Render search highlights
useEffect(() => {
  if (!overlayCanvasRef.current || !pdfDocument) return;

  const overlayCanvas = overlayCanvasRef.current;
  const ctx = overlayCanvas.getContext('2d');
  if (!ctx) return;

  // Clear previous highlights
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Get search results for current page
  const pageResults = searchResults.find((r: SearchResult) => r.pageIndex === pageNumber - 1);
  if (!pageResults) return;

  // Draw highlights
  pageResults.items.forEach((item: SearchResult['items'][0], index: number) => {
    const globalIndex = searchResults
      .slice(0, searchResults.indexOf(pageResults))
      .reduce((sum: number, r: SearchResult) => sum + r.items.length, 0) + index;

    const isCurrentMatch = globalIndex === currentMatchIndex;

    ctx.fillStyle = isCurrentMatch ? 'rgba(255, 200, 0, 0.5)' : 'rgba(255, 255, 0, 0.3)';
    ctx.fillRect(
      item.bbox[0] * zoom,
      item.bbox[1] * zoom,
      (item.bbox[2] - item.bbox[0]) * zoom,
      (item.bbox[3] - item.bbox[1]) * zoom
    );
  });
}, [searchResults, currentMatchIndex, zoom, pageNumber]);
```

**Step 2: Commit**

```bash
git add src/components/PDFViewer/PDFCanvasInteractive.tsx
git commit -m "feat: add search highlight rendering to canvas"
```

---

## Task 8: Test and Refine Viewing Enhancements

**Files:**
- None

**Step 1: Run TypeScript compiler**

```bash
pnpm run build
```

Expected: Build succeeds

**Step 2: Test viewing modes**

Test scenarios:
- Switch between all four view modes
- Verify zoom calculation is correct
- Test two-page view with odd/even page numbers

**Step 3: Test page jump**

Test scenarios:
- Jump to valid page number
- Jump to out-of-range number (should clamp)
- Verify display updates correctly

**Step 4: Test text search**

Test scenarios:
- Search for existing text
- Search for non-existing text
- Navigate between matches
- Verify highlights appear correctly

**Step 5: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: resolve issues found during testing of viewing enhancements"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `README.md`

**Step 1: Update Phase 5 section in README**

Change viewing features from 🚧 to ✅:

```markdown
### Phase 5: Complete Feature Enhancement 🚧 (In Development)
- ✅ View modes (1:1, fit page, fit width, two-page)
- ✅ Quick page navigation
- ✅ Text search in PDF
- 🚧 PDF converter (to TXT, Word, Images)
- 🚧 Images to PDF converter
- 🚧 Extract images from PDF
- ... (rest remain 🚧)
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update Phase 5 progress - viewing enhancements complete"
```

---

## Summary

Stage 2 implements all three viewing enhancements:
- ✅ Four view modes with automatic zoom calculation
- ✅ Quick page jump with input validation
- ✅ Full-text search with highlighting and navigation
- ✅ Caching for improved search performance

**Estimated time:** 6-8 hours

**Next:** Stage 3 - Implement conversion tools (PDF formats, images to PDF, extract images)
