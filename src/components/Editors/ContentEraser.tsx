import React, { useState } from 'react';
import { Modal, InputNumber, Space, message, Alert } from 'antd';
import { ScissorOutlined } from '@ant-design/icons';

interface ContentEraserProps {
  visible: boolean;
  onClose: () => void;
  onErase: (x: number, y: number, width: number, height: number) => Promise<void>;
}

export const ContentEraser: React.FC<ContentEraserProps> = ({
  visible,
  onClose,
  onErase,
}) => {
  const [x, setX] = useState<number>(100);
  const [y, setY] = useState<number>(100);
  const [width, setWidth] = useState<number>(200);
  const [height, setHeight] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const handleErase = async () => {
    if (width <= 0 || height <= 0) {
      message.error('Width and height must be positive');
      return;
    }

    try {
      setLoading(true);
      await onErase(x, y, width, height);
      message.success('Content erased successfully');
      handleClose();
    } catch (error) {
      console.error('Error erasing content:', error);
      message.error('Failed to erase content');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setX(100);
    setY(100);
    setWidth(200);
    setHeight(100);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ScissorOutlined />
          Erase Content
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleErase}
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="Erase Content Region"
          description="This will draw a white rectangle over the specified region to erase content. Coordinates are from the top-left corner of the page."
          type="info"
          showIcon
        />

        <div>
          <strong>Position:</strong>
          <Space style={{ marginTop: 8 }}>
            <span>X:</span>
            <InputNumber
              min={0}
              value={x}
              onChange={(value) => setX(value || 0)}
              style={{ width: 100 }}
            />
            <span>Y:</span>
            <InputNumber
              min={0}
              value={y}
              onChange={(value) => setY(value || 0)}
              style={{ width: 100 }}
            />
          </Space>
        </div>

        <div>
          <strong>Size:</strong>
          <Space style={{ marginTop: 8 }}>
            <span>Width:</span>
            <InputNumber
              min={1}
              value={width}
              onChange={(value) => setWidth(value || 1)}
              style={{ width: 100 }}
            />
            <span>Height:</span>
            <InputNumber
              min={1}
              value={height}
              onChange={(value) => setHeight(value || 1)}
              style={{ width: 100 }}
            />
          </Space>
        </div>
      </Space>
    </Modal>
  );
};
