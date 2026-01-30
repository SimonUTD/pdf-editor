import React, { useState } from 'react';
import { InputNumber, Space, Typography } from 'antd';
import { useUIStore, usePDFStore } from '@/stores';
import { NavigationService } from '@/services/viewer';

const { Text } = Typography;

export const PageJumpControl: React.FC = () => {
  const { selectedPageIndex, selectPage } = useUIStore();
  const { pdfDocument } = usePDFStore();
  const [inputValue, setInputValue] = useState<number | null>(null);

  if (!pdfDocument) return null;

  const currentPage = selectedPageIndex + 1;
  const totalPages = pdfDocument.numPages;

  const handleJump = (value: number | null) => {
    if (value === null) return;

    const targetPage = NavigationService.jumpToPage(currentPage, value, totalPages);
    selectPage(targetPage - 1);
    setInputValue(null);
  };

  return (
    <Space align="center" size="small">
      <Text style={{ fontSize: 12 }}>
        {NavigationService.getPageDisplayText(currentPage, totalPages)}
      </Text>
      <InputNumber
        size="small"
        min={1}
        max={totalPages}
        value={inputValue}
        onChange={(value) => setInputValue(value)}
        onPressEnter={() => handleJump(inputValue)}
        placeholder="跳转"
        style={{ width: 70 }}
      />
    </Space>
  );
};
