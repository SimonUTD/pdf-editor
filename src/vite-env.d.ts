/// <reference types="vite/client" />

interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

interface Window {
  electronAPI: {
    openFile: () => Promise<FileData | null>;
    saveFile: (data: ArrayBuffer) => Promise<boolean>;
  };
}
