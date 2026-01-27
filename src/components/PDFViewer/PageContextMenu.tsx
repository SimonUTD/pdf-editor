import React from 'react';
import { Dropdown, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  FileAddOutlined,
} from '@ant-design/icons';

interface PageContextMenuProps {
  pageNumber: number;
  onDeletePage: (pageNumber: number) => void;
  onInsertBlankPage: (afterPageNumber: number) => void;
  children: React.ReactNode;
}

export const PageContextMenu: React.FC<PageContextMenuProps> = ({
  pageNumber,
  onDeletePage,
  onInsertBlankPage,
  children,
}) => {
  const items: MenuProps['items'] = [
    {
      key: 'insert',
      label: 'Insert Blank Page After',
      icon: <FileAddOutlined />,
      onClick: () => onInsertBlankPage(pageNumber),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete Page',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeletePage(pageNumber),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  );
};
