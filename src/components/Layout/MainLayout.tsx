import React from 'react';
import { Layout } from 'antd';
import { Toolbar } from './Toolbar';

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
  onEraseContent: () => void;
  onAddHighlight: () => void;
  onReplacePage: () => void;
  onReversePages: () => void;
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
  onEraseContent,
  onAddHighlight,
  onReplacePage,
  onReversePages,
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
        onEraseContent={onEraseContent}
        onAddHighlight={onAddHighlight}
        onReplacePage={onReplacePage}
        onReversePages={onReversePages}
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
    </Layout>
  );
};
