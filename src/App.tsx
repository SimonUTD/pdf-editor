import React from 'react';
import { ConfigProvider, theme } from 'antd';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <h1>PDF Editor</h1>
        <p>Application starting...</p>
      </div>
    </ConfigProvider>
  );
};

export default App;
