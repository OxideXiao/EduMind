import { useCallback, useLayoutEffect, useRef, useState, type TransitionEvent } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { MasteryLevel } from '../../utils/colorMap';
import { MASTERY_COLOR, MASTERY_LABEL, RECOMMENDED_BORDER } from '../../utils/colorMap';

export type GraphLegendFilter = MasteryLevel | 'RECOMMENDED' | 'WEAK_TOP';

interface GraphLegendProps {
  viewRole: 'student' | 'teacher';
  activeFilter?: GraphLegendFilter | null;
  onHover?: (filter: GraphLegendFilter | null) => void;
}

const MASTERY_LEVELS: MasteryLevel[] = ['GRAY', 'RED', 'YELLOW', 'GREEN'];

/** 知识图谱图例 — 可向左收起（高度与展开一致），悬浮时高亮对应节点 */
export default function GraphLegend({ viewRole, activeFilter, onHover }: GraphLegendProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number>();
  const overlayRef = useRef<HTMLDivElement>(null);

  const measureExpandedHeight = useCallback(() => {
    const el = overlayRef.current;
    if (!el || el.classList.contains('is-collapsed')) return;
    const prev = el.style.height;
    el.style.height = 'auto';
    const h = el.offsetHeight;
    el.style.height = prev;
    if (h > 0) setPanelHeight(h);
  }, []);

  useLayoutEffect(() => {
    measureExpandedHeight();
  }, [measureExpandedHeight, viewRole]);

  useLayoutEffect(() => {
    const onResize = () => {
      if (!collapsed) measureExpandedHeight();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [collapsed, measureExpandedHeight]);

  const itemClass = (filter: GraphLegendFilter) =>
    `graph-legend__item${activeFilter === filter ? ' is-active' : ''}`;

  const toggle = () => {
    const el = overlayRef.current;
    if (!collapsed && el) {
      setPanelHeight(el.offsetHeight);
    }
    setCollapsed((v) => {
      if (!v) onHover?.(null);
      return !v;
    });
  };

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).classList?.contains('graph-legend-clip')) return;
    if (e.propertyName !== 'grid-template-columns') return;
    if (!collapsed) measureExpandedHeight();
  };

  return (
    <div
      ref={overlayRef}
      className={`graph-legend-overlay${collapsed ? ' is-collapsed' : ''}`}
      style={panelHeight ? { height: panelHeight } : undefined}
      onTransitionEnd={handleTransitionEnd}
    >
      <button
        type="button"
        className="graph-legend-toggle"
        title={collapsed ? '展开图例' : '收起图例'}
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>

      <div className="graph-legend-clip">
        <div
          className="graph-legend"
          onMouseLeave={() => onHover?.(null)}
          aria-hidden={collapsed}
        >
          {MASTERY_LEVELS.map((level) => (
            <div
              key={level}
              className={itemClass(level)}
              onMouseEnter={() => { if (!collapsed) onHover?.(level); }}
            >
              <span className="graph-legend__dot" style={{ backgroundColor: MASTERY_COLOR[level] }} />
              <span className="graph-legend__label">{MASTERY_LABEL[level]}</span>
            </div>
          ))}

          {viewRole === 'student' && (
            <div
              className={itemClass('RECOMMENDED')}
              onMouseEnter={() => { if (!collapsed) onHover?.('RECOMMENDED'); }}
            >
              <span
                className="graph-legend__dot graph-legend__dot--ring"
                style={{ borderColor: RECOMMENDED_BORDER }}
              />
              <span className="graph-legend__label">推荐学习</span>
            </div>
          )}

          {viewRole === 'teacher' && (
            <div
              className={itemClass('WEAK_TOP')}
              onMouseEnter={() => { if (!collapsed) onHover?.('WEAK_TOP'); }}
            >
              <span className="graph-legend__dot graph-legend__dot--dashed" />
              <span className="graph-legend__label">班级薄弱点</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function nodeMatchesLegendFilter(
  node: { masteryLevel: MasteryLevel; isRecommended: boolean; isWeakTop: boolean },
  filter: GraphLegendFilter,
  viewRole: 'student' | 'teacher',
): boolean {
  if (filter === 'RECOMMENDED') return node.isRecommended;
  if (filter === 'WEAK_TOP') return viewRole === 'teacher' && node.isWeakTop;
  return node.masteryLevel === filter;
}
