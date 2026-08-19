/**
 * Mock Student — 两部分内容合并
 *
 * Part A (dev2): 学生轨迹 (StudentTrajectory) — 对齐 api-spec §6 + demo-seed-spec §4
 * Part B (dev1): 节点学生掌握度 + 学生个人图谱 — GraphCanvas 驱动数据
 */

import type { StudentTrajectory } from '../api/types';
import type { StudentNodeMastery } from '../api/student';
import type { MasteryLevel } from '../utils/colorMap';
import type { GraphData } from '../api/graph';
import { getMockGraph } from './graph';

// ═══════════════════════════════════════════════════
// Part A — 学生轨迹 Mock (dev2)
// ═══════════════════════════════════════════════════

function delay() {
  return new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 300));
}

/** 三档学生数据 — demo-seed-spec §4 */
const MOCK_TRAJECTORY: Record<number, StudentTrajectory> = {
  101: {
    // 张三（近期下滑，触发 Heartbeat 提醒）
    recentQuizzes: [
      { quizName: '线性表基础测验', score: 95, submittedAt: '2026-06-10T14:00:00' },
      { quizName: '树与遍历测验', score: 72, submittedAt: '2026-06-14T10:00:00' },
      { quizName: '算法设计测验', score: 48, submittedAt: '2026-06-20T15:30:00' },
    ],
    recentLogs: [
      { action: 'QUIZ', nodeName: '算法设计测验', createdAt: '2026-06-20T15:30:00' },
      { action: 'LOGIN', nodeName: '—', createdAt: '2026-06-22T09:00:00' },
    ],
  },
  102: {
    // 李四（中等生）
    recentQuizzes: [
      { quizName: '线性表基础测验', score: 70, submittedAt: '2026-06-11T16:00:00' },
      { quizName: '树与遍历测验', score: 65, submittedAt: '2026-06-15T11:00:00' },
      { quizName: '算法设计测验', score: 45, submittedAt: '2026-06-19T09:00:00' },
    ],
    recentLogs: [
      { action: 'QUIZ', nodeName: '算法设计测验', createdAt: '2026-06-19T09:00:00' },
      { action: 'VIEW_RESOURCE', nodeName: '动态规划', createdAt: '2026-06-18T20:00:00' },
      { action: 'VIEW_RESOURCE', nodeName: '贪心算法', createdAt: '2026-06-16T19:00:00' },
    ],
  },
  103: {
    // 王五（预警学生）
    recentQuizzes: [
      { quizName: '线性表基础测验', score: 30, submittedAt: '2026-06-12T17:00:00' },
      { quizName: '树与遍历测验', score: 35, submittedAt: '2026-06-16T10:30:00' },
    ],
    recentLogs: [
      { action: 'QUIZ', nodeName: '树与遍历测验', createdAt: '2026-06-16T10:30:00' },
      { action: 'LOGIN', nodeName: '—', createdAt: '2026-06-19T09:00:00' },
    ],
  },
};

/** GET /api/courses/{courseId}/students/{studentId}/trajectory */
export async function fetchStudentTrajectory(
  courseId: number,
  studentId: number,
): Promise<StudentTrajectory> {
  await delay();
  return MOCK_TRAJECTORY[studentId] ?? { recentQuizzes: [], recentLogs: [] };
}

// ═══════════════════════════════════════════════════
// Part B — 节点学生列表 + 学生个人图谱 (dev1)
// ═══════════════════════════════════════════════════

/** 模拟学生池 — 对齐种子数据（101 张三 / 102 李四 / 103 王五） */
const MOCK_STUDENTS: { studentId: number; studentName: string }[] = [
  { studentId: 101, studentName: '张三' },
  { studentId: 102, studentName: '李四' },
  { studentId: 103, studentName: '王五' },
];

function scoreToLevel(score: number): MasteryLevel {
  if (score === 0) return 'GRAY';
  if (score >= 80) return 'GREEN';
  if (score >= 60) return 'YELLOW';
  return 'RED';
}

/**
 * 模拟某节点的学生掌握度列表
 * 围绕班级均分（avgScore）随机 ±25 生成个体分数
 */
export function getMockNodeStudents(
  nodeId: number,
  avgScore: number,
): StudentNodeMastery[] {
  const seed = nodeId * 7 + avgScore * 3;
  return MOCK_STUDENTS.map((s, i) => {
    const offset = ((seed * (i + 1) * 13) % 51) - 25; // -25 ~ +25
    const raw = Math.max(0, Math.min(100, avgScore + offset));
    const score = Math.round(raw);
    return {
      studentId: s.studentId,
      studentName: s.studentName,
      masteryScore: score,
      masteryLevel: scoreToLevel(score),
    };
  });
}

/**
 * 模拟某个学生的个人知识图谱
 * 以学生视图 mock 为骨架模板，按学生 ID 重新生成个性化的掌握度
 * 每个学生有且仅有一套确定性数据（seed 由 studentId + nodeId 决定）
 */
export function getMockStudentGraph(
  courseId: number,
  studentId: number,
): GraphData {
  const base = getMockGraph(courseId, 'student');

  /** 伪随机数（基于 seed，0~1） */
  function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /**
   * 学生水平基线 — 不同学生有不同的掌握曲线
   * 好学生：中心高，尾部低但不到零
   * 中等生：中心中等，尾部接近零
   * 差学生：整体偏低
   */
  const studentSeed = studentId * 13 + 7;
  const baseMastery = 30 + Math.floor(pseudoRandom(studentSeed) * 55); // 30~85 的基线

  const nodes = base.nodes.map((n) => {
    const nodeSeed = n.id * 17 + studentId * 31;
    const r1 = pseudoRandom(nodeSeed);
    const r2 = pseudoRandom(nodeSeed + 100);

    // 模拟"学习进度衰减"：序号越大的节点学得越少
    const progressFactor = Math.max(0.05, 1 - (n.order - 1) / base.nodes.length);
    // 部分节点随机"擅长"或"薄弱"
    const talentBump = r1 > 0.7 ? 20 : r1 < 0.15 ? -15 : 0;
    // 噪声 ±12
    const noise = Math.floor(r2 * 25) - 12;

    const raw = Math.round(
      Math.max(0, Math.min(100, baseMastery * progressFactor + talentBump + noise)),
    );

    return {
      ...n,
      masteryScore: raw,
      masteryLevel: scoreToLevel(raw),
      // 学生个人视图：推荐学习得分 < 60 且 > 0 的节点
      isRecommended: raw < 60 && raw > 0,
      isWeakTop: false,
    };
  });

  // 找到得分最低且 > 0 的作为推荐节点
  const scored = nodes.filter((n) => n.masteryScore > 0);
  const weakest = scored.length > 0
    ? scored.reduce((a, b) => (a.masteryScore < b.masteryScore ? a : b))
    : null;

  return {
    ...base,
    nodes,
    meta: {
      ...base.meta,
      recommendedNodeId: weakest?.id ?? null,
      weakNodeIds: nodes.filter((n) => n.masteryLevel === 'RED').map((n) => n.id),
    },
  };
}

/** 根据学生 ID 查找 mock 姓名，找不到返回默认值 */
export function getMockStudentName(studentId: number): string {
  const student = MOCK_STUDENTS.find((s) => s.studentId === studentId);
  return student?.studentName ?? `学生#${studentId}`;
}
