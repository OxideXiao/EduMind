import { Typography } from 'antd';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  suffix?: string;
}

export default function StatCard({ label, value, color = 'var(--accent)', suffix }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
      borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-lg)',
      padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'box-shadow var(--duration-fast) var(--ease-out-expo)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>
        {label}
      </Typography.Text>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 500, color,
          lineHeight: 1.1, letterSpacing: '-0.03em',
        }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}
