/**
 * API 类型定义 — 唯一真相源
 * 对齐 api-spec.md + demo-seed-spec.md
 *
 * mock/ 和 api/ 全部 import 自此文件
 */

// ═══ 认证 ═══
export interface LoginParams { email: string; password: string }
export interface RegisterParams { name: string; email: string; password: string; role: 'TEACHER' | 'STUDENT' }
export interface AuthUser { id: number; name: string; email: string; role: 'TEACHER' | 'STUDENT' }
export interface AuthResponse { token: string; user: AuthUser }

// ═══ 课程 ═══
export interface Course {
  id: number; name: string; semester: string; description: string;
  teacherId: number; inviteCode?: string; nodeCount?: number; studentCount?: number;
  createdAt: string;
}
export interface CreateCourseParams { name: string; semester: string; description?: string }
export interface CourseMember { userId: number; name: string; joinedAt: string }

// ═══ 知识图谱 ═══
// GraphNode / GraphEdge / GraphData / ViewRole 定义在 api/graph.ts 中 (dev1 版更完整)
// 不要在此处重复定义，避免类型冲突

// ═══ 节点学习 ═══
export interface NodeInfo { id: number; name: string; description: string }
export interface ResourceItem { id: number; name: string; type: 'PDF' | 'VIDEO' | 'LINK'; url: string }
export interface QuizBrief { quizId: number; name: string; deadline?: string }
export interface NodeLearningData { node: NodeInfo; resources: ResourceItem[]; quizzes: QuizBrief[] }

// ═══ 测验 ═══
export interface QuizQuestion { id: number; content: string; type: 'SINGLE' | 'JUDGE'; options: string[]; score: number }
export interface Quiz { id: number; name: string; courseId: number; nodeId: number; questions: QuizQuestion[]; deadline?: string }
export interface SubmitResult {
  score: number; totalScore: number;
  masteryUpdates: Array<{ nodeId: number; label: string; change: number }>;
}

// ═══ 学情看板 ═══
export interface DashboardData {
  completionRate: number; activeRate: number; riskStudentCount: number;
  activeTrend: Array<{ date: string; count: number }>;
  weakKnowledgePoints: Array<{ nodeId: number; label: string; avgScore: number }>;
  riskStudents: Array<{ studentId: number; name: string; avgMastery: number; activeDays: number; lastLogin: string }>;
}

// ═══ AI ═══
export interface LearningPlan {
  id: number; week: string; summary: string;
  dailyPlan: Array<{ day: string; tasks: string[] }>; motivation: string;
}
export interface TeachingAdvice {
  problem: string;
  suggestions: Array<{ id: number; content: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
}

// ═══ 学生轨迹 ═══
export interface QuizRecord { quizName: string; score: number; submittedAt: string }
export interface LearningLog { action: string; nodeName: string; createdAt: string }
export interface StudentTrajectory { recentQuizzes: QuizRecord[]; recentLogs: LearningLog[] }

// ═══ 开发辅助 ═══
export interface HeartbeatStatus { lastRunAt: string; status: 'SUCCESS' | 'FAILED' | 'IDLE'; totalStudents: number; remindedCount: number }

// ═══ 通知 ═══
export interface Notification {
  id: number; userId: number; courseId: number;
  type: 'REMINDER' | 'PLAN' | 'SYSTEM' | 'ADVICE';
  title: string; content: string; priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean; createdAt: string;
}
