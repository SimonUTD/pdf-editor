import { dialog, ipcMain, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

/**
 * Validates that the file path is safe and has a .pdf extension
 */
function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  // Check for path traversal attempts
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    return { valid: false, error: 'Invalid file path: path traversal detected' };
  }

  // Validate file extension
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.pdf') {
    return { valid: false, error: 'Invalid file extension: only .pdf files are allowed' };
  }

  return { valid: true };
}

/**
 * Validates that the data is a valid non-empty ArrayBuffer
 */
function validateData(data: unknown): { valid: boolean; error?: string } {
  if (!data || !(data instanceof ArrayBuffer)) {
    return { valid: false, error: 'Invalid data: must be an ArrayBuffer' };
  }

  if (data.byteLength === 0) {
    return { valid: false, error: 'Invalid data: ArrayBuffer is empty' };
  }

  return { valid: true };
}

/**
 * Safely extracts error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

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
      // Validate input parameters
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, error: 'Invalid file path parameter' };
      }

      const pathValidation = validateFilePath(filePath);
      if (!pathValidation.valid) {
        return { success: false, error: pathValidation.error };
      }

      const dataValidation = validateData(data);
      if (!dataValidation.valid) {
        return { success: false, error: dataValidation.error };
      }

      await fs.writeFile(filePath, Buffer.from(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('save-file-as', async (_event, data: ArrayBuffer) => {
    try {
      // Validate data parameter
      const dataValidation = validateData(data);
      if (!dataValidation.valid) {
        return { success: false, error: dataValidation.error };
      }

      const result = await dialog.showSaveDialog({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        defaultPath: 'document.pdf',
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.writeFile(result.filePath, Buffer.from(data));
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('print-pdf', async (_event) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();

    if (!focusedWindow) {
      return { success: false, error: 'No focused window available for printing' };
    }

    // Convert callback-based print to Promise-based
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      focusedWindow.webContents.print({}, (success, errorType) => {
        if (!success) {
          const errorMessage = `Print failed: ${errorType}`;
          console.error(errorMessage);
          resolve({ success: false, error: errorMessage });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}
