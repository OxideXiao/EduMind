import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, List, Spin, Modal, Tag, Empty } from 'antd';
import { AlertOutlined, CalendarOutlined, InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotification';
import type { Notification } from '../../api/types';

const typeIcon: Record<string, React.ReactNode> = {
  REMINDER: <AlertOutlined style={{ color: 'var(--danger)', fontSize: 20 }} />,
  PLAN: <CalendarOutlined style={{ color: 'var(--info)', fontSize: 20 }} />,
  SYSTEM: <InfoCircleOutlined style={{ color: 'var(--text-muted)', fontSize: 20 }} />,
  ADVICE: <BulbOutlined style={{ color: 'var(--accent)', fontSize: 20 }} />,
};

const typeLabel: Record<string, string> = { REMINDER: '学习提醒', PLAN: '计划通知', SYSTEM: '系统通知', ADVICE: '学习建议' };

export default function NotificationListPage() {
  const { items, loading, readOne, readAll } = useNotifications();
  const [detail, setDetail] = useState<Notification | null>(null);
  const navigate = useNavigate();

  const handleClick = (item: Notification) => {
    setDetail(item);
    if (!item.isRead) readOne(item.id);
  };

  const hasUnread = items.some((n) => !n.isRead);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <Typography.Title level={2} style={{ fontFamily: 'var(--font-display)', marginBottom: 4, fontSize: 28 }}>
            通知中心
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {items.length} 条通知{hasUnread ? ` · ${items.filter((n) => !n.isRead).length} 条未读` : ' · 全部已读'}
          </Typography.Text>
        </div>
        {hasUnread && (
          <Button type="link" onClick={readAll} style={{ color: 'var(--accent)', fontWeight: 500 }}>
            全部标为已读
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
      ) : (
        <List dataSource={items} renderItem={(item, idx) => (
          <List.Item style={{
            cursor: 'pointer', padding: '18px 22px', marginBottom: 10,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', opacity: item.isRead ? 0.5 : 1,
            borderLeft: item.isRead ? '1px solid var(--border-default)' : '4px solid var(--danger)',
            transition: 'all var(--duration-fast)',
            animation: `fade-in-scale var(--duration-fast) var(--ease-out-expo) ${idx * 40}ms both`,
          }}
            onClick={() => handleClick(item)}
            onMouseEnter={(e) => { if (!item.isRead) e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
            <List.Item.Meta
              avatar={typeIcon[item.type] ?? typeIcon.SYSTEM}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Text style={{ color: 'var(--text-primary)', fontWeight: item.isRead ? 400 : 600, fontSize: 15 }}>
                    {item.title}
                  </Typography.Text>
                  {item.priority === 'HIGH' && (
                    <span style={{ fontSize: 10, color: '#fff', background: 'var(--danger)', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>重要</span>
                  )}
                </div>
              }
              description={
                <div>
                  <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginTop: 3 }}>
                    {item.content.length > 60 ? item.content.slice(0, 60) + '…' : item.content}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3, display: 'block' }}>
                    {item.createdAt}
                  </Typography.Text>
                </div>
              } />
          </List.Item>
        )} />
      )}

      {/* 通知详情 Modal */}
      <Modal
        title={null}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={520}
      >
        {detail && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{typeIcon[detail.type] ?? typeIcon.SYSTEM}</span>
              <div>
                <Tag color={detail.priority === 'HIGH' ? 'red' : detail.priority === 'MEDIUM' ? 'gold' : 'default'}
                  style={{ fontSize: 11, marginBottom: 4 }}>
                  {typeLabel[detail.type] ?? detail.type}
                </Tag>
                <Typography.Title level={4} style={{ margin: 0, fontSize: 18 }}>
                  {detail.title}
                </Typography.Title>
              </div>
            </div>
            <Typography.Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {detail.content}
            </Typography.Paragraph>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13, display: 'block', marginTop: 16 }}>
              {detail.createdAt}
            </Typography.Text>
          </div>
        )}
      </Modal>
    </div>
  );
}
