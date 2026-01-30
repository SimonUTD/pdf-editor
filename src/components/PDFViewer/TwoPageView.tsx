import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
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
    let renderTaskLeft: any = null;
    let renderTaskRight: any = null;
    setLoading(true);

    const renderPages = async () => {
      try {
        // 渲染左页
        if (leftCanvasRef.current && leftPageNumber > 0) {
          const leftPage = await pdfDocument.getPage(leftPageNumber);
          const leftViewport = leftPage.getViewport({ scale: zoom, rotation: pageRotations[leftPageNumber - 1] || 0 });
          const leftCanvas = leftCanvasRef.current;

          // 设置canvas尺寸
          leftCanvas.width = leftViewport.width;
          leftCanvas.height = leftViewport.height;

          const leftCtx = leftCanvas.getContext('2d');
          if (leftCtx) {
            const renderContext = {
              canvasContext: leftCtx,
              viewport: leftViewport,
            };
            renderTaskLeft = leftPage.render(renderContext);
            await renderTaskLeft.promise;
          }
        }

        // 渲染右页
        if (rightCanvasRef.current && rightPageNumber > 0) {
          const rightPage = await pdfDocument.getPage(rightPageNumber);
          const rightViewport = rightPage.getViewport({ scale: zoom, rotation: pageRotations[rightPageNumber - 1] || 0 });
          const rightCanvas = rightCanvasRef.current;

          // 设置canvas尺寸
          rightCanvas.width = rightViewport.width;
          rightCanvas.height = rightViewport.height;

          const rightCtx = rightCanvas.getContext('2d');
          if (rightCtx) {
            const renderContext = {
              canvasContext: rightCtx,
              viewport: rightViewport,
            };
            renderTaskRight = rightPage.render(renderContext);
            await renderTaskRight.promise;
          }
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (error: any) {
        if (error.name === 'RenderingCancelledException') {
          console.log('Rendering cancelled');
        } else {
          console.error('Error rendering two-page view:', error);
        }
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderPages();

    return () => {
      cancelled = true;
      if (renderTaskLeft) {
        renderTaskLeft.cancel();
      }
      if (renderTaskRight) {
        renderTaskRight.cancel();
      }
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
