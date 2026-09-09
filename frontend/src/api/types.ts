/**
 * API 类型定义 — 唯一真相源
 * 对齐 api-spec.md + demo-seed-spec.md
 *
 * mock/ 和 api/ 全部 import 自此文件
 */

// ═══ 认证 ═══
/** account = 用户名 / 邮箱 / 学号（发送到后端时映射为 email 字段） */
export interface LoginParams { account: string; password: string }
export interface RegisterParams { name: string; email: string; password: string; role: 'TEACHER' | 'STUDENT' }
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  username?: string;
  mustChangePassword?: boolean;
}
export interface AuthResponse { token: string; user: AuthUser }

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

// ═══ 课程 ═══
export interface Course {
  id: number; name: string; semester: string; description: string;
  teacherId: number; inviteCode?: string; nodeCount?: number; studentCount?: number;
  createdAt: string;
}
export interface CreateCourseParams { name: string; semester: string; description?: string }
export interface CourseMember { userId: number; name: string; joinedAt: string; email?: string }

// ═══ 教师端：导入 / 资源 / 题库 / 作业（对接后端预留） ═══
export interface ImportFailureRow {
  row: number;
  reason: string;
  raw?: string;
}

export interface ImportResult {
  successCount: number;
  failCount: number;
  failures: ImportFailureRow[];
  message?: string;
  /** 两步导入：确认后凭证下载 token */
  credentialExportToken?: string;
}

/** 导入预检（学生 / 知识点 / 题库） */
export interface ImportPreviewRow {
  row: number;
  status: 'VALID' | 'WARNING' | 'ERROR' | string;
  messages?: string[];
  studentNo?: string;
  realName?: string;
  raw?: string;
}

export interface ImportPreviewResult {
  importToken: string;
  total: number;
  valid: number;
  warningCount: number;
  errorCount: number;
  rows: ImportPreviewRow[];
}

export interface ImportCommitResult {
  created?: number;
  joined?: number;
  skipped?: number;
  successCount?: number;
  failCount?: number;
  failedRows?: Array<{ row: number; reason: string; studentNo?: string }>;
  credentialExportToken?: string;
  message?: string;
}

export interface TeachingResource {
  id: number;
  courseId: number;
  name: string;
  type: 'PDF' | 'VIDEO' | 'LINK' | 'OTHER';
  url: string;
  nodeIds: number[];
  nodeNames?: string[];
  createdAt: string;
}

export interface CreateResourceParams {
  name: string;
  type: TeachingResource['type'];
  url: string;
  nodeIds: number[];
}

export type QuestionType = 'SINGLE' | 'JUDGE' | 'MULTIPLE' | 'SHORT' | 'FILE';

export interface BankQuestion {
  id: number;
  courseId: number;
  content: string;
  type: QuestionType;
  options?: string[];
  answer?: string;
  score: number;
  nodeIds: number[];
  nodeNames?: string[];
  createdAt: string;
}

export interface CreateBankQuestionParams {
  content: string;
  type: QuestionType;
  options?: string[];
  answer?: string;
  score: number;
  nodeIds: number[];
}

export type AssignmentSubmitType = 'ONLINE' | 'FILE' | 'MIXED';
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string;
  deadline?: string;
  questionCount: number;
  submitType: AssignmentSubmitType;
  status: AssignmentStatus;
  createdAt: string;
}

export interface CreateAssignmentParams {
  title: string;
  description: string;
  deadline?: string;
  questionCount: number;
  submitType: AssignmentSubmitType;
  questionIds?: number[];
  publish?: boolean;
}

/** 教师发布的课程测验（从题库选题） */
export type CourseQuizStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface CourseQuiz {
  id: number;
  courseId: number;
  name: string;
  nodeId: number;
  nodeName?: string;
  questionIds: number[];
  questionCount: number;
  deadline?: string;
  status: CourseQuizStatus;
  createdAt: string;
}

export interface PublishQuizParams {
  name: string;
  nodeId: number;
  questionIds: number[];
  deadline?: string;
  publish?: boolean;
}

/** 学生侧作业列表项 */
export interface StudentAssignmentView extends Assignment {
  courseName?: string;
  submitted: boolean;
  submittedAt?: string;
  score?: number | null;
}

export interface SubmitAssignmentParams {
  textAnswer?: string;
  /** @deprecated 改用 files；Mock 仍可用 */
  fileName?: string;
  files?: File[];
}

/** 学生本人提交记录（Mock / 本地） */
export interface AssignmentSubmission {
  assignmentId: number;
  courseId: number;
  textAnswer?: string;
  fileName?: string;
  submittedAt: string;
  score?: number | null;
}

/** 教师查看作业提交列表项（含未提交学生） */
export type TeacherSubmissionStatus = 'submitted' | 'graded' | 'not_submitted' | string;

export interface TeacherSubmissionItem {
  submissionId: number | null;
  studentId: number;
  studentName: string;
  content?: string | null;
  status: TeacherSubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
  files?: Array<{
    fileId: number;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
  }>;
}

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
  id?: number;
  problem: string;
  suggestions: Array<{ id: number; content: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  generatedAt?: string;
}

/** AI 生题（学生端练习） */
export type AiQuestionType = 'SINGLE' | 'JUDGE' | 'MIXED';

export interface GenerateQuestionsParams {
  nodeId: number;
  questionType?: AiQuestionType;
  count?: number;
}

export interface AiGeneratedQuestion {
  id: number;
  content: string;
  type: 'SINGLE' | 'JUDGE';
  options: string[];
  /** 练习批改用；正式接口可能不下发，Mock 有 */
  answer?: string;
  analysis?: string;
  score: number;
}

export interface AiQuestionSet {
  nodeId: number;
  nodeName: string;
  questions: AiGeneratedQuestion[];
  generatedAt: string;
  summary?: string;
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
