import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Typography, Card, message, Modal, Checkbox } from 'antd';
import { SwapOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text, Title } = Typography;

interface PageReorderProps {
  visible: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  pdfBytes: Uint8Array | null;
}

interface PageItem {
  id: string;
  originalIndex: number; // 0-based, original page index
  currentPageNumber: number; // 1-based, current display number
  thumbnail: string | null;
  selected: boolean;
}

export const PageReorder: React.FC<PageReorderProps> = ({
  visible,
  onClose,
  pdfDocument,
  pdfBytes,
}) => {
  const [pageItems, setPageItems] = useState<PageItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Generate thumbnails when modal opens
  useEffect(() => {
    if (visible && pdfDocument) {
      generateThumbnails();
    } else {
      // Cleanup when modal closes
      thumbnails.forEach(url => URL.revokeObjectURL(url));
      setThumbnails(new Map());
      setPageItems([]);
      setSelectedIds(new Set());
      setLastSelectedId(null);
    }
  }, [visible, pdfDocument]);

  const generateThumbnails = async () => {
    if (!pdfDocument) return;

    setGeneratingThumbnails(true);
    const thumbnailMap = new Map<number, string>();

    try {
      const totalPages = pdfDocument.numPages;

      // Initialize page items
      const items: PageItem[] = [];
      for (let i = 0; i < totalPages; i++) {
        items.push({
          id: `page-${i}`,
          originalIndex: i,
          currentPageNumber: i + 1,
          thumbnail: null,
          selected: false,
        });
      }
      setPageItems(items);

      // Generate thumbnails in parallel with concurrency limit
      const concurrency = 10;
      for (let i = 0; i < totalPages; i += concurrency) {
        const batch = Array.from(
          { length: Math.min(concurrency, totalPages - i) },
          (_, j) => i + j
        );

        await Promise.all(
          batch.map(async (pageIndex) => {
            try {
              const page = await pdfDocument.getPage(pageIndex + 1);
              const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnail

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (!context) return;

              canvas.width = viewport.width;
              canvas.height = viewport.height;

              const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
              };

              await page.render(renderContext).promise;

              const dataUrl = canvas.toDataURL('image/png');
              thumbnailMap.set(pageIndex, dataUrl);

              // Update page item with thumbnail
              setPageItems(prevItems =>
                prevItems.map(item =>
                  item.originalIndex === pageIndex
                    ? { ...item, thumbnail: dataUrl }
                    : item
                )
              );
            } catch (error) {
              console.error(`Error generating thumbnail for page ${pageIndex + 1}:`, error);
            }
          })
        );
      }

      setThumbnails(thumbnailMap);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      message.error('生成缩略图失败');
    } finally {
      setGeneratingThumbnails(false);
    }
  };

  // Handle selection
  const handlePageClick = (itemId: string, event: React.MouseEvent) => {
    const item = pageItems.find(p => p.id === itemId);
    if (!item) return;

    const isCtrlPressed = event.ctrlKey || event.metaKey;
    const isShiftPressed = event.shiftKey;

    if (isCtrlPressed) {
      // Toggle selection
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
      setLastSelectedId(itemId);
    } else if (isShiftPressed && lastSelectedId) {
      // Range selection
      const lastItemIndex = pageItems.findIndex(p => p.id === lastSelectedId);
      const currentItemIndex = pageItems.findIndex(p => p.id === itemId);
      const start = Math.min(lastItemIndex, currentItemIndex);
      const end = Math.max(lastItemIndex, currentItemIndex);

      const newSelected = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        newSelected.add(pageItems[i].id);
      }
      setSelectedIds(newSelected);
    } else {
      // Single selection
      setSelectedIds(new Set([itemId]));
      setLastSelectedId(itemId);
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Small movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);

    // If dragging an unselected item, select just that item
    if (!selectedIds.has(event.active.id as string)) {
      setSelectedIds(new Set([event.active.id as string]));
      setLastSelectedId(event.active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find indices
    const oldIndex = pageItems.findIndex(item => item.id === activeId);
    const newIndex = pageItems.findIndex(item => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Check if dragging selected items or single item
    const selectedItems = pageItems.filter(item => selectedIds.has(item.id));

    if (selectedItems.length > 1) {
      // Multi-item drag: move all selected items as a block
      const selectedIndices = selectedItems.map(item => pageItems.findIndex(p => p.id === item.id));
      const minSelectedIndex = Math.min(...selectedIndices);
      const maxSelectedIndex = Math.max(...selectedIndices);

      // Remove selected items from list
      const remainingItems = pageItems.filter(item => !selectedIds.has(item.id));

      // Calculate new insertion index
      let adjustedNewIndex = newIndex;
      if (newIndex > minSelectedIndex) {
        adjustedNewIndex = newIndex - (maxSelectedIndex - minSelectedIndex + 1);
      }

      // Insert selected items at new position
      const newItems = [
        ...remainingItems.slice(0, adjustedNewIndex),
        ...selectedItems.sort((a, b) => a.originalIndex - b.originalIndex), // Keep relative order
        ...remainingItems.slice(adjustedNewIndex),
      ];

      // Update current page numbers
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        currentPageNumber: index + 1,
      }));

      setPageItems(updatedItems);
    } else {
      // Single item drag: simple array move
      const newItems = arrayMove(pageItems, oldIndex, newIndex);
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        currentPageNumber: index + 1,
      }));
      setPageItems(updatedItems);
    }
  };

  // Move individual item up/down
  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = pageItems.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= pageItems.length) return;

    const newItems = arrayMove(pageItems, currentIndex, newIndex);
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      currentPageNumber: index + 1,
    }));
    setPageItems(updatedItems);
  };

  // Apply reordering
  const handleApply = async () => {
    if (!pdfBytes || pageItems.length === 0) {
      message.warning('没有可重排的页面');
      return;
    }

    setLoading(true);

    try {
      // Load original PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Create new PDF
      const newPdf = await PDFDocument.create();

      // Get new page order (0-based indices)
      const newPageOrder = pageItems.map(item => item.originalIndex);

      // Copy pages in new order
      const copiedPages = await newPdf.copyPages(pdfDoc, newPageOrder);

      // Add pages to new PDF
      copiedPages.forEach(page => newPdf.addPage(page));

      // Save PDF
      const pdfBytesOutput = await newPdf.save();

      // Convert to ArrayBuffer and download
      const arrayBuffer = pdfBytesOutput.buffer.slice(
        pdfBytesOutput.byteOffset,
        pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      saveAs(blob, `reordered-${Date.now()}.pdf`);

      message.success(`成功重排 ${pageItems.length} 页`);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Reorder error:', error);
      message.error('重排失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Select all / clear selection
  const handleSelectAll = () => {
    if (selectedIds.size === pageItems.length) {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    } else {
      setSelectedIds(new Set(pageItems.map(item => item.id)));
      setLastSelectedId(pageItems[0]?.id || null);
    }
  };

  // Sortable page item component
  const SortablePageItem: React.FC<{ item: PageItem; index: number }> = ({ item, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
    };

    const isSelected = selectedIds.has(item.id);
    const isDraggingThis = activeDragId === item.id;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
      >
        <Card
          size="small"
          style={{
            cursor: 'grab',
            border: isSelected
              ? '2px solid #1890ff'
              : isDraggingThis
              ? '2px solid #faad14'
              : '1px solid #d9d9d9',
            backgroundColor: isSelected
              ? '#e6f7ff'
              : isDraggingThis
              ? '#fff7e6'
              : '#fff',
            userSelect: 'none',
          }}
          onClick={(e) => handlePageClick(item.id, e)}
          hoverable
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* Thumbnail */}
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={`Page ${item.currentPageNumber}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  border: '1px solid #f0f0f0',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 100,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">加载中...</Text>
              </div>
            )}

            {/* Page info */}
            <div style={{ textAlign: 'center' }}>
              <Text strong>
                第 {item.currentPageNumber} 页
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                (原第 {item.originalIndex + 1} 页)
              </Text>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  已选择
                </Text>
              </div>
            )}

            {/* Drag handle */}
            <div
              {...listeners}
              style={{
                textAlign: 'center',
                cursor: 'grab',
                marginTop: 4,
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                ⋮⋮ 拖拽排序
              </Text>
            </div>

            {/* Move buttons */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              <Button
                size="small"
                icon={<UploadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  moveItem(item.id, 'up');
                }}
                disabled={index === 0 || loading}
                style={{ flex: 1 }}
              >
                上移
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  moveItem(item.id, 'down');
                }}
                disabled={index === pageItems.length - 1 || loading}
                style={{ flex: 1 }}
              >
                下移
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  };

  return (
    <Modal
      title={<Title level={4}>页面排序</Title>}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      style={{ top: 20 }}
    >
      <Space size="large" style={{ width: '100%' }} direction="vertical">
        {/* Instructions */}
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              拖拽页面缩略图重新排序，或使用上移/下移按钮调整
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              • 单击选择单个页面 • Ctrl/Cmd+单击多选 • Shift+单击连选
            </Text>
            <Text type="secondary">
              总页数: {pageItems.length} | 已选择: {selectedIds.size} 页
            </Text>
          </Space>
        </Card>

        {/* Selection controls */}
        <Card size="small">
          <Space>
            <Checkbox
              checked={selectedIds.size === pageItems.length && pageItems.length > 0}
              indeterminate={
                selectedIds.size > 0 && selectedIds.size < pageItems.length
              }
              onChange={handleSelectAll}
            >
              全选 / 取消全选
            </Checkbox>
            <Button
              size="small"
              onClick={() => setSelectedIds(new Set())}
              disabled={loading}
            >
              清空选择
            </Button>
          </Space>
        </Card>

        {/* Loading indicator */}
        {generatingThumbnails && (
          <Card size="small">
            <Text type="secondary">正在生成缩略图，请稍候...</Text>
          </Card>
        )}

        {/* Page grid with drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pageItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Card title="拖拽排序页面" size="small">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  padding: '8px',
                }}
              >
                {pageItems.map((item, index) => (
                  <SortablePageItem key={item.id} item={item} index={index} />
                ))}
              </div>
            </Card>
          </SortableContext>
        </DndContext>

        {/* Action buttons */}
        <Card size="small">
          <Space>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={handleApply}
              disabled={pageItems.length === 0 || loading}
              loading={loading}
            >
              应用排序 ({pageItems.length} 页)
            </Button>
            <Button onClick={onClose} disabled={loading}>
              取消
            </Button>
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};
