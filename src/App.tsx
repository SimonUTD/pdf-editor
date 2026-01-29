import React, { useState, useCallback, useRef } from 'react';
import { ConfigProvider, theme, Empty, Modal, Input, message } from 'antd';
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
import { usePDFStore, useUIStore, useEditStore, useObjectStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useI18n } from './hooks/useI18n';
import { getArrayBuffer, base64ToArrayBuffer } from './utils/arrayBuffer';
import { getMessage } from './constants/messages';
import { ImageObject, TextObject, InsertedObject } from './types/objects';
import {
  ImageInsertCommand,
  TextInsertCommand,
  ObjectMoveCommand,
  ObjectResizeCommand,
  ObjectRotateCommand,
  ObjectDeleteCommand,
  PageDeleteCommand,
  PageInsertCommand,
  EraseCommand,
  HighlightCommand,
  type Command,
} from './commands';

const App: React.FC = () => {
  const { t } = useI18n();
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const { selectedPageIndex, selectPage, toolMode, setToolMode } = useUIStore();
  const { hasUnsavedChanges, markAsSaved, markAsUnsaved, addToHistory } = useEditStore();
  const { objects, addObject } = useObjectStore();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [imageInserterVisible, setImageInserterVisible] = useState(false);
  const [textInserterVisible, setTextInserterVisible] = useState(false);
  const [pdfMergerVisible, setPdfMergerVisible] = useState(false);
  const [watermarkEditorVisible, setWatermarkEditorVisible] = useState(false);
  const [headerFooterEditorVisible, setHeaderFooterEditorVisible] = useState(false);
  const [pageReplacerVisible, setPageReplacerVisible] = useState(false);

  // Inline text editing state
  const [editingText, setEditingText] = useState<{
    pageIndex: number;
    position: { x: number; y: number };
    content: string;
  } | null>(null);

  // Command history for undo/redo
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const [commandIndex, setCommandIndex] = useState(-1);

  // Use ref to track latest values without causing re-renders
  const commandHistoryRef = useRef<Command[]>([]);
  const commandIndexRef = useRef(-1);

  // Keep refs in sync with state
  React.useEffect(() => {
    commandHistoryRef.current = commandHistory;
    commandIndexRef.current = commandIndex;
  }, [commandHistory, commandIndex]);

  // Command execution with history management
  const executeCommand = useCallback(async (command: Command) => {
    try {
      await command.execute();

      // Use functional updates to avoid closure issues
      setCommandHistory((prevHistory) => {
        const currentIndex = commandIndexRef.current;
        const newHistory = prevHistory.slice(0, currentIndex + 1);
        newHistory.push(command);

        // Limit history length to prevent memory issues
        if (newHistory.length > 100) {
          newHistory.shift();
        }

        // Update index synchronously with history
        setCommandIndex(newHistory.length - 1);

        return newHistory;
      });

      markAsUnsaved();
    } catch (error) {
      console.error('Error executing command:', error);
      message.error(getMessage('Failed to execute command'));
      throw error;
    }
  }, [markAsUnsaved]);

  // Undo last command
  const undo = useCallback(async () => {
    const currentIndex = commandIndexRef.current;
    if (currentIndex < 0) return;

    try {
      const history = commandHistoryRef.current;
      const command = history[currentIndex];
      await command.undo();
      setCommandIndex(currentIndex - 1);
      markAsUnsaved();
    } catch (error) {
      console.error('Error undoing command:', error);
      message.error(getMessage('Failed to undo'));
      throw error;
    }
  }, [markAsUnsaved]);

  // Redo next command
  const redo = useCallback(async () => {
    const currentIndex = commandIndexRef.current;
    const history = commandHistoryRef.current;

    if (currentIndex >= history.length - 1) return;

    try {
      const command = history[currentIndex + 1];
      await command.redo();
      setCommandIndex(currentIndex + 1);
      markAsUnsaved();
    } catch (error) {
      console.error('Error redoing command:', error);
      message.error(getMessage('Failed to redo'));
      throw error;
    }
  }, [markAsUnsaved]);

  // Helper function to reload PDF after modifications
  const reloadPDF = useCallback(async (newPdfBytes: Uint8Array) => {
    setPdfBytes(newPdfBytes);
    const document = await PDFRenderer.loadDocument(getArrayBuffer(newPdfBytes));
    loadPDF(filePath || '', document, document.numPages);
  }, [filePath, loadPDF]);

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

  // 插入图片到指定位置 (点击插入功能)
  const handleInsertImageAtPosition = useCallback(async (pageIndex: number, x: number, y: number) => {
    if (!pdfBytes) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    // 打开文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            if (!base64) return;

            // 计算图片尺寸 (默认200x200，保持宽高比)
            const img = new Image();
            img.onload = async () => {
              const maxSize = 200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }

              // 创建对象
              const newObject: ImageObject = {
                id: `img-${Date.now()}-${Math.random()}`,
                type: 'image',
                pageIndex,
                position: { x, y },
                size: { width, height },
                zIndex: objects.length + 1,
                selected: true,
                content: base64,
                opacity: 1,
              };

              // 使用 ImageInsertCommand 包装操作
              const command = new ImageInsertCommand(
                newObject,
                async (obj) => {
                  // onExecute: 仅添加对象到存储，不渲染到 PDF
                  addObject(obj);
                  markAsUnsaved();

                  // 添加到历史记录
                  addToHistory({
                    type: 'image-insert',
                    timestamp: Date.now(),
                    data: {
                      pageIndex: obj.pageIndex,
                      x: obj.position.x,
                      y: obj.position.y,
                      width: obj.size.width,
                      height: obj.size.height,
                    },
                  });

                  message.success('图片已插入，可拖拽调整位置');
                },
                async (id) => {
                  // onUndo: 从对象存储移除
                  useObjectStore.getState().deleteObject(id);
                  markAsUnsaved();
                }
              );

              await executeCommand(command);
            };
            img.src = base64;
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error reading image file:', error);
          message.error('读取图片失败');
        }
      }
      // 无论是否选择文件，都返回查看模式
      setToolMode('view');
    };
    input.oncancel = () => {
      setToolMode('view');
    };
    input.click();
  }, [pdfBytes, objects.length, addObject, setToolMode, executeCommand, reloadPDF, addToHistory]);

  // 插入文本到指定位置 (点击插入功能) - 使用内联编辑
  const handleInsertTextAtPosition = useCallback((pageIndex: number, x: number, y: number) => {
    if (!pdfBytes) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    // 设置编辑状态，显示内联文本框
    setEditingText({
      pageIndex,
      position: { x, y },
      content: '',
    });
  }, [pdfBytes]);

  // 完成文本编辑
  const handleFinishEditingText = useCallback(async () => {
    if (!editingText || !pdfBytes) {
      return;
    }

    const { pageIndex, position, content } = editingText;

    // 如果内容为空，取消编辑
    if (!content || content.trim() === '') {
      setEditingText(null);
      setToolMode('view');
      return;
    }

    try {
      // 创建对象
      const newObject: TextObject = {
        id: `text-${Date.now()}-${Math.random()}`,
        type: 'text',
        pageIndex,
        position: { x: position.x, y: position.y },
        size: { width: 200, height: 100 }, // 初始大小
        zIndex: objects.length + 1,
        selected: true,
        content: content.trim(),
        style: {
          fontSize: 16,
          color: '#000000',
          fontFamily: 'sans-serif',
          opacity: 1,
        },
      };

      // 使用 TextInsertCommand 包装操作
      const command = new TextInsertCommand(
        newObject,
        async (obj) => {
          // onExecute: 仅添加对象到存储，不渲染到 PDF
          addObject(obj);
          markAsUnsaved();

          // 添加到历史记录
          addToHistory({
            type: 'text-insert',
            timestamp: Date.now(),
            data: {
              pageIndex: obj.pageIndex,
              text: obj.content,
              x: obj.position.x,
              y: obj.position.y,
              fontSize: obj.style.fontSize,
              color: {
                r: parseInt(obj.style.color.slice(1, 3), 16) / 255,
                g: parseInt(obj.style.color.slice(3, 5), 16) / 255,
                b: parseInt(obj.style.color.slice(5, 7), 16) / 255,
              },
            },
          });

          message.success('文本已插入，可拖拽调整位置');
        },
        async (id) => {
          // onUndo: 从对象存储移除
          useObjectStore.getState().deleteObject(id);
          markAsUnsaved();
        }
      );

      await executeCommand(command);
    } catch (error) {
      console.error('Error inserting text:', error);
      message.error('插入文本失败');
    } finally {
      setEditingText(null);
      setToolMode('view');
    }
  }, [editingText, pdfBytes, objects.length, addObject, setToolMode, executeCommand, addToHistory, markAsUnsaved]);

  // 取消文本编辑
  const handleCancelEditingText = useCallback(() => {
    setEditingText(null);
    setToolMode('view');
  }, [setToolMode]);

  // Handle object move complete - create and execute move command
  const handleObjectMoveComplete = useCallback(async (
    objectId: string,
    oldPos: { x: number; y: number },
    newPos: { x: number; y: number }
  ) => {
    const object = objects.find(o => o.id === objectId);
    if (!object) return;

    const command = new ObjectMoveCommand(
      object,
      oldPos,
      newPos,
      (id, position) => {
        useObjectStore.getState().updateObject(id, { position });
      }
    );

    await executeCommand(command);
  }, [objects, executeCommand]);

  // Handle object resize complete - create and execute resize command
  const handleObjectResizeComplete = useCallback(async (
    objectId: string,
    oldPos: { x: number; y: number },
    newPos: { x: number; y: number },
    oldSize: { width: number; height: number },
    newSize: { width: number; height: number }
  ) => {
    const object = objects.find(o => o.id === objectId);
    if (!object) return;

    const command = new ObjectResizeCommand(
      object,
      oldPos,
      newPos,
      oldSize,
      newSize,
      (id, updates) => {
        useObjectStore.getState().updateObject(id, updates);
      }
    );

    await executeCommand(command);
  }, [objects, executeCommand]);

  // Handle object rotate complete - create and execute rotate command
  const handleObjectRotateComplete = useCallback(async (
    objectId: string,
    oldRotation: number,
    newRotation: number
  ) => {
    const object = objects.find(o => o.id === objectId);
    if (!object) return;

    const command = new ObjectRotateCommand(
      object,
      oldRotation,
      newRotation,
      (id, rotation) => {
        useObjectStore.getState().updateObject(id, { rotation });
      }
    );

    await executeCommand(command);
  }, [objects, executeCommand]);

  // 保存对象到 PDF
  const saveObjectToPDF = useCallback(async (object: InsertedObject) => {
    if (!pdfBytes) return;

    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      const page = pdfDoc.getPage(object.pageIndex);

      if (object.type === 'image') {
        const imageBytes = base64ToArrayBuffer(object.content);
        const imageType = object.content.startsWith('data:image/png') ? 'png' : 'jpg';
        await PDFEditor.insertImage(
          pdfDoc,
          object.pageIndex,
          imageBytes,
          imageType,
          object.position.x,
          object.position.y,
          object.size.width,
          object.size.height
        );

        // Add to history with correct data structure
        addToHistory({
          type: 'image-insert',
          timestamp: Date.now(),
          data: {
            pageIndex: object.pageIndex,
            x: object.position.x,
            y: object.position.y,
            width: object.size.width,
            height: object.size.height,
          },
        });
      } else if (object.type === 'text') {
        await PDFEditor.insertText(
          pdfDoc,
          object.pageIndex,
          object.content,
          object.position.x,
          object.position.y,
          object.style.fontSize,
          {
            r: parseInt(object.style.color.slice(1, 3), 16) / 255,
            g: parseInt(object.style.color.slice(3, 5), 16) / 255,
            b: parseInt(object.style.color.slice(5, 7), 16) / 255,
          }
        );

        // Add to history with correct data structure
        addToHistory({
          type: 'text-insert',
          timestamp: Date.now(),
          data: {
            pageIndex: object.pageIndex,
            text: object.content,
            x: object.position.x,
            y: object.position.y,
            fontSize: object.style.fontSize,
            color: {
              r: parseInt(object.style.color.slice(1, 3), 16) / 255,
              g: parseInt(object.style.color.slice(3, 5), 16) / 255,
              b: parseInt(object.style.color.slice(5, 7), 16) / 255,
            },
          },
        });
      }

      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      markAsUnsaved();
    } catch (error) {
      console.error('Error saving object to PDF:', error);
      message.error('保存对象到PDF失败');
      throw error;
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved]);

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
      // Save original state for undo
      const originalBytes = new Uint8Array(pdfBytes);

      const command = new EraseCommand(
        [{ pageIndex: selectedPageIndex, path: [{ x, y }], strokeWidth: width }],
        new Map([[selectedPageIndex.toString(), originalBytes]]),
        async () => {
          // onExecute callback
          const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
          await PDFEditor.eraseRegion(pdfDoc, selectedPageIndex, x, y, width, height);
          const newBytes = await PDFEditor.saveToBytes(pdfDoc);
          setPdfBytes(newBytes);
          const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
          loadPDF(filePath || '', document, document.numPages);
          addToHistory({ type: 'content-erase', timestamp: Date.now(), data: { pageIndex: selectedPageIndex, x, y, width, height } });
          markAsUnsaved();
          message.success('内容已擦除');
        },
        async (pageIndex: number, content: Uint8Array) => {
          // onUndo callback
          setPdfBytes(content);
          const document = await PDFRenderer.loadDocument(getArrayBuffer(content));
          loadPDF(filePath || '', document, document.numPages);
          markAsUnsaved();
          message.info('已撤销擦除操作');
        }
      );

      await executeCommand(command);
    } catch (error) {
      console.error('Error erasing content:', error);
      message.error('擦除内容失败');
      throw error;
    }
  }, [pdfBytes, selectedPageIndex, filePath, loadPDF, addToHistory, markAsUnsaved, executeCommand]);

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
    onUndo: undo,
    onRedo: redo,
  });

  // ESC key handler to exit insert modes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (toolMode === 'insert-image' || toolMode === 'insert-text')) {
        setToolMode('view');
        message.info('已取消插入模式');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toolMode, setToolMode]);

  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : null;

  return (
    <>
      <MainLayout
          fileName={fileName || null}
          hasUnsavedChanges={hasUnsavedChanges}
          canSave={!!pdfDocument}
          onOpenFile={handleOpenFile}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onPrint={handlePrint}
          onUndo={undo}
          onRedo={redo}
          canUndo={commandIndex >= 0}
          canRedo={commandIndex < commandHistory.length - 1}
          onInsertImage={() => {
            setToolMode('insert-image');
            message.info('点击 PDF 位置插入图片');
          }}
          onInsertText={() => {
            setToolMode('insert-text');
            message.info('点击 PDF 位置插入文本');
          }}
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
                onInsertImageAtPosition={handleInsertImageAtPosition}
                onInsertTextAtPosition={handleInsertTextAtPosition}
                editingText={editingText}
                onEditingTextChange={setEditingText}
                onFinishEditingText={handleFinishEditingText}
                onCancelEditingText={handleCancelEditingText}
                onObjectMoveComplete={handleObjectMoveComplete}
                onObjectResizeComplete={handleObjectResizeComplete}
                onObjectRotateComplete={handleObjectRotateComplete}
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
    </>
  );
};
// Wrap app with ConfigProvider
const AppWrapper: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  );
};

export default AppWrapper;
