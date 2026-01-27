/// <reference types="vite/client" />

interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

interface SaveResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

interface Window {
  electronAPI: {
    openFile: () => Promise<FileData | null>;
    saveFile: (filePath: string, data: ArrayBuffer) => Promise<SaveResult>;
    saveFileAs: (data: ArrayBuffer) => Promise<SaveResult>;
    printPDF: () => Promise<{ success: boolean }>;
  };
}
