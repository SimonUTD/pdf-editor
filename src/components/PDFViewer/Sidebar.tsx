import React from 'react';
import { Empty } from 'antd';
import { PageThumbnail } from './PageThumbnail';
import { useUIStore } from '@/stores';

interface SidebarProps {
  pdfDocument: any;
  totalPages: number;
  onDeletePage: (pageNumber: number) => void;
  onInsertBlankPage: (afterPageNumber: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pdfDocument,
  totalPages,
  onDeletePage,
  onInsertBlankPage,
}) => {
  const { selectPage } = useUIStore();

  if (!pdfDocument || totalPages === 0) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description="No pages" />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {Array.from({ length: totalPages }, (_, index) => (
        <PageThumbnail
          key={index}
          pdfDocument={pdfDocument}
          pageNumber={index + 1}
          onClick={() => selectPage(index)}
          onDeletePage={onDeletePage}
          onInsertBlankPage={onInsertBlankPage}
        />
      ))}
    </div>
  );
};
