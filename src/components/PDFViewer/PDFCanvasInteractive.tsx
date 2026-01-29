import React, { useEffect, useRef, useState } from 'react';
import { Spin, message } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';
import { TextLayer } from './TextLayer';
import { ObjectLayer } from './ObjectLayer';
import { useTextSelection } from '@/hooks/useTextSelection';

interface PDFCanvasProps {
  pdfDocument: any;
  pageNumber: number;
  onEraseRegion?: (x: number, y: number, width: number, height: number) => Promise<void>;
  onHighlightRegion?: (x: number, y: number, width: number, height: number) => Promise<void>;
  onInsertImageAtPosition?: (pageIndex: number, x: number, y: number) => void;
  onInsertTextAtPosition?: (pageIndex: number, x: number, y: number) => void;
  editingText?: {
    pageIndex: number;
    position: { x: number; y: number };
    content: string;
  } | null;
  onEditingTextChange?: (editing: {
    pageIndex: number;
    position: { x: number; y: number };
    content: string;
  } | null) => void;
  onFinishEditingText?: () => void;
  onCancelEditingText?: () => void;
  onObjectMoveComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }) => void;
  onObjectResizeComplete?: (id: string, oldPos: { x: number; y: number }, newPos: { x: number; y: number }, oldSize: { width: number; height: number }, newSize: { width: number; height: number }) => void;
  onObjectRotateComplete?: (id: string, oldRotation: number, newRotation: number) => void;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pdfDocument,
  pageNumber,
  onEraseRegion,
  onHighlightRegion,
  onInsertImageAtPosition,
  onInsertTextAtPosition,
  editingText,
  onEditingTextChange,
  onFinishEditingText,
  onCancelEditingText,
  onObjectMoveComplete,
  onObjectResizeComplete,
  onObjectRotateComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(true);
  const { zoom, toolMode } = useUIStore();

  // 启用文本选择复制
  useTextSelection();

  // Auto-focus textarea when it appears
  useEffect(() => {
    if (editingText && editingText.pageIndex === pageNumber - 1 && textareaRef.current) {
      console.log('Auto-focusing textarea');
      textareaRef.current.focus();
    }
  }, [editingText, pageNumber]);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

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

        // 更新 canvas 尺寸
        if (canvasRef.current) {
          setCanvasSize({
            width: canvasRef.current.width,
            height: canvasRef.current.height,
          });
        }

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

  // 当拖拽状态改变时，绘制选择框
  useEffect(() => {
    if (!overlayCanvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // 清空覆盖层
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (!isDragging && !dragStart.x && !dragStart.y) {
      return;
    }

    // 计算矩形
    const x = Math.min(dragStart.x, dragEnd.x);
    const y = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);

    // 绘制选择矩形
    ctx.strokeStyle = toolMode === 'erase' ? '#ff4d4f' : '#ffec3d';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);

    // 绘制半透明填充
    ctx.fillStyle = toolMode === 'erase' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 236, 61, 0.2)';
    ctx.fillRect(x, y, width, height);
  }, [isDragging, dragStart, dragEnd, toolMode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    // Handle insertion modes
    if (toolMode === 'insert-image') {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      onInsertImageAtPosition?.(pageNumber - 1, x, y);
      return;
    }

    if (toolMode === 'insert-text') {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      onInsertTextAtPosition?.(pageNumber - 1, x, y);
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
    if (toolMode === 'insert-image') return 'cell';
    if (toolMode === 'insert-text') return 'text';
    return 'default';
  };

  const handleTextCopy = (text: string) => {
    console.log('Text copied:', text);
    // 可以添加到剪贴板历史等功能
  };

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

      {/* 内联文本编辑器 */}
      {!loading && editingText && editingText.pageIndex === pageNumber - 1 && (
        <textarea
          ref={textareaRef}
          autoFocus
          value={editingText.content}
          onChange={(e) => onEditingTextChange?.({
            ...editingText,
            content: e.target.value,
          })}
          onBlur={() => {
            // Add delay to prevent immediate blur on render
            setTimeout(() => {
              onFinishEditingText();
            }, 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancelEditingText?.();
            } else if (e.key === 'Enter' && !e.shiftKey) {
              // Don't prevent default during IME composition (e.g., Chinese input)
              if (!e.nativeEvent.isComposing) {
                e.preventDefault();
                onFinishEditingText?.();
              }
            }
          }}
          onCompositionEnd={(e) => {
            // Update content after IME composition ends
            onEditingTextChange?.({
              ...editingText,
              content: e.currentTarget.value,
            });
          }}
          style={{
            position: 'absolute',
            left: editingText.position.x * zoom,
            top: editingText.position.y * zoom,
            width: 300,
            height: 100,
            fontSize: 16,
            fontFamily: 'sans-serif',
            color: '#000000',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #52c41a',
            borderRadius: 4,
            padding: 8,
            resize: 'both',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          placeholder="输入文本内容... (按 Enter 确认，ESC 取消)"
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
              toolMode === 'insert-image' ? '#1890ff' :
              toolMode === 'insert-text' ? '#52c41a' : '#999',
            color:
              toolMode === 'erase' || toolMode === 'insert-image' ? '#fff' : '#000',
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
           toolMode === 'insert-image' ? '插入图片模式 - 点击PDF位置插入' :
           toolMode === 'insert-text' ? '插入文本模式 - 点击PDF位置插入' : ''}
        </div>
      )}
    </div>
  );
};
