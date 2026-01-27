import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onSaveAs?: () => void;
  onPrint?: () => void;
  onOpen?: () => void;
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
