import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onSaveAs?: () => void;
  onPrint?: () => void;
  onOpen?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (modifier && event.key === 's') {
        event.preventDefault();
        if (event.shiftKey && shortcuts.onSaveAs) {
          shortcuts.onSaveAs();
        } else if (shortcuts.onSave) {
          shortcuts.onSave();
        }
      } else if (modifier && event.key === 'p') {
        event.preventDefault();
        if (shortcuts.onPrint) {
          shortcuts.onPrint();
        }
      } else if (modifier && event.key === 'o') {
        event.preventDefault();
        if (shortcuts.onOpen) {
          shortcuts.onOpen();
        }
      } else if (modifier && event.key === 'z') {
        event.preventDefault();
        // Undo: Ctrl+Z or Cmd+Z (without shift)
        if (!event.shiftKey && shortcuts.onUndo) {
          shortcuts.onUndo();
        }
        // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
        else if (event.shiftKey && shortcuts.onRedo) {
          shortcuts.onRedo();
        }
      } else if (modifier && event.key === 'y') {
        event.preventDefault();
        // Redo: Ctrl+Y or Cmd+Y
        if (shortcuts.onRedo) {
          shortcuts.onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
