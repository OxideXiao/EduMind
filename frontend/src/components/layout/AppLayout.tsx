import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Breadcrumb, Badge, type MenuProps } from 'antd';
import {
  BookOutlined,
  DashboardOutlined,
  BulbOutlined,
  CalendarOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth, useRole } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotification';
import NotificationBell from './NotificationBell';


const { Header, Sider, Content } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isTeacher } = useAuth();
  const { unreadCount } = useNotifications();

  const menuItems: MenuItem[] = [
    { key: '/courses', icon: <BookOutlined />, label: '我的课程' },
    ...(isTeacher
      ? [{
          key: 'teacher-group', type: 'group' as const, label: '教师工具',
          children: [
            { key: '/dashboard', icon: <DashboardOutlined />, label: '学情看板' },
            { key: '/advice', icon: <BulbOutlined />, label: '教学建议' },
          ],
        }]
      : []),
    ...(!isTeacher
      ? [{ key: '/plan', icon: <CalendarOutlined />, label: '学习计划' }]
      : []),
    { key: '/notifications', icon: <Badge count={unreadCount} size="small" offset={[4, -2]}><BellOutlined /></Badge>, label: '通知中心' },
  ];


  const selectedKey = (() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return '/dashboard';
    if (path.includes('/advice')) return '/advice';
    if (path.includes('/plan')) return '/plan';
    if (path.startsWith('/notifications')) return '/notifications';
    if (path.startsWith('/courses')) return '/courses';
    return '/courses';
  })();

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息', disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const handleUserMenu: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login'); }
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { title: '首页', path: '/courses' },
    ...pathParts.map((part, i) => ({
      title: part, path: '/' + pathParts.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── 侧栏 ── */}
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        trigger={null} width={220}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-default)' }}>
        {/* Logo */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: collapsed ? 0 : 10, borderBottom: '1px solid var(--border-default)',
          cursor: 'pointer',
        }} onClick={() => navigate('/courses')}>
          <img src="/logo.png" alt="Logo" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              智慧教学
            </span>
          )}
        </div>

        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems}
          onClick={({ key }) => {
            // 从当前 URL 提取 courseId，没有则默认 1
            const match = location.pathname.match(/\/courses\/(\d+)/);
            const courseId = match?.[1] ?? '1';
            if (key === '/dashboard') navigate(`/courses/${courseId}/dashboard`);
            else if (key === '/advice') navigate(`/courses/${courseId}/advice`);
            else if (key === '/plan') navigate(`/courses/${courseId}/plan`);
            else navigate(key);
          }}
          style={{ background: 'transparent', borderInlineEnd: 'none', marginTop: 12 }} />
      </Sider>

      {/* ── 主区 ── */}
      <Layout>
        <Header style={{
          height: 56, background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: 'var(--text-secondary)', fontSize: 16 }} />
            <Breadcrumb
              items={breadcrumbItems}
              itemRender={(route) => (
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(route.path!);
                  }}
                  style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {route.title}
                </a>
              )}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={['click']}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '6px 12px', borderRadius: 8,
                transition: 'background var(--duration-fast)',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '2px solid var(--accent-dim)', background: 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserOutlined style={{ color: 'var(--accent)', fontSize: 14 }} />
                </div>
                <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>
                  {user?.name ?? '用户'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 24, overflow: 'auto' }}>
          <div className="page-enter" style={{ maxWidth: 1320, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
