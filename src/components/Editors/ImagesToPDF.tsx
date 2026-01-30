import React, { useState } from 'react';
import { Button, Upload, Select, Space, Typography, List, Card, message, Modal, Radio } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, FileImageOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

const { Text, Title } = Typography;
const { Option } = Select;

interface ImageFile {
  uid: string;
  name: string;
  url: string;
  file: File;
  rotation: number;
}

interface ImagesToPDFProps {
  visible: boolean;
  onClose: () => void;
}

type PageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';
type PageOrientation = 'portrait' | 'landscape';
type ImageFit = 'fit' | 'fill' | 'stretch' | 'center';

const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
  'A4': { width: 595.28, height: 841.89 },
  'A3': { width: 841.89, height: 1190.55 },
  'A5': { width: 420.94, height: 595.28 },
  'Letter': { width: 612, height: 792 },
  'Legal': { width: 612, height: 1008 },
};

export const ImagesToPDF: React.FC<ImagesToPDFProps> = ({ visible, onClose }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [imageFit, setImageFit] = useState<ImageFit>('fit');
  const [converting, setConverting] = useState(false);

  // 处理图片上传
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file } = options;

    try {
      const fileObj = file as File;
      const url = URL.createObjectURL(fileObj);
      const imageFile: ImageFile = {
        uid: `${Date.now()}-${Math.random()}`,
        name: fileObj.name,
        url,
        file: fileObj,
        rotation: 0,
      };

      setImages(prev => [...prev, imageFile]);
      options.onSuccess?.({});
    } catch (error) {
      console.error('Upload error:', error);
      options.onError?.(error as Error);
      message.error('图片加载失败');
    }
  };

  // 移除图片
  const removeImage = (uid: string) => {
    setImages(prev => {
      const image = prev.find(img => img.uid === uid);
      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter(img => img.uid !== uid);
    });
  };

  // 调整图片顺序
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;

    setImages(prev => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      if (removed) {
        newImages.splice(toIndex, 0, removed);
      }
      return newImages;
    });
  };

  // 旋转图片
  const rotateImage = (uid: string) => {
    setImages(prev => prev.map(img =>
      img.uid === uid ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  // 获取页面尺寸（考虑方向）
  const getPageDimensions = () => {
    const size = PAGE_SIZES[pageSize];
    if (orientation === 'landscape') {
      return { width: size.height, height: size.width };
    }
    return size;
  };

  // 转换为PDF
  const convertToPDF = async () => {
    if (images.length === 0) {
      message.warning('请先添加图片');
      return;
    }

    setConverting(true);

    try {
      // 创建PDF文档
      const pdfDoc = await PDFDocument.create();
      const pageDimensions = getPageDimensions();

      for (const imageFile of images) {
        // 添加页面
        const page = pdfDoc.addPage([pageDimensions.width, pageDimensions.height]);

        // 加载图片
        const imageBytes = await imageFile.file.arrayBuffer();
        let image;

        // 根据文件类型加载图片
        if (imageFile.file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (imageFile.file.type === 'image/jpeg' || imageFile.file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          // 其他格式，尝试用PNG
          image = await pdfDoc.embedPng(imageBytes);
        }

        let x = 0;
        let y = 0;
        let width = pageDimensions.width;
        let height = pageDimensions.height;

        // 根据fit模式计算
        switch (imageFit) {
          case 'fit':
            const fitScale = Math.min(
              pageDimensions.width / image.width,
              pageDimensions.height / image.height
            );
            width = image.width * fitScale;
            height = image.height * fitScale;
            x = (pageDimensions.width - width) / 2;
            y = (pageDimensions.height - height) / 2;
            break;
          case 'fill':
            width = pageDimensions.width;
            height = pageDimensions.height;
            x = 0;
            y = 0;
            break;
          case 'stretch':
            width = pageDimensions.width;
            height = pageDimensions.height;
            x = 0;
            y = 0;
            break;
          case 'center':
            width = image.width;
            height = image.height;
            x = (pageDimensions.width - width) / 2;
            y = (pageDimensions.height - height) / 2;
            break;
        }

        // 绘制图片
        page.drawImage(image, {
          x,
          y,
          width,
          height,
        });
      }

      // 保存PDF
      const pdfBytes = await pdfDoc.save();
      // Create blob from ArrayBuffer (ensure it's not SharedArrayBuffer)
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      saveAs(pdfBlob, `images-to-pdf-${Date.now()}.pdf`);

      message.success(`成功将 ${images.length} 张图片转换为PDF`);

      // 清理URL
      images.forEach(img => {
        if (img.url) URL.revokeObjectURL(img.url);
      });
      setImages([]);

    } catch (error) {
      console.error('Convert error:', error);
      message.error('转换失败：' + (error as Error).message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>图片转PDF</Title>}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Space style={{ width: '100%' }} size="large" direction="vertical">
        {/* 上传区域 */}
        <Card title="1. 选择图片" size="small">
          <Upload
            accept="image/png,image/jpeg,image/jpg"
            customRequest={handleUpload}
            multiple
            showUploadList={false}
            disabled={converting}
          >
            <Button icon={<UploadOutlined />} disabled={converting}>
              选择图片
            </Button>
          </Upload>
        </Card>

        {/* 图片列表 */}
        {images.length > 0 && (
          <Card title={`2. 调整顺序 (${images.length} 张)`} size="small">
            <List
              dataSource={images}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      icon={<UploadOutlined />}
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0 || converting}
                    >
                      上移
                    </Button>,
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === images.length - 1 || converting}
                    >
                      下移
                    </Button>,
                    <Button
                      size="small"
                      onClick={() => rotateImage(item.uid)}
                      disabled={converting}
                    >
                      旋转{item.rotation > 0 ? `(${item.rotation}°)` : ''}
                    </Button>,
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeImage(item.uid)}
                      disabled={converting}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <Space>
                    <img
                      src={item.url}
                      alt={item.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'contain',
                        border: '1px solid #f0f0f0',
                      }}
                    />
                    <Text>{item.name}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 设置区域 */}
        {images.length > 0 && (
          <Card title="3. 设置" size="small">
            <Space wrap>
              <Space>
                <Text>页面大小:</Text>
                <Select
                  value={pageSize}
                  onChange={setPageSize}
                  style={{ width: 100 }}
                  disabled={converting}
                >
                  <Option value="A4">A4</Option>
                  <Option value="A3">A3</Option>
                  <Option value="A5">A5</Option>
                  <Option value="Letter">Letter</Option>
                  <Option value="Legal">Legal</Option>
                </Select>
              </Space>

              <Space>
                <Text>方向:</Text>
                <Radio.Group
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  disabled={converting}
                >
                  <Radio.Button value="portrait">纵向</Radio.Button>
                  <Radio.Button value="landscape">横向</Radio.Button>
                </Radio.Group>
              </Space>

              <Space>
                <Text>图片适配:</Text>
                <Select
                  value={imageFit}
                  onChange={setImageFit}
                  style={{ width: 100 }}
                  disabled={converting}
                >
                  <Option value="fit">适应</Option>
                  <Option value="fill">填充</Option>
                  <Option value="stretch">拉伸</Option>
                  <Option value="center">居中</Option>
                </Select>
              </Space>
            </Space>
          </Card>
        )}

        {/* 操作按钮 */}
        <Card size="small">
          <Space>
            <Button
              type="primary"
              icon={<FileImageOutlined />}
              onClick={convertToPDF}
              disabled={images.length === 0 || converting}
              loading={converting}
            >
              转换为PDF
            </Button>
            <Button onClick={onClose} disabled={converting}>
              取消
            </Button>
            <Text type="secondary">
              提示：已选择 {images.length} 张图片
            </Text>
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};
