import React from 'react';
import { Modal, List, Button, Space, Alert, Popconfirm, message, Tag, Empty } from 'antd';
import { StopOutlined, DeleteOutlined, ClearOutlined, CheckOutlined } from '@ant-design/icons';
import { useUIStore, type UIStoreRedactionMark as RedactionMark } from '@/stores/uiStore';

interface RedactToolProps {
  visible: boolean;
  onClose: () => void;
  onApplyRedactions: () => Promise<void>;
}

export const RedactTool: React.FC<RedactToolProps> = ({
  visible,
  onClose,
  onApplyRedactions,
}) => {
  const { redactionMarks, removeRedactionMark, clearRedactionMarks, selectedPageIndex } = useUIStore();
  const [applying, setApplying] = React.useState(false);

  // 按页分组
  const marksByPage = React.useMemo(() => {
    const groups: Record<number, RedactionMark[]> = {};
    redactionMarks.forEach(mark => {
      if (!groups[mark.pageIndex]) {
        groups[mark.pageIndex] = [];
      }
      groups[mark.pageIndex].push(mark);
    });
    return groups;
  }, [redactionMarks]);

  const currentPageMarks = marksByPage[selectedPageIndex] || [];

  const handleApply = async () => {
    if (redactionMarks.length === 0) {
      message.warning('没有密文标记可应用');
      return;
    }

    try {
      setApplying(true);
      await onApplyRedactions();
      message.success(`已应用 ${redactionMarks.length} 个密文标记`);
      onClose();
    } catch (error) {
      console.error('Error applying redactions:', error);
      message.error('应用密文失败');
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = (id: string) => {
    removeRedactionMark(id);
    message.success('已删除标记');
  };

  const handleClearCurrentPage = () => {
    clearRedactionMarks(selectedPageIndex);
    message.success(`已清空第 ${selectedPageIndex + 1} 页标记`);
  };

  const handleClearAll = () => {
    clearRedactionMarks();
    message.success('已清空所有标记');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <StopOutlined />
          密文标记管理
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="close" onClick={handleClose}>
          关闭
        </Button>,
        <Popconfirm
          key="clear"
          title="确定要清空所有标记吗？"
          onConfirm={handleClearAll}
          okText="确定"
          cancelText="取消"
        >
          <Button danger icon={<ClearOutlined />}>
            清空全部
          </Button>
        </Popconfirm>,
        <Button
          key="apply"
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleApply}
          loading={applying}
          disabled={redactionMarks.length === 0}
        >
          应用密文 ({redactionMarks.length})
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          message="安全提示"
          description="密文功能通过绘制黑色矩形覆盖敏感内容。请注意：这只是视觉遮挡，不保证底层内容完全不可提取。如需更高安全性，建议使用专业的 PDF 密文工具。"
          type="warning"
          showIcon
          closable
        />

        <div>
          <Space style={{ marginBottom: 8 }}>
            <strong>当前页标记：</strong>
            <Tag color="blue">{currentPageMarks.length} 个</Tag>
            {currentPageMarks.length > 0 && (
              <Popconfirm
                title="确定要清空当前页标记吗？"
                onConfirm={handleClearCurrentPage}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" danger icon={<ClearOutlined />}>
                  清空当前页
                </Button>
              </Popconfirm>
            )}
          </Space>

          {currentPageMarks.length === 0 ? (
            <Empty
              description="当前页暂无密文标记"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <List
              size="small"
              dataSource={currentPageMarks}
              renderItem={(mark) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定要删除此标记吗？"
                      onConfirm={() => handleDelete(mark.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>第 {mark.pageIndex + 1} 页</span>
                        <Tag>位置: ({Math.round(mark.x)}, {Math.round(mark.y)})</Tag>
                        <Tag>尺寸: {Math.round(mark.width)} × {Math.round(mark.height)}</Tag>
                      </Space>
                    }
                    description={`创建时间: ${new Date(mark.createdAt).toLocaleString()}`}
                  />
                </List.Item>
              )}
              style={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                padding: '8px 0',
              }}
            />
          )}
        </div>

        {redactionMarks.length > currentPageMarks.length && (
          <div>
            <strong>其他页标记：</strong>
            <Tag color="default">{redactionMarks.length - currentPageMarks.length} 个</Tag>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              切换到相应页面可查看和管理其他标记
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};
