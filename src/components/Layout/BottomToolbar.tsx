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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'nowrap' }}>
        {/* 左侧：缩放控制 */}
        <Space size="small" style={{ flex: '0 0 auto' }}>
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            title="缩小"
          />
          <Slider
            min={50}
            max={300}
            value={Math.round(zoom * 100)}
            onChange={handleSliderChange}
            style={{ width: 150 }}
            tooltip={{ formatter: (value) => `${value}%` }}
          />
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            onClick={zoomIn}
            disabled={zoom >= 3.0}
            title="放大"
          />
          <Text style={{ minWidth: 45, textAlign: 'center', fontSize: 12 }}>
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

        <Divider orientation="vertical" style={{ height: 24 }} />

        {/* 右侧：查看模式 - 直接显示为按钮 */}
        <Space size="small" style={{ flex: '0 0 auto' }}>
          {viewModes.map((mode) => (
            <Button
              key={mode.key}
              size="small"
              type={viewMode === mode.key ? 'primary' : 'default'}
              onClick={() => setViewMode(mode.key)}
            >
              {mode.icon} {mode.label}
            </Button>
          ))}
        </Space>
      </div>
    </div>
  );
};
