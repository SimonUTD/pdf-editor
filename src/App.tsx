import React, { useState, useCallback } from 'react';
import { ConfigProvider, theme, Empty, message, Modal } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { MainLayout } from './components/Layout/MainLayout';
import { Sidebar } from './components/PDFViewer/Sidebar';
import { PDFCanvas } from './components/PDFViewer/PDFCanvasInteractive';
import { ImageInserter } from './components/Editors/ImageInserter';
import { TextInserter } from './components/Editors/TextInserter';
import { PDFMerger } from './components/Editors/PDFMerger';
import { WatermarkEditor } from './components/Editors/WatermarkEditor';
import { HeaderFooterEditor } from './components/Editors/HeaderFooterEditor';
import { PageReplacer } from './components/Editors/PageReplacer';
import { PDFRenderer } from './services/pdfRenderer';
import { PDFEditor } from './services/pdfEditor';
import { ExportService } from './services/exportService';
import { usePDFStore, useUIStore, useEditStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useI18n } from './hooks/useI18n';
import { getArrayBuffer } from './utils/arrayBuffer';
import { getMessage } from './constants/messages';

const App: React.FC = () => {
  const { t } = useI18n();
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex, selectPage, toolMode, setToolMode } = useUIStore();
  const { hasUnsavedChanges, markAsSaved, markAsUnsaved, addToHistory } = useEditStore();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [imageInserterVisible, setImageInserterVisible] = useState(false);
  const [textInserterVisible, setTextInserterVisible] = useState(false);
  const [pdfMergerVisible, setPdfMergerVisible] = useState(false);
  const [watermarkEditorVisible, setWatermarkEditorVisible] = useState(false);
  const [headerFooterEditorVisible, setHeaderFooterEditorVisible] = useState(false);
  const [pageReplacerVisible, setPageReplacerVisible] = useState(false);

  const handleOpenFile = async () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: getMessage('Unsaved Changes'),
        content: getMessage('You have unsaved changes. Do you want to continue?'),
        okText: getMessage('Confirm'),
        cancelText: getMessage('Cancel'),
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
      const fileData = await window.electronAPI.openFile();

      if (!fileData) {
        return;
      }

      const document = await PDFRenderer.loadDocument(getArrayBuffer(new Uint8Array(fileData.buffer)));
      const numPages = document.numPages;

      loadPDF(fileData.filePath, document, numPages);
      setPdfBytes(new Uint8Array(fileData.buffer));
      markAsSaved();
      message.success(getMessage('Loaded {name} ({pages} pages)', {
        name: fileData.fileName,
        pages: numPages
      }));
    } catch (error) {
      console.error('Error loading PDF:', error);
      message.error(getMessage('Failed to load PDF file'));
    }
  };

  const handleSave = async () => {
    if (!pdfBytes || !filePath) {
      message.error(getMessage('No file to save'));
      return;
    }

    try {
      const result = await window.electronAPI.saveFile(filePath, getArrayBuffer(pdfBytes));
      if (result.success) {
        markAsSaved();
        message.success(getMessage('File saved successfully'));
      } else {
        message.error(getMessage('Failed to save: {error}', { error: result.error || 'Unknown error' }));
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      message.error(getMessage('Failed to save PDF file'));
    }
  };

  const handleSaveAs = async () => {
    if (!pdfBytes) {
      message.error(getMessage('No file to save'));
      return;
    }

    try {
      const result = await window.electronAPI.saveFileAs(getArrayBuffer(pdfBytes));
      if (result.success && result.filePath) {
        loadPDF(result.filePath, pdfDocument, totalPages);
        markAsSaved();
        message.success(getMessage('File saved successfully'));
      } else if (!result.canceled) {
        message.error(getMessage('Failed to save: {error}', { error: result.error || 'Unknown error' }));
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      message.error(getMessage('Failed to save PDF file'));
    }
  };

  const handlePrint = async () => {
    try {
      await window.electronAPI.printPDF();
    } catch (error) {
      console.error('Error printing PDF:', error);
      message.error(getMessage('Failed to print PDF'));
    }
  };

  const handleDeletePage = useCallback(async (pageNumber: number) => {
    if (!pdfBytes || totalPages <= 1) {
      message.warning(getMessage('Cannot delete the last page'));
      return;
    }

    Modal.confirm({
      title: getMessage('Delete Page'),
      content: getMessage('Are you sure you want to delete page {pageNumber}?', { pageNumber }),
      okText: getMessage('Confirm'),
      cancelText: getMessage('Cancel'),
      onOk: async () => {
        try {
          const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
          await PDFEditor.deletePage(pdfDoc, pageNumber - 1);
          const newBytes = await PDFEditor.saveToBytes(pdfDoc);

          setPdfBytes(newBytes);
          const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
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

          message.success(getMessage('Page {pageNumber} deleted', { pageNumber }));
        } catch (error) {
          console.error('Error deleting page:', error);
          message.error(getMessage('Failed to delete page'));
        }
      },
    });
  }, [pdfBytes, totalPages, filePath, selectedPageIndex, loadPDF, selectPage, addToHistory, markAsUnsaved]);

  const handleInsertBlankPage = useCallback(async (afterPageNumber: number) => {
    if (!pdfBytes) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.insertBlankPage(pdfDoc, afterPageNumber - 1);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);

      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);

      addToHistory({
        type: 'page-insert',
        timestamp: Date.now(),
        data: { afterPageNumber },
      });
      markAsUnsaved();

      message.success(getMessage('Blank page inserted after page {afterPageNumber}', { afterPageNumber }));
    } catch (error) {
      console.error('Error inserting blank page:', error);
      message.error(getMessage('Failed to insert blank page'));
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleInsertImage = useCallback(
    async (
      imageBytes: Uint8Array,
      imageType: 'png' | 'jpg',
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      if (!pdfBytes) {
        message.error(getMessage('No PDF loaded'));
        return;
      }

      try {
        const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
        await PDFEditor.insertImage(
          pdfDoc,
          selectedPageIndex,
          imageBytes,
          imageType,
          x,
          y,
          width,
          height
        );
        const newBytes = await PDFEditor.saveToBytes(pdfDoc);

        setPdfBytes(newBytes);
        const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
        loadPDF(filePath || '', document, document.numPages);

        addToHistory({
          type: 'image-insert',
          timestamp: Date.now(),
          data: { pageIndex: selectedPageIndex, x, y, width, height },
        });
        markAsUnsaved();

        message.success(getMessage('Image inserted successfully'));
      } catch (error) {
        console.error('Error inserting image:', error);
        message.error(getMessage('Failed to insert image'));
        throw error;
      }
    },
    [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]
  );

  const handleInsertText = useCallback(
    async (
      text: string,
      x: number,
      y: number,
      fontSize: number,
      color: { r: number; g: number; b: number }
    ) => {
      if (!pdfBytes) {
        message.error(getMessage('No PDF loaded'));
        return;
      }

      try {
        const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
        await PDFEditor.insertText(
          pdfDoc,
          selectedPageIndex,
          text,
          x,
          y,
          fontSize,
          color
        );
        const newBytes = await PDFEditor.saveToBytes(pdfDoc);

        setPdfBytes(newBytes);
        const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
        loadPDF(filePath || '', document, document.numPages);

        addToHistory({
          type: 'text-insert',
          timestamp: Date.now(),
          data: { pageIndex: selectedPageIndex, text, x, y, fontSize, color },
        });
        markAsUnsaved();

        message.success(getMessage('Text inserted successfully'));
      } catch (error) {
        console.error('Error inserting text:', error);
        message.error(getMessage('Failed to insert text'));
        throw error;
      }
    },
    [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]
  );

  const handleExportAsImages = useCallback(async () => {
    if (!pdfDocument) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'page' : 'page';
      await ExportService.exportAllPagesAsImages(pdfDocument, 'png', fileName);
      message.success(getMessage('Exported {totalPages} pages as images', { totalPages }));
    } catch (error) {
      console.error('Error exporting as images:', error);
      message.error(getMessage('Failed to export as images'));
    }
  }, [pdfDocument, filePath, totalPages]);

  const handleExportAsText = useCallback(async () => {
    if (!pdfDocument) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'document' : 'document';
      await ExportService.exportAsText(pdfDocument, fileName);
      message.success(getMessage('Exported as text file'));
    } catch (error) {
      console.error('Error exporting as text:', error);
      message.error(getMessage('Failed to export as text'));
    }
  }, [pdfDocument, filePath]);

  const handleExportAsWord = useCallback(async () => {
    if (!pdfDocument) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'document' : 'document';
      await ExportService.exportAsWord(pdfDocument, fileName);
      message.success(getMessage('Exported as Word document'));
    } catch (error) {
      console.error('Error exporting as Word:', error);
      message.error(getMessage('Failed to export as Word'));
    }
  }, [pdfDocument, filePath]);

  const handleMergePDFs = useCallback(async (pdfBytesArray: Uint8Array[]) => {
    try {
      const mergedBytes = await PDFEditor.mergePDFs(pdfBytesArray);
      setPdfBytes(mergedBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(mergedBytes));
      loadPDF('merged.pdf', document, document.numPages);
      addToHistory({ type: 'pdf-merge', timestamp: Date.now(), data: { count: pdfBytesArray.length } });
      markAsUnsaved();
      message.success(getMessage('PDFs merged successfully'));
    } catch (error) {
      console.error('Error merging PDFs:', error);
      message.error(getMessage('Failed to merge PDFs'));
      throw error;
    }
  }, [loadPDF, addToHistory, markAsUnsaved]);

  const handleAddTextWatermark = useCallback(async (text: string, options: any) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.addTextWatermark(pdfDoc, text, options);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({ type: 'watermark-add', timestamp: Date.now(), data: { text } });
      markAsUnsaved();
    } catch (error) {
      console.error('Error adding watermark:', error);
      throw error;
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleAddImageWatermark = useCallback(async (imageBytes: Uint8Array, imageType: 'png' | 'jpg', options: any) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.addImageWatermark(pdfDoc, imageBytes, imageType, options);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({ type: 'watermark-add', timestamp: Date.now(), data: { type: 'image' } });
      markAsUnsaved();
    } catch (error) {
      console.error('Error adding image watermark:', error);
      throw error;
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleAddHeader = useCallback(async (text: string, options: any) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.addHeader(pdfDoc, text, options);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({ type: 'header-add', timestamp: Date.now(), data: { text } });
      markAsUnsaved();
    } catch (error) {
      console.error('Error adding header:', error);
      throw error;
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleAddFooter = useCallback(async (text: string, options: any) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.addFooter(pdfDoc, text, options);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({ type: 'footer-add', timestamp: Date.now(), data: { text } });
      markAsUnsaved();
    } catch (error) {
      console.error('Error adding footer:', error);
      throw error;
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleEraseContent = useCallback(async (x: number, y: number, width: number, height: number) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.eraseRegion(pdfDoc, selectedPageIndex, x, y, width, height);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({ type: 'content-erase', timestamp: Date.now(), data: { pageIndex: selectedPageIndex, x, y, width, height } });
      markAsUnsaved();
    } catch (error) {
      console.error('Error erasing content:', error);
      throw error;
    }
  }, [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleAddHighlight = useCallback(async (x: number, y: number, width: number, height: number) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      // 默认黄色高亮，透明度0.3
      const color = { r: 1, g: 1, b: 0 };
      const opacity = 0.3;
      await PDFEditor.addHighlight(pdfDoc, selectedPageIndex, x, y, width, height, color, opacity);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({ type: 'highlight-add', timestamp: Date.now(), data: { pageIndex: selectedPageIndex, x, y, width, height } });
      markAsUnsaved();
    } catch (error) {
      console.error('Error adding highlight:', error);
      throw error;
    }
  }, [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleReplacePage = useCallback(async (sourcePdfBytes: Uint8Array, sourcePageIndex: number) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.replacePage(pdfDoc, selectedPageIndex, sourcePdfBytes, sourcePageIndex);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({
        type: 'page-replace',
        timestamp: Date.now(),
        data: { targetPageIndex: selectedPageIndex, sourcePageIndex },
      });
      markAsUnsaved();
    } catch (error) {
      console.error('Error replacing page:', error);
      throw error;
    }
  }, [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved]);

  const handleReversePages = useCallback(async () => {
    if (!pdfBytes) return;
    Modal.confirm({
      title: getMessage('Reverse Page Order'),
      content: getMessage('Are you sure you want to reverse the order of all pages?'),
      okText: getMessage('Confirm'),
      cancelText: getMessage('Cancel'),
      onOk: async () => {
        try {
          const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
          await PDFEditor.reversePages(pdfDoc);
          const newBytes = await PDFEditor.saveToBytes(pdfDoc);
          setPdfBytes(newBytes);
          const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
          loadPDF(filePath || '', document, document.numPages);
          addToHistory({ type: 'pages-reverse', timestamp: Date.now(), data: {} });
          markAsUnsaved();
          message.success(getMessage('Pages reversed successfully'));
        } catch (error) {
          console.error('Error reversing pages:', error);
          message.error(getMessage('Failed to reverse pages'));
        }
      },
    });
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
      locale={zhCN}
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
        onInsertImage={() => setImageInserterVisible(true)}
        onInsertText={() => setTextInserterVisible(true)}
        onExportAsImages={handleExportAsImages}
        onExportAsText={handleExportAsText}
        onExportAsWord={handleExportAsWord}
        onMergePDFs={() => setPdfMergerVisible(true)}
        onAddWatermark={() => setWatermarkEditorVisible(true)}
        onAddHeaderFooter={() => setHeaderFooterEditorVisible(true)}
        onReplacePage={() => setPageReplacerVisible(true)}
        onReversePages={handleReversePages}
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
              onEraseRegion={handleEraseContent}
              onHighlightRegion={handleAddHighlight}
            />
          ) : (
            <Empty
              description={getMessage('Open a PDF file to get started')}
              style={{ marginTop: 100 }}
            />
          )
        }
      />

      <ImageInserter
        visible={imageInserterVisible}
        onClose={() => setImageInserterVisible(false)}
        onInsert={handleInsertImage}
      />

      <TextInserter
        visible={textInserterVisible}
        onClose={() => setTextInserterVisible(false)}
        onInsert={handleInsertText}
      />

      <PDFMerger
        visible={pdfMergerVisible}
        onClose={() => setPdfMergerVisible(false)}
        onMerge={handleMergePDFs}
      />

      <WatermarkEditor
        visible={watermarkEditorVisible}
        onClose={() => setWatermarkEditorVisible(false)}
        onAddTextWatermark={handleAddTextWatermark}
        onAddImageWatermark={handleAddImageWatermark}
      />

      <HeaderFooterEditor
        visible={headerFooterEditorVisible}
        onClose={() => setHeaderFooterEditorVisible(false)}
        onAddHeader={handleAddHeader}
        onAddFooter={handleAddFooter}
      />

      <PageReplacer
        visible={pageReplacerVisible}
        currentPageNumber={selectedPageIndex + 1}
        onClose={() => setPageReplacerVisible(false)}
        onReplace={handleReplacePage}
      />
    </ConfigProvider>
  );
};

export default App;
