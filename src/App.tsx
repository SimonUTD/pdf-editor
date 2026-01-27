import React, { useState, useCallback } from 'react';
import { ConfigProvider, theme, Empty, message, Modal } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';
import { Sidebar } from './components/PDFViewer/Sidebar';
import { PDFCanvas } from './components/PDFViewer/PDFCanvas';
import { PDFRenderer } from './services/pdfRenderer';
import { PDFEditor } from './services/pdfEditor';
import { usePDFStore, useUIStore, useEditStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex, selectPage } = useUIStore();
  const { hasUnsavedChanges, markAsSaved, markAsUnsaved, addToHistory } = useEditStore();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  const handleOpenFile = async () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to continue?',
        onOk: async () => {
          await loadFile();
        },
      });
    } else {
      await loadFile();
    }
  };

  const loadFile = async () => {
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
      setPdfBytes(new Uint8Array(fileData.buffer));
      markAsSaved();
      message.success(`Loaded ${fileData.fileName} (${numPages} pages)`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      message.error('Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pdfBytes || !filePath) {
      message.error('No file to save');
      return;
    }

    try {
      const result = await window.electronAPI.saveFile(filePath, pdfBytes.buffer);
      if (result.success) {
        markAsSaved();
        message.success('File saved successfully');
      } else {
        message.error(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      message.error('Failed to save PDF file');
    }
  };

  const handleSaveAs = async () => {
    if (!pdfBytes) {
      message.error('No file to save');
      return;
    }

    try {
      const result = await window.electronAPI.saveFileAs(pdfBytes.buffer);
      if (result.success && result.filePath) {
        loadPDF(result.filePath, pdfDocument, totalPages);
        markAsSaved();
        message.success('File saved successfully');
      } else if (!result.canceled) {
        message.error(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      message.error('Failed to save PDF file');
    }
  };

  const handlePrint = async () => {
    try {
      await window.electronAPI.printPDF();
    } catch (error) {
      console.error('Error printing PDF:', error);
      message.error('Failed to print PDF');
    }
  };

  const handleDeletePage = useCallback(async (pageNumber: number) => {
    if (!pdfBytes || totalPages <= 1) {
      message.warning('Cannot delete the last page');
      return;
    }

    Modal.confirm({
      title: 'Delete Page',
      content: `Are you sure you want to delete page ${pageNumber}?`,
      onOk: async () => {
        try {
          const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
          await PDFEditor.deletePage(pdfDoc, pageNumber - 1);
          const newBytes = await PDFEditor.saveToBytes(pdfDoc);

          setPdfBytes(newBytes);
          const document = await PDFRenderer.loadDocument(newBytes.buffer);
          loadPDF(filePath || '', document, document.numPages);

          addToHistory({
            type: 'page-delete',
            timestamp: Date.now(),
            data: { pageNumber },
          });
          markAsUnsaved();

          // Adjust selected page if necessary
          if (selectedPageIndex >= document.numPages) {
            selectPage(document.numPages - 1);
          }

          message.success(`Page ${pageNumber} deleted`);
        } catch (error) {
          console.error('Error deleting page:', error);
          message.error('Failed to delete page');
        }
      },
    });
  }, [pdfBytes, totalPages, filePath, selectedPageIndex, loadPDF, selectPage, addToHistory, markAsUnsaved]);

  const handleInsertBlankPage = useCallback(async (afterPageNumber: number) => {
    if (!pdfBytes) {
      message.error('No PDF loaded');
      return;
    }

    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.insertBlankPage(pdfDoc, afterPageNumber - 1);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);

      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(newBytes.buffer);
      loadPDF(filePath || '', document, document.numPages);

      addToHistory({
        type: 'page-insert',
        timestamp: Date.now(),
        data: { afterPageNumber },
      });
      markAsUnsaved();

      message.success(`Blank page inserted after page ${afterPageNumber}`);
    } catch (error) {
      console.error('Error inserting blank page:', error);
      message.error('Failed to insert blank page');
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  useKeyboardShortcuts({
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onPrint: handlePrint,
    onOpen: handleOpenFile,
  });

  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MainLayout
        fileName={fileName || null}
        hasUnsavedChanges={hasUnsavedChanges}
        canSave={!!pdfDocument}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPrint={handlePrint}
        sidebar={
          <Sidebar
            pdfDocument={pdfDocument}
            totalPages={totalPages}
            onDeletePage={handleDeletePage}
            onInsertBlankPage={handleInsertBlankPage}
          />
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
