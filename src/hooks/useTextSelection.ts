import { useEffect } from 'react';
import { message } from 'antd';

export const useTextSelection = () => {
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection) return;
      const text = selection.toString();

      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          message.success('已复制到剪贴板');
        }).catch((err) => {
          console.error('复制失败:', err);
          message.error('复制失败');
        });
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);
};
