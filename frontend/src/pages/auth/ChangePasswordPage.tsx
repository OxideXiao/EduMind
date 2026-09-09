import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Form, Input, Button, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { changePassword } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

/** FE-13 强制/主动修改密码 */
export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { user, setAuth, token, logout } = useAuth();
  const navigate = useNavigate();
  const forced = Boolean(user?.mustChangePassword);

  const onFinish = async (values: {
    oldPassword: string;
    newPassword: string;
    confirm: string;
  }) => {
    if (values.newPassword !== values.confirm) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setLoading(true);
    try {
      const { token: nextToken } = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (user) {
        setAuth({ ...user, mustChangePassword: false }, nextToken || token || '');
      }
      message.success('密码已更新');
      navigate('/courses', { replace: true });
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg-root)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title
          level={2}
          style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}
        >
          修改密码
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 28 }}>
          {forced
            ? '首次登录或管理员重置后，必须修改密码才能继续使用。'
            : '请输入原密码与新密码。'}
        </Typography.Paragraph>

        <Form layout="vertical" size="large" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '至少 8 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码（至少 8 位）" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48 }}>
              确认修改
            </Button>
          </Form.Item>
        </Form>

        <Button type="link" onClick={() => logout()} style={{ paddingLeft: 0 }}>
          退出登录
        </Button>
      </div>
    </div>
  );
}
