import React, { useState } from 'react';
import { Modal, Button, Upload, InputNumber, Space, message, Alert } from 'antd';
import { UploadOutlined, SwapOutlined } from '@ant-design/icons';

interface PageReplacerProps {
  visible: boolean;
  currentPageNumber: number;
  onClose: () => void;
  onReplace: (sourcePdfBytes: Uint8Array, sourcePageIndex: number) => Promise<void>;
}

export const PageReplacer: React.FC<PageReplacerProps> = ({
  visible,
  currentPageNumber,
  onClose,
  onReplace,
}) => {
  const [sourcePdfFile, setSourcePdfFile] = useState<File | null>(null);
  const [sourcePageNumber, setSourcePageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      message.error('Only PDF files are supported');
      return false;
    }

    setSourcePdfFile(file);
    message.success(`Selected ${file.name}`);
    return false;
  };

  const handleReplace = async () => {
    if (!sourcePdfFile) {
      message.error('Please select a source PDF file');
      return;
    }

    try {
      setLoading(true);

      const arrayBuffer = await sourcePdfFile.arrayBuffer();
      const sourcePdfBytes = new Uint8Array(arrayBuffer);

      await onReplace(sourcePdfBytes, sourcePageNumber - 1);
      message.success(`Page ${currentPageNumber} replaced successfully`);
      handleClose();
    } catch (error) {
      console.error('Error replacing page:', error);
      message.error('Failed to replace page');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSourcePdfFile(null);
    setSourcePageNumber(1);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          Replace Page {currentPageNumber}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleReplace}
      confirmLoading={loading}
      width={500}
      okButtonProps={{ disabled: !sourcePdfFile }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="Replace Current Page"
          description={`This will replace page ${currentPageNumber} in the current document with a page from another PDF file.`}
          type="info"
          showIcon
        />

        <div>
          <strong>Source PDF File:</strong>
          <Upload
            accept="application/pdf"
            maxCount={1}
            beforeUpload={handleFileUpload}
            showUploadList={false}
            style={{ marginTop: 8 }}
          >
            <Button icon={<UploadOutlined />}>Select PDF File</Button>
          </Upload>
          {sourcePdfFile && (
            <div style={{ marginTop: 8 }}>
              <strong>Selected:</strong> {sourcePdfFile.name}
            </div>
          )}
        </div>

        <div>
          <strong>Source Page Number:</strong>
          <InputNumber
            min={1}
            value={sourcePageNumber}
            onChange={(value) => setSourcePageNumber(value || 1)}
            style={{ width: 120, marginLeft: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
};
