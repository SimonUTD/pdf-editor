import React, { useEffect, useRef } from 'react';
import { useUIStore, usePDFStore } from '@/stores';

interface ScrollablePDFViewerProps {
  children: React.ReactNode;
}

export const ScrollablePDFViewer: React.FC<ScrollablePDFViewerProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedPageIndex, selectPage } = useUIStore();
  const { pdfDocument } = usePDFStore();
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 只在没有按住Ctrl键时响应滚轮翻页（Ctrl+滚轮是浏览器缩放）
      if (e.ctrlKey) return;

      // 检查是否是水平滚动（触摸板或水平滚轮）
      if (e.deltaX !== 0) {
        return; // 让水平滚动正常工作
      }

      // 垂直滚动幅度必须足够大
      if (Math.abs(e.deltaY) < 50) return;

      // 防抖：避免连续滚动触发多次翻页
      if (wheelTimeoutRef.current) {
        return;
      }

      if (!pdfDocument) return;

      const totalPages = pdfDocument.numPages;
      if (e.deltaY > 0) {
        // 向下滚动，下一页
        if (selectedPageIndex < totalPages - 1) {
          selectPage(selectedPageIndex + 1);
          wheelTimeoutRef.current = setTimeout(() => {
            wheelTimeoutRef.current = null;
          }, 500);
        }
      } else {
        // 向上滚动，上一页
        if (selectedPageIndex > 0) {
          selectPage(selectedPageIndex - 1);
          wheelTimeoutRef.current = setTimeout(() => {
            wheelTimeoutRef.current = null;
          }, 500);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [selectedPageIndex, selectPage, pdfDocument]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
};
