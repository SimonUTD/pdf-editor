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
  FilePdfOutlined,
  MergeCellsOutlined,
  FontColorsOutlined,
  HighlightOutlined,
  ScissorOutlined,
  SwapOutlined,
  SortAscendingOutlined,
  VerticalAlignTopOutlined,
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
  StopOutlined,
  FormOutlined,
  Html5Outlined,
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
  onExportAsHTML?: () => void;
  onShowPDFConverter?: () => void;
  onMergePDFs: () => void;
  onAddWatermark: () => void;
  onAddHeaderFooter: () => void;
  onReversePages: () => void;
  onReplacePage: () => void;
  onImagesToPDF: () => void;
  onExtractImages: () => void;
  onSplitPDF: () => void;
  onExtractPages: () => void;
  onAddPageNumbers: () => void;
  onReorderPages?: () => void;
  onOptimizePDF?: () => void;
  onRotatePageLeft?: () => void;
  onRotatePageRight?: () => void;
  onFlipPage?: () => void;
  onRedact?: () => void;
  onCompressPDF?: () => void;
  onAddSignature?: () => void;
  onPasswordProtect?: () => void;
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
  onExportAsHTML,
  onShowPDFConverter,
  onMergePDFs,
  onAddWatermark,
  onAddHeaderFooter,
  onReplacePage,
  onReversePages,
  onImagesToPDF,
  onExtractImages,
  onSplitPDF,
  onExtractPages,
  onAddPageNumbers,
  onReorderPages,
  onOptimizePDF,
  onRotatePageLeft,
  onRotatePageRight,
  onFlipPage,
  onRedact,
  onCompressPDF,
  onAddSignature,
  onPasswordProtect,
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
          <Button
            size="small"
            type={toolMode === 'redact' ? 'primary' : 'default'}
            icon={<StopOutlined />}
            onClick={onRedact}
            disabled={!canSave}
            danger={toolMode === 'redact'}
          >
            密文
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
          <Button size="small" icon={<Html5Outlined />} onClick={onExportAsHTML} disabled={!canSave}>
            导出HTML
          </Button>
          <Button size="small" icon={<SwapOutlined />} onClick={onShowPDFConverter} disabled={!canSave}>
            PDF转换
          </Button>

          <Divider orientation="vertical" style={{ margin: '0 8px' }} />

          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>转换工具:</Text>
          <Button size="small" icon={<FilePdfOutlined />} onClick={onImagesToPDF}>
            图片转PDF
          </Button>
          <Button size="small" icon={<FileImageOutlined />} onClick={onExtractImages} disabled={!canSave}>
            提取图像
          </Button>
          <Button size="small" icon={<ScissorOutlined />} onClick={onSplitPDF} disabled={!canSave}>
            拆分PDF
          </Button>
          <Button size="small" icon={<VerticalAlignTopOutlined />} onClick={onExtractPages} disabled={!canSave}>
            提取页面
          </Button>
          <Button size="small" icon={<SwapOutlined />} disabled={!canSave} onClick={onReorderPages}>
            页面排序
          </Button>
          <Button size="small" icon={<ToolOutlined />} disabled={!canSave} onClick={onAddPageNumbers}>
            添加页码
          </Button>

          <Divider orientation="vertical" style={{ margin: '0 8px' }} />

          <Text style={{ fontSize: 12, color: '#999', marginRight: 4 }}>高级:</Text>
          <Button size="small" icon={<CompressOutlined />} disabled={!canSave} onClick={onCompressPDF}>
            PDF压缩
          </Button>
          <Button size="small" icon={<SettingOutlined />} disabled={!canSave} onClick={onOptimizePDF}>
            PDF优化
          </Button>
          <Button size="small" icon={<KeyOutlined />} disabled={!canSave} onClick={onPasswordProtect}>
            密码保护
          </Button>
          <Button size="small" icon={<FormOutlined />} disabled={!canSave} onClick={onAddSignature}>
            PDF签名
          </Button>
        </Space>
      </Row>
    </div>
  );
};
