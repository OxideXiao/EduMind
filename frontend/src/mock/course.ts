import type { Course, CreateCourseParams, CourseMember } from '../api/types';

function delay(ms?: number) {
  return new Promise<void>((r) => setTimeout(r, ms ?? 300 + Math.random() * 300));
}

/* ── 学生姓名池 ── */
const NAMES = ['张三','李四','王五','赵六','孙七','周八','吴九','郑十','冯一一','陈二','褚三','卫四','蒋五','沈六','韩七','杨八','朱九','秦十','何二','许一一','刘明','黄丽','林涛','叶芳','唐杰'];

function makeMembers(count: number, baseDate: string): CourseMember[] {
  return NAMES.slice(0, count).map((name, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * 2);
    return { userId: 101 + i, name, joinedAt: d.toISOString().slice(0, 10) + 'T08:00:00' };
  });
}

/* ── 多门课程 ── */
const MOCK_COURSES: Course[] = [
  {
    id: 1, name: '数据结构与算法', semester: '2025-2026-2', description: '计算机科学核心基础课程',
    teacherId: 1, inviteCode: 'DEMO01', nodeCount: 35, studentCount: 20, createdAt: '2026-06-01',
  },
  {
    id: 2, name: '操作系统', semester: '2025-2026-2', description: '深入理解进程管理、内存管理与文件系统',
    teacherId: 1, inviteCode: 'DEMO02', nodeCount: 28, studentCount: 18, createdAt: '2026-06-01',
  },
  {
    id: 3, name: '计算机网络', semester: '2025-2026-2', description: 'TCP/IP协议栈、网络层与传输层核心原理',
    teacherId: 1, inviteCode: 'DEMO03', nodeCount: 30, studentCount: 15, createdAt: '2026-06-01',
  },
];

/* ── 每个课程的学生 ── */
const MOCK_MEMBERS: Record<number, CourseMember[]> = {
  1: makeMembers(20, '2026-06-01'),
  2: makeMembers(18, '2026-06-02'),
  3: makeMembers(15, '2026-06-03'),
};

let createdCourses: Course[] = [];

function ensureMembers(courseId: number) {
  if (!MOCK_MEMBERS[courseId]) MOCK_MEMBERS[courseId] = [];
}

export async function fetchCourses(): Promise<Course[]> {
  await delay();
  return [...MOCK_COURSES, ...createdCourses];
}

export async function createCourse(params: CreateCourseParams): Promise<Course> {
  await delay();
  const id = 100 + createdCourses.length;
  const course: Course = {
    id, name: params.name, semester: params.semester,
    description: params.description ?? '', teacherId: 1,
    inviteCode: String(Math.random()).slice(2, 8).toUpperCase(),
    nodeCount: 0, studentCount: 0, createdAt: new Date().toISOString().split('T')[0],
  };
  createdCourses.push(course);
  MOCK_MEMBERS[id] = [];
  return course;
}

export async function joinCourse(inviteCode: string): Promise<Course> {
  await delay();
  const course = [...MOCK_COURSES, ...createdCourses].find(
    (c) => c.inviteCode?.toUpperCase() === inviteCode.toUpperCase(),
  );
  if (!course) throw new Error('邀请码无效');
  return course;
}

export async function fetchMembers(courseId: number): Promise<CourseMember[]> {
  await delay();
  ensureMembers(courseId);
  return MOCK_MEMBERS[courseId];
}
