import React, { useEffect, useState } from 'react';
import { Input, Button, Space, Typography } from 'antd';
import { SearchOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useUIStore, usePDFStore } from '@/stores';
import { PDFSearchService, SearchResult } from '@/services/pdf/PDFSearchService';
import { message } from 'antd';

const { Text } = Typography;

export const SearchPanel: React.FC = () => {
  const {
    searchQuery,
    searchResults,
    currentMatchIndex,
    setSearchQuery,
    setSearchResults,
    setCurrentMatchIndex,
    selectPage,
  } = useUIStore();
  const { pdfDocument } = usePDFStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!pdfDocument || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const results = await PDFSearchService.searchPDF(pdfDocument, searchQuery);
        setSearchResults(results);
        setCurrentMatchIndex(0);

        if (results.length > 0) {
          message.success(`找到 ${PDFSearchService.getTotalMatchCount(results)} 个匹配项`);
        } else {
          message.info('未找到匹配项');
        }
      } catch (error) {
        console.error('Search failed:', error);
        message.error('搜索失败');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, pdfDocument, setSearchResults, setCurrentMatchIndex]);

  const totalMatches = searchResults.reduce((sum: number, r: SearchResult) => sum + r.items.length, 0);

  const goToNextMatch = () => {
    if (totalMatches === 0) return;

    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);

    // Navigate to the page containing this match
    let count = 0;
    for (const result of searchResults) {
      if (count + result.items.length > nextIndex) {
        selectPage(result.pageIndex);
        break;
      }
      count += result.items.length;
    }
  };

  const goToPrevMatch = () => {
    if (totalMatches === 0) return;

    const prevIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prevIndex);

    // Navigate to the page containing this match
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
    <div style={{ padding: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="搜索文本..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          loading={loading}
          allowClear
        />

        {totalMatches > 0 && (
          <>
            <Space>
              <Text>
                {currentMatchIndex + 1} / {totalMatches}
              </Text>
              <Button
                size="small"
                icon={<UpOutlined />}
                onClick={goToPrevMatch}
              >
                上一个
              </Button>
              <Button
                size="small"
                icon={<DownOutlined />}
                onClick={goToNextMatch}
              >
                下一个
              </Button>
            </Space>
          </>
        )}
      </Space>
    </div>
  );
};
