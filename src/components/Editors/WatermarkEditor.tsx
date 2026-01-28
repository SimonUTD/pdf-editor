import React, { useState } from 'react';
import { Modal, Button, Input, InputNumber, Space, Radio, Upload, ColorPicker, message } from 'antd';
import { FontSizeOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import { getMessage } from '@/constants/messages';

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
          message.error(getMessage('Please enter watermark text'));
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

        message.success(getMessage('Text watermark added successfully'));
      } else {
        if (!imageFile) {
          message.error(getMessage('Please select a watermark image file'));
          return;
        }

        const fileType = imageFile.type;
        if (!fileType.includes('png') && !fileType.includes('jpeg') && !fileType.includes('jpg')) {
          message.error(getMessage('Only PNG and JPG images are supported'));
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

        message.success(getMessage('Image watermark added successfully'));
      }

      handleClose();
    } catch (error) {
      console.error('Error adding watermark:', error);
      message.error(getMessage('Failed to add watermark'));
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
      title={getMessage('Add Watermark')}
      open={visible}
      onCancel={handleClose}
      onOk={handleAdd}
      okText={getMessage('Confirm')}
      cancelText={getMessage('Cancel')}
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <strong>{getMessage('Watermark Type:')}</strong>
          <Radio.Group
            value={watermarkType}
            onChange={(e) => setWatermarkType(e.target.value)}
            style={{ marginTop: 8, display: 'block' }}
          >
            <Radio value="text">
              <FontSizeOutlined /> {getMessage('Text Watermark')}
            </Radio>
            <Radio value="image">
              <PictureOutlined /> {getMessage('Image Watermark')}
            </Radio>
          </Radio.Group>
        </div>

        {watermarkType === 'text' ? (
          <>
            <div>
              <strong>{getMessage('Watermark Text:')}</strong>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={getMessage('Enter watermark text...')}
                style={{ marginTop: 8 }}
              />
            </div>

            <div>
              <strong>{getMessage('Font Size:')}</strong>
              <InputNumber
                min={12}
                max={120}
                value={fontSize}
                onChange={(value) => setFontSize(value || 48)}
                style={{ width: 120, marginLeft: 8 }}
              />
            </div>

            <div>
              <strong>{getMessage('Opacity:')}</strong>
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
              <strong>{getMessage('Rotation (degrees):')}</strong>
              <InputNumber
                min={-180}
                max={180}
                value={rotation}
                onChange={(value) => setRotation(value || -45)}
                style={{ width: 120, marginLeft: 8 }}
              />
            </div>

            <div>
              <strong>{getMessage('Text Color:')}</strong>
              <ColorPicker
                value={color}
                onChange={setColor}
                showText
                style={{ marginLeft: 8 }}
              />
            </div>

            <div>
              <strong>{getMessage('Position:')}</strong>
              <Radio.Group
                value={textPosition}
                onChange={(e) => setTextPosition(e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="diagonal">{getMessage('Diagonal (Center)')}</Radio>
                <Radio value="center">{getMessage('Center (Horizontal)')}</Radio>
                <Radio value="top">{getMessage('Top')}</Radio>
                <Radio value="bottom">{getMessage('Bottom')}</Radio>
              </Radio.Group>
            </div>
          </>
        ) : (
          <>
            <div>
              <strong>{getMessage('Watermark Image:')}</strong>
              <Upload
                accept="image/png,image/jpeg,image/jpg"
                maxCount={1}
                beforeUpload={() => false}
                onChange={handleFileChange}
                style={{ marginTop: 8 }}
              >
                <Button icon={<UploadOutlined />}>{getMessage('Select Image (PNG/JPG)')}</Button>
              </Upload>
              {imageFile && (
                <div style={{ marginTop: 8 }}>
                  <strong>{getMessage('Selected:')}</strong> {imageFile.name}
                </div>
              )}
            </div>

            <div>
              <strong>{getMessage('Size:')}</strong>
              <Space style={{ marginTop: 8 }}>
                <span>{getMessage('Width:')}</span>
                <InputNumber
                  min={50}
                  max={500}
                  value={imageWidth}
                  onChange={(value) => setImageWidth(value || 200)}
                  style={{ width: 100 }}
                />
                <span>{getMessage('Height:')}</span>
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
              <strong>{getMessage('Opacity:')}</strong>
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
              <strong>{getMessage('Position:')}</strong>
              <Radio.Group
                value={imagePosition}
                onChange={(e) => setImagePosition(e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Radio value="center">{getMessage('Center')}</Radio>
                <Radio value="top-left">{getMessage('Top Left')}</Radio>
                <Radio value="top-right">{getMessage('Top Right')}</Radio>
                <Radio value="bottom-left">{getMessage('Bottom Left')}</Radio>
                <Radio value="bottom-right">{getMessage('Bottom Right')}</Radio>
              </Radio.Group>
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};
