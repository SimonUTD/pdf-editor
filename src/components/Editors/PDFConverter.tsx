import React, { useState } from 'react';
import { Modal, Radio, Space, Typography, Button, Progress } from 'antd';
import { FileWordOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { ExportService } from '@/services/exportService';

const { Text } = Typography;

interface PDFConverterProps {
  visible: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  fileName: string;
}

type ConversionFormat = 'word' | 'html';

export const PDFConverter: React.FC<PDFConverterProps> = ({
  visible,
  onClose,
  pdfDocument,
  fileName,
}) => {
  const [format, setFormat] = useState<ConversionFormat>('word');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!pdfDocument) {
      return;
    }

    setConverting(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const baseFileName = fileName.split('/').pop()?.replace('.pdf', '') || 'document';

      if (format === 'word') {
        await ExportService.exportAsWord(pdfDocument, baseFileName);
      } else if (format === 'html') {
        await ExportService.exportAsHTML(pdfDocument, baseFileName);
      }

      clearInterval(progressInterval);
      setProgress(100);

      // Close modal after brief success display
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Error converting PDF:', error);
      setConverting(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setFormat('word');
    setConverting(false);
    setProgress(0);
    onClose();
  };

  return (
    <Modal
      title="PDF格式转换"
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={converting}>
          取消
        </Button>,
        <Button
          key="convert"
          type="primary"
          onClick={handleConvert}
          disabled={converting}
          loading={converting}
          icon={converting ? <LoadingOutlined /> : undefined}
        >
          {converting ? '转换中...' : '开始转换'}
        </Button>,
      ]}
      width={500}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>选择转换格式：</Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ marginTop: 12, display: 'block' }}
            disabled={converting}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="word">
                <Space>
                  <FileWordOutlined style={{ color: '#2B579A' }} />
                  <span>Word文档 (.docx)</span>
                </Space>
              </Radio>
              <Radio value="html">
                <Space>
                  <FileOutlined style={{ color: '#E44D26' }} />
                  <span>HTML网页 (.html)</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {format === 'word' && (
          <div>
            <Text type="secondary">
              • 优化段落结构保持
              <br />
              • 改进文本提取逻辑
              <br />• 添加基本格式化（标题、缩进）
            </Text>
          </div>
        )}

        {format === 'html' && (
          <div>
            <Text type="secondary">
              • 生成完整HTML文档
              <br />
              • 保留页面结构和段落
              <br />• 可在浏览器中直接查看
            </Text>
          </div>
        )}

        {converting && (
          <div>
            <Text strong>转换进度：</Text>
            <Progress percent={progress} status="active" style={{ marginTop: 8 }} />
          </div>
        )}
      </Space>
    </Modal>
  );
};
