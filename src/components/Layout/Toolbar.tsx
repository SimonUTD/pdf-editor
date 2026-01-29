import React from 'react';
import { Button, Space, Typography, Divider, Dropdown, Row, Col } from 'antd';
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
  MoreOutlined,
  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';
import { translate } from '@/constants/translations';

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
  onReversePages: () => void;
  onReplacePage: () => void;
  onRotatePageLeft?: () => void;
  onRotatePageRight?: () => void;
  onFlipPage?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onReplacePage,
  onReversePages,
  onRotatePageLeft,
  onRotatePageRight,
  onFlipPage,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  fileName,
  hasUnsavedChanges,
  canSave,
}) => {
  const { zoom, zoomIn, zoomOut, resetZoom, toolMode, setToolMode } = useUIStore();

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'export-images',
      label: translate('Export as Images (PNG)'),
      icon: <FileImageOutlined />,
      onClick: onExportAsImages,
    },
    {
      key: 'export-text',
      label: translate('Export as Text (TXT)'),
      icon: <FileTextOutlined />,
      onClick: onExportAsText,
    },
    {
      key: 'export-word',
      label: translate('Export as Word (DOCX)'),
      icon: <FileWordOutlined />,
      onClick: onExportAsWord,
    },
  ];

  const toolsMenuItems: MenuProps['items'] = [
    {
      key: 'merge',
      label: translate('Merge PDFs'),
      icon: <MergeCellsOutlined />,
      onClick: onMergePDFs,
    },
    {
      key: 'watermark',
      label: translate('Watermark'),
      icon: <FontColorsOutlined />,
      onClick: onAddWatermark,
    },
    {
      key: 'header-footer',
      label: translate('Header/Footer'),
      icon: <FontSizeOutlined />,
      onClick: onAddHeaderFooter,
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'replace',
      label: '替换页面',
      icon: <SwapOutlined />,
      onClick: onReplacePage,
    },
    {
      key: 'reverse',
      label: translate('Reverse Pages'),
      icon: <SortAscendingOutlined />,
      onClick: onReversePages,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Row align="middle" style={{ padding: '8px 16px' }}>
        {/* 文件操作区 */}
        <Col flex="0 0 auto">
          <Space size="small">
            <Button size="small" icon={<FileOutlined />} onClick={onOpenFile}>
              打开
            </Button>
            <Button
              size="small"
              icon={<SaveOutlined />}
              onClick={onSave}
              disabled={!canSave || !hasUnsavedChanges}
            >
              保存
            </Button>
            <Button size="small" onClick={onSaveAs} disabled={!canSave}>
              另存
            </Button>
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={onPrint}
              disabled={!canSave}
            >
              打印
            </Button>
          </Space>
        </Col>

        <Divider orientation="vertical" />

        {/* 撤销/重做区 */}
        <Col flex="0 0 auto">
          <Space size="small">
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
              title="撤销 (Ctrl+Z)"
            >
              撤销
            </Button>
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
              title="重做 (Ctrl+Y)"
            >
              重做
            </Button>
          </Space>
        </Col>

        <Divider orientation="vertical" />

        {/* 插入操作区 */}
        <Col flex="0 0 auto">
          <Space size="small">
            <Button
              size="small"
              icon={<PictureOutlined />}
              onClick={onInsertImage}
              disabled={!canSave}
            >
              插入图片
            </Button>
            <Button
              size="small"
              icon={<FontSizeOutlined />}
              onClick={onInsertText}
              disabled={!canSave}
            >
              插入文本
            </Button>
          </Space>
        </Col>

        <Divider orientation="vertical" />

        {/* 工具模式区 */}
        <Col flex="0 0 auto">
          <Space size="small">
            <Button
              size="small"
              type={toolMode === 'erase' ? 'primary' : 'default'}
              icon={<ScissorOutlined />}
              onClick={() => setToolMode(toolMode === 'erase' ? 'view' : 'erase')}
              disabled={!canSave}
              danger={toolMode === 'erase'}
            >
              {toolMode === 'erase' ? '退出擦除' : '擦除'}
            </Button>
            <Button
              size="small"
              type={toolMode === 'highlight' ? 'primary' : 'default'}
              icon={<HighlightOutlined />}
              onClick={() => setToolMode(toolMode === 'highlight' ? 'view' : 'highlight')}
              disabled={!canSave}
              style={toolMode === 'highlight' ? { backgroundColor: '#ffec3d', borderColor: '#ffec3d', color: '#000' } : {}}
            >
              {toolMode === 'highlight' ? '退出高亮' : '高亮'}
            </Button>
          </Space>
        </Col>

        <Divider orientation="vertical" />

        {/* 页面旋转区 */}
        <Col flex="0 0 auto">
          <Space size="small">
            <Button
              size="small"
              icon={<RotateLeftOutlined />}
              onClick={onRotatePageLeft}
              disabled={!canSave}
              title="向左旋转90度"
            >
              左转
            </Button>
            <Button
              size="small"
              icon={<RotateRightOutlined />}
              onClick={onRotatePageRight}
              disabled={!canSave}
              title="向右旋转90度"
            >
              右转
            </Button>
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={onFlipPage}
              disabled={!canSave}
              title="翻转180度"
            >
              翻转
            </Button>
          </Space>
        </Col>

        <Divider orientation="vertical" />

        {/* 更多工具区 */}
        <Col flex="0 0 auto">
          <Dropdown menu={{ items: toolsMenuItems }} disabled={!canSave}>
            <Button size="small" icon={<MoreOutlined />}>
              更多工具
            </Button>
          </Dropdown>
        </Col>

        <Divider orientation="vertical" />

        {/* 导出区 */}
        <Col flex="0 0 auto">
          <Dropdown menu={{ items: exportMenuItems }} disabled={!canSave}>
            <Button size="small" icon={<ExportOutlined />}>
              导出
            </Button>
          </Dropdown>
        </Col>

        <Divider orientation="vertical" />

        {/* 文件名和缩放 */}
        <Col flex="1 1 auto" style={{ overflow: 'hidden', textAlign: 'right' }}>
          <Space size="small">
            {fileName && (
              <Text
                ellipsis
                style={{ maxWidth: 300, color: hasUnsavedChanges ? '#ff4d4f' : undefined }}
              >
                {fileName}
                {hasUnsavedChanges && ' *'}
              </Text>
            )}
            <Button size="small" icon={<ZoomOutOutlined />} onClick={zoomOut} />
            <Text style={{ minWidth: 45, textAlign: 'center', fontSize: 12 }}>
              {Math.round(zoom * 100)}%
            </Text>
            <Button size="small" icon={<ZoomInOutlined />} onClick={zoomIn} />
            <Button size="small" icon={<FullscreenOutlined />} onClick={resetZoom}>
              适应
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
