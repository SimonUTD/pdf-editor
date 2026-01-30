import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, Checkbox, Upload, message, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getMessage } from '@/constants/messages';

export interface SignatureOptions {
  imageBytes: Uint8Array;
  imageWidth: number;
  imageHeight: number;
  addDate: boolean;
  dateText?: string;
  dateFontSize?: number;
  dateColor?: { r: number; g: number; b: number };
}

interface SignatureToolProps {
  visible: boolean;
  onClose: () => void;
  onAddSignature: (options: SignatureOptions) => Promise<void>;
}

export const SignatureTool: React.FC<SignatureToolProps> = ({
  visible,
  onClose,
  onAddSignature,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(150);
  const [imageHeight, setImageHeight] = useState<number>(80);
  const [addDate, setAddDate] = useState<boolean>(false);
  const [dateText, setDateText] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFontSize, setDateFontSize] = useState<number>(12);
  const [dateColor, setDateColor] = useState<string>('#000000');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      if (!file.type.includes('png')) {
        message.error('签名图片请使用 PNG 格式（支持透明背景）');
        return;
      }
      setImageFile(file);

      // 自动读取图片尺寸
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let newWidth = 150;
        let newHeight = 80;

        if (aspectRatio > 1) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }

        setImageWidth(Math.round(newWidth));
        setImageHeight(Math.round(newHeight));
      };
      img.src = URL.createObjectURL(file);
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
      : { r: 0, g: 0, b: 0 };
  };

  const handleAdd = async () => {
    try {
      setLoading(true);

      if (!imageFile) {
        message.error('请选择签名图片');
        return;
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);

      const options: SignatureOptions = {
        imageBytes,
        imageWidth,
        imageHeight,
        addDate,
        dateText: addDate ? dateText : undefined,
        dateFontSize: addDate ? dateFontSize : undefined,
        dateColor: addDate ? hexToRgb(dateColor) : undefined,
      };

      await onAddSignature(options);
      message.success('签名模式已激活，点击PDF位置放置签名');
      handleClose();
    } catch (error) {
      console.error('Error adding signature:', error);
      message.error('添加签名失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setImageWidth(150);
    setImageHeight(80);
    setAddDate(false);
    setDateText(new Date().toISOString().split('T')[0]);
    setDateFontSize(12);
    setDateColor('#000000');
    onClose();
  };

  return (
    <Modal
      title="添加PDF签名"
      open={visible}
      onCancel={handleClose}
      onOk={handleAdd}
      okText="确定"
      cancelText="取消"
      confirmLoading={loading}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 上传签名图片 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            签名图片 (PNG格式，支持透明背景):
          </div>
          <Upload
            accept="image/png"
            maxCount={1}
            beforeUpload={() => false}
            onChange={handleFileChange}
          >
            <Button icon={<UploadOutlined />}>选择签名图片</Button>
          </Upload>
          {imageFile && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              已选择: {imageFile.name}
            </div>
          )}
        </div>

        {/* 签名尺寸 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>签名尺寸:</div>
          <Space>
            <span>宽度:</span>
            <InputNumber
              min={50}
              max={300}
              value={imageWidth}
              onChange={(value) => setImageWidth(value || 150)}
              style={{ width: 100 }}
            />
            <span>高度:</span>
            <InputNumber
              min={30}
              max={200}
              value={imageHeight}
              onChange={(value) => setImageHeight(value || 80)}
              style={{ width: 100 }}
            />
          </Space>
        </div>

        {/* 添加日期选项 */}
        <div>
          <Checkbox
            checked={addDate}
            onChange={(e) => setAddDate(e.target.checked)}
          >
            添加签名日期
          </Checkbox>
        </div>

        {/* 日期设置 */}
        {addDate && (
          <>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>日期 (YYYY-MM-DD):</div>
              <Input
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                placeholder="2024-01-30"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>日期字号:</div>
              <InputNumber
                min={8}
                max={24}
                value={dateFontSize}
                onChange={(value) => setDateFontSize(value || 12)}
                style={{ width: 120 }}
              />
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>日期颜色:</div>
              <input
                type="color"
                value={dateColor}
                onChange={(e) => setDateColor(e.target.value)}
                style={{ width: 60, height: 30, cursor: 'pointer' }}
              />
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};
