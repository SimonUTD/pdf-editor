import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, List, Card, message, Modal, Progress } from 'antd';
import { DownloadOutlined, FileImageOutlined } from '@ant-design/icons';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { saveAs } from 'file-saver';

const { Text, Title } = Typography;

interface ExtractedImage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

interface ImageExtractorProps {
  visible: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
}

export const ImageExtractor: React.FC<ImageExtractorProps> = ({
  visible,
  onClose,
  pdfDocument,
}) => {
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setExtractedImages([]);
      setProgress(0);
    }
  }, [visible]);

  // Extract images from PDF
  const extractImages = async () => {
    if (!pdfDocument) {
      message.warning('请先打开PDF文件');
      return;
    }

    setExtracting(true);
    setExtractedImages([]);
    setProgress(0);

    try {
      const totalPages = pdfDocument.numPages;
      const images: ExtractedImage[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const ops = await page.getOperatorList();

        // Look for image operations in the operator list
        // In PDF.js, image operations have specific function numbers
        for (let i = 0; i < ops.fnArray.length; i++) {
          const args = ops.argsArray[i];

          // Check if this operation has arguments (likely an image or resource)
          if (args && args.length > 0) {
            const imageName = String(args[0]);

            try {
              // Try to get the object - if it's an image, this will succeed
              const image = await page.objs.get(imageName);

              if (image && (image.data || image.bitmap)) {
                // Create canvas to draw the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (ctx) {
                  let dataUrl = '';
                  let width = 100;
                  let height = 100;

                  // Handle different image formats
                  if (image.bitmap) {
                    // Image has a bitmap (HTMLImageElement or similar)
                    canvas.width = image.bitmap.width || 100;
                    canvas.height = image.bitmap.height || 100;
                    ctx.drawImage(image.bitmap, 0, 0);
                    dataUrl = canvas.toDataURL('image/png');
                    width = canvas.width;
                    height = canvas.height;
                  } else if (image.data) {
                    // Image has raw data
                    canvas.width = image.width || 100;
                    canvas.height = image.height || 100;

                    // Put image data
                    let imageData;
                    if (image.data instanceof Uint8ClampedArray) {
                      imageData = new ImageData(image.data, image.width, image.height);
                    } else if (image.data instanceof Uint8Array) {
                      const clampedData = new Uint8ClampedArray(image.data);
                      imageData = new ImageData(clampedData, image.width, image.height);
                    } else if (image.data instanceof ImageData) {
                      imageData = image.data;
                    } else {
                      continue;
                    }

                    ctx.putImageData(imageData, 0, 0);
                    dataUrl = canvas.toDataURL('image/png');
                    width = image.width || 100;
                    height = image.height || 100;
                  }

                  if (dataUrl) {
                    images.push({
                      id: `${pageNum}-${i}-${Date.now()}`,
                      pageNumber: pageNum,
                      dataUrl,
                      width,
                      height,
                    });
                  }
                }
              }
            } catch (err) {
              // Skip objects that can't be extracted as images
              // This is expected - not all objects are images
            }
          }
        }

        // Update progress
        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      setExtractedImages(images);

      if (images.length === 0) {
        message.info('未找到可提取的图像');
      } else {
        message.success(`成功提取 ${images.length} 张图像`);
      }
    } catch (error) {
      console.error('Extract error:', error);
      message.error('提取图像失败：' + (error as Error).message);
    } finally {
      setExtracting(false);
      setProgress(0);
    }
  };

  // Download single image
  const downloadImage = (image: ExtractedImage) => {
    try {
      const byteString = atob(image.dataUrl.split(',')[1]);
      const mimeString = image.dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });
      saveAs(blob, `image-page-${image.pageNumber}-${image.id}.png`);
      message.success('图像下载成功');
    } catch (error) {
      console.error('Download error:', error);
      message.error('下载失败');
    }
  };

  // Download all images as ZIP
  const downloadAllImages = async () => {
    if (extractedImages.length === 0) {
      message.warning('没有可下载的图像');
      return;
    }

    // Download each image individually
    for (let i = 0; i < extractedImages.length; i++) {
      downloadImage(extractedImages[i]);
      // Add a small delay to avoid browser blocking multiple downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    message.success(`已下载 ${extractedImages.length} 张图像`);
  };

  return (
    <Modal
      title={<Title level={4}>提取PDF图像</Title>}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <Space size="large" style={{ width: '100%' }} direction="vertical">
        {/* 操作区域 */}
        <Card size="small">
          <Space>
            <Button
              type="primary"
              icon={<FileImageOutlined />}
              onClick={extractImages}
              disabled={extracting || !pdfDocument}
              loading={extracting}
            >
              开始提取
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadAllImages}
              disabled={extractedImages.length === 0 || extracting}
            >
              下载全部 ({extractedImages.length})
            </Button>
            <Button onClick={onClose} disabled={extracting}>
              关闭
            </Button>
            {extracting && (
              <Progress
                percent={progress}
                status="active"
                style={{ width: 200 }}
              />
            )}
          </Space>
        </Card>

        {/* 图像列表 */}
        {extractedImages.length > 0 && (
          <Card title={`已提取 ${extractedImages.length} 张图像`} size="small">
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
                xl: 4,
                xxl: 6,
              }}
              dataSource={extractedImages}
              renderItem={(image) => (
                <List.Item>
                  <Card
                    size="small"
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 150,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f5f5f5',
                          padding: 8,
                        }}
                      >
                        <img
                          src={image.dataUrl}
                          alt={`Page ${image.pageNumber}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <Text style={{ fontSize: 12 }}>
                          第 {image.pageNumber} 页
                        </Text>
                      }
                      description={
                        <Text style={{ fontSize: 11 }} type="secondary">
                          {image.width} × {image.height}
                        </Text>
                      }
                    />
                    <Button
                      type="primary"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadImage(image)}
                      style={{ marginTop: 8 }}
                      block
                    >
                      下载
                    </Button>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 提示信息 */}
        {extractedImages.length === 0 && !extracting && (
          <Card size="small">
            <Text type="secondary">
              点击"开始提取"按钮从PDF中提取所有图像
            </Text>
          </Card>
        )}
      </Space>
    </Modal>
  );
};
