import { useMemo, useState, type ReactNode } from 'react';
import { Typography, Button, Spin, Modal, Empty } from 'antd';
import {
  AlertOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  CheckOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotification';
import type { Notification } from '../../api/types';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

type NotifFilter = 'ALL' | 'UNREAD';

const TYPE_META: Record<string, { label: string; icon: ReactNode; tone: string }> = {
  REMINDER: {
    label: '学习提醒',
    icon: <AlertOutlined />,
    tone: 'danger',
  },
  PLAN: {
    label: '计划通知',
    icon: <CalendarOutlined />,
    tone: 'info',
  },
  SYSTEM: {
    label: '系统通知',
    icon: <InfoCircleOutlined />,
    tone: 'muted',
  },
  ADVICE: {
    label: '学习建议',
    icon: <BulbOutlined />,
    tone: 'accent',
  },
};

function formatNotifTime(raw: string): string {
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return raw.slice(0, 16).replace('T', ' ');
}

export default function NotificationListPage() {
  const { items, loading, readOne, readAll } = useNotifications();
  const [detail, setDetail] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<NotifFilter>('ALL');

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);
  const hasUnread = unreadCount > 0;

  const filtered = useMemo(() => {
    if (filter === 'UNREAD') return items.filter((n) => !n.isRead);
    return items;
  }, [items, filter]);

  const handleClick = (item: Notification) => {
    setDetail(item);
    if (!item.isRead) readOne(item.id);
  };

  if (loading) {
    return (
      <div className="course-page course-page--notifications page-enter">
        <div className="course-page-loading">
          <Spin size="large" />
          <span>加载通知…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page course-page--notifications page-enter">
      <CoursePageHeader
        title="通知中心"
        description="学习提醒、计划更新与系统消息集中查看"
        badges={(
          <>
            <span className="course-page-badge">
              <BellOutlined /> {items.length} 条通知
            </span>
            {hasUnread ? (
              <span className="course-page-badge course-page-badge--warn">
                {unreadCount} 条未读
              </span>
            ) : (
              <span className="course-page-badge course-page-badge--ok">全部已读</span>
            )}
          </>
        )}
        actions={hasUnread ? (
          <Button icon={<CheckOutlined />} onClick={readAll}>
            全部标为已读
          </Button>
        ) : undefined}
      />

      <section className="course-page-panel course-page-panel--accent notif-panel">
        <div className="notif-toolbar">
          <div className="notif-filters" role="tablist" aria-label="通知筛选">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'ALL'}
              className={`notif-filter${filter === 'ALL' ? ' is-active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              全部
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'UNREAD'}
              className={`notif-filter${filter === 'UNREAD' ? ' is-active' : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              未读{hasUnread ? ` · ${unreadCount}` : ''}
            </button>
          </div>
          {filter === 'UNREAD' && (
            <span className="course-page-search-hint">
              显示 {filtered.length} / {items.length} 条
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            className="dashboard-empty"
          />
        ) : filtered.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="没有未读通知"
            className="dashboard-empty"
          />
        ) : (
          <ul className="notif-list">
            {filtered.map((item, idx) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.SYSTEM;
              return (
                <li
                  key={item.id}
                  className={`notif-item${item.isRead ? ' is-read' : ' is-unread'}${item.priority === 'HIGH' ? ' is-high' : ''}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <button type="button" className="notif-item__btn" onClick={() => handleClick(item)}>
                    <span className={`notif-item__icon notif-item__icon--${meta.tone}`} aria-hidden>
                      {meta.icon}
                    </span>
                    <span className="notif-item__main">
                      <span className="notif-item__top">
                        <span className="notif-item__title">{item.title}</span>
                        {item.priority === 'HIGH' && (
                          <span className="notif-item__priority">重要</span>
                        )}
                        {!item.isRead && <span className="notif-item__dot" aria-label="未读" />}
                      </span>
                      <span className="notif-item__preview">
                        {item.content.length > 72 ? `${item.content.slice(0, 72)}…` : item.content}
                      </span>
                      <span className="notif-item__meta">
                        <span className="notif-item__type">{meta.label}</span>
                        <span className="notif-item__time">{formatNotifTime(item.createdAt)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        className="notif-detail-modal"
        title={null}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={520}
        destroyOnHidden
      >
        {detail && (() => {
          const meta = TYPE_META[detail.type] ?? TYPE_META.SYSTEM;
          return (
            <div className="notif-detail">
              <div className="notif-detail__head">
                <span className={`notif-item__icon notif-item__icon--${meta.tone} notif-detail__icon`}>
                  {meta.icon}
                </span>
                <div className="notif-detail__titles">
                  <span className="notif-detail__type">{meta.label}</span>
                  <Typography.Title level={4} className="notif-detail__title">
                    {detail.title}
                  </Typography.Title>
                </div>
              </div>
              {detail.priority === 'HIGH' && (
                <div className="notif-detail__alert">高优先级通知，请尽快处理</div>
              )}
              <Typography.Paragraph className="notif-detail__content">
                {detail.content}
              </Typography.Paragraph>
              <div className="notif-detail__footer">
                <span>{formatNotifTime(detail.createdAt)}</span>
                <span className="notif-detail__raw">{detail.createdAt}</span>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
