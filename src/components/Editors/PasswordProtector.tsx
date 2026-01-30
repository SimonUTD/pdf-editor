import React, { useState } from 'react';
import {
  Modal,
  Input,
  Space,
  Checkbox,
  Alert,
  message,
  Divider,
  Typography
} from 'antd';
import { LockOutlined, KeyOutlined, SafetyOutlined } from '@ant-design/icons';
import { getMessage } from '@/constants/messages';

const { Text } = Typography;

export type PDFPermissionKey = 'printing' | 'copying' | 'modifying';

export interface PDFPermissions {
  printing: boolean;
  copying: boolean;
  modifying: boolean;
}

export interface PDFPasswordProtectionOptions {
  userPassword: string;   // 打开密码（必填）
  ownerPassword: string;  // 所有者/编辑密码（必填）
  permissions: PDFPermissions;
}

interface PasswordProtectorProps {
  visible: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  onProtect: (options: PDFPasswordProtectionOptions) => Promise<void>;
}

export const PasswordProtector: React.FC<PasswordProtectorProps> = ({
  visible,
  onClose,
  pdfBytes,
  onProtect,
}) => {
  const [userPassword, setUserPassword] = useState<string>('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [ownerPasswordConfirm, setOwnerPasswordConfirm] = useState<string>('');
  const [ownerSameAsUser, setOwnerSameAsUser] = useState<boolean>(false);

  const [permissions, setPermissions] = useState<PDFPermissions>({
    printing: true,
    copying: true,
    modifying: true,
  });

  const [loading, setLoading] = useState(false);

  const handleProtect = async () => {
    // 验证必填字段
    if (!userPassword || userPassword.trim().length === 0) {
      message.error(getMessage('请输入用户密码（打开密码）'));
      return;
    }

    if (userPassword !== userPasswordConfirm) {
      message.error(getMessage('两次输入的用户密码不一致'));
      return;
    }

    if (!ownerSameAsUser) {
      if (!ownerPassword || ownerPassword.trim().length === 0) {
        message.error(getMessage('请输入所有者密码（编辑密码）'));
        return;
      }

      if (ownerPassword !== ownerPasswordConfirm) {
        message.error(getMessage('两次输入的所有者密码不一致'));
        return;
      }
    }

    if (!pdfBytes) {
      message.error(getMessage('没有可加密的 PDF 文档'));
      return;
    }

    try {
      setLoading(true);

      const finalOwnerPassword = ownerSameAsUser ? userPassword : ownerPassword;

      await onProtect({
        userPassword,
        ownerPassword: finalOwnerPassword,
        permissions,
      });

      // 注意：不显示成功提示，因为 App 已经显示了信息弹窗
      handleClose();
    } catch (error) {
      console.error('Error protecting PDF:', error);
      // 不显示错误提示，因为 App 已经处理了错误
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUserPassword('');
    setUserPasswordConfirm('');
    setOwnerPassword('');
    setOwnerPasswordConfirm('');
    setOwnerSameAsUser(false);
    setPermissions({
      printing: true,
      copying: true,
      modifying: true,
    });
    onClose();
  };

  const handlePermissionChange = (key: PDFPermissionKey, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          {getMessage('PDF 密码保护')}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleProtect}
      okText={getMessage('生成加密指引')}
      cancelText={getMessage('取消')}
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          message={getMessage('重要提示')}
          description={getMessage(
            '加密后的 PDF 需要输入密码才能打开。忘记密码将无法打开文档。权限限制并非绝对安全，专业工具可能可以绕过限制。'
          )}
          type="warning"
          showIcon
          icon={<SafetyOutlined />}
        />

        <Divider />
        <Space>
          <KeyOutlined />
          <Text strong>{getMessage('用户密码（打开密码）')}</Text>
        </Space>

        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>{getMessage('用户密码:')}</strong>
            <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
              {getMessage('打开此 PDF 所需的密码')}
            </span>
          </div>
          <Input.Password
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            placeholder={getMessage('输入用户密码')}
            style={{ marginBottom: 8 }}
          />
          <Input.Password
            value={userPasswordConfirm}
            onChange={(e) => setUserPasswordConfirm(e.target.value)}
            placeholder={getMessage('确认用户密码')}
          />
        </div>

        <Divider />
        <Space>
          <KeyOutlined />
          <Text strong>{getMessage('所有者密码（编辑密码）')}</Text>
        </Space>

        <div>
          <Checkbox
            checked={ownerSameAsUser}
            onChange={(e) => setOwnerSameAsUser(e.target.checked)}
            style={{ marginBottom: 8 }}
          >
            {getMessage('所有者密码与用户密码相同')}
          </Checkbox>

          {!ownerSameAsUser && (
            <>
              <div style={{ marginBottom: 8 }}>
                <strong>{getMessage('所有者密码:')}</strong>
                <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                  {getMessage('用于编辑此 PDF 的密码')}
                </span>
              </div>
              <Input.Password
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder={getMessage('输入所有者密码')}
                style={{ marginBottom: 8 }}
              />
              <Input.Password
                value={ownerPasswordConfirm}
                onChange={(e) => setOwnerPasswordConfirm(e.target.value)}
                placeholder={getMessage('确认所有者密码')}
              />
            </>
          )}
        </div>

        <Divider />
        <Text strong>{getMessage('权限设置')}</Text>

        <div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox
              checked={permissions.printing}
              onChange={(e) => handlePermissionChange('printing', e.target.checked)}
            >
              {getMessage('允许打印')}
            </Checkbox>
            <Checkbox
              checked={permissions.copying}
              onChange={(e) => handlePermissionChange('copying', e.target.checked)}
            >
              {getMessage('允许复制内容')}
            </Checkbox>
            <Checkbox
              checked={permissions.modifying}
              onChange={(e) => handlePermissionChange('modifying', e.target.checked)}
            >
              {getMessage('允许编辑文档')}
            </Checkbox>
          </Space>
        </div>

        <Alert
          message={getMessage('需要外部工具完成加密')}
          description={getMessage(
            '注意：由于 pdf-lib 库的限制，当前版本不会直接加密 PDF。点击"应用加密"后，将显示加密配置和外部工具使用说明，您需要使用 qPDF 或 PDFtk 等工具完成加密。'
          )}
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
};
