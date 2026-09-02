/**
 * 教师端 API — 预留后端接口路径，失败时回退 Mock 便于联调前演示
 *
 * 约定接口（供后端对齐）：
 * POST   /api/courses/{id}/members/import          multipart file
 * GET    /api/courses/{id}/members/import-template
 * POST   /api/courses/{id}/graph/import            multipart file
 * GET    /api/courses/{id}/resources
 * POST   /api/courses/{id}/resources
 * DELETE /api/courses/{id}/resources/{resourceId}
 * GET    /api/courses/{id}/question-bank
 * POST   /api/courses/{id}/question-bank
 * POST   /api/courses/{id}/question-bank/import    multipart file
 * GET    /api/courses/{id}/assignments
 * POST   /api/courses/{id}/assignments
 * POST   /api/courses/{id}/assignments/{id}/publish
 */
import client from './client';
import type {
  Assignment,
  BankQuestion,
  CreateAssignmentParams,
  CreateBankQuestionParams,
  CreateResourceParams,
  ImportResult,
  TeachingResource,
} from './types';
import * as mock from '../mock/teacher';

/** 设为 true 强制走 Mock；联调时改为 false 或通过环境变量关闭 */
const FORCE_MOCK = import.meta.env.VITE_TEACHER_API_MOCK !== 'false';

function isNetworkishError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true;
  const anyErr = err as { response?: { status?: number }; message?: string };
  const status = anyErr.response?.status;
  return !status || status === 404 || status >= 500;
}

async function withFallback<T>(real: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (FORCE_MOCK) return fallback();
  try {
    return await real();
  } catch (err) {
    if (isNetworkishError(err)) {
      console.warn('[teacher API] 后端未就绪，使用 Mock：', err);
      return fallback();
    }
    throw err;
  }
}

function toFormData(file: File, extra?: Record<string, string>): FormData {
  const fd = new FormData();
  fd.append('file', file);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  }
  return fd;
}

/** POST /api/courses/{courseId}/members/import */
export async function importStudents(courseId: number, file: File): Promise<ImportResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/members/import`,
        toFormData(file),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as ImportResult;
    },
    () => mock.mockImportStudents(courseId, file),
  );
}

/** GET /api/courses/{courseId}/members/import-template — 返回模板下载 URL 或 blob */
export function getStudentImportTemplateUrl(courseId: number): string {
  return `/api/courses/${courseId}/members/import-template`;
}

/** POST /api/courses/{courseId}/graph/import */
export async function importKnowledgePoints(courseId: number, file: File): Promise<ImportResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/graph/import`,
        toFormData(file),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as ImportResult;
    },
    () => mock.mockImportKnowledge(courseId, file),
  );
}

/** GET /api/courses/{courseId}/resources */
export async function fetchResources(courseId: number): Promise<TeachingResource[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/resources`);
      return Array.isArray(data) ? (data as TeachingResource[]) : [];
    },
    () => mock.mockFetchResources(courseId),
  );
}

/** POST /api/courses/{courseId}/resources */
export async function createResource(courseId: number, params: CreateResourceParams): Promise<TeachingResource> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/resources`, params);
      return data as TeachingResource;
    },
    () => mock.mockCreateResource(courseId, params),
  );
}

/** DELETE /api/courses/{courseId}/resources/{resourceId} */
export async function deleteResource(courseId: number, resourceId: number): Promise<void> {
  return withFallback(
    async () => {
      await client.delete(`/courses/${courseId}/resources/${resourceId}`);
    },
    () => mock.mockDeleteResource(courseId, resourceId),
  );
}

/** GET /api/courses/{courseId}/question-bank */
export async function fetchBankQuestions(courseId: number): Promise<BankQuestion[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/question-bank`);
      return Array.isArray(data) ? (data as BankQuestion[]) : [];
    },
    () => mock.mockFetchQuestions(courseId),
  );
}

/** POST /api/courses/{courseId}/question-bank */
export async function createBankQuestion(
  courseId: number,
  params: CreateBankQuestionParams,
): Promise<BankQuestion> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/question-bank`, params);
      return data as BankQuestion;
    },
    () => mock.mockCreateQuestion(courseId, params),
  );
}

/** POST /api/courses/{courseId}/question-bank/import */
export async function importBankQuestions(courseId: number, file: File): Promise<ImportResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/question-bank/import`,
        toFormData(file),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as ImportResult;
    },
    () => mock.mockImportQuestions(courseId, file),
  );
}

/** GET /api/courses/{courseId}/assignments */
export async function fetchAssignments(courseId: number): Promise<Assignment[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/assignments`);
      return Array.isArray(data) ? (data as Assignment[]) : [];
    },
    () => mock.mockFetchAssignments(courseId),
  );
}

/** POST /api/courses/{courseId}/assignments */
export async function createAssignment(
  courseId: number,
  params: CreateAssignmentParams,
): Promise<Assignment> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/assignments`, params);
      return data as Assignment;
    },
    () => mock.mockCreateAssignment(courseId, params),
  );
}

/** POST /api/courses/{courseId}/assignments/{assignmentId}/publish */
export async function publishAssignment(courseId: number, assignmentId: number): Promise<Assignment> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/assignments/${assignmentId}/publish`);
      return data as Assignment;
    },
    () => mock.mockPublishAssignment(courseId, assignmentId),
  );
}
