import React, { useState } from 'react';
import { Button, Space, Typography, Card, message, Modal, Checkbox, InputNumber, Spin, Input } from 'antd';
import { ScissorOutlined } from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const { Text, Title } = Typography;

interface PDFSplitterProps {
  visible: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  pdfBytes: Uint8Array | null;
}

type SplitMode = 'range' | 'every' | 'individual';

export const PDFSplitter: React.FC<PDFSplitterProps> = ({
  visible,
  onClose,
  pdfDocument,
  pdfBytes,
}) => {
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [pageRanges, setPageRanges] = useState<string>(''); // e.g., "1-3,5,7-9"
  const [splitEvery, setSplitEvery] = useState<number>(1);
  const [splitting, setSplitting] = useState(false);
  const [includeOriginal, setIncludeOriginal] = useState(false);

  const handleSplit = async () => {
    if (!pdfDocument || !pdfBytes) {
      message.warning('请先打开PDF文件');
      return;
    }

    setSplitting(true);

    try {
      const totalPages = pdfDocument.numPages;
      const pdfDoc = await PDFDocument.load(pdfBytes);
      let splitCount = 0;

      if (splitMode === 'range') {
        // Split: save each selected page as a separate PDF file
        const pages = parsePageRanges(pageRanges, totalPages);

        console.log('[PDFSplitter] Parsed pages:', pages);
        console.log('[PDFSplitter] Total pages to split:', pages.length);

        if (pages.length === 0) {
          message.warning('请输入有效的页面范围');
          setSplitting(false);
          return;
        }

        // Create a separate PDF for each selected page
        for (const pageNum of pages) {
          console.log('[PDFSplitter] Splitting page:', pageNum);
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]); // Convert to 0-based
          newPdf.addPage(copiedPage);

          const pdfBytesOutput = await newPdf.save();
          const arrayBuffer = pdfBytesOutput.buffer.slice(pdfBytesOutput.byteOffset, pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength) as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          saveAs(blob, `page-${pageNum}.pdf`);
          splitCount++;
        }

        console.log('[PDFSplitter] Split complete. Total files:', splitCount);
        message.success(`成功拆分为 ${splitCount} 个PDF文件`);
      } else if (splitMode === 'every') {
        // Split every N pages
        if (splitEvery < 1 || splitEvery > totalPages) {
          message.warning('请输入有效的拆分间隔');
          setSplitting(false);
          return;
        }

        for (let i = 0; i < totalPages; i += splitEvery) {
          const newPdf = await PDFDocument.create();
          const endPage = Math.min(i + splitEvery, totalPages);
          const pageIndices = [];

          for (let j = i; j < endPage; j++) {
            pageIndices.push(j);
          }

          const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page) => newPdf.addPage(page));

          const pdfBytesOutput = await newPdf.save();
          const arrayBuffer = pdfBytesOutput.buffer.slice(pdfBytesOutput.byteOffset, pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength) as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          saveAs(blob, `split-${i + 1}-${endPage}.pdf`);
          splitCount++;
        }

        message.success(`成功拆分为 ${splitCount} 个PDF文件`);
      } else if (splitMode === 'individual') {
        // Split each page into individual PDF
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);

          const pdfBytesOutput = await newPdf.save();
          const arrayBuffer = pdfBytesOutput.buffer.slice(pdfBytesOutput.byteOffset, pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength) as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          saveAs(blob, `page-${i + 1}.pdf`);
          splitCount++;
        }

        message.success(`成功拆分为 ${splitCount} 个PDF文件`);
      }

      // Optionally save original
      if (includeOriginal) {
        const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        saveAs(blob, 'original.pdf');
      }

      onClose();
    } catch (error) {
      console.error('Split error:', error);
      message.error('拆分失败：' + (error as Error).message);
    } finally {
      setSplitting(false);
    }
  };

  // Parse page ranges like "1-3,5,7-9" into array of page numbers
  const parsePageRanges = (input: string, totalPages: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        const page = parseInt(trimmed);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          pages.push(page);
        }
      }
    }

    return pages;
  };

  const totalPages = pdfDocument?.numPages || 0;

  return (
    <Modal
      title={<Title level={4}>拆分PDF</Title>}
      open={visible}
      onCancel={onClose}
      width={600}
      footer={null}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 说明文字 */}
        <Card size="small">
          <Text>
            将指定的每一页单独保存为一个独立的PDF文件。例如输入 "1,3,5" 将生成 3 个文件：page-1.pdf、page-3.pdf、page-5.pdf。
          </Text>
          <br />
          <Text type="secondary">
            注意：如需将多个页面合并到一个文件，请使用"提取页面"功能。
          </Text>
        </Card>

        {/* 拆分模式选择 */}
        <Card title="选择操作模式" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox
              checked={splitMode === 'range'}
              onChange={(e) => e.target.checked && setSplitMode('range')}
            >
              <Text strong>指定页面拆分（推荐）</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                输入页面号，每页单独保存
              </Text>
            </Checkbox>

            <Checkbox
              checked={splitMode === 'every'}
              onChange={(e) => e.target.checked && setSplitMode('every')}
            >
              <Text strong>按间隔拆分</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                每N页保存为一个独立文件
              </Text>
            </Checkbox>

            <Checkbox
              checked={splitMode === 'individual'}
              onChange={(e) => e.target.checked && setSplitMode('individual')}
            >
              <Text strong>每页单独保存</Text>
            </Checkbox>
          </Space>
        </Card>

        {/* 拆分参数设置 */}
        {splitMode === 'range' && (
          <Card title="输入要拆分的页面" size="small">
            <Space style={{ width: '100%' }} direction="vertical">
              <Input
                placeholder="例如: 1,3,5 或 1-3,5,7-9"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
                disabled={splitting}
                style={{ width: '100%' }}
              />
              <Text type="secondary">
                输入页面号，用逗号分隔。例如: 1,3,5 将拆分为3个文件；1-3,5 表示第1-3页和第5页
              </Text>
              <Text type="secondary">
                文档总页数: {totalPages}
              </Text>
            </Space>
          </Card>
        )}

        {splitMode === 'every' && (
          <Card title="设置拆分间隔" size="small">
            <Space style={{ width: '100%' }} direction="vertical">
              <Space>
                <Text>每</Text>
                <InputNumber
                  min={1}
                  max={totalPages}
                  value={splitEvery}
                  onChange={(value) => setSplitEvery(value || 1)}
                  disabled={splitting}
                  style={{ width: 100 }}
                />
                <Text>页拆分一次</Text>
              </Space>
              <Text type="secondary">
                例如: 每2页拆分一次，将生成 {Math.ceil(totalPages / splitEvery)} 个PDF文件
              </Text>
            </Space>
          </Card>
        )}

        {splitMode === 'individual' && (
          <Card title="预览" size="small">
            <Text>
              将生成 {totalPages} 个单独的PDF文件，每个文件包含一页
            </Text>
          </Card>
        )}

        {/* 其他选项 */}
        <Card title="其他选项" size="small">
          <Checkbox
            checked={includeOriginal}
            onChange={(e) => setIncludeOriginal(e.target.checked)}
            disabled={splitting}
          >
            同时保存原始PDF文件
          </Checkbox>
        </Card>

        {/* 操作按钮 */}
        <Card size="small">
          <Space>
            <Button
              type="primary"
              icon={<ScissorOutlined />}
              onClick={handleSplit}
              disabled={!pdfDocument || splitting}
              loading={splitting}
            >
              开始拆分
            </Button>
            <Button onClick={onClose} disabled={splitting}>
              取消
            </Button>
            {splitting && (
              <Spin tip="正在拆分PDF..." />
            )}
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};
