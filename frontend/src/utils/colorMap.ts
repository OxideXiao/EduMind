export type MasteryLevel = 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';

export const MASTERY_COLOR: Record<MasteryLevel, string> = {
  GRAY: '#c5bfb6',
  RED: '#ef4444',
  YELLOW: '#eab308',
  GREEN: '#22c55e',
};

export const RECOMMENDED_BORDER = '#4f6d8c';
export const WEAK_TOP_BORDER = '#ef4444';

export function getMasteryLevel(score: number): MasteryLevel {
  if (score === 0) return 'GRAY';
  if (score >= 80) return 'GREEN';
  if (score >= 60) return 'YELLOW';
  return 'RED';
}

export function getMasteryColor(score: number): string {
  return MASTERY_COLOR[getMasteryLevel(score)];
}

export const MASTERY_LABEL: Record<string, string> = {
  GRAY: '未学习', RED: '薄弱', YELLOW: '发展中', GREEN: '已掌握',
};
