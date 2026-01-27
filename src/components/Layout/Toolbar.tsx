import React from 'react';
import { Button, Space, Typography, Divider, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  FileOutlined,
  SaveOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  ExportOutlined,
  PictureOutlined,
  FontSizeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileWordOutlined,
  MergeCellsOutlined,
  FontColorsOutlined,
  HighlightOutlined,
  ScissorOutlined,
  SwapOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';

const { Text } = Typography;

interface ToolbarProps {
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onPrint: () => void;
  onInsertImage: () => void;
  onInsertText: () => void;
  onExportAsImages: () => void;
  onExportAsText: () => void;
  onExportAsWord: () => void;
  onMergePDFs: () => void;
  onAddWatermark: () => void;
  onAddHeaderFooter: () => void;
  onEraseContent: () => void;
  onAddHighlight: () => void;
  onReplacePage: () => void;
  onReversePages: () => void;
  fileName: string | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onSave,
  onSaveAs,
  onPrint,
  onInsertImage,
  onInsertText,
  onExportAsImages,
  onExportAsText,
  onExportAsWord,
  onMergePDFs,
  onAddWatermark,
  onAddHeaderFooter,
  onEraseContent,
  onAddHighlight,
  onReplacePage,
  onReversePages,
  fileName,
  hasUnsavedChanges,
  canSave,
}) => {
  const { zoom, zoomIn, zoomOut, resetZoom } = useUIStore();

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'export-images',
      label: 'Export as Images (PNG)',
      icon: <FileImageOutlined />,
      onClick: onExportAsImages,
    },
    {
      key: 'export-text',
      label: 'Export as Text (TXT)',
      icon: <FileTextOutlined />,
      onClick: onExportAsText,
    },
    {
      key: 'export-word',
      label: 'Export as Word (DOCX)',
      icon: <FileWordOutlined />,
      onClick: onExportAsWord,
    },
  ];

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
          <Button
            icon={<PictureOutlined />}
            onClick={onInsertImage}
            disabled={!canSave}
          >
            Insert Image
          </Button>
          <Button
            icon={<FontSizeOutlined />}
            onClick={onInsertText}
            disabled={!canSave}
          >
            Insert Text
          </Button>
        </Space>

        <Space>
          <Button
            icon={<MergeCellsOutlined />}
            onClick={onMergePDFs}
          >
            Merge PDFs
          </Button>
          <Button
            icon={<FontColorsOutlined />}
            onClick={onAddWatermark}
            disabled={!canSave}
          >
            Watermark
          </Button>
          <Button
            icon={<FontSizeOutlined />}
            onClick={onAddHeaderFooter}
            disabled={!canSave}
          >
            Header/Footer
          </Button>
          <Button
            icon={<HighlightOutlined />}
            onClick={onAddHighlight}
            disabled={!canSave}
          >
            Highlight
          </Button>
          <Button
            icon={<ScissorOutlined />}
            onClick={onEraseContent}
            disabled={!canSave}
          >
            Erase
          </Button>
          <Button
            icon={<SortAscendingOutlined />}
            onClick={onReversePages}
            disabled={!canSave}
          >
            Reverse Pages
          </Button>
        </Space>

        <Space>
          <Dropdown menu={{ items: exportMenuItems }} disabled={!canSave}>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Dropdown>
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
