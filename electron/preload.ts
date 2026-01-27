import { contextBridge, ipcRenderer } from 'electron';

export interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

export interface SaveResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke('open-file'),
  saveFile: (filePath: string, data: ArrayBuffer): Promise<SaveResult> =>
    ipcRenderer.invoke('save-file', filePath, data),
  saveFileAs: (data: ArrayBuffer): Promise<SaveResult> =>
    ipcRenderer.invoke('save-file-as', data),
  printPDF: (): Promise<PrintResult> =>
    ipcRenderer.invoke('print-pdf'),
});
