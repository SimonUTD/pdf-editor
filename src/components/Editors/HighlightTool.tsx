import React, { useState } from 'react';
import { Modal, InputNumber, Space, ColorPicker, message, Alert } from 'antd';
import { HighlightOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';

interface HighlightToolProps {
  visible: boolean;
  onClose: () => void;
  onHighlight: (
    x: number,
    y: number,
    width: number,
    height: number,
    color: { r: number; g: number; b: number },
    opacity: number
  ) => Promise<void>;
}

export const HighlightTool: React.FC<HighlightToolProps> = ({
  visible,
  onClose,
  onHighlight,
}) => {
  const [x, setX] = useState<number>(100);
  const [y, setY] = useState<number>(100);
  const [width, setWidth] = useState<number>(200);
  const [height, setHeight] = useState<number>(20);
  const [color, setColor] = useState<Color | string>('#FFFF00');
  const [opacity, setOpacity] = useState<number>(0.3);
  const [loading, setLoading] = useState(false);

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 1, g: 1, b: 0 };
  };

  const handleHighlight = async () => {
    if (width <= 0 || height <= 0) {
      message.error('Width and height must be positive');
      return;
    }

    try {
      setLoading(true);
      const colorStr = typeof color === 'string' ? color : color.toHexString();
      const rgb = hexToRgb(colorStr);
      await onHighlight(x, y, width, height, rgb, opacity);
      message.success('Highlight added successfully');
      handleClose();
    } catch (error) {
      console.error('Error adding highlight:', error);
      message.error('Failed to add highlight');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setX(100);
    setY(100);
    setWidth(200);
    setHeight(20);
    setColor('#FFFF00');
    setOpacity(0.3);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <HighlightOutlined />
          Add Highlight
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleHighlight}
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="Add Highlight"
          description="This will add a semi-transparent colored rectangle to highlight content. Coordinates are from the top-left corner of the page."
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

        <div>
          <strong>Highlight Color:</strong>
          <ColorPicker
            value={color}
            onChange={setColor}
            showText
            style={{ marginLeft: 8 }}
          />
        </div>

        <div>
          <strong>Opacity:</strong>
          <InputNumber
            min={0.1}
            max={1}
            step={0.1}
            value={opacity}
            onChange={(value) => setOpacity(value || 0.3)}
            style={{ width: 120, marginLeft: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
};
