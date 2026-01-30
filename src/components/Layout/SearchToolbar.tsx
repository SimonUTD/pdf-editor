import React, { useEffect, useState } from 'react';
import { Input, Button, Space, Typography, Spin } from 'antd';
import { SearchOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useUIStore, usePDFStore } from '@/stores';
import { PDFSearchService } from '@/services/pdf/PDFSearchService';

const { Text } = Typography;

export const SearchToolbar: React.FC = () => {
  const { searchQuery, searchResults, currentMatchIndex, setSearchQuery, setSearchResults, setCurrentMatchIndex, selectPage } = useUIStore();
  const { pdfDocument } = usePDFStore();
  const [loading, setLoading] = useState(false);

  const totalMatches = searchResults.reduce((sum: number, r: any) => sum + r.items.length, 0);

  // 执行搜索
  useEffect(() => {
    if (!pdfDocument || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await PDFSearchService.searchPDF(pdfDocument, searchQuery);
        setSearchResults(results);
        if (results.length > 0 && results[0].items.length > 0) {
          // 跳转到第一个匹配项
          selectPage(results[0].pageIndex);
          setCurrentMatchIndex(0);
        }
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, pdfDocument]);

  // 导航到下一个匹配项
  const goToNextMatch = () => {
    if (totalMatches === 0) return;

    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);

    // 找到对应的页面
    let count = 0;
    for (const result of searchResults) {
      if (count + result.items.length > nextIndex) {
        selectPage(result.pageIndex);
        break;
      }
      count += result.items.length;
    }
  };

  // 导航到上一个匹配项
  const goToPrevMatch = () => {
    if (totalMatches === 0) return;

    const prevIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prevIndex);

    // 找到对应的页面
    let count = 0;
    for (const result of searchResults) {
      if (count + result.items.length > prevIndex) {
        selectPage(result.pageIndex);
        break;
      }
      count += result.items.length;
    }
  };

  return (
    <Space size="small" style={{ display: 'flex', alignItems: 'center' }}>
      <Input
        placeholder="搜索..."
        prefix={<SearchOutlined />}
        suffix={loading && <Spin size="small" />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        allowClear
        style={{ width: 200 }}
      />
      {totalMatches > 0 && (
        <>
          <Text style={{ minWidth: 60, textAlign: 'center' }}>
            {currentMatchIndex + 1} / {totalMatches}
          </Text>
          <Button size="small" icon={<UpOutlined />} onClick={goToPrevMatch} title="上一个 (Shift+Enter)" />
          <Button size="small" icon={<DownOutlined />} onClick={goToNextMatch} title="下一个 (Enter)" />
        </>
      )}
      {totalMatches === 0 && searchQuery && !loading && (
        <Text type="secondary">未找到</Text>
      )}
    </Space>
  );
};
