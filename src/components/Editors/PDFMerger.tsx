import React, { useState } from 'react';
import { Modal, Button, Upload, List, Space, message } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { getMessage } from '@/constants/messages';

interface PDFFile {
  id: string;
  name: string;
  bytes: Uint8Array;
}

interface PDFMergerProps {
  visible: boolean;
  onClose: () => void;
  onMerge: (pdfFiles: Uint8Array[]) => Promise<void>;
}

export const PDFMerger: React.FC<PDFMergerProps> = ({
  visible,
  onClose,
  onMerge,
}) => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      // Validate PDF file
      if (!file.type.includes('pdf')) {
        message.error(getMessage('Only PDF files are supported'));
        return false;
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Add to list
      const newFile: PDFFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        bytes,
      };

      setPdfFiles(prev => [...prev, newFile]);
      message.success(getMessage('Added {name}', { name: file.name }));
      return false; // Prevent auto upload
    } catch (error) {
      console.error('Error reading PDF file:', error);
      message.error(getMessage('Failed to read PDF file'));
      return false;
    }
  };

  const handleRemove = (id: string) => {
    setPdfFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...pdfFiles];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setPdfFiles(newFiles);
  };

  const handleMoveDown = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      message.error(getMessage('Please add at least 2 PDF files to merge'));
      return;
    }

    try {
      setLoading(true);
      const pdfBytesArray = pdfFiles.map(f => f.bytes);
      await onMerge(pdfBytesArray);
      message.success(getMessage('PDFs merged successfully'));
      handleClose();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      message.error(getMessage('Failed to merge PDFs'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPdfFiles([]);
    onClose();
  };

  return (
    <Modal
      title={getMessage('Merge PDF Files')}
      open={visible}
      onCancel={handleClose}
      onOk={handleMerge}
      okText={getMessage('Merge PDFs')}
      cancelText={getMessage('Cancel')}
      confirmLoading={loading}
      width={600}
      okButtonProps={{ disabled: pdfFiles.length < 2 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload
          accept="application/pdf"
          multiple
          beforeUpload={handleFileUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>{getMessage('Add PDF Files')}</Button>
        </Upload>

        <div>
          <strong>{getMessage('Files to merge ({count}):', { count: pdfFiles.length })}</strong>
          <List
            style={{ marginTop: 8, maxHeight: 400, overflow: 'auto' }}
            bordered
            dataSource={pdfFiles}
            locale={{ emptyText: getMessage('No PDF files added yet') }}
            renderItem={(file, index) => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  />,
                  <Button
                    size="small"
                    icon={<ArrowDownOutlined />}
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pdfFiles.length - 1}
                  />,
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(file.id)}
                  />,
                ]}
              >
                <Space>
                  <span style={{ fontWeight: 500 }}>{index + 1}.</span>
                  {file.name}
                </Space>
              </List.Item>
            )}
          />
        </div>

        {pdfFiles.length >= 2 && (
          <div style={{ color: '#52c41a' }}>
            {getMessage('Ready to merge {count} PDF files', { count: pdfFiles.length })}
          </div>
        )}
      </Space>
    </Modal>
  );
};
