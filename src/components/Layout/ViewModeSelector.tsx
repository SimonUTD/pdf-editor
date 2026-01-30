import React from 'react';
import { Select } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useUIStore, ViewMode } from '@/stores';

export const ViewModeSelector: React.FC = () => {
  const { viewMode, setViewMode } = useUIStore();

  const handleChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <Select
      value={viewMode}
      onChange={handleChange}
      style={{ width: 120 }}
      placeholder="查看模式"
    >
      <Select.Option value="actual">
        <EyeOutlined /> 1:1
      </Select.Option>
      <Select.Option value="fit-page">
        <EyeOutlined /> 完整页面
      </Select.Option>
      <Select.Option value="fit-width">
        <EyeOutlined /> 宽度100%
      </Select.Option>
      <Select.Option value="two-page">
        <EyeOutlined /> 双页并排
      </Select.Option>
    </Select>
  );
};
