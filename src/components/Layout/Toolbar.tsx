import React from 'react';
import { Button, Space, Typography, Divider, Row, Col } from 'antd';
import {
  FileOutlined,
  SaveOutlined,
  PrinterOutlined,
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
  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SyncOutlined,
  AppstoreOutlined,
  FileSearchOutlined,
  CompressOutlined,
  SafetyOutlined,
  ToolOutlined,
  SettingOutlined,
  DownloadOutlined,
  EditOutlined,
  KeyOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/stores';
import { PageJumpControl } from './PageJumpControl';
import { SearchToolbar } from './SearchToolbar';

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
  const { toolMode, setToolMode } = useUIStore();

  return (
    <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      {/* 第一行：基本操作 */}
      <Row align="middle" style={{ padding: '6px 12px', borderBottom: '1px solid #f5f5f5' }}>
        <Space size="small">
          <Button size="small" icon={<FileOutlined />} onClick={onOpenFile}>
            打开
          </Button>
          <Button size="small" icon={<SaveOutlined />} onClick={onSave} disabled={!canSave || !hasUnsavedChanges}>
            保存
          </Button>
          <Button size="small" onClick={onSaveAs} disabled={!canSave}>
            另存
          </Button>
          <Button size="small" icon={<PrinterOutlined />} onClick={onPrint} disabled={!canSave}>
            打印
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <Space size="small">
          <Button size="small" icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
            撤销
          </Button>
          <Button size="small" icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Y)">
            重做
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <Space size="small">
          <Button size="small" icon={<PictureOutlined />} onClick={onInsertImage} disabled={!canSave}>
            插入图片
          </Button>
          <Button size="small" icon={<FontSizeOutlined />} onClick={onInsertText} disabled={!canSave}>
            插入文本
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <Space size="small">
          <Button
            size="small"
            type={toolMode === 'erase' ? 'primary' : 'default'}
            icon={<ScissorOutlined />}
            onClick={() => setToolMode(toolMode === 'erase' ? 'view' : 'erase')}
            disabled={!canSave}
            danger={toolMode === 'erase'}
          >
            擦除
          </Button>
          <Button
            size="small"
            type={toolMode === 'highlight' ? 'primary' : 'default'}
            icon={<HighlightOutlined />}
            onClick={() => setToolMode(toolMode === 'highlight' ? 'view' : 'highlight')}
            disabled={!canSave}
            style={toolMode === 'highlight' ? { backgroundColor: '#ffec3d', borderColor: '#ffec3d', color: '#000' } : {}}
          >
            高亮
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <Space size="small">
          <Button size="small" icon={<RotateLeftOutlined />} onClick={onRotatePageLeft} disabled={!canSave}>
            左转
          </Button>
          <Button size="small" icon={<RotateRightOutlined />} onClick={onRotatePageRight} disabled={!canSave}>
            右转
          </Button>
          <Button size="small" icon={<SyncOutlined />} onClick={onFlipPage} disabled={!canSave}>
            翻转
          </Button>
        </Space>

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <SearchToolbar />

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <PageJumpControl />

        <Divider orientation="vertical" style={{ margin: '0 8px' }} />

        <Text style={{ fontSize: 12, color: hasUnsavedChanges ? '#ff4d4f' : '#666', marginLeft: 8 }}>
          {fileName || '未打开文件'}
          {hasUnsavedChanges && ' *'}
        </Text>
      </Row>

      {/* 第二行：PDF工具 */}
      <Row align="middle" style={{ padding: '4px 12px' }}>
        <Space size="small" wrap>
          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>PDF工具:</Text>
          <Button size="small" icon={<MergeCellsOutlined />} onClick={onMergePDFs} disabled={!canSave}>
            合并PDF
          </Button>
          <Button size="small" icon={<FontColorsOutlined />} onClick={onAddWatermark} disabled={!canSave}>
            水印
          </Button>
          <Button size="small" icon={<FontSizeOutlined />} onClick={onAddHeaderFooter} disabled={!canSave}>
            页眉页脚
          </Button>
          <Button size="small" icon={<SwapOutlined />} onClick={onReplacePage} disabled={!canSave}>
            替换页面
          </Button>
          <Button size="small" icon={<SortAscendingOutlined />} onClick={onReversePages} disabled={!canSave}>
            倒序页面
          </Button>

          <Divider orientation="vertical" style={{ margin: '0 8px' }} />

          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>导出:</Text>
          <Button size="small" icon={<FileImageOutlined />} onClick={onExportAsImages} disabled={!canSave}>
            导出图片
          </Button>
          <Button size="small" icon={<FileTextOutlined />} onClick={onExportAsText} disabled={!canSave}>
            导出文本
          </Button>
          <Button size="small" icon={<FileWordOutlined />} onClick={onExportAsWord} disabled={!canSave}>
            导出Word
          </Button>

          <Divider orientation="vertical" style={{ margin: '0 8px' }} />

          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>转换工具:</Text>
          <Button size="small" icon={<SwapOutlined />} disabled={!canSave} onClick={() => {}}>
            PDF转换
          </Button>
          <Button size="small" icon={<FileImageOutlined />} disabled={!canSave} onClick={() => {}}>
            图片转PDF
          </Button>
          <Button size="small" icon={<DownloadOutlined />} disabled={!canSave} onClick={() => {}}>
            提取图像
          </Button>

          <Divider orientation="vertical" style={{ margin: '0 8px' }} />

          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>编辑:</Text>
          <Button size="small" icon={<ScissorOutlined />} disabled={!canSave} onClick={() => {}}>
            PDF拆分
          </Button>
          <Button size="small" icon={<DownloadOutlined />} disabled={!canSave} onClick={() => {}}>
            页面提取
          </Button>
          <Button size="small" icon={<SwapOutlined />} disabled={!canSave} onClick={() => {}}>
            页面重排
          </Button>
          <Button size="small" icon={<ToolOutlined />} disabled={!canSave} onClick={() => {}}>
            添加页码
          </Button>

          <Divider orientation="vertical" style={{ margin: '0 8px' }} />

          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>高级:</Text>
          <Button size="small" icon={<CompressOutlined />} disabled={!canSave} onClick={() => {}}>
            PDF压缩
          </Button>
          <Button size="small" icon={<SafetyOutlined />} disabled={!canSave} onClick={() => {}}>
            标记密文
          </Button>
          <Button size="small" icon={<KeyOutlined />} disabled={!canSave} onClick={() => {}}>
            密码保护
          </Button>
          <Button size="small" icon={<SettingOutlined />} disabled={!canSave} onClick={() => {}}>
            PDF优化
          </Button>
        </Space>
      </Row>
    </div>
  );
};
