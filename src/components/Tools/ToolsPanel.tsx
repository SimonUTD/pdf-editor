import React from 'react';
import { Card, Collapse, Space, Typography } from 'antd';
import {
  FileSearchOutlined,
  ScissorOutlined,
  CompressOutlined,
  SwapOutlined,
  SafetyOutlined,
  ToolOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined,
  KeyOutlined,
  SettingOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Title } = Typography;

interface ToolsPanelProps {
  onToolSelect: (tool: string) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ onToolSelect }) => {
  const tools = [
    {
      category: '查看增强',
      icon: <EyeOutlined />,
      items: [
        { key: 'view-modes', label: '查看模式', icon: <EyeOutlined /> },
        { key: 'quick-jump', label: '快捷跳转', icon: <SearchOutlined /> },
        { key: 'text-search', label: '文本搜索', icon: <FileSearchOutlined /> },
      ],
    },
    {
      category: '转换工具',
      icon: <SwapOutlined />,
      items: [
        { key: 'pdf-convert', label: 'PDF转换器', icon: <SwapOutlined /> },
        { key: 'image-to-pdf', label: '图片转PDF', icon: <FileImageOutlined /> },
        { key: 'extract-images', label: '提取图像', icon: <DownloadOutlined /> },
      ],
    },
    {
      category: '编辑工具',
      icon: <EditOutlined />,
      items: [
        { key: 'pdf-split', label: 'PDF拆分', icon: <ScissorOutlined /> },
        { key: 'extract-pages', label: '页面提取', icon: <DownloadOutlined /> },
        { key: 'reorder-pages', label: '页面重排', icon: <SwapOutlined /> },
        { key: 'page-numbers', label: '添加页码', icon: <ToolOutlined /> },
        { key: 'redact', label: '标记密文', icon: <SafetyOutlined /> },
      ],
    },
    {
      category: '高级功能',
      icon: <SettingOutlined />,
      items: [
        { key: 'compress', label: 'PDF压缩', icon: <CompressOutlined /> },
        { key: 'signature', label: 'PDF签署', icon: <EditOutlined /> },
        { key: 'security', label: '密码保护', icon: <KeyOutlined /> },
        { key: 'optimize', label: 'PDF优化', icon: <SettingOutlined /> },
      ],
    },
  ];

  return (
    <Card title={<Title level={4}>工具箱</Title>}>
      <Collapse accordion>
        {tools.map((category) => (
          <Panel
            header={
              <Space>
                {category.icon}
                <span>{category.category}</span>
              </Space>
            }
            key={category.category}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {category.items.map((item) => (
                <div
                  key={item.key}
                  onClick={() => onToolSelect(item.key)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Space>
                    {item.icon}
                    <span>{item.label}</span>
                  </Space>
                </div>
              ))}
            </Space>
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
};
