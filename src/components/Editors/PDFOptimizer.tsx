import React, { useState, useCallback } from 'react';
import {
  Button,
  Space,
  Typography,
  Card,
  message,
  Modal,
  Statistic,
  Row,
  Col,
  Spin,
  Upload,
  List,
  Tag,
  Progress,
  Divider,
} from 'antd';
import {
  SettingOutlined,
  DownloadOutlined,
  SaveOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type { UploadFile } from 'antd';
import { getMessage } from '@/constants/messages';

const { Text, Title } = Typography;

interface PDFOptimizerProps {
  visible: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  onReplaceDocument: (newBytes: Uint8Array) => void;
}

interface OptimizationResult {
  id: string;
  fileName: string;
  originalSize: number;
  optimizedSize: number | null;
  originalBytes: Uint8Array;
  optimizedBytes: Uint8Array | null;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  processingTime?: number;
}

export const PDFOptimizer: React.FC<PDFOptimizerProps> = ({
  visible,
  onClose,
  pdfBytes,
  onReplaceDocument,
}) => {
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [processingAll, setProcessingAll] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 计算优化率
  const calculateOptimizationRatio = (original: number, optimized: number): string => {
    if (original === 0) return '0%';
    const ratio = ((original - optimized) / original) * 100;
    return ratio.toFixed(2) + '%';
  };

  // 优化单个PDF
  const optimizePDF = useCallback(
    async (bytes: Uint8Array): Promise<{ optimizedBytes: Uint8Array; processingTime: number }> => {
      const startTime = Date.now();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      // 使用对象流优化结构
      const optimized = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const processingTime = Date.now() - startTime;
      return { optimizedBytes: new Uint8Array(optimized), processingTime };
    },
    []
  );

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      if (!file.type.includes('pdf')) {
        message.error(getMessage('Only PDF files are supported'));
        return false;
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const newResult: OptimizationResult = {
        id: `${Date.now()}-${Math.random()}`,
        fileName: file.name,
        originalSize: bytes.length,
        optimizedSize: null,
        originalBytes: bytes,
        optimizedBytes: null,
        status: 'pending',
      };

      setOptimizationResults((prev) => [...prev, newResult]);
      return false;
    } catch (error) {
      console.error('Error reading PDF file:', error);
      message.error(getMessage('Failed to read PDF file'));
      return false;
    }
  };

  // 优化当前打开的PDF
  const handleOptimizeCurrent = async () => {
    if (!pdfBytes) {
      message.warning('请先打开PDF文件');
      return;
    }

    const currentResult: OptimizationResult = {
      id: `current-${Date.now()}`,
      fileName: '当前文档.pdf',
      originalSize: pdfBytes.length,
      optimizedSize: null,
      originalBytes: pdfBytes,
      optimizedBytes: null,
      status: 'pending',
    };

    setOptimizationResults((prev) => [...prev, currentResult]);
  };

  // 优化所有待处理文件
  const handleOptimizeAll = async () => {
    const pendingResults = optimizationResults.filter((r) => r.status === 'pending');

    if (pendingResults.length === 0) {
      message.info('没有需要优化的文件');
      return;
    }

    setProcessingAll(true);
    setOverallProgress(0);

    let completed = 0;
    const total = pendingResults.length;

    // 串行处理以避免内存和性能问题
    for (const result of pendingResults) {
      try {
        // 更新状态为处理中
        setOptimizationResults((prev) =>
          prev.map((r) =>
            r.id === result.id ? { ...r, status: 'processing' } : r
          )
        );

        // 执行优化
        const { optimizedBytes, processingTime } = await optimizePDF(result.originalBytes);

        // 更新结果
        setOptimizationResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  optimizedSize: optimizedBytes.length,
                  optimizedBytes,
                  status: 'success',
                  processingTime,
                }
              : r
          )
        );
      } catch (error) {
        console.error('Optimization error:', error);
        setOptimizationResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: 'error',
                  error: (error as Error).message,
                }
              : r
          )
        );
      }

      completed++;
      setOverallProgress(Math.round((completed / total) * 100));
    }

    setProcessingAll(false);
    message.success(`优化完成！成功: ${completed}/${total}`);
  };

  // 删除文件
  const handleRemove = (id: string) => {
    setOptimizationResults((prev) => prev.filter((r) => r.id !== id));
  };

  // 下载优化后的文件
  const handleDownload = (result: OptimizationResult) => {
    if (!result.optimizedBytes) return;

    try {
      const arrayBuffer = result.optimizedBytes.buffer.slice(
        result.optimizedBytes.byteOffset,
        result.optimizedBytes.byteOffset + result.optimizedBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const fileName = result.fileName.replace('.pdf', '_optimized.pdf');
      saveAs(blob, fileName);
      message.success('下载成功！');
    } catch (error) {
      console.error('Download error:', error);
      message.error('下载失败');
    }
  };

  // 替换当前文档
  const handleReplace = (result: OptimizationResult) => {
    if (!result.optimizedBytes) return;

    Modal.confirm({
      title: '确认替换',
      content: '确定要用优化后的PDF替换当前文档吗？此操作不可撤销。',
      okText: '确认替换',
      cancelText: '取消',
      onOk: () => {
        onReplaceDocument(result.optimizedBytes!);
        message.success('文档已替换');
        onClose();
      },
    });
  };

  // 清空列表
  const handleClear = () => {
    setOptimizationResults([]);
    setOverallProgress(0);
  };

  // 重置状态
  React.useEffect(() => {
    if (visible) {
      setOptimizationResults([]);
      setOverallProgress(0);
    }
  }, [visible]);

  // 计算统计数据
  const stats = React.useMemo(() => {
    const completed = optimizationResults.filter((r) => r.status === 'success');
    const totalOriginalSize = completed.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimizedSize = completed.reduce(
      (sum, r) => sum + (r.optimizedSize || 0),
      0
    );
    const avgProcessingTime =
      completed.length > 0
        ? completed.reduce((sum, r) => sum + (r.processingTime || 0), 0) /
          completed.length
        : 0;

    return {
      completed: completed.length,
      totalOriginalSize,
      totalOptimizedSize,
      avgProcessingTime,
    };
  }, [optimizationResults]);

  return (
    <Modal
      title={<Title level={4}>PDF优化</Title>}
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 功能说明 */}
        <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
          <Space direction="vertical" size="small">
            <Text strong>PDF结构优化功能</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              • 优化PDF内部对象结构，使用对象流压缩
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              • 移除冗余数据，重建交叉引用表
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              • 提升PDF加载速度和兼容性
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              • 注意：暂不支持线性化(Fast Web View)和资源去重
            </Text>
          </Space>
        </Card>

        {/* 文件添加 */}
        <Card title="添加PDF文件" size="small">
          <Space>
            {pdfBytes && (
              <Button icon={<SettingOutlined />} onClick={handleOptimizeCurrent}>
                优化当前文档
              </Button>
            )}
            <Upload
              accept="application/pdf"
              multiple
              beforeUpload={handleFileUpload}
              showUploadList={false}
            >
              <Button icon={<SettingOutlined />}>添加PDF文件</Button>
            </Upload>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleClear}
              disabled={optimizationResults.length === 0}
            >
              清空列表
            </Button>
          </Space>
        </Card>

        {/* 文件列表 */}
        {optimizationResults.length > 0 && (
          <Card title="文件列表" size="small">
            <List
              dataSource={optimizationResults}
              renderItem={(result) => {
                const isCompleted = result.status === 'success';
                const isError = result.status === 'error';
                const isProcessing = result.status === 'processing';

                return (
                  <List.Item
                    actions={[
                      isCompleted && (
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(result)}
                        >
                          下载
                        </Button>
                      ),
                      isCompleted && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={() => handleReplace(result)}
                        >
                          替换
                        </Button>
                      ),
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(result.id)}
                        disabled={isProcessing}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        isCompleted ? (
                          <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                        ) : isError ? (
                          <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                        ) : isProcessing ? (
                          <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        ) : (
                          <CheckCircleOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
                        )
                      }
                      title={
                        <Space>
                          <Text strong>{result.fileName}</Text>
                          {isCompleted && (
                            <Tag color="green">优化完成</Tag>
                          )}
                          {isError && <Tag color="red">优化失败</Tag>}
                          {isProcessing && <Tag color="blue">处理中...</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Text type="secondary">
                                原始大小: {formatFileSize(result.originalSize)}
                              </Text>
                            </Col>
                            <Col span={6}>
                              {isCompleted ? (
                                <Text type="secondary">
                                  优化后: {formatFileSize(result.optimizedSize!)}
                                </Text>
                              ) : (
                                <Text type="secondary">优化后: -</Text>
                              )}
                            </Col>
                            <Col span={6}>
                              {isCompleted ? (
                                <Text
                                  type={
                                    result.optimizedSize! < result.originalSize
                                      ? 'success'
                                      : 'danger'
                                  }
                                >
                                  变化: {calculateOptimizationRatio(result.originalSize, result.optimizedSize!)}
                                </Text>
                              ) : (
                                <Text type="secondary">变化: -</Text>
                              )}
                            </Col>
                            <Col span={6}>
                              {result.processingTime && (
                                <Text type="secondary">
                                  耗时: {result.processingTime}ms
                                </Text>
                              )}
                            </Col>
                          </Row>
                          {isProcessing && <Progress percent={overallProgress} size="small" />}
                          {isError && (
                            <Text type="danger" style={{ fontSize: 12 }}>
                              错误: {result.error}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />

            <Divider />

            {/* 统计信息 */}
            {stats.completed > 0 && (
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="已优化文件"
                    value={stats.completed}
                    suffix={` / ${optimizationResults.length}`}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="原始总大小"
                    value={formatFileSize(stats.totalOriginalSize)}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="优化后总大小"
                    value={formatFileSize(stats.totalOptimizedSize)}
                    valueStyle={{
                      color:
                        stats.totalOptimizedSize < stats.totalOriginalSize
                          ? '#52c41a'
                          : '#ff4d4f',
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="平均处理时间"
                    value={Math.round(stats.avgProcessingTime)}
                    suffix="ms"
                  />
                </Col>
              </Row>
            )}

            {/* 批量操作按钮 */}
            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleOptimizeAll}
                disabled={
                  optimizationResults.filter((r) => r.status === 'pending').length === 0 ||
                  processingAll
                }
                loading={processingAll}
              >
                开始批量优化
              </Button>
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
};
