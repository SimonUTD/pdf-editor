import React from 'react';
import { Button, Space, Typography, Divider } from 'antd';
import {
  FileOutlined,
  SaveOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';

const { Text } = Typography;

interface ToolbarProps {
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onPrint: () => void;
  fileName: string | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onSave,
  onSaveAs,
  onPrint,
  fileName,
  hasUnsavedChanges,
  canSave,
}) => {
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
      <Space split={<Divider type="vertical" />}>
        <Space>
          <Button icon={<FileOutlined />} onClick={onOpenFile}>
            Open
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={onSave}
            disabled={!canSave || !hasUnsavedChanges}
          >
            Save
          </Button>
          <Button onClick={onSaveAs} disabled={!canSave}>
            Save As
          </Button>
          <Button icon={<PrinterOutlined />} onClick={onPrint} disabled={!canSave}>
            Print
          </Button>
        </Space>

        <Space>
          {fileName && (
            <Text type="secondary">
              {fileName}
              {hasUnsavedChanges && ' *'}
            </Text>
          )}
        </Space>
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
