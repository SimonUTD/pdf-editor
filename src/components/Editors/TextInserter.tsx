import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, message, Input, ColorPicker } from 'antd';
import { FontSizeOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';

const { TextArea } = Input;

interface TextInserterProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: { r: number; g: number; b: number }
  ) => Promise<void>;
}

export const TextInserter: React.FC<TextInserterProps> = ({
  visible,
  onClose,
  onInsert,
}) => {
  const [text, setText] = useState<string>('');
  const [x, setX] = useState<number>(50);
  const [y, setY] = useState<number>(50);
  const [fontSize, setFontSize] = useState<number>(12);
  const [color, setColor] = useState<Color | string>('#000000');
  const [loading, setLoading] = useState(false);

  const handleInsert = async () => {
    if (!text || text.trim().length === 0) {
      message.error('Please enter text content');
      return;
    }

    try {
      setLoading(true);

      // Parse color
      const colorStr = typeof color === 'string' ? color : color.toHexString();
      const rgb = hexToRgb(colorStr);

      // Call insert handler
      await onInsert(text, x, y, fontSize, rgb);

      message.success('Text inserted successfully');
      handleClose();
    } catch (error) {
      console.error('Error inserting text:', error);
      message.error('Failed to insert text');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText('');
    setX(50);
    setY(50);
    setFontSize(12);
    setColor('#000000');
    onClose();
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  return (
    <Modal
      title="Insert Text"
      open={visible}
      onCancel={handleClose}
      onOk={handleInsert}
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <strong>Text Content:</strong>
          <TextArea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to insert..."
            style={{ marginTop: 8 }}
          />
        </div>

        <div>
          <strong>Position (from top-left):</strong>
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
          <strong>Font Size:</strong>
          <InputNumber
            min={6}
            max={72}
            value={fontSize}
            onChange={(value) => setFontSize(value || 12)}
            style={{ width: 100, marginLeft: 8 }}
          />
        </div>

        <div>
          <strong>Text Color:</strong>
          <ColorPicker
            value={color}
            onChange={setColor}
            showText
            style={{ marginLeft: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
};

