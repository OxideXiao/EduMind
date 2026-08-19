import { MASTERY_COLOR, MASTERY_LABEL, RECOMMENDED_BORDER } from '../../utils/colorMap';

interface GraphLegendProps {
  viewRole: 'student' | 'teacher';
}

const MASTERY_LEVELS = ['GRAY', 'RED', 'YELLOW', 'GREEN'] as const;

/**
 * 知识图谱图例 — 掌握度颜色 + 特殊标记说明
 */
export default function GraphLegend({ viewRole }: GraphLegendProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        marginBottom: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {MASTERY_LEVELS.map((level) => (
        <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: MASTERY_COLOR[level],
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {MASTERY_LABEL[level]}
          </span>
        </div>
      ))}

      {/* 学生视图：推荐节点标记 */}
      {viewRole === 'student' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 0, height: 0, marginLeft: 7 }} />
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: `3px solid ${RECOMMENDED_BORDER}`,
              backgroundColor: 'transparent',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>推荐学习</span>
        </div>
      )}

      {/* 教师视图：班级薄弱点标记 */}
      {viewRole === 'teacher' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 0, height: 0, marginLeft: 7 }} />
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '3px dashed #ef4444',
              backgroundColor: 'transparent',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>班级薄弱点</span>
        </div>
      )}
    </div>
  );
}
