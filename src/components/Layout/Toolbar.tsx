import React from 'react';
import { Button, Space, Typography } from 'antd';
import {
  FileOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';

const { Text } = Typography;

interface ToolbarProps {
  onOpenFile: () => void;
  fileName: string | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenFile, fileName }) => {
  const { zoom, zoomIn, zoomOut, resetZoom } = useUIStore();

  return (
    <div
      style={{
        height: 56,
        borderBottom: '1px solid #f0f0f0',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
      }}
    >
      <Space>
        <Button icon={<FileOutlined />} onClick={onOpenFile}>
          Open PDF
        </Button>
        {fileName && <Text type="secondary">{fileName}</Text>}
      </Space>

      <Space>
        <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
        <Text style={{ minWidth: 60, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Text>
        <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
        <Button icon={<FullscreenOutlined />} onClick={resetZoom}>
          Fit
        </Button>
      </Space>
    </div>
  );
};
