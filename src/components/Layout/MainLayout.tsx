import React from 'react';
import { Layout } from 'antd';
import { Toolbar } from './Toolbar';

const { Sider, Content } = Layout;

interface MainLayoutProps {
  fileName: string | null;
  onOpenFile: () => void;
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  fileName,
  onOpenFile,
  sidebar,
  content,
}) => {
  return (
    <Layout style={{ height: '100vh' }}>
      <Toolbar onOpenFile={onOpenFile} fileName={fileName} />
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
