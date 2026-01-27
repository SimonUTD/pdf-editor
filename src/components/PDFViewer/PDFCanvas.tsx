import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';

interface PDFCanvasProps {
  pdfDocument: any;
  pageNumber: number;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pdfDocument,
  pageNumber,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = React.useState(true);
  const { zoom } = useUIStore();

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

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Spin size="large" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          display: loading ? 'none' : 'block',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
};
