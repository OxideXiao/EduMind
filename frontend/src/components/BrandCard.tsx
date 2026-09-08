import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';

interface BrandCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style' | 'onClick'> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

/**
 * 统一品牌卡片
 * - hover 上浮交给 CSS transition，避免 JS 改 transform 导致生硬
 */
export default function BrandCard({
  children,
  className = '',
  style,
  onClick,
  hover = true,
  onAnimationEnd,
  ...rest
}: BrandCardProps) {
  return (
    <div
      className={`card-branded ${hover ? 'card-branded--hover' : ''} ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
      onAnimationEnd={(e) => {
        // 入场动画结束后清掉 animation，释放 transform 给 hover 上浮
        if (e.target === e.currentTarget) {
          e.currentTarget.style.animation = 'none';
        }
        onAnimationEnd?.(e);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
