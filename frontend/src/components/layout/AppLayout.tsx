import { useState, useMemo } from 'react';
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
  TeamOutlined,
  FolderOpenOutlined,
  DatabaseOutlined,
  FormOutlined,
  NodeIndexOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotification';
import NotificationBell from './NotificationBell';


const { Header, Sider, Content } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

/** 将当前路径解析为可读的面包屑（页面名，而非路由片段） */
function buildBreadcrumbs(pathname: string): { title: string; path: string }[] {
  if (pathname === '/notifications') {
    return [
      { title: '我的课程', path: '/courses' },
      { title: '通知中心', path: '/notifications' },
    ];
  }

  if (pathname === '/courses') {
    return [{ title: '我的课程', path: '/courses' }];
  }

  const courseMatch = pathname.match(/^\/courses\/([^/]+)(?:\/(.*))?$/);
  if (!courseMatch) {
    return [{ title: '我的课程', path: '/courses' }];
  }

  const courseId = courseMatch[1];
  const rest = courseMatch[2] ?? '';
  const courseRoot = `/courses/${courseId}/graph`;
  const items: { title: string; path: string }[] = [
    { title: '我的课程', path: '/courses' },
  ];

  if (!rest || rest === 'graph') {
    items.push({ title: '知识图谱', path: courseRoot });
    return items;
  }

  if (rest === 'members') {
    items.push({ title: '课程成员', path: `/courses/${courseId}/members` });
    return items;
  }

  if (rest === 'resources') {
    items.push({ title: '教学资源', path: `/courses/${courseId}/resources` });
    return items;
  }

  if (rest === 'question-bank') {
    items.push({ title: '题库管理', path: `/courses/${courseId}/question-bank` });
    return items;
  }

  if (rest === 'assignments') {
    items.push({ title: '作业管理', path: `/courses/${courseId}/assignments` });
    return items;
  }

  if (rest === 'dashboard') {
    items.push({ title: '学情看板', path: `/courses/${courseId}/dashboard` });
    return items;
  }

  if (rest === 'advice') {
    items.push({ title: '教学建议', path: `/courses/${courseId}/advice` });
    return items;
  }

  if (rest === 'plan') {
    items.push({ title: '学习计划', path: `/courses/${courseId}/plan` });
    return items;
  }

  if (/^nodes\/[^/]+\/learn$/.test(rest)) {
    items.push({ title: '知识图谱', path: courseRoot });
    items.push({ title: '节点学习', path: pathname });
    return items;
  }

  if (/^quizzes\/[^/]+$/.test(rest)) {
    items.push({ title: '知识图谱', path: courseRoot });
    items.push({ title: '测验作答', path: pathname });
    return items;
  }

  if (/^students\/[^/]+$/.test(rest)) {
    items.push({ title: '课程成员', path: `/courses/${courseId}/members` });
    items.push({ title: '学生详情', path: pathname });
    return items;
  }

  items.push({ title: '课程详情', path: courseRoot });
  return items;
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isTeacher } = useAuth();
  const { unreadCount } = useNotifications();

  const courseIdMatch = location.pathname.match(/^\/courses\/(\d+)/);
  const activeCourseId = courseIdMatch?.[1] ?? null;
  const inCourse = Boolean(activeCourseId);
  const isGraphPage = /\/courses\/[^/]+\/graph\/?$/.test(location.pathname);

  const menuItems: MenuItem[] = inCourse
    ? (isTeacher
        ? [
            { key: '/graph', icon: <NodeIndexOutlined />, label: '知识图谱' },
            { key: '/members', icon: <TeamOutlined />, label: '课程成员' },
            { key: '/resources', icon: <FolderOpenOutlined />, label: '教学资源' },
            { key: '/question-bank', icon: <DatabaseOutlined />, label: '题库管理' },
            { key: '/assignments', icon: <FormOutlined />, label: '作业管理' },
            { key: '/dashboard', icon: <DashboardOutlined />, label: '学情看板' },
            { key: '/advice', icon: <BulbOutlined />, label: '教学建议' },
          ]
        : [
            { key: '/graph', icon: <NodeIndexOutlined />, label: '知识图谱' },
            { key: '/plan', icon: <CalendarOutlined />, label: '学习计划' },
          ])
    : [
        { key: '/courses', icon: <BookOutlined />, label: '我的课程' },
        { key: '/notifications', icon: <Badge count={unreadCount} size="small" offset={[4, -2]}><BellOutlined /></Badge>, label: '通知中心' },
      ];


  const selectedKey = (() => {
    const path = location.pathname;
    if (!inCourse) {
      if (path.startsWith('/notifications')) return '/notifications';
      return '/courses';
    }
    if (path.includes('/dashboard')) return '/dashboard';
    if (path.includes('/advice')) return '/advice';
    if (path.includes('/plan')) return '/plan';
    if (path.includes('/members')) return '/members';
    if (path.includes('/resources')) return '/resources';
    if (path.includes('/question-bank')) return '/question-bank';
    if (path.includes('/assignments')) return '/assignments';
    if (path.includes('/graph') || path.includes('/nodes/') || path.includes('/quizzes/') || path.includes('/students/')) {
      return path.includes('/students/') ? '/members' : '/graph';
    }
    return '/graph';
  })();

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息', disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const handleUserMenu: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login'); }
  };

  const breadcrumbItems = useMemo(
    () => buildBreadcrumbs(location.pathname),
    [location.pathname],
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── 侧栏 ── */}
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        trigger={null} width={220}
        className="app-sider"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: collapsed ? 0 : 10, borderBottom: '1px solid var(--border-default)',
          cursor: 'pointer', flexShrink: 0,
        }} onClick={() => navigate('/courses')}>
          <img src="/logo.png" alt="Logo" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              智慧教学
            </span>
          )}
        </div>

        <div className="sidebar-menu-scroll">
          <Menu
            className="sidebar-menu"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => {
              if (key === '/courses' || key === '/notifications') {
                navigate(key);
                return;
              }
              const courseId = activeCourseId ?? '1';
              const courseRoutes: Record<string, string> = {
                '/graph': `/courses/${courseId}/graph`,
                '/members': `/courses/${courseId}/members`,
                '/resources': `/courses/${courseId}/resources`,
                '/question-bank': `/courses/${courseId}/question-bank`,
                '/assignments': `/courses/${courseId}/assignments`,
                '/dashboard': `/courses/${courseId}/dashboard`,
                '/advice': `/courses/${courseId}/advice`,
                '/plan': `/courses/${courseId}/plan`,
              };
              if (courseRoutes[key]) navigate(courseRoutes[key]);
              else navigate(key);
            }}
            style={{ background: 'transparent', borderInlineEnd: 'none', marginTop: 8 }}
          />
        </div>

        {inCourse && (
          <div
            className="sidebar-back-course"
            style={{
              flexShrink: 0,
              borderTop: '1px solid var(--border-default)',
              padding: collapsed ? '14px 8px' : '14px 16px',
              display: 'flex',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <a
              href="/courses"
              className={`sidebar-back-course__link${collapsed ? ' is-collapsed' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/courses');
              }}
            >
              <ArrowLeftOutlined />
              {!collapsed && <span>返回课程</span>}
            </a>
          </div>
        )}
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
              itemRender={(route, _params, items) => {
                const isLast = items[items.length - 1]?.path === route.path;
                if (isLast) {
                  return (
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {route.title}
                    </span>
                  );
                }
                return (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(route.path!);
                    }}
                    style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    {route.title}
                  </a>
                );
              }}
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

        <Content style={{ padding: 24, overflow: isGraphPage ? 'hidden' : 'auto' }}>
          <div className="page-enter" style={{ maxWidth: 1320, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
