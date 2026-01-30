import React from 'react';
import { Space, Slider, Button, Typography, Divider } from 'antd';
import {
  ZoomOutOutlined,
  ZoomInOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';
import type { ViewMode } from '@/services/viewer';

const { Text } = Typography;

export const BottomToolbar: React.FC = () => {
  const { zoom, setZoom, zoomIn, zoomOut, fitToPage, viewMode, setViewMode } = useUIStore();

  const handleSliderChange = (value: number) => {
    setZoom(value / 100);
  };

  const viewModes: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'actual', label: '1:1', icon: '🔍' },
    { key: 'fit-page', label: '完整页面', icon: '📄' },
    { key: 'fit-width', label: '宽度100%', icon: '↔️' },
    { key: 'two-page', label: '双页并排', icon: '📑' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
        padding: '8px 16px',
        zIndex: 1000,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
        {/* 左侧：缩放控制 */}
        <Space size="middle" style={{ flex: 1 }}>
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            title="缩小 (Ctrl+-)"
          />
          <Slider
            min={50}
            max={300}
            value={Math.round(zoom * 100)}
            onChange={handleSliderChange}
            style={{ width: 200 }}
            tooltip={{ formatter: (value) => `${value}%` }}
          />
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            onClick={zoomIn}
            disabled={zoom >= 3.0}
            title="放大 (Ctrl++)"
          />
          <Text style={{ minWidth: 50, textAlign: 'center', fontSize: 13 }}>
            {Math.round(zoom * 100)}%
          </Text>
          <Button
            size="small"
            icon={<FullscreenOutlined />}
            onClick={fitToPage}
            title="适应页面"
          >
            适应
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ height: 30 }} />

        {/* 中间：查看模式 - 直接显示为按钮 */}
        <Space size="small" style={{ flex: 2, justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: '#666' }}>显示模式：</Text>
          {viewModes.map((mode) => (
            <Button
              key={mode.key}
              size="small"
              type={viewMode === mode.key ? 'primary' : 'default'}
              onClick={() => setViewMode(mode.key)}
              title={mode.label}
            >
              {mode.icon} {mode.label}
            </Button>
          ))}
        </Space>

        <Divider orientation="vertical" style={{ height: 30 }} />

        {/* 右侧：留空用于扩展 */}
        <Space size="middle" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#999' }}>
            滚轮翻页 | Ctrl+滚轮缩放
          </Text>
        </Space>
      </div>
    </div>
  );
};
