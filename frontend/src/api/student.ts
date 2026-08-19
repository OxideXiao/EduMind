import client from './client';
import type { MasteryLevel } from '../utils/colorMap';
import type { GraphData } from './graph';
import type { StudentTrajectory } from './types';

/** 单个学生在某知识点上的掌握情况 */
export interface StudentNodeMastery {
  studentId: number;
  studentName: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
}

/** GET /api/courses/{courseId}/nodes/{nodeId}/students 响应体 */
export interface NodeStudentsResponse {
  nodeId: number;
  nodeName: string;
  classAvgScore: number;
  classAvgLevel: MasteryLevel;
  totalStudents: number;
  students: StudentNodeMastery[];
}

/**
 * 获取某知识点下的学生掌握度列表（教师视图专用）
 * GET /api/courses/{courseId}/nodes/{nodeId}/students
 * ⚠️ 后端待实现此接口
 */
export async function fetchNodeStudents(
  courseId: number,
  nodeId: number,
): Promise<NodeStudentsResponse> {
  const { data } = await client.get(
    `/courses/${courseId}/nodes/${nodeId}/students`,
  );
  return data as NodeStudentsResponse;
}

/**
 * 获取某个学生的个人知识图谱（教师下钻专用）
 * GET /api/courses/{courseId}/students/{studentId}/graph
 */
export async function fetchStudentGraph(
  courseId: number,
  studentId: number,
): Promise<GraphData> {
  const { data } = await client.get(
    `/courses/${courseId}/students/${studentId}/graph`,
  );
  return data as unknown as GraphData;
}

/**
 * 获取学生学习轨迹（教师下钻专用）
 * GET /api/courses/{courseId}/students/{studentId}/trajectory
 */
export async function fetchStudentTrajectory(
  courseId: number,
  studentId: number,
): Promise<StudentTrajectory> {
  const { data } = await client.get(
    `/courses/${courseId}/students/${studentId}/trajectory`,
  );
  return data as StudentTrajectory;
}
