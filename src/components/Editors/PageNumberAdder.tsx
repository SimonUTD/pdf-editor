import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, Radio, ColorPicker, message, Input } from 'antd';
import { FontSizeOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import { toRoman } from '@/utils/romanNumerals';

export type PageNumberPosition = 'top' | 'bottom' | 'left' | 'right';
export type PageNumberFormat = 'arabic' | 'roman';
export type PageNumberRangeMode = 'all' | 'range';

export interface AddPageNumbersOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  fontSize: number;
  color: { r: number; g: number; b: number };
  rangeMode: PageNumberRangeMode;
  pageRange?: string;
}

interface PageNumberAdderProps {
  visible: boolean;
  onClose: () => void;
  totalPages: number;
  onAddPageNumbers: (options: AddPageNumbersOptions) => Promise<void>;
}

export const PageNumberAdder: React.FC<PageNumberAdderProps> = ({
  visible,
  onClose,
  totalPages,
  onAddPageNumbers,
}) => {
  const [position, setPosition] = useState<PageNumberPosition>('bottom');
  const [format, setFormat] = useState<PageNumberFormat>('arabic');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(10);
  const [color, setColor] = useState<Color | string>('#000000');
  const [rangeMode, setRangeMode] = useState<PageNumberRangeMode>('all');
  const [pageRange, setPageRange] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 计算最大显示页码（用于罗马数字校验）
  const maxDisplayNumber = rangeMode === 'all'
    ? startNumber + totalPages - 1
    : startNumber + 1000; // 指定范围时保守估计，避免复杂计算

  // 校验罗马数字范围
  const isRomanInRange = format === 'arabic' || (maxDisplayNumber <= 3999);

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const validatePageRange = (range: string): boolean => {
    if (!range || range.trim().length === 0) {
      message.error('请输入页面范围');
      return false;
    }

    // 解析页面范围
    const parts = range.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim()));
        if (
          isNaN(start) ||
          isNaN(end) ||
          start < 1 ||
          end > totalPages ||
          start > end
        ) {
          message.error(`无效的页面范围: ${trimmed}`);
          return false;
        }
      } else {
        const page = parseInt(trimmed);
        if (isNaN(page) || page < 1 || page > totalPages) {
          message.error(`无效的页码: ${trimmed}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleAdd = async () => {
    try {
      setLoading(true);

      // 校验起始页码
      if (startNumber < 1) {
        message.error('起始页码必须大于0');
        return;
      }

      // 校验字体大小
      if (fontSize < 6 || fontSize > 72) {
        message.error('字体大小必须在6-72之间');
        return;
      }

      // 校验页面范围
      if (rangeMode === 'range' && !validatePageRange(pageRange)) {
        return;
      }

      const colorStr = typeof color === 'string' ? color : color.toHexString();
      const rgb = hexToRgb(colorStr);

      const options: AddPageNumbersOptions = {
        position,
        format,
        startNumber,
        fontSize,
        color: rgb,
        rangeMode,
        pageRange: rangeMode === 'range' ? pageRange : undefined,
      };

      await onAddPageNumbers(options);
      message.success('页码添加成功');
      handleClose();
    } catch (error) {
      console.error('Error adding page numbers:', error);
      const errorMessage = error instanceof Error ? error.message : '添加页码失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPosition('bottom');
    setFormat('arabic');
    setStartNumber(1);
    setFontSize(10);
    setColor('#000000');
    setRangeMode('all');
    setPageRange('');
    onClose();
  };

  // 预览页码示例
  const previewNumber = startNumber;
  let previewText: string;
  try {
    previewText =
      format === 'roman' ? toRoman(previewNumber).toLowerCase() : String(previewNumber);
  } catch (error) {
    // 如果罗马数字转换失败（超出范围），显示阿拉伯数字
    previewText = String(previewNumber);
  }

  return (
    <Modal
      title="添加页码"
      open={visible}
      onCancel={handleClose}
      onOk={handleAdd}
      okText="确认"
      cancelText="取消"
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 位置选择 */}
        <div>
          <strong>页码位置：</strong>
          <Radio.Group
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={{ marginTop: 8, display: 'block' }}
          >
            <Radio value="top">顶部</Radio>
            <Radio value="bottom">底部</Radio>
            <Radio value="left">左侧</Radio>
            <Radio value="right">右侧</Radio>
          </Radio.Group>
        </div>

        {/* 页码格式 */}
        <div>
          <strong>页码格式：</strong>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ marginTop: 8, display: 'block' }}
          >
            <Radio value="arabic">数字 (1, 2, 3, ...)</Radio>
            <Radio value="roman">罗马数字 (i, ii, iii, ...)</Radio>
          </Radio.Group>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            预览: {previewText}
          </div>
        </div>

        {/* 起始页码 */}
        <div>
          <strong>起始页码：</strong>
          <InputNumber
            min={1}
            max={9999}
            value={startNumber}
            onChange={(value) => setStartNumber(value || 1)}
            style={{ width: 120, marginLeft: 8 }}
          />
          {format === 'roman' && !isRomanInRange && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#ff4d4f' }}>
              注意：罗马数字仅支持1-3999，当前配置将超出范围，部分页码会显示为阿拉伯数字
            </div>
          )}
        </div>

        {/* 字体大小 */}
        <div>
          <strong>字体大小：</strong>
          <InputNumber
            min={6}
            max={72}
            value={fontSize}
            onChange={(value) => setFontSize(value || 10)}
            style={{ width: 120, marginLeft: 8 }}
          />
        </div>

        {/* 字体颜色 */}
        <div>
          <strong>字体颜色：</strong>
          <ColorPicker
            value={color}
            onChange={setColor}
            showText
            style={{ marginLeft: 8 }}
          />
        </div>

        {/* 应用范围 */}
        <div>
          <strong>应用范围：</strong>
          <Radio.Group
            value={rangeMode}
            onChange={(e) => setRangeMode(e.target.value)}
            style={{ marginTop: 8, display: 'block' }}
          >
            <Radio value="all">全部页面</Radio>
            <Radio value="range">指定范围</Radio>
          </Radio.Group>
        </div>

        {/* 页面范围输入 */}
        {rangeMode === 'range' && (
          <div>
            <strong>页面范围：</strong>
            <Input
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="例如: 1-3,5,7-9"
              style={{ marginTop: 8, width: '100%' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              总页数: {totalPages} | 格式: 单页用逗号分隔，范围用连字符，例如:
              1-3,5,7-9
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};
