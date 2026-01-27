import React, { useState } from 'react';
import { Modal, Button, Input, InputNumber, Space, Radio, ColorPicker, message, Tabs } from 'antd';
import { FontSizeOutlined } from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';

interface HeaderFooterEditorProps {
  visible: boolean;
  onClose: () => void;
  onAddHeader: (
    text: string,
    options: {
      fontSize: number;
      color: { r: number; g: number; b: number };
      alignment: 'left' | 'center' | 'right';
      marginTop: number;
    }
  ) => Promise<void>;
  onAddFooter: (
    text: string,
    options: {
      fontSize: number;
      color: { r: number; g: number; b: number };
      alignment: 'left' | 'center' | 'right';
      marginBottom: number;
    }
  ) => Promise<void>;
}

export const HeaderFooterEditor: React.FC<HeaderFooterEditorProps> = ({
  visible,
  onClose,
  onAddHeader,
  onAddFooter,
}) => {
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');
  const [headerText, setHeaderText] = useState<string>('Page {page} of {total}');
  const [footerText, setFooterText] = useState<string>('Page {page} of {total}');
  const [fontSize, setFontSize] = useState<number>(10);
  const [color, setColor] = useState<Color | string>('#000000');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [margin, setMargin] = useState<number>(20);
  const [loading, setLoading] = useState(false);

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

  const handleAdd = async () => {
    try {
      setLoading(true);

      const text = activeTab === 'header' ? headerText : footerText;
      if (!text || text.trim().length === 0) {
        message.error(`Please enter ${activeTab} text`);
        return;
      }

      const colorStr = typeof color === 'string' ? color : color.toHexString();
      const rgb = hexToRgb(colorStr);

      if (activeTab === 'header') {
        await onAddHeader(text, {
          fontSize,
          color: rgb,
          alignment,
          marginTop: margin,
        });
        message.success('Header added successfully');
      } else {
        await onAddFooter(text, {
          fontSize,
          color: rgb,
          alignment,
          marginBottom: margin,
        });
        message.success('Footer added successfully');
      }

      handleClose();
    } catch (error) {
      console.error(`Error adding ${activeTab}:`, error);
      message.error(`Failed to add ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHeaderText('Page {page} of {total}');
    setFooterText('Page {page} of {total}');
    setFontSize(10);
    setColor('#000000');
    setAlignment('center');
    setMargin(20);
    setActiveTab('header');
    onClose();
  };

  return (
    <Modal
      title="Add Header/Footer"
      open={visible}
      onCancel={handleClose}
      onOk={handleAdd}
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'header' | 'footer')}
          items={[
            { key: 'header', label: 'Header' },
            { key: 'footer', label: 'Footer' },
          ]}
        />

        <div>
          <strong>{activeTab === 'header' ? 'Header' : 'Footer'} Text:</strong>
          <Input
            value={activeTab === 'header' ? headerText : footerText}
            onChange={(e) =>
              activeTab === 'header'
                ? setHeaderText(e.target.value)
                : setFooterText(e.target.value)
            }
            placeholder="Use {page} for page number, {total} for total pages"
            style={{ marginTop: 8 }}
          />
          <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
            Tip: Use {'{page}'} for page number and {'{total}'} for total pages
          </div>
        </div>

        <div>
          <strong>Font Size:</strong>
          <InputNumber
            min={6}
            max={24}
            value={fontSize}
            onChange={(value) => setFontSize(value || 10)}
            style={{ width: 120, marginLeft: 8 }}
          />
        </div>

        <div>
          <strong>Text Color:</strong>
          <ColorPicker
            value={color}
            onChange={setColor}
            showText
            style={{ marginLeft: 8 }}
          />
        </div>

        <div>
          <strong>Alignment:</strong>
          <Radio.Group
            value={alignment}
            onChange={(e) => setAlignment(e.target.value)}
            style={{ marginTop: 8, display: 'block' }}
          >
            <Radio value="left">Left</Radio>
            <Radio value="center">Center</Radio>
            <Radio value="right">Right</Radio>
          </Radio.Group>
        </div>

        <div>
          <strong>Margin:</strong>
          <InputNumber
            min={10}
            max={100}
            value={margin}
            onChange={(value) => setMargin(value || 20)}
            style={{ width: 120, marginLeft: 8 }}
          />
          <span style={{ marginLeft: 8 }}>points</span>
        </div>
      </Space>
    </Modal>
  );
};
