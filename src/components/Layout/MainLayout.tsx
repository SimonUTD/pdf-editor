import React from 'react';
import { Layout } from 'antd';
import { useUIStore } from '@/stores';
import { Toolbar } from './Toolbar';
import { BottomToolbar } from './BottomToolbar';

const { Sider, Content } = Layout;

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
  onImagesToPDF: () => void;
  onExtractImages: () => void;
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
  onImagesToPDF,
  onExtractImages,
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
        onImagesToPDF={onImagesToPDF}
        onExtractImages={onExtractImages}
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
            paddingBottom: 60, // 为底部toolbar留空间
          }}
        >
          {content}
        </Content>
      </Layout>

      {/* 底部工具栏 */}
      <BottomToolbar />
    </Layout>
  );
};
