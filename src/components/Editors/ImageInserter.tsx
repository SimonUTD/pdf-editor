import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, message, Upload } from 'antd';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { getMessage } from '@/constants/messages';

interface ImageInserterProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (
    imageBytes: Uint8Array,
    imageType: 'png' | 'jpg',
    x: number,
    y: number,
    width: number,
    height: number
  ) => Promise<void>;
}

export const ImageInserter: React.FC<ImageInserterProps> = ({
  visible,
  onClose,
  onInsert,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [x, setX] = useState<number>(50);
  const [y, setY] = useState<number>(50);
  const [width, setWidth] = useState<number>(200);
  const [height, setHeight] = useState<number>(200);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setImageFile(file);
    }
  };

  const handleInsert = async () => {
    if (!imageFile) {
      message.error(getMessage('Please select an image file'));
      return;
    }

    // Validate image type
    const fileType = imageFile.type;
    if (!fileType.includes('png') && !fileType.includes('jpeg') && !fileType.includes('jpg')) {
      message.error(getMessage('Only PNG and JPG images are supported'));
      return;
    }

    try {
      setLoading(true);

      // Read file as ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);
      const imageType = fileType.includes('png') ? 'png' : 'jpg';

      // Call insert handler
      await onInsert(imageBytes, imageType, x, y, width, height);

      message.success(getMessage('Image inserted successfully'));
      handleClose();
    } catch (error) {
      console.error('Error inserting image:', error);
      message.error(getMessage('Failed to insert image'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setX(50);
    setY(50);
    setWidth(200);
    setHeight(200);
    onClose();
  };

  return (
    <Modal
      title={getMessage('Insert Image')}
      open={visible}
      onCancel={handleClose}
      onOk={handleInsert}
      okText={getMessage('Confirm')}
      cancelText={getMessage('Cancel')}
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload
          accept="image/png,image/jpeg,image/jpg"
          maxCount={1}
          beforeUpload={() => false}
          onChange={handleFileChange}
        >
          <Button icon={<UploadOutlined />}>{getMessage('Select Image (PNG/JPG)')}</Button>
        </Upload>

        {imageFile && (
          <div>
            <strong>{getMessage('Selected:')}</strong> {imageFile.name}
          </div>
        )}

        <div>
          <strong>{getMessage('Position (from top-left):')}</strong>
          <Space style={{ marginTop: 8 }}>
            <span>X:</span>
            <InputNumber
              min={0}
              max={1000}
              value={x}
              onChange={(value) => setX(value || 0)}
              style={{ width: 100 }}
            />
            <span>Y:</span>
            <InputNumber
              min={0}
              max={1000}
              value={y}
              onChange={(value) => setY(value || 0)}
              style={{ width: 100 }}
            />
          </Space>
        </div>

        <div>
          <strong>{getMessage('Size:')}</strong>
          <Space style={{ marginTop: 8 }}>
            <span>{getMessage('Width:')}</span>
            <InputNumber
              min={10}
              max={1000}
              value={width}
              onChange={(value) => setWidth(value || 100)}
              style={{ width: 100 }}
            />
            <span>{getMessage('Height:')}</span>
            <InputNumber
              min={10}
              max={1000}
              value={height}
              onChange={(value) => setHeight(value || 100)}
              style={{ width: 100 }}
            />
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

