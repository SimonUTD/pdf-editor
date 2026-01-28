import React, { useEffect, useRef } from 'react';
import { PDFRenderer } from '@/services/pdfRenderer';

interface TextLayerProps {
  pdfDocument: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  onTextCopy?: (text: string) => void;
}

export const TextLayer: React.FC<TextLayerProps> = ({
  pdfDocument,
  pageNumber,
  scale,
  rotation = 0,
  onTextCopy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textDivsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!pdfDocument || !containerRef.current) return;

    let cancelled = false;

    const renderTextLayer = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale, rotation });

        if (cancelled) return;

        if (containerRef.current) {
          PDFRenderer.renderTextLayer(
            page,
            viewport,
            containerRef.current,
            scale,
            textDivsRef.current
          );
        }
      } catch (error) {
        console.error('Error rendering text layer:', error);
      }
    };

    renderTextLayer();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, pageNumber, scale, rotation]);

  // 监听复制事件
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection) return;
      const text = selection.toString();

      if (text && onTextCopy) {
        onTextCopy(text);
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [onTextCopy]);

  return (
    <div
      ref={containerRef}
      className="pdf-text-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'auto',
        overflow: 'hidden',
        mixBlendMode: 'multiply',
      }}
    />
  );
};
