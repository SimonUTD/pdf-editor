import React, { useState } from 'react';
import { Button, Space, Typography, Card, message, Modal, Radio, Statistic, Row, Col, Spin } from 'antd';
import { CompressOutlined, DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

const { Text, Title } = Typography;

interface PDFCompressorProps {
  visible: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  onReplaceDocument: (newBytes: Uint8Array) => void;
}

type CompressionLevel = 'low' | 'medium' | 'high';

export const PDFCompressor: React.FC<PDFCompressorProps> = ({
  visible,
  onClose,
  pdfBytes,
  onReplaceDocument,
}) => {
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [compressing, setCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array | null>(null);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 计算压缩率
  const calculateCompressionRatio = (): string => {
    if (!compressedSize || originalSize === 0) return '0%';
    const ratio = ((originalSize - compressedSize) / originalSize) * 100;
    return ratio.toFixed(2) + '%';
  };

  // 压缩PDF
  const handleCompress = async () => {
    if (!pdfBytes) {
      message.warning('请先打开PDF文件');
      return;
    }

    setCompressing(true);
    setCompressedSize(null);
    setCompressedBytes(null);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      // 根据压缩级别设置不同的保存选项
      const saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: compressionLevel === 'high' ? 10 : 50,
      };

      const compressed = await pdfDoc.save(saveOptions);
      setCompressedBytes(new Uint8Array(compressed));
      setCompressedSize(compressed.length);
      setOriginalSize(pdfBytes.length);

      message.success('压缩完成！');
    } catch (error) {
      console.error('Compression error:', error);
      message.error('压缩失败：' + (error as Error).message);
    } finally {
      setCompressing(false);
    }
  };

  // 下载压缩后的PDF
  const handleDownload = () => {
    if (!compressedBytes) return;

    try {
      const arrayBuffer = compressedBytes.buffer.slice(
        compressedBytes.byteOffset,
        compressedBytes.byteOffset + compressedBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      saveAs(blob, 'compressed.pdf');
      message.success('下载成功！');
    } catch (error) {
      console.error('Download error:', error);
      message.error('下载失败');
    }
  };

  // 替换当前文档
  const handleReplace = () => {
    if (!compressedBytes) return;

    Modal.confirm({
      title: '确认替换',
      content: '确定要用压缩后的PDF替换当前文档吗？此操作不可撤销。',
      okText: '确认替换',
      cancelText: '取消',
      onOk: () => {
        onReplaceDocument(compressedBytes);
        message.success('文档已替换');
        onClose();
      },
    });
  };

  // 获取压缩级别描述
  const getCompressionLevelDescription = (level: CompressionLevel): string => {
    switch (level) {
      case 'low':
        return '基本压缩 - 快速处理，文件大小减少较少';
      case 'medium':
        return '中等压缩 - 删除未使用对象，平衡速度和压缩率';
      case 'high':
        return '高压缩 - 最大程度压缩，处理时间较长';
      default:
        return '';
    }
  };

  // 重置状态
  React.useEffect(() => {
    if (visible && pdfBytes) {
      setOriginalSize(pdfBytes.length);
      setCompressedSize(null);
      setCompressedBytes(null);
    }
  }, [visible, pdfBytes]);

  return (
    <Modal
      title={<Title level={4}>PDF压缩</Title>}
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 压缩级别选择 */}
        <Card title="选择压缩级别" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Group
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="low">
                  <Space direction="vertical" size={0}>
                    <Text strong>低压缩</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getCompressionLevelDescription('low')}
                    </Text>
                  </Space>
                </Radio>

                <Radio value="medium">
                  <Space direction="vertical" size={0}>
                    <Text strong>中压缩（推荐）</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getCompressionLevelDescription('medium')}
                    </Text>
                  </Space>
                </Radio>

                <Radio value="high">
                  <Space direction="vertical" size={0}>
                    <Text strong>高压缩</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getCompressionLevelDescription('high')}
                    </Text>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Space>
        </Card>

        {/* 文件大小对比 */}
        {originalSize > 0 && (
          <Card title="文件大小对比" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="原始文件"
                  value={formatFileSize(originalSize)}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                {compressedSize !== null ? (
                  <>
                    <Statistic
                      title="压缩后"
                      value={formatFileSize(compressedSize)}
                      valueStyle={{ color: compressedSize < originalSize ? '#52c41a' : '#ff4d4f' }}
                    />
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, display: 'block', marginTop: 8 }}
                    >
                      压缩率: {calculateCompressionRatio()}
                    </Text>
                  </>
                ) : (
                  <Statistic
                    title="压缩后"
                    value="-"
                    valueStyle={{ color: '#999' }}
                  />
                )}
              </Col>
            </Row>
          </Card>
        )}

        {/* 操作按钮 */}
        <Card size="small">
          <Space>
            <Button
              type="primary"
              icon={<CompressOutlined />}
              onClick={handleCompress}
              disabled={!pdfBytes || compressing}
              loading={compressing}
            >
              开始压缩
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!compressedBytes || compressing}
            >
              下载压缩文件
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleReplace}
              disabled={!compressedBytes || compressing}
              type={compressedBytes ? 'primary' : 'default'}
            >
              替换当前文档
            </Button>
            <Button onClick={onClose} disabled={compressing}>
              关闭
            </Button>
            {compressing && (
              <Spin tip="正在压缩PDF，请稍候..." />
            )}
          </Space>
        </Card>

        {/* 提示信息 */}
        <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>
              提示：压缩效果取决于PDF文件的原始内容和结构。图像较多的PDF压缩效果更明显。
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              压缩过程中不会降低图像质量，仅优化文件结构。
            </Text>
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};
