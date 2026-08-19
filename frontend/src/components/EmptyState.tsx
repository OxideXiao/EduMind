import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

/**
 * 空态占位组件
 */
export default function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) onAction();
    else if (actionTo) navigate(actionTo);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16) var(--space-6)',
        minHeight: 300,
        textAlign: 'center',
        gap: 16,
      }}
    >
      {icon ? (
        <div style={{ color: 'var(--accent)', opacity: 0.6, marginBottom: 8 }}>{icon}</div>
      ) : (
        <img src="/logo.png" alt="" style={{ width: 64, height: 64, borderRadius: '50%', opacity: 0.5 }} />
      )}
      <Typography.Title level={3} style={{ color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </Typography.Title>
      <Typography.Text style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
        {description}
      </Typography.Text>
      {actionLabel && (
        <Button
          type="primary"
          size="large"
          onClick={handleAction}
          style={{ marginTop: 8 }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
