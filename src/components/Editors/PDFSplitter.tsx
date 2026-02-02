import React, { useState } from 'react';
import { Button, Space, Typography, Card, message, Modal, Input, Radio, InputNumber, Spin } from 'antd';
import { ScissorOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const { Text, Title } = Typography;

type SplitMode = 'custom' | 'fixed' | 'average';

interface FileRow {
  id: string;
  pages: string;
}

interface PDFSplitterProps {
  visible: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  pdfBytes: Uint8Array | null;
}

export const PDFSplitter: React.FC<PDFSplitterProps> = ({
  visible,
  onClose,
  pdfDocument,
  pdfBytes,
}) => {
  const [splitMode, setSplitMode] = useState<SplitMode>('custom');
  const [rows, setRows] = useState<FileRow[]>([
    { id: '1', pages: '' },
    { id: '2', pages: '' },
  ]);
  const [fixedPages, setFixedPages] = useState<number>(1);
  const [averageCount, setAverageCount] = useState<number>(2);
  const [splitting, setSplitting] = useState(false);

  const addRow = () => {
    const newId = (rows.length + 1).toString();
    setRows([...rows, { id: newId, pages: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      message.warning('至少保留一行');
      return;
    }
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, pages: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, pages } : row));
  };

  const handleSplit = async () => {
    if (!pdfDocument || !pdfBytes) {
      message.warning('请先打开PDF文件');
      return;
    }

    const totalPages = pdfDocument.numPages;

    if (splitMode === 'custom') {
      await handleCustomSplit(totalPages);
    } else if (splitMode === 'fixed') {
      await handleFixedSplit(totalPages);
    } else if (splitMode === 'average') {
      await handleAverageSplit(totalPages);
    }
  };

  // 自定义模式：每行一个文件
  const handleCustomSplit = async (totalPages: number) => {
    const validRows = rows.filter(row => row.pages.trim() !== '');
    if (validRows.length === 0) {
      message.warning('请至少在一行中输入页面号');
      return;
    }

    if (!pdfBytes) return;

    setSplitting(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const zip = new JSZip();
      let totalFiles = 0;

      for (const row of validRows) {
        const pages = parsePageRanges(row.pages, totalPages);

        if (pages.length === 0) {
          message.warning(`文件 "${row.id}" 的页面范围无效，已跳过`);
          continue;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pages.map(p => p - 1));
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytesOutput = await newPdf.save();
        const arrayBuffer = pdfBytesOutput.buffer.slice(
          pdfBytesOutput.byteOffset,
          pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength
        ) as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        const filename = row.id === '1' && validRows.length === 1
          ? `split-pages.pdf`
          : `file-${row.id}-${row.pages.replace(/[^a-zA-Z0-9,-]/g, '-')}.pdf`;

        zip.file(filename, uint8Array);
        totalFiles++;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `split-pdf-${Date.now()}.zip`);

      message.success(`成功拆分为 ${totalFiles} 个PDF文件，已打包为ZIP下载`);
      onClose();
    } catch (error) {
      console.error('Split error:', error);
      message.error('拆分失败：' + (error as Error).message);
    } finally {
      setSplitting(false);
    }
  };

  // 固定页数模式：每X页一个文件
  const handleFixedSplit = async (totalPages: number) => {
    if (fixedPages < 1) {
      message.warning('每份页数必须大于0');
      return;
    }

    if (fixedPages > totalPages) {
      message.warning('每份页数不能超过总页数');
      return;
    }

    if (!pdfBytes) return;

    setSplitting(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const zip = new JSZip();
      let totalFiles = 0;

      for (let start = 1; start <= totalPages; start += fixedPages) {
        const end = Math.min(start + fixedPages - 1, totalPages);
        const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pages.map(p => p - 1));
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytesOutput = await newPdf.save();
        const arrayBuffer = pdfBytesOutput.buffer.slice(
          pdfBytesOutput.byteOffset,
          pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength
        ) as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        const filename = `pages-${start}-${end}.pdf`;
        zip.file(filename, uint8Array);
        totalFiles++;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `split-fixed-${Date.now()}.zip`);

      message.success(`成功拆分为 ${totalFiles} 个PDF文件，已打包为ZIP下载`);
      onClose();
    } catch (error) {
      console.error('Split error:', error);
      message.error('拆分失败：' + (error as Error).message);
    } finally {
      setSplitting(false);
    }
  };

  // 平均分割模式：将文件平均分成X份
  const handleAverageSplit = async (totalPages: number) => {
    if (averageCount < 1) {
      message.warning('分割份数必须大于0');
      return;
    }

    if (averageCount > totalPages) {
      message.warning('分割份数不能超过总页数');
      return;
    }

    if (!pdfBytes) return;

    setSplitting(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const zip = new JSZip();

      // 计算每份大概有多少页
      const basePagesPerFile = Math.floor(totalPages / averageCount);
      const remainder = totalPages % averageCount;

      let currentPage = 1;
      let totalFiles = 0;

      for (let i = 0; i < averageCount; i++) {
        // 前面的文件多分配一页（如果有余数）
        const pagesInThisFile = basePagesPerFile + (i < remainder ? 1 : 0);

        // 如果没有页数分配给这个文件，跳过
        if (pagesInThisFile === 0) break;

        if (currentPage > totalPages) break;

        const end = Math.min(currentPage + pagesInThisFile - 1, totalPages);
        const pages = Array.from({ length: end - currentPage + 1 }, (_, j) => currentPage + j);

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pages.map(p => p - 1));
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytesOutput = await newPdf.save();
        const arrayBuffer = pdfBytesOutput.buffer.slice(
          pdfBytesOutput.byteOffset,
          pdfBytesOutput.byteOffset + pdfBytesOutput.byteLength
        ) as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        const filename = `part-${i + 1}-of-${averageCount}.pdf`;
        zip.file(filename, uint8Array);
        totalFiles++;

        currentPage = end + 1;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `split-average-${Date.now()}.zip`);

      message.success(`成功拆分为 ${totalFiles} 个PDF文件，已打包为ZIP下载`);
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
      width={700}
      footer={null}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 选择切割模式 */}
        <Card title="选择切割模式" size="small">
          <Radio.Group
            value={splitMode}
            onChange={(e) => setSplitMode(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="custom">
                <Text strong>自定义模式</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  每行一个文件，手动指定每个文件包含的页面
                </Text>
              </Radio>

              <Radio value="fixed">
                <Text strong>固定页数模式</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  每X页切割成一个文件
                </Text>
              </Radio>

              <Radio value="average">
                <Text strong>平均分割模式</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  将PDF平均分成X份
                </Text>
              </Radio>
            </Space>
          </Radio.Group>
        </Card>

        {/* 自定义模式：多行输入 */}
        {splitMode === 'custom' && (
          <Card title="设置输出文件" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                每行代表一个输出文件，输入该文件要包含的页面。例如：
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 第1行输入 "1,3,5" → 文件1包含第1、3、5页<br />
                • 第2行输入 "2,4,6" → 文件2包含第2、4、6页
              </Text>

              {rows.map((row) => (
                <Space key={row.id} style={{ width: '100%' }} align="baseline">
                  <Text strong>文件 {row.id}:</Text>
                  <Input
                    placeholder="例如: 1,3,5 或 1-3,5,7-9"
                    value={row.pages}
                    onChange={(e) => updateRow(row.id, e.target.value)}
                    disabled={splitting}
                    style={{ flex: 1 }}
                    addonAfter={
                      rows.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeRow(row.id)}
                          disabled={splitting}
                        />
                      )
                    }
                  />
                </Space>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addRow}
                disabled={splitting}
                block
                style={{ marginTop: 8 }}
              >
                添加文件
              </Button>

              <Text type="secondary">
                文档总页数: {totalPages}
              </Text>
            </Space>
          </Card>
        )}

        {/* 固定页数模式 */}
        {splitMode === 'fixed' && (
          <Card title="设置切割参数" size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>每份页数：</Text>
                <InputNumber
                  min={1}
                  max={totalPages}
                  value={fixedPages}
                  onChange={(value) => setFixedPages(value || 1)}
                  disabled={splitting}
                  style={{ marginLeft: 8 }}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  （总共将生成约 {Math.ceil(totalPages / fixedPages)} 个文件）
                </Text>
              </div>

              <Text type="secondary">
                例如：10页的PDF，每份3页，将生成4个文件：<br />
                • 文件1：第1-3页<br />
                • 文件2：第4-6页<br />
                • 文件3：第7-9页<br />
                • 文件4：第10页
              </Text>
            </Space>
          </Card>
        )}

        {/* 平均分割模式 */}
        {splitMode === 'average' && (
          <Card title="设置切割参数" size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>分割份数：</Text>
                <InputNumber
                  min={1}
                  max={totalPages}
                  value={averageCount}
                  onChange={(value) => setAverageCount(value || 2)}
                  disabled={splitting}
                  style={{ marginLeft: 8 }}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  （将PDF平均分成 {averageCount} 份）
                </Text>
              </div>

              <Text type="secondary">
                例如：10页的PDF，分成3份，将生成3个文件：<br />
                • 文件1：第1-4页（4页）<br />
                • 文件2：第5-8页（4页）<br />
                • 文件3：第9-10页（2页）
              </Text>
            </Space>
          </Card>
        )}

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
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};
