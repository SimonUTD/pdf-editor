import React, { useState } from 'react';
import { Modal, Button, Input, InputNumber, Space, Radio, Upload, ColorPicker, message } from 'antd';
import { FontSizeOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';

interface WatermarkEditorProps {
  visible: boolean;
  onClose: () => void;
  onAddTextWatermark: (
    text: string,
    options: {
      fontSize: number;
      opacity: number;
      rotation: number;
      color: { r: number; g: number; b: number };
      position: 'center' | 'diagonal' | 'top' | 'bottom';
    }
  ) => Promise<void>;
  onAddImageWatermark: (
    imageBytes: Uint8Array,
    imageType: 'png' | 'jpg',
    options: {
      width: number;
      height: number;
      opacity: number;
      position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    }
  ) => Promise<void>;
}

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({
  visible,
  onClose,
  onAddTextWatermark,
  onAddImageWatermark,
}) => {
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(48);
  const [opacity, setOpacity] = useState<number>(0.3);
  const [rotation, setRotation] = useState<number>(-45);
  const [color, setColor] = useState<Color | string>('#B0B0B0');
  const [textPosition, setTextPosition] = useState<'center' | 'diagonal' | 'top' | 'bottom'>('diagonal');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(200);
  const [imageHeight, setImageHeight] = useState<number>(200);
  const [imageOpacity, setImageOpacity] = useState<number>(0.3);
  const [imagePosition, setImagePosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');

  const [loading, setLoading] = useState(false);

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setImageFile(file);
    }
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0.7, g: 0.7, b: 0.7 };
  };

  const handleAdd = async () => {
    try {
      setLoading(true);

      if (watermarkType === 'text') {
        if (!text || text.trim().length === 0) {
          message.error('Please enter watermark text');
          return;
        }

        const colorStr = typeof color === 'string' ? color : color.toHexString();
        const rgb = hexToRgb(colorStr);

        await onAddTextWatermark(text, {
          fontSize,
          opacity,
          rotation,
          color: rgb,
          position: textPosition,
        });

        message.success('Text watermark added successfully');
      } else {
        if (!imageFile) {
          message.error('Please select an image file');
          return;
        }

        const fileType = imageFile.type;
        if (!fileType.includes('png') && !fileType.includes('jpeg') && !fileType.includes('jpg')) {
          message.error('Only PNG and JPG images are supported');
          return;
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const imageBytes = new Uint8Array(arrayBuffer);
        const imageType = fileType.includes('png') ? 'png' : 'jpg';

        await onAddImageWatermark(imageBytes, imageType, {
          width: imageWidth,
          height: imageHeight,
          opacity: imageOpacity,
          position: imagePosition,
        });

        message.success('Image watermark added successfully');
      }

      handleClose();
    } catch (error) {
      console.error('Error adding watermark:', error);
      message.error('Failed to add watermark');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText('CONFIDENTIAL');
    setFontSize(48);
    setOpacity(0.3);
    setRotation(-45);
    setColor('#B0B0B0');
    setTextPosition('diagonal');
    setImageFile(null);
    setImageWidth(200);
    setImageHeight(200);
    setImageOpacity(0.3);
    setImagePosition('center');
    onClose();
  };

  return (
    <Modal
      title="Add Watermark"
      open={visible}
      onCancel={handleClose}
      onOk={handleAdd}
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <strong>Watermark Type:</strong>
          <Radio.Group
            value={watermarkType}
            onChange={(e) => setWatermarkType(e.target.value)}
            style={{ marginTop: 8, display: 'block' }}
          >
            <Radio value="text">
              <FontSizeOutlined /> Text Watermark
            </Radio>
            <Radio value="image">
              <PictureOutlined /> Image Watermark
            </Radio>
          </Radio.Group>
        </div>

        {watermarkType === 'text' ? (
          <>
            <div>
              <strong>Watermark Text:</strong>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter watermark text..."
                style={{ marginTop: 8 }}
              />
            </div>

            <div>
              <strong>Font Size:</strong>
              <InputNumber
                min={12}
                max={120}
                value={fontSize}
                onChange={(value) => setFontSize(value || 48)}
                style={{ width: 120, marginLeft: 8 }}
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

            <div>
              <strong>Rotation (degrees):</strong>
              <InputNumber
                min={-180}
                max={180}
                value={rotation}
                onChange={(value) => setRotation(value || -45)}
                style={{ width: 120, marginLeft: 8 }}
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

            <div>
              <strong>Position:</strong>
              <Radio.Group
                value={textPosition}
                onChange={(e) => setTextPosition(e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="diagonal">Diagonal (Center)</Radio>
                <Radio value="center">Center (Horizontal)</Radio>
                <Radio value="top">Top</Radio>
                <Radio value="bottom">Bottom</Radio>
              </Radio.Group>
            </div>
          </>
        ) : (
          <>
            <div>
              <strong>Watermark Image:</strong>
              <Upload
                accept="image/png,image/jpeg,image/jpg"
                maxCount={1}
                beforeUpload={() => false}
                onChange={handleFileChange}
                style={{ marginTop: 8 }}
              >
                <Button icon={<UploadOutlined />}>Select Image (PNG/JPG)</Button>
              </Upload>
              {imageFile && (
                <div style={{ marginTop: 8 }}>
                  <strong>Selected:</strong> {imageFile.name}
                </div>
              )}
            </div>

            <div>
              <strong>Size:</strong>
              <Space style={{ marginTop: 8 }}>
                <span>Width:</span>
                <InputNumber
                  min={50}
                  max={500}
                  value={imageWidth}
                  onChange={(value) => setImageWidth(value || 200)}
                  style={{ width: 100 }}
                />
                <span>Height:</span>
                <InputNumber
                  min={50}
                  max={500}
                  value={imageHeight}
                  onChange={(value) => setImageHeight(value || 200)}
                  style={{ width: 100 }}
                />
              </Space>
            </div>

            <div>
              <strong>Opacity:</strong>
              <InputNumber
                min={0.1}
                max={1}
                step={0.1}
                value={imageOpacity}
                onChange={(value) => setImageOpacity(value || 0.3)}
                style={{ width: 120, marginLeft: 8 }}
              />
            </div>

            <div>
              <strong>Position:</strong>
              <Radio.Group
                value={imagePosition}
                onChange={(e) => setImagePosition(e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="center">Center</Radio>
                <Radio value="top-left">Top Left</Radio>
                <Radio value="top-right">Top Right</Radio>
                <Radio value="bottom-left">Bottom Left</Radio>
                <Radio value="bottom-right">Bottom Right</Radio>
              </Radio.Group>
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};
