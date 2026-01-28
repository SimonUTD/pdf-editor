import React, { useState } from 'react';
import { Modal, Button, Upload, InputNumber, Space, message, Alert } from 'antd';
import { UploadOutlined, SwapOutlined } from '@ant-design/icons';
import { getMessage } from '@/constants/messages';

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
      message.error(getMessage('Only PDF files are supported'));
      return false;
    }

    setSourcePdfFile(file);
    message.success(getMessage('Selected {name}', { name: file.name }));
    return false;
  };

  const handleReplace = async () => {
    if (!sourcePdfFile) {
      message.error(getMessage('Please select a source PDF file'));
      return;
    }

    try {
      setLoading(true);

      const arrayBuffer = await sourcePdfFile.arrayBuffer();
      const sourcePdfBytes = new Uint8Array(arrayBuffer);

      await onReplace(sourcePdfBytes, sourcePageNumber - 1);
      message.success(getMessage('Page {pageNumber} replaced successfully', { pageNumber: currentPageNumber }));
      handleClose();
    } catch (error) {
      console.error('Error replacing page:', error);
      message.error(getMessage('Failed to replace page'));
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
          {getMessage('Replace Page')} {currentPageNumber}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleReplace}
      okText={getMessage('Confirm')}
      cancelText={getMessage('Cancel')}
      confirmLoading={loading}
      width={500}
      okButtonProps={{ disabled: !sourcePdfFile }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message={getMessage('Replace Current Page')}
          description={getMessage('This will replace page {pageNumber} in the current document with a page from another PDF file.', { pageNumber: currentPageNumber })}
          type="info"
          showIcon
        />

        <div>
          <strong>{getMessage('Source PDF File:')}</strong>
          <Upload
            accept="application/pdf"
            maxCount={1}
            beforeUpload={handleFileUpload}
            showUploadList={false}
            style={{ marginTop: 8 }}
          >
            <Button icon={<UploadOutlined />}>{getMessage('Select PDF File')}</Button>
          </Upload>
          {sourcePdfFile && (
            <div style={{ marginTop: 8 }}>
              <strong>{getMessage('Selected:')}</strong> {sourcePdfFile.name}
            </div>
          )}
        </div>

        <div>
          <strong>{getMessage('Source Page Number:')}</strong>
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
