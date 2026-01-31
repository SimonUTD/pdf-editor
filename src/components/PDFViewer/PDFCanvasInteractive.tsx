import React, { useEffect, useRef, useState } from 'react';
import { Spin, message } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';
import { TextLayer } from './TextLayer';
import { ObjectLayer } from './ObjectLayer';
import { useTextSelection } from '@/hooks/useTextSelection';
import { ViewModeService } from '@/services/viewer/ViewModeService';
import { TwoPageView } from './TwoPageView';

interface PDFCanvasProps {
  pdfDocument: any;
  pageNumber: number;
  rotation?: number; // 页面旋转角度 (0, 90, 180, 270)
  onEraseRegion?: (x: number, y: number, width: number, height: number) => Promise<void>;
  onHighlightRegion?: (x: number, y: number, width: number, height: number) => Promise<void>;
  onRedactRegion?: (x: number, y: number, width: number, height: number) => Promise<void>;
  onInsertImageAtPosition?: (pageIndex: number, x: number, y: number) => void;
  onInsertTextAtPosition?: (pageIndex: number, x: number, y: number) => void;
  onInsertSignatureAtPosition?: (pageIndex: number, x: number, y: number) => void;
  onObjectMoveComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }) => void;
  onObjectResizeComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }, oldSize: { width: number; height: number }, newSize: { width: number; height: number }) => void;
  onObjectRotateComplete?: (id: string, oldRotation: number, newRotation: number) => void;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pdfDocument,
  pageNumber,
  rotation = 0,
  onEraseRegion,
  onHighlightRegion,
  onRedactRegion,
  onInsertImageAtPosition,
  onInsertTextAtPosition,
  onInsertSignatureAtPosition,
  onObjectMoveComplete,
  onObjectResizeComplete,
  onObjectRotateComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const { zoom, toolMode, viewMode, searchResults, currentMatchIndex, redactionMarks } = useUIStore();

  // 启用文本选择复制
  useTextSelection();

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: any = null;
    setLoading(true);

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        // Clear canvas before rendering to avoid conflicts
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const viewport = page.getViewport({ scale: zoom, rotation });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);

        try {
          await renderTask.promise;

          if (!cancelled) {
            // 更新 canvas 尺寸
            setCanvasSize({
              width: canvas.width,
              height: canvas.height,
            });
            setLoading(false);
          }
        } catch (renderError: any) {
          if (renderError.name === 'RenderingCancelledException') {
            console.log('Rendering cancelled');
          } else {
            throw renderError;
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error rendering page:', error);
          setLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocument, pageNumber, zoom, rotation]);

  // Calculate zoom based on view mode
  // 只在viewMode或pageNumber或rotation变化时计算，避免zoom变化导致的循环
  // 注意：two-page 模式和 actual 模式不自动调整 zoom，保持用户当前缩放比例
  useEffect(() => {
    if (!containerRef.current || !pdfDocument) return;

    const { zoom: currentZoom } = useUIStore.getState();

    // two-page 模式和 actual 模式不自动调整 zoom
    if (viewMode === 'two-page' || viewMode === 'actual') {
      console.log('[PDFCanvasInteractive] Skipping auto-zoom for viewMode:', viewMode, 'current zoom:', currentZoom);
      return;
    }

    console.log('[PDFCanvasInteractive] Calculating zoom for viewMode:', viewMode, 'current zoom:', currentZoom);

    const updateZoomForViewMode = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.0, rotation });

        const container = containerRef.current!;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const newZoom = ViewModeService.calculateZoom(
          viewMode,
          viewport.width,
          viewport.height,
          containerWidth,
          containerHeight
        );

        console.log('[PDFCanvasInteractive] Calculated newZoom:', newZoom, 'current zoom:', currentZoom);

        const { setZoom } = useUIStore.getState();
        if (Math.abs(currentZoom - newZoom) > 0.01) {
          console.log('[PDFCanvasInteractive] Setting zoom from', currentZoom, 'to', newZoom);
          setZoom(newZoom);
        }
      } catch (error) {
        console.error('Error calculating zoom:', error);
      }
    };

    updateZoomForViewMode();
  }, [viewMode, pdfDocument, pageNumber, rotation]); // 移除zoom依赖

  // 当拖拽状态改变时，绘制选择框和密文标记
  useEffect(() => {
    if (!overlayCanvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // 清空覆盖层
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // 绘制当前页的密文标记
    const currentPageMarks = redactionMarks.filter(m => m.pageIndex === pageNumber - 1);
    currentPageMarks.forEach(mark => {
      const x = mark.x * zoom;
      const y = mark.y * zoom;
      const w = mark.width * zoom;
      const h = mark.height * zoom;

      // 绘制黑色半透明矩形
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x, y, w, h);

      // 绘制边框
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);
    });

    if (!isDragging && !dragStart.x && !dragStart.y) {
      return;
    }

    // 计算矩形
    const x = Math.min(dragStart.x, dragEnd.x);
    const y = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);

    // 绘制选择矩形
    if (toolMode === 'erase') {
      ctx.strokeStyle = '#ff4d4f';
      ctx.fillStyle = 'rgba(255, 77, 79, 0.1)';
    } else if (toolMode === 'highlight') {
      ctx.strokeStyle = '#ffec3d';
      ctx.fillStyle = 'rgba(255, 236, 61, 0.2)';
    } else if (toolMode === 'redact') {
      ctx.strokeStyle = '#ff0000';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    } else {
      return;
    }

    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.fillRect(x, y, width, height);
  }, [isDragging, dragStart, dragEnd, toolMode, redactionMarks, pageNumber, zoom]);

  // Render search highlights
  useEffect(() => {
    if (!overlayCanvasRef.current || !pdfDocument) return;

    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // Get search results from store
    const { searchResults, currentMatchIndex } = useUIStore.getState();

    // Clear previous highlights
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Get search results for current page
    const pageResults = searchResults.find((r: any) => r.pageIndex === pageNumber - 1);
    if (!pageResults) return;

    // Draw highlights
    pageResults.items.forEach((item: any, index: number) => {
      const globalIndex = searchResults
        .slice(0, searchResults.indexOf(pageResults))
        .reduce((sum: number, r: any) => sum + r.items.length, 0) + index;

      const isCurrentMatch = globalIndex === currentMatchIndex;

      ctx.fillStyle = isCurrentMatch ? 'rgba(255, 200, 0, 0.5)' : 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(
        item.bbox[0] * zoom,
        item.bbox[1] * zoom,
        (item.bbox[2] - item.bbox[0]) * zoom,
        (item.bbox[3] - item.bbox[1]) * zoom
      );
    });
  }, [searchResults, currentMatchIndex, zoom, pageNumber, pdfDocument]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    // Handle insertion modes
    if (toolMode === 'insert-image') {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      onInsertImageAtPosition?.(pageNumber - 1, x, y);
      e.stopPropagation();
      return;
    }

    if (toolMode === 'insert-text') {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      onInsertTextAtPosition?.(pageNumber - 1, x, y);
      e.stopPropagation();
      return;
    }

    if (toolMode === 'insert-signature') {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      onInsertSignatureAtPosition?.(pageNumber - 1, x, y);
      e.stopPropagation();
      return;
    }

    // Handle drawing modes
    if (toolMode === 'view') return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setDragEnd({ x, y });
  };

  const handleMouseUp = async () => {
    if (!isDragging) return;

    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);

    // 如果拖拽区域太小（小于5px），视为误操作
    if (width < 5 || height < 5) {
      setIsDragging(false);
      setDragStart({ x: 0, y: 0 });
      setDragEnd({ x: 0, y: 0 });
      return;
    }

    // 计算相对于 PDF 页面的坐标（考虑缩放）
    const x = Math.min(dragStart.x, dragEnd.x) / zoom;
    const y = Math.min(dragStart.y, dragEnd.y) / zoom;
    const scaledWidth = width / zoom;
    const scaledHeight = height / zoom;

    // 执行相应的操作
    try {
      if (toolMode === 'erase' && onEraseRegion) {
        await onEraseRegion(x, y, scaledWidth, scaledHeight);
        message.success('擦除成功');
      } else if (toolMode === 'highlight' && onHighlightRegion) {
        await onHighlightRegion(x, y, scaledWidth, scaledHeight);
        message.success('高亮添加成功');
      } else if (toolMode === 'redact' && onRedactRegion) {
        await onRedactRegion(x, y, scaledWidth, scaledHeight);
        message.success('密文标记已添加');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }

    // 重置状态
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragEnd({ x: 0, y: 0 });
  };

  // 获取鼠标样式
  const getCursor = () => {
    if (toolMode === 'view') return 'default';
    if (toolMode === 'erase') return 'crosshair';
    if (toolMode === 'highlight') return 'crosshair';
    if (toolMode === 'redact') return 'crosshair';
    if (toolMode === 'insert-image') return 'cell';
    if (toolMode === 'insert-text') return 'text';
    return 'default';
  };

  const handleTextCopy = (text: string) => {
    console.log('Text copied:', text);
    // 可以添加到剪贴板历史等功能
  };

  // Calculate two-page layout
  const shouldShowTwoPage = viewMode === 'two-page';
  const leftPageNumber = shouldShowTwoPage && pageNumber % 2 === 1 ? pageNumber : pageNumber - 1;
  const rightPageNumber = leftPageNumber + 1;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: getCursor(),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <Spin size="large" />
        </div>
      )}

      {/* PDF 渲染层 */}
      {viewMode === 'two-page' ? (
        <TwoPageView
          pdfDocument={pdfDocument}
          leftPageNumber={leftPageNumber}
          rightPageNumber={rightPageNumber}
        />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            style={{
              display: loading ? 'none' : 'block',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />

          {/* 文本选择层 */}
          {!loading && toolMode === 'view' && (
            <TextLayer
              pdfDocument={pdfDocument}
              pageNumber={pageNumber}
              scale={zoom}
              rotation={0}
              onTextCopy={handleTextCopy}
            />
          )}
        </>
      )}

      {/* 对象层 - 插入的图片和文本 */}
      {!loading && (
        <ObjectLayer
          pageIndex={pageNumber - 1}
          pdfZoom={zoom}
          onObjectMoveComplete={onObjectMoveComplete}
          onObjectResizeComplete={onObjectResizeComplete}
          onObjectRotateComplete={onObjectRotateComplete}
        />
      )}

      {/* 交互覆盖层 */}
      {!loading && canvasSize.width > 0 && (
        <canvas
          ref={overlayCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none', // 让鼠标事件穿透到容器
          }}
        />
      )}

      {/* 工具提示 */}
      {toolMode !== 'view' && !loading && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor:
              toolMode === 'erase' ? '#ff4d4f' :
              toolMode === 'highlight' ? '#ffec3d' :
              toolMode === 'redact' ? '#ff0000' :
              toolMode === 'insert-image' ? '#1890ff' :
              toolMode === 'insert-text' ? '#52c41a' : '#999',
            color:
              toolMode === 'erase' || toolMode === 'redact' || toolMode === 'insert-image' ? '#fff' : '#000',
            padding: '6px 12px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          {toolMode === 'erase' ? '擦除模式 - 拖拽鼠标画框' :
           toolMode === 'highlight' ? '高亮模式 - 拖拽鼠标画框' :
           toolMode === 'redact' ? '密文模式 - 拖拽鼠标画框' :
           toolMode === 'insert-image' ? '插入图片模式 - 点击PDF位置插入' :
           toolMode === 'insert-text' ? '插入文本模式 - 点击PDF位置插入' : ''}
        </div>
      )}
    </div>
  );
};
