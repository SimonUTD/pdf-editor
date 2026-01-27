import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations will be added here
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data: ArrayBuffer) => ipcRenderer.invoke('save-file', data),
});
