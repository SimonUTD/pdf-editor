import React from 'react';
import { ConfigProvider, theme, Empty } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';

const App: React.FC = () => {
  const handleOpenFile = () => {
    console.log('Open file clicked');
    // Will be implemented in next task
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MainLayout
        fileName={null}
        onOpenFile={handleOpenFile}
        sidebar={<Empty description="No PDF loaded" />}
        content={
          <Empty
            description="Open a PDF file to get started"
            style={{ marginTop: 100 }}
          />
        }
      />
    </ConfigProvider>
  );
};

export default App;
