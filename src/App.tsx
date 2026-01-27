import React, { useState } from 'react';
import { ConfigProvider, theme, Empty, message } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';
import { Sidebar } from './components/PDFViewer/Sidebar';
import { PDFCanvas } from './components/PDFViewer/PDFCanvas';
import { PDFRenderer } from './services/pdfRenderer';
import { usePDFStore, useUIStore } from './stores';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex } = useUIStore();

  const handleOpenFile = async () => {
    try {
      setLoading(true);
      const fileData = await window.electronAPI.openFile();

      if (!fileData) {
        setLoading(false);
        return;
      }

      const document = await PDFRenderer.loadDocument(fileData.buffer);
      const numPages = document.numPages;

      loadPDF(fileData.filePath, document, numPages);
      message.success(`Loaded ${fileData.fileName} (${numPages} pages)`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      message.error('Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  };

  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MainLayout
        fileName={fileName || null}
        onOpenFile={handleOpenFile}
        sidebar={
          <Sidebar pdfDocument={pdfDocument} totalPages={totalPages} />
        }
        content={
          pdfDocument ? (
            <PDFCanvas
              pdfDocument={pdfDocument}
              pageNumber={selectedPageIndex + 1}
            />
          ) : (
            <Empty
              description="Open a PDF file to get started"
              style={{ marginTop: 100 }}
            />
          )
        }
      />
    </ConfigProvider>
  );
};

export default App;
