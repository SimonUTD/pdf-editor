import { contextBridge, ipcRenderer } from 'electron';

export interface FileData {
  filePath: string;
  buffer: ArrayBuffer;
  fileName: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke('open-file'),
  saveFile: (data: ArrayBuffer): Promise<boolean> =>
    ipcRenderer.invoke('save-file', data),
});
