import React from 'react';
import { Space, Slider, Select, Button, Typography, Divider } from 'antd';
import {
  ZoomOutOutlined,
  ZoomInOutlined,
  FullscreenOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';
import { ViewModeSelector } from './ViewModeSelector';

const { Text } = Typography;

export const BottomToolbar: React.FC = () => {
  const { zoom, setZoom, zoomIn, zoomOut, fitToPage, viewMode } = useUIStore();

  const handleSliderChange = (value: number) => {
    setZoom(value / 100);
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
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
            title="适应页面 (Ctrl+0)"
          >
            适应
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ height: 30 }} />

        {/* 右侧：查看模式 */}
        <Space size="middle" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <ViewModeSelector />
        </Space>
      </div>
    </div>
  );
};
