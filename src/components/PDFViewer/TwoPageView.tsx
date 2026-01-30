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

  const totalPages = pdfDocument?.numPages || 0;
  const showRightPage = rightPageNumber > 0 && rightPageNumber <= totalPages;

  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-start' }}>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <Spin size="large" />
        </div>
      )}

      {leftPageNumber > 0 && (
        <canvas
          ref={leftCanvasRef}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: loading ? 'none' : 'block' }}
        />
      )}

      {showRightPage && (
        <canvas
          ref={rightCanvasRef}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: loading ? 'none' : 'block' }}
        />
      )}
    </div>
  );
};
