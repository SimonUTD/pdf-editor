import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { PDFRenderer } from '@/services/pdfRenderer';
import { useUIStore } from '@/stores';
import { PageContextMenu } from './PageContextMenu';

interface PageThumbnailProps {
  pdfDocument: any;
  pageNumber: number;
  onClick: () => void;
  onDeletePage: (pageNumber: number) => void;
  onInsertBlankPage: (afterPageNumber: number) => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pdfDocument,
  pageNumber,
  onClick,
  onDeletePage,
  onInsertBlankPage,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedPageIndex } = useUIStore();

  const isSelected = selectedPageIndex === pageNumber - 1;

  useEffect(() => {
    if (!pdfDocument) return;

    let cancelled = false;

    const generateThumbnail = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const thumbnailData = await PDFRenderer.generateThumbnail(page, 150);
        setThumbnail(thumbnailData);
        setLoading(false);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        setLoading(false);
      }
    };

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, pageNumber]);

  return (
    <PageContextMenu
      pageNumber={pageNumber}
      onDeletePage={onDeletePage}
      onInsertBlankPage={onInsertBlankPage}
    >
      <Card
        hoverable
        onClick={onClick}
        style={{
          margin: '8px',
          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: 8 } }}
      >
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : (
          <>
            <img
              src={thumbnail || ''}
              alt={`Page ${pageNumber}`}
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
              Page {pageNumber}
            </div>
          </>
        )}
      </Card>
    </PageContextMenu>
  );
};
