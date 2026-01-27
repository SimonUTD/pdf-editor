import { dialog, ipcMain, BrowserWindow } from 'electron';
import fs from 'fs/promises';

export function setupFileHandlers() {
  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const buffer = await fs.readFile(filePath);

    return {
      filePath,
      buffer: buffer.buffer,
      fileName: filePath.split('/').pop() || filePath.split('\\').pop(),
    };
  });

  ipcMain.handle('save-file', async (_event, filePath: string, data: ArrayBuffer) => {
    try {
      await fs.writeFile(filePath, Buffer.from(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('save-file-as', async (_event, data: ArrayBuffer) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      defaultPath: 'document.pdf',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      await fs.writeFile(result.filePath, Buffer.from(data));
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('print-pdf', async (_event) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.print({}, (success, errorType) => {
        if (!success) {
          console.error('Print failed:', errorType);
        }
      });
    }
    return { success: true };
  });
}
