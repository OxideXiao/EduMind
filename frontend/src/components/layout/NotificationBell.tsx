import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, List, Typography, Button, Popover, Empty, Modal, Tag } from 'antd';
import { BellOutlined, AlertOutlined, CalendarOutlined, InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotification';
import type { Notification } from '../../api/types';

const typeIcon: Record<string, React.ReactNode> = {
  REMINDER: <AlertOutlined style={{ color: 'var(--danger)' }} />,
  PLAN: <CalendarOutlined style={{ color: 'var(--info)' }} />,
  SYSTEM: <InfoCircleOutlined style={{ color: 'var(--text-muted)' }} />,
  ADVICE: <BulbOutlined style={{ color: 'var(--accent)' }} />,
};

const typeLabel: Record<string, string> = { REMINDER: '学习提醒', PLAN: '计划通知', SYSTEM: '系统通知', ADVICE: '学习建议' };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Notification | null>(null);
  const { items, unreadCount, readOne } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (item: Notification) => {
    setOpen(false);
    setDetail(item);
    if (!item.isRead) readOne(item.id);
  };

  const recent = items.slice(0, 5);

  const dropdownContent = (
    <div style={{ width: 370, maxHeight: 420, overflow: 'auto' }}>
      {recent.length === 0 ? (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List dataSource={recent} renderItem={(item) => (
          <List.Item style={{
            cursor: 'pointer', padding: '10px 12px',
            opacity: item.isRead ? 0.55 : 1,
            borderLeft: item.isRead ? 'none' : '3px solid var(--danger)',
            transition: 'opacity var(--duration-fast), background var(--duration-fast)',
          }}
            onClick={() => handleClick(item)}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <List.Item.Meta
              avatar={typeIcon[item.type] ?? typeIcon.SYSTEM}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Typography.Text style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: item.isRead ? 400 : 600 }}>
                    {item.title}
                  </Typography.Text>
                  {item.priority === 'HIGH' && (
                    <span style={{ fontSize: 10, color: '#fff', background: 'var(--danger)', padding: '0 5px', borderRadius: 3, fontWeight: 700 }}>!</span>
                  )}
                </div>
              }
              description={
                <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.createdAt}</Typography.Text>
              } />
          </List.Item>
        )} />
      )}
      {items.length > 5 && (
        <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid var(--border-default)' }}>
          <Button type="link" size="small" onClick={() => { setOpen(false); navigate('/notifications'); }}>查看全部</Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Popover content={dropdownContent} trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight">
        <div style={{ cursor: 'pointer' }}>
          <Badge count={unreadCount} size="small" offset={[2, -2]}>
            <BellOutlined style={{ fontSize: 18, color: 'var(--text-secondary)' }} />
          </Badge>
        </div>
      </Popover>

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
    </>
  );
}
