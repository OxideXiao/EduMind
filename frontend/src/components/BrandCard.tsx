import type { ReactNode, CSSProperties } from 'react';

interface BrandCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

/**
 * 统一品牌卡片
 * - 暗底 + 金色顶线
 * - hover 上浮效果（hover=true 时启用）
 */
export default function BrandCard({ children, className = '', style, onClick, hover = true }: BrandCardProps) {
  return (
    <div
      className={`card-branded ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...(hover ? {} : { transform: 'none', boxShadow: 'var(--shadow-card)' }),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!hover || !onClick) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
      }}
      onMouseLeave={(e) => {
        if (!hover || !onClick) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {children}
    </div>
  );
}
