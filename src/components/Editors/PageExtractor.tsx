import React, { useState } from 'react';
import { Button, Space, Typography, Card, message, Modal, Checkbox } from 'antd';
import { VerticalAlignTopOutlined } from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const { Text, Title } = Typography;

interface PageExtractorProps {
  visible: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  pdfBytes: Uint8Array | null;
}

export const PageExtractor: React.FC<PageExtractorProps> = ({
  visible,
  onClose,
  pdfDocument,
  pdfBytes,
}) => {
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const totalPages = pdfDocument?.numPages || 0;

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedPages([]);
      setSelectAll(false);
    }
  }, [visible]);

  const handleTogglePage = (pageNumber: number) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageNumber)) {
        return prev.filter((p) => p !== pageNumber);
      } else {
        return [...prev, pageNumber].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPages([]);
    } else {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
    }
    setSelectAll(!selectAll);
  };

  const handleExtract = async () => {
    if (!pdfDocument || !pdfBytes) {
      message.warning('请先打开PDF文件');
      return;
    }

    if (selectedPages.length === 0) {
      message.warning('请至少选择一页');
      return;
    }

    setExtracting(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();

      // Copy selected pages (convert to 0-based index)
      const copiedPages = await newPdf.copyPages(
        pdfDoc,
        selectedPages.map((p) => p - 1)
      );

      // Add pages to new PDF
      copiedPages.forEach((page) => newPdf.addPage(page));

      // Save and download
      const pdfBytesOutput = await newPdf.save();
      const arrayBuffer = pdfBytesOutput.buffer.slice(
        pdfBytesOutput.byteOffset,
        pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      // Generate filename based on selected pages
      const pageRange =
        selectedPages.length === 1
          ? `page-${selectedPages[0]}`
          : `pages-${selectedPages[0]}-${selectedPages[selectedPages.length - 1]}`;

      saveAs(blob, `extracted-${pageRange}.pdf`);

      message.success(`成功提取 ${selectedPages.length} 页`);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Extract error:', error);
      message.error('提取失败：' + (error as Error).message);
    } finally {
      setExtracting(false);
    }
  };

  // Generate page grid
  const renderPageGrid = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Card
          key={i}
          size="small"
          style={{
            cursor: 'pointer',
            border: selectedPages.includes(i) ? '2px solid #1890ff' : '1px solid #d9d9d9',
            backgroundColor: selectedPages.includes(i) ? '#e6f7ff' : '#fff',
          }}
          onClick={() => handleTogglePage(i)}
          hoverable
        >
          <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
            <Text strong>{i}</Text>
            {selectedPages.includes(i) && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                已选择
              </Text>
            )}
          </Space>
        </Card>
      );
    }
    return pages;
  };

  return (
    <Modal
      title={<Title level={4}>提取页面</Title>}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Space size="large" style={{ width: '100%' }} direction="vertical">
        {/* 说明 */}
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              选择要提取的页面，选中的页面将合并到一个新的PDF文件中
            </Text>
            <Text type="secondary">
              文档总页数: {totalPages}
            </Text>
            <Text type="secondary">
              已选择: {selectedPages.length} 页
            </Text>
          </Space>
        </Card>

        {/* 全选按钮 */}
        <Card size="small">
          <Space>
            <Checkbox checked={selectAll} onChange={handleSelectAll}>
              全选 / 取消全选
            </Checkbox>
            <Button
              size="small"
              onClick={() => {
                // Select even pages
                setSelectedPages(Array.from({ length: Math.ceil(totalPages / 2) }, (_, i) => i * 2 + 1));
              }}
              disabled={extracting}
            >
              选择奇数页
            </Button>
            <Button
              size="small"
              onClick={() => {
                // Select odd pages
                const evenPages = [];
                for (let i = 2; i <= totalPages; i += 2) {
                  evenPages.push(i);
                }
                setSelectedPages(evenPages);
              }}
              disabled={extracting}
            >
              选择偶数页
            </Button>
            <Button
              size="small"
              onClick={() => setSelectedPages([])}
              disabled={extracting}
            >
              清空选择
            </Button>
          </Space>
        </Card>

        {/* 页面网格 */}
        <Card title="选择页面" size="small">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {renderPageGrid()}
          </div>
        </Card>

        {/* 操作按钮 */}
        <Card size="small">
          <Space>
            <Button
              type="primary"
              icon={<VerticalAlignTopOutlined />}
              onClick={handleExtract}
              disabled={selectedPages.length === 0 || extracting}
              loading={extracting}
            >
              提取选中页面 ({selectedPages.length})
            </Button>
            <Button onClick={onClose} disabled={extracting}>
              取消
            </Button>
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};
