import client from './client';
import type { Course, CreateCourseParams, CourseMember } from './types';

export type { Course, CreateCourseParams, CourseMember } from './types';

/** 后端课程字段 → 前端 Course 类型映射 */
function mapCourse(raw: Record<string, unknown>): Course {
  return {
    id: raw.courseId as number,
    name: raw.name as string,
    semester: (raw.semester as string) ?? '',
    description: (raw.description as string) ?? '',
    teacherId: (raw.teacherId as number) ?? 0,
    inviteCode: raw.inviteCode as string | undefined,
    nodeCount: (raw.nodeCount as number) ?? 0,
    studentCount: (raw.studentCount as number) ?? 0,
    createdAt: (raw.createdAt as string) ?? '',
  };
}

/** GET /api/courses */
export async function fetchCourses(): Promise<Course[]> {
  const { data } = await client.get('/courses');
  return Array.isArray(data) ? data.map(mapCourse) : [];
}

/** POST /api/courses */
export async function createCourse(params: CreateCourseParams): Promise<Course> {
  const { data } = await client.post('/courses', params);
  return mapCourse(data as Record<string, unknown>);
}

/** POST /api/courses/join */
export async function joinCourse(inviteCode: string): Promise<Course> {
  const { data } = await client.post('/courses/join', { inviteCode });
  return mapCourse(data as Record<string, unknown>);
}

/** GET /api/courses/{courseId}/members — 后端返回 { students: [...] } */
export async function fetchMembers(courseId: number): Promise<CourseMember[]> {
  const { data } = await client.get(`/courses/${courseId}/members`);
  const list = Array.isArray(data) ? data : (data as Record<string, unknown>)?.students;
  return Array.isArray(list)
    ? list.map((m: Record<string, unknown>) => ({
        userId: (m.userId ?? m.id) as number,
        name: m.name as string,
        joinedAt: (m.joinedAt as string) ?? '',
      }))
    : [];
}
