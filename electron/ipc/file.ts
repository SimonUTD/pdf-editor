import { dialog, ipcMain } from 'electron';
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

  ipcMain.handle('save-file', async (_event, data: ArrayBuffer) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    await fs.writeFile(result.filePath, Buffer.from(data));
    return true;
  });
}
