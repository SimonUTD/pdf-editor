import React, { useState, useCallback, useRef } from 'react';
import { ConfigProvider, theme, Empty, Modal, Input, App as AntdApp, Alert } from 'antd';
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
import { ImagesToPDF } from './components/Editors/ImagesToPDF';
import { ImageExtractor } from './components/Editors/ImageExtractor';
import { PDFSplitter } from './components/Editors/PDFSplitter';
import { PageExtractor } from './components/Editors/PageExtractor';
import { PageNumberAdder } from './components/Editors/PageNumberAdder';
import { PageReorder } from './components/Editors/PageReorder';
import { RedactTool } from './components/Editors/RedactTool';
import { PDFCompressor } from './components/Editors/PDFCompressor';
import { PDFOptimizer } from './components/Editors/PDFOptimizer';
import { SignatureTool, SignatureOptions } from './components/Editors/SignatureTool';
import { PasswordProtector, PDFPasswordProtectionOptions } from './components/Editors/PasswordProtector';
import { PDFConverter } from './components/Editors/PDFConverter';
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
  PageRotateCommand,
  EraseCommand,
  HighlightCommand,
  RedactCommand,
  type Command,
} from './commands';

const App: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { t } = useI18n();
  const { pdfDocument, filePath, totalPages, loadPDF } = usePDFStore();
  const {
    selectedPageIndex,
    selectPage,
    toolMode,
    setToolMode,
    getPageRotation,
    rotatePageLeft,
    rotatePageRight,
    flipPage,
    addRedactionMark,
    clearRedactionMarks,
  } = useUIStore();
  const { hasUnsavedChanges, markAsSaved, markAsUnsaved, addToHistory } = useEditStore();
  const { objects, addObject } = useObjectStore();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [imageInserterVisible, setImageInserterVisible] = useState(false);
  const [textInserterVisible, setTextInserterVisible] = useState(false);
  const [pdfMergerVisible, setPdfMergerVisible] = useState(false);
  const [watermarkEditorVisible, setWatermarkEditorVisible] = useState(false);
  const [headerFooterEditorVisible, setHeaderFooterEditorVisible] = useState(false);
  const [pageReplacerVisible, setPageReplacerVisible] = useState(false);
  const [imagesToPDFVisible, setImagesToPDFVisible] = useState(false);
  const [imageExtractorVisible, setImageExtractorVisible] = useState(false);
  const [pdfSplitterVisible, setPdfSplitterVisible] = useState(false);
  const [pageExtractorVisible, setPageExtractorVisible] = useState(false);
  const [redactToolVisible, setRedactToolVisible] = useState(false);
  const [pageNumberAdderVisible, setPageNumberAdderVisible] = useState(false);
  const [pageReorderVisible, setPageReorderVisible] = useState(false);
  const [pdfCompressorVisible, setPdfCompressorVisible] = useState(false);
  const [pdfOptimizerVisible, setPdfOptimizerVisible] = useState(false);
  const [signatureToolVisible, setSignatureToolVisible] = useState(false);
  const [passwordProtectorVisible, setPasswordProtectorVisible] = useState(false);
  const [pdfConverterVisible, setPdfConverterVisible] = useState(false);
  const [pendingSignature, setPendingSignature] = useState<SignatureOptions | null>(null);


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

      // Initialize pageRotations with PDF's original rotation for each page
      const rotations: number[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await document.getPage(i);
        // PDF pages have a rotation property (0, 90, 180, 270)
        rotations.push((page as any).rotation || 0);
      }
      // Set the initial rotations in uiStore
      useUIStore.setState({ pageRotations: rotations });

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

  // 插入文本到指定位置 (点击插入功能) - 立即创建 TextObject
  const handleInsertTextAtPosition = useCallback(async (pageIndex: number, x: number, y: number) => {
    if (!pdfBytes) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    // 创建 TextObject
    const newObject: TextObject = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      pageIndex,
      position: { x, y },
      size: { width: 200, height: 100 },
      zIndex: objects.length + 1,
      selected: true,
      content: '',
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
        addObject(obj);
        markAsUnsaved();

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

        message.success('文本已插入，可直接编辑');
      },
      async (id) => {
        useObjectStore.getState().deleteObject(id);
        markAsUnsaved();
      }
    );

    await executeCommand(command);

    // 退出插入模式
    setToolMode('view');
  }, [pdfBytes, objects.length, addObject, setToolMode, executeCommand, addToHistory, markAsUnsaved]);

  // 处理签名选项 - 准备签名模式
  const handleAddSignature = useCallback(async (options: SignatureOptions) => {
    setPendingSignature(options);
    setToolMode('insert-signature');
    message.info('点击PDF位置放置签名');
  }, [setToolMode]);

  // 插入签名到指定位置
  const handleInsertSignatureAtPosition = useCallback(async (pageIndex: number, x: number, y: number) => {
    if (!pendingSignature || !pdfBytes) {
      message.error('没有待放置的签名');
      setToolMode('view');
      return;
    }

    try {
      const { imageBytes, imageWidth, imageHeight, addDate, dateText, dateFontSize, dateColor } = pendingSignature;

      // 将签名图片转换为base64
      const base64 = `data:image/png;base64,${btoa(String.fromCharCode(...imageBytes))}`;

      // 创建签名图片对象
      const signatureImageObject: ImageObject = {
        id: `signature-img-${Date.now()}-${Math.random()}`,
        type: 'image',
        pageIndex,
        position: { x, y },
        size: { width: imageWidth, height: imageHeight },
        zIndex: objects.length + 1,
        selected: false,
        content: base64,
        opacity: 1,
      };

      // 使用ImageInsertCommand插入签名图片
      const imageCommand = new ImageInsertCommand(
        signatureImageObject,
        async (obj) => {
          addObject(obj);
          markAsUnsaved();
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
        },
        async (id) => {
          useObjectStore.getState().deleteObject(id);
          markAsUnsaved();
        }
      );

      await executeCommand(imageCommand);

      // 如果需要添加日期，在签名下方创建文本对象
      if (addDate && dateText && dateFontSize && dateColor) {
        const dateX = x;
        const dateY = y - 20; // 在签名下方20像素

        const dateObject: TextObject = {
          id: `signature-date-${Date.now()}-${Math.random()}`,
          type: 'text',
          pageIndex,
          position: { x: dateX, y: dateY },
          size: { width: 150, height: 30 },
          zIndex: objects.length + 2,
          selected: false,
          content: dateText,
          style: {
            fontSize: dateFontSize,
            color: `#${Math.round(dateColor.r * 255).toString(16).padStart(2, '0')}${Math.round(dateColor.g * 255).toString(16).padStart(2, '0')}${Math.round(dateColor.b * 255).toString(16).padStart(2, '0')}`,
            fontFamily: 'sans-serif',
            opacity: 1,
          },
        };

        const textCommand = new TextInsertCommand(
          dateObject,
          async (obj) => {
            addObject(obj);
            markAsUnsaved();
            addToHistory({
              type: 'text-insert',
              timestamp: Date.now(),
              data: {
                pageIndex: obj.pageIndex,
                text: obj.content,
                x: obj.position.x,
                y: obj.position.y,
                fontSize: obj.style.fontSize,
                color: dateColor,
              },
            });
          },
          async (id) => {
            useObjectStore.getState().deleteObject(id);
            markAsUnsaved();
          }
        );

        await executeCommand(textCommand);
      }

      message.success('签名已添加，可拖拽调整位置和大小');
      setPendingSignature(null);
      setToolMode('view');
    } catch (error) {
      console.error('Error inserting signature:', error);
      message.error('插入签名失败');
      setToolMode('view');
    }
  }, [pendingSignature, pdfBytes, objects.length, addObject, setToolMode, executeCommand, addToHistory, markAsUnsaved]);

  // 处理密码保护
  const handleProtectPDF = useCallback(async (options: PDFPasswordProtectionOptions) => {
    if (!pdfBytes) {
      message.error(getMessage('没有可加密的 PDF 文档'));
      return;
    }

    try {
      // 由于 pdf-lib 1.17.1 不直接支持加密，我们需要使用外部方法
      // 这里先实现一个基础版本，将加密后的 PDF 下载到本地

      // 注意：pdf-lib 没有直接的加密 API
      // 我们需要使用其他方法，比如：
      // 1. 使用 qpdf 命令行工具（需要通过 Electron 主进程调用）
      // 2. 使用其他支持加密的 Node.js 库
      // 3. 在主进程中通过 child_process 调用系统工具

      // 暂时的解决方案：提示用户使用外部工具
      const configText = `用户密码: ${options.userPassword}\n所有者密码: ${options.ownerPassword}\n允许打印: ${options.permissions.printing ? '是' : '否'}\n允许复制: ${options.permissions.copying ? '是' : '否'}\n允许编辑: ${options.permissions.modifying ? '是' : '否'}`;

      // 尝试复制到剪贴板
      let copySuccess = false;
      try {
        await navigator.clipboard.writeText(configText);
        copySuccess = true;
      } catch (clipboardError) {
        console.warn('Failed to copy to clipboard:', clipboardError);
        // 剪贴板复制失败不是致命错误，继续执行
      }

      Modal.info({
        title: getMessage('密码保护 - 需要外部工具'),
        content: (
          <div>
            <p>{getMessage('由于技术限制，当前版本需要使用外部工具来完成 PDF 加密。')}</p>
            <p><strong>{getMessage('推荐的加密工具：')}</strong></p>
            <ul>
              <li>qPDF: <code>qpdf --encrypt user-password owner-password 256 -- input.pdf output.pdf</code></li>
              <li>PDFtk: <code>pdftk input.pdf output output.pdf user_pw user-password owner_pw owner-password</code></li>
            </ul>
            <p><strong>{getMessage('您的加密配置：')}</strong></p>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12 }}>
              {configText}
            </pre>
            {copySuccess ? (
              <Alert
                message={getMessage('配置已复制到剪贴板')}
                type="success"
                showIcon
                style={{ marginTop: 12 }}
              />
            ) : (
              <Alert
                message={getMessage('自动复制失败，请手动复制上面的配置')}
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
            <Alert
              message={getMessage('安全提示')}
              description={getMessage('密码已显示在界面上，请注意周围环境安全。使用后请及时清除剪贴板。')}
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
            />
          </div>
        ),
        width: 700,
        okText: getMessage('知道了'),
      });

    } catch (error) {
      console.error('Error preparing PDF protection:', error);
      // 不 throw，避免组件层重复提示
    }
  }, [pdfBytes]);


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

  const handleAddPageNumbers = useCallback(async (options: {
    position: 'top' | 'bottom' | 'left' | 'right';
    format: 'arabic' | 'roman';
    startNumber: number;
    fontSize: number;
    color: { r: number; g: number; b: number };
    rangeMode: 'all' | 'range';
    pageRange?: string;
  }) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);
      await PDFEditor.addPageNumbers(pdfDoc, options);
      const newBytes = await PDFEditor.saveToBytes(pdfDoc);
      setPdfBytes(newBytes);
      const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
      loadPDF(filePath || '', document, document.numPages);
      addToHistory({
        type: 'page-numbers-add',
        timestamp: Date.now(),
        data: { options },
      });
      markAsUnsaved();
    } catch (error) {
      console.error('Error adding page numbers:', error);
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

  const handleExportAsHTML = useCallback(async () => {
    if (!pdfDocument) {
      message.error(getMessage('No PDF loaded'));
      return;
    }

    try {
      const fileName = filePath ? filePath.split('/').pop()?.replace('.pdf', '') || 'document' : 'document';
      await ExportService.exportAsHTML(pdfDocument, fileName);
      message.success('已导出为HTML文档');
    } catch (error) {
      console.error('Error exporting as HTML:', error);
      message.error('导出HTML失败');
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

  // 页面旋转处理函数
  const handleRotatePageLeft = useCallback(async () => {
    const pageIndex = selectedPageIndex;
    const oldRotation = getPageRotation(pageIndex);
    const command = new PageRotateCommand(
      pageIndex,
      oldRotation,
      (oldRotation - 90 + 360) % 360,
      rotatePageLeft
    );
    await executeCommand(command);
    message.success(`第 ${pageIndex + 1} 页向左旋转 90°`);
  }, [selectedPageIndex, getPageRotation, rotatePageLeft, executeCommand]);

  const handleRotatePageRight = useCallback(async () => {
    const pageIndex = selectedPageIndex;
    const oldRotation = getPageRotation(pageIndex);
    const command = new PageRotateCommand(
      pageIndex,
      oldRotation,
      (oldRotation + 90) % 360,
      rotatePageRight
    );
    await executeCommand(command);
    message.success(`第 ${pageIndex + 1} 页向右旋转 90°`);
  }, [selectedPageIndex, getPageRotation, rotatePageRight, executeCommand]);

  const handleFlipPage = useCallback(async () => {
    const pageIndex = selectedPageIndex;
    const oldRotation = getPageRotation(pageIndex);
    const command = new PageRotateCommand(
      pageIndex,
      oldRotation,
      (oldRotation + 180) % 360,
      flipPage
    );
    await executeCommand(command);
    message.success(`第 ${pageIndex + 1} 页已翻转`);
  }, [selectedPageIndex, getPageRotation, flipPage, executeCommand]);

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

  // Add redaction mark (only add to store, don't apply to PDF yet)
  const handleAddRedactionMark = useCallback(async (x: number, y: number, width: number, height: number) => {
    addRedactionMark({
      pageIndex: selectedPageIndex,
      x,
      y,
      width,
      height,
    });
  }, [selectedPageIndex, addRedactionMark]);

  // Apply all redaction marks to PDF
  const handleApplyRedactions = useCallback(async () => {
    if (!pdfBytes) {
      message.error('没有加载PDF文件');
      return;
    }

    try {
      const { redactionMarks } = useUIStore.getState();

      if (redactionMarks.length === 0) {
        message.warning('没有密文标记可应用');
        return;
      }

      // Save original state for undo
      const originalBytes = new Uint8Array(pdfBytes);

      const command = new RedactCommand(
        redactionMarks,
        originalBytes,
        async (marks) => {
          // onExecute callback
          const pdfDoc = await PDFEditor.createFromBytes(pdfBytes);

          // Apply all redactions
          await PDFEditor.applyRedactions(
            pdfDoc,
            marks.map(m => ({
              pageIndex: m.pageIndex,
              x: m.x,
              y: m.y,
              width: m.width,
              height: m.height,
            }))
          );

          const newBytes = await PDFEditor.saveToBytes(pdfDoc);
          setPdfBytes(newBytes);
          const document = await PDFRenderer.loadDocument(getArrayBuffer(newBytes));
          loadPDF(filePath || '', document, document.numPages);

          // Clear redaction marks
          clearRedactionMarks();

          addToHistory({
            type: 'redaction-apply',
            timestamp: Date.now(),
            data: { count: marks.length }
          });
          markAsUnsaved();
        },
        async (originalBytes: Uint8Array) => {
          // onUndo callback
          setPdfBytes(originalBytes);
          const document = await PDFRenderer.loadDocument(getArrayBuffer(originalBytes));
          loadPDF(filePath || '', document, document.numPages);
          markAsUnsaved();
          message.info('已撤销密文应用');
        }
      );

      await executeCommand(command);
    } catch (error) {
      console.error('Error applying redactions:', error);
      message.error('应用密文失败');
      throw error;
    }
  }, [pdfBytes, filePath, loadPDF, addToHistory, markAsUnsaved, executeCommand, clearRedactionMarks]);

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
          onExportAsHTML={handleExportAsHTML}
          onShowPDFConverter={() => setPdfConverterVisible(true)}
          onMergePDFs={() => setPdfMergerVisible(true)}
          onAddWatermark={() => setWatermarkEditorVisible(true)}
          onAddHeaderFooter={() => setHeaderFooterEditorVisible(true)}
          onReplacePage={() => setPageReplacerVisible(true)}
          onReversePages={handleReversePages}
          onImagesToPDF={() => setImagesToPDFVisible(true)}
          onExtractImages={() => setImageExtractorVisible(true)}
          onSplitPDF={() => setPdfSplitterVisible(true)}
          onExtractPages={() => setPageExtractorVisible(true)}
          onAddPageNumbers={() => setPageNumberAdderVisible(true)}
          onReorderPages={() => setPageReorderVisible(true)}
          onOptimizePDF={() => setPdfOptimizerVisible(true)}
          onRotatePageLeft={handleRotatePageLeft}
          onRotatePageRight={handleRotatePageRight}
          onFlipPage={handleFlipPage}
          onRedact={() => {
            setToolMode('redact');
            setRedactToolVisible(true);
            message.info('密文模式 - 拖拽鼠标画框标记密文区域');
          }}
          onCompressPDF={() => setPdfCompressorVisible(true)}
          onAddSignature={() => setSignatureToolVisible(true)}
          onPasswordProtect={() => setPasswordProtectorVisible(true)}
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
                rotation={getPageRotation(selectedPageIndex)}
                onEraseRegion={handleEraseContent}
                onHighlightRegion={handleAddHighlight}
                onRedactRegion={handleAddRedactionMark}
                onInsertImageAtPosition={handleInsertImageAtPosition}
                onInsertTextAtPosition={handleInsertTextAtPosition}
                onInsertSignatureAtPosition={handleInsertSignatureAtPosition}
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

      <ImagesToPDF
        visible={imagesToPDFVisible}
        onClose={() => setImagesToPDFVisible(false)}
      />

      <ImageExtractor
        visible={imageExtractorVisible}
        onClose={() => setImageExtractorVisible(false)}
        pdfDocument={pdfDocument}
      />

      <PDFSplitter
        visible={pdfSplitterVisible}
        onClose={() => setPdfSplitterVisible(false)}
        pdfDocument={pdfDocument}
        pdfBytes={pdfBytes}
      />

      <PageExtractor
        visible={pageExtractorVisible}
        onClose={() => setPageExtractorVisible(false)}
        pdfDocument={pdfDocument}
        pdfBytes={pdfBytes}
      />

      <PageNumberAdder
        visible={pageNumberAdderVisible}
        onClose={() => setPageNumberAdderVisible(false)}
        totalPages={totalPages}
        onAddPageNumbers={handleAddPageNumbers}
      />

      <PageReorder
        visible={pageReorderVisible}
        onClose={() => setPageReorderVisible(false)}
        pdfDocument={pdfDocument}
        pdfBytes={pdfBytes}
      />

      <RedactTool
        visible={redactToolVisible}
        onClose={() => setRedactToolVisible(false)}
        onApplyRedactions={handleApplyRedactions}
      />

      <PDFCompressor
        visible={pdfCompressorVisible}
        onClose={() => setPdfCompressorVisible(false)}
        pdfBytes={pdfBytes}
        onReplaceDocument={reloadPDF}
      />

      <PDFOptimizer
        visible={pdfOptimizerVisible}
        onClose={() => setPdfOptimizerVisible(false)}
        pdfBytes={pdfBytes}
        onReplaceDocument={reloadPDF}
      />

      <SignatureTool
        visible={signatureToolVisible}
        onClose={() => setSignatureToolVisible(false)}
        onAddSignature={handleAddSignature}
      />

      <PasswordProtector
        visible={passwordProtectorVisible}
        onClose={() => setPasswordProtectorVisible(false)}
        pdfBytes={pdfBytes}
        onProtect={handleProtectPDF}
      />

      <PDFConverter
        visible={pdfConverterVisible}
        onClose={() => setPdfConverterVisible(false)}
        pdfDocument={pdfDocument}
        fileName={filePath || 'document'}
      />
    </>
  );
};
// Wrap app with ConfigProvider and AntdApp
const AppWrapper: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
};

export default AppWrapper;
