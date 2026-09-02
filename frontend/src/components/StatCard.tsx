import type { CSSProperties, ReactNode } from 'react';
import { Typography } from 'antd';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  suffix?: string;
  icon?: ReactNode;
  hint?: string;
}

export default function StatCard({
  label, value, color = 'var(--accent)', suffix, icon, hint,
}: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--stat-color': color } as CSSProperties}>
      <div className="stat-card__top">
        {icon && <div className="stat-card__icon">{icon}</div>}
        <Typography.Text className="stat-card__label">{label}</Typography.Text>
      </div>
      <div className="stat-card__value-row">
        <span className="stat-card__value">{value}</span>
        {suffix && <span className="stat-card__suffix">{suffix}</span>}
      </div>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </div>
  );
}
