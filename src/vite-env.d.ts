/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openFile: () => Promise<{ filePath: string; buffer: ArrayBuffer } | null>;
    saveFile: (data: ArrayBuffer) => Promise<boolean>;
  };
}
