import React, { useCallback, useState } from 'react';
import { Drawer, Layout, message, Modal } from 'antd';
import { ToolsPanel } from '@/components/Tools';
import { SearchPanel } from '@/components/Tools/SearchPanel';
import { useUIStore } from '@/stores';
import { Toolbar } from './Toolbar';

const { Sider, Content } = Layout;

// Tool label mapping for display feedback
const TOOL_LABELS: Record<string, string> = {
  'view-modes': '查看模式',
  'quick-jump': '快捷跳转',
  'text-search': '文本搜索',
  'pdf-convert': 'PDF转换器',
  'image-to-pdf': '图片转PDF',
  'extract-images': '提取图像',
  'pdf-split': 'PDF拆分',
  'extract-pages': '页面提取',
  'reorder-pages': '页面重排',
  'page-numbers': '添加页码',
  redact: '标记密文',
  compress: 'PDF压缩',
  signature: 'PDF签署',
  security: '密码保护',
  optimize: 'PDF优化',
};

interface MainLayoutProps {
  fileName: string | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
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
  onReplacePage: () => void;
  onReversePages: () => void;
  onRotatePageLeft?: () => void;
  onRotatePageRight?: () => void;
  onFlipPage?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  fileName,
  hasUnsavedChanges,
  canSave,
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
  sidebar,
  content,
}) => {
  const { showToolsPanel, toggleToolsPanel } = useUIStore();
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleToolSelect = useCallback((toolKey: string) => {
    if (toolKey === 'text-search') {
      setShowSearchModal(true);
    } else {
      const toolLabel = TOOL_LABELS[toolKey] || toolKey;
      message.info(toolLabel);
    }
  }, []);
  return (
    <Layout style={{ height: '100vh' }}>
      <Toolbar
        onOpenFile={onOpenFile}
        onSave={onSave}
        onSaveAs={onSaveAs}
        onPrint={onPrint}
        onInsertImage={onInsertImage}
        onInsertText={onInsertText}
        onExportAsImages={onExportAsImages}
        onExportAsText={onExportAsText}
        onExportAsWord={onExportAsWord}
        onMergePDFs={onMergePDFs}
        onAddWatermark={onAddWatermark}
        onAddHeaderFooter={onAddHeaderFooter}
        onReplacePage={onReplacePage}
        onReversePages={onReversePages}
        onRotatePageLeft={onRotatePageLeft}
        onRotatePageRight={onRotatePageRight}
        onFlipPage={onFlipPage}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        fileName={fileName}
        hasUnsavedChanges={hasUnsavedChanges}
        canSave={canSave}
      />
      <Layout>
        <Sider
          width={200}
          style={{
            backgroundColor: '#fafafa',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
          }}
        >
          {sidebar}
        </Sider>
        <Content
          style={{
            backgroundColor: '#525659',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 16,
          }}
        >
          {content}
        </Content>
      </Layout>

      <Drawer
        title="工具箱"
        placement="right"
        width={320}
        onClose={toggleToolsPanel}
        open={showToolsPanel}
      >
        <ToolsPanel onToolSelect={handleToolSelect} />
      </Drawer>

      {/* Search Modal */}
      <Modal
        title="文本搜索"
        open={showSearchModal}
        onCancel={() => setShowSearchModal(false)}
        footer={null}
        width={400}
      >
        <SearchPanel />
      </Modal>
    </Layout>
  );
};
