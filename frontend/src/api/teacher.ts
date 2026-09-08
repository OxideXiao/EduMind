/**
 * 教师/学生教学业务 API — 对齐《前端接口交接文档》
 * Mock：VITE_TEACHER_API_MOCK !== 'false' 时强制走本地
 */
import client from './client';
import type {
  Assignment,
  AssignmentStatus,
  BankQuestion,
  CourseQuiz,
  CreateAssignmentParams,
  CreateBankQuestionParams,
  CreateResourceParams,
  ImportCommitResult,
  ImportPreviewResult,
  ImportResult,
  PublishQuizParams,
  StudentAssignmentView,
  SubmitAssignmentParams,
  TeachingResource,
} from './types';
import {
  downloadBlob,
  normalizeQuestionType,
  normalizeStatus,
  normalizeSubmitType,
  normalizeResourceType,
  toApiQuestionType,
  toApiResourceType,
  toApiSubmitType,
  unwrapList,
} from '../utils/apiNormalize';
import * as mock from '../mock/teacher';

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

function toFormData(file: File, extra?: Record<string, string | boolean>): FormData {
  const fd = new FormData();
  fd.append('file', file);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => fd.append(k, String(v)));
  }
  return fd;
}

// ── mappers ──

function mapResource(raw: Record<string, unknown>, courseId: number): TeachingResource {
  const nodeIds = Array.isArray(raw.nodeIds)
    ? (raw.nodeIds as number[])
    : raw.nodeId != null
      ? [Number(raw.nodeId)]
      : [];
  return {
    id: Number(raw.resourceId ?? raw.id ?? 0),
    courseId: Number(raw.courseId ?? courseId),
    name: String(raw.name ?? ''),
    type: normalizeResourceType(raw.resourceType ?? raw.type),
    url: String(raw.url ?? ''),
    nodeIds,
    nodeNames: Array.isArray(raw.nodeNames) ? (raw.nodeNames as string[]) : undefined,
    createdAt: String(raw.createdAt ?? ''),
  };
}

function mapQuestion(raw: Record<string, unknown>, courseId: number): BankQuestion {
  const opts = raw.options;
  let options: string[] | undefined;
  if (Array.isArray(opts)) {
    if (opts.length && typeof opts[0] === 'object') {
      options = (opts as Array<Record<string, unknown>>).map((o) =>
        String(o.content ?? o.text ?? o.label ?? ''),
      );
    } else {
      options = opts as string[];
    }
  }
  return {
    id: Number(raw.questionId ?? raw.id ?? 0),
    courseId: Number(raw.courseId ?? courseId),
    content: String(raw.stem ?? raw.content ?? ''),
    type: normalizeQuestionType(raw.type ?? raw.questionType),
    options,
    answer: raw.answer != null ? String(raw.answer) : undefined,
    score: Number(raw.score ?? raw.difficulty ?? 5),
    nodeIds: Array.isArray(raw.nodeIds) ? (raw.nodeIds as number[]) : [],
    nodeNames: Array.isArray(raw.nodeNames) ? (raw.nodeNames as string[]) : undefined,
    createdAt: String(raw.createdAt ?? ''),
  };
}

function mapAssignment(raw: Record<string, unknown>, courseId: number): Assignment {
  return {
    id: Number(raw.assignmentId ?? raw.id ?? 0),
    courseId: Number(raw.courseId ?? courseId),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    deadline: (raw.endTime ?? raw.deadline) as string | undefined,
    questionCount: Number(raw.questionCount ?? raw.totalScore ?? 0),
    submitType: normalizeSubmitType(raw.submissionType ?? raw.submitType),
    status: normalizeStatus<AssignmentStatus>(raw.status, 'DRAFT'),
    createdAt: String(raw.createdAt ?? raw.startTime ?? ''),
  };
}

function mapCourseQuiz(raw: Record<string, unknown>, courseId: number): CourseQuiz {
  const qids = Array.isArray(raw.questionIds)
    ? (raw.questionIds as number[])
    : Array.isArray(raw.questions)
      ? (raw.questions as Array<Record<string, unknown>>).map((q) => Number(q.questionId ?? q.id))
      : [];
  return {
    id: Number(raw.quizId ?? raw.id ?? 0),
    courseId: Number(raw.courseId ?? courseId),
    name: String(raw.title ?? raw.name ?? ''),
    nodeId: Number(
      raw.nodeId
      ?? (Array.isArray(raw.nodeIds) ? raw.nodeIds[0] : 0)
      ?? 0,
    ),
    nodeName: raw.nodeName != null ? String(raw.nodeName) : undefined,
    questionIds: qids,
    questionCount: Number(raw.questionCount ?? qids.length),
    deadline: (raw.endTime ?? raw.deadline) as string | undefined,
    status: normalizeStatus(raw.status, 'DRAFT'),
    createdAt: String(raw.createdAt ?? ''),
  };
}

function mapStudentAssignment(raw: Record<string, unknown>, courseId?: number): StudentAssignmentView {
  const base = mapAssignment(raw, courseId ?? Number(raw.courseId ?? 0));
  const sub = (raw.mySubmission && typeof raw.mySubmission === 'object')
    ? (raw.mySubmission as Record<string, unknown>)
    : null;
  const submitted = Boolean(
    raw.submitted
    ?? (sub && (sub.status === 'submitted' || sub.status === 'graded' || sub.submissionId)),
  );
  return {
    ...base,
    submitted,
    submittedAt: (sub?.submittedAt ?? raw.submittedAt) as string | undefined,
    score: (sub?.score ?? raw.score) as number | null | undefined,
  };
}

function questionBody(params: CreateBankQuestionParams): Record<string, unknown> {
  const type = toApiQuestionType(params.type);
  const options = (params.options ?? []).map((text, i) => {
    const label = String.fromCharCode(65 + i);
    const isCorrect = params.answer === text || params.answer === label;
    return { label, content: text, isCorrect };
  });
  return {
    nodeIds: params.nodeIds,
    type,
    stem: params.content,
    options: options.length ? options : undefined,
    answer: params.answer,
    difficulty: params.score,
  };
}

function assignmentBody(params: CreateAssignmentParams): Record<string, unknown> {
  return {
    title: params.title,
    description: params.description,
    submissionType: toApiSubmitType(params.submitType),
    endTime: params.deadline,
    totalScore: params.questionCount || 100,
    questionIds: params.questionIds,
  };
}

function quizBody(params: PublishQuizParams): Record<string, unknown> {
  return {
    title: params.name,
    name: params.name,
    nodeIds: [params.nodeId],
    nodeId: params.nodeId,
    questionIds: params.questionIds,
    endTime: params.deadline,
    deadline: params.deadline,
  };
}

// ═══ 学生导入（两步） ═══

export function getStudentImportTemplateUrl(courseId: number): string {
  return `/api/courses/${courseId}/student-imports/template`;
}

export async function previewStudentImport(
  courseId: number,
  file: File,
  opts?: { passwordMode?: 'RANDOM' | 'UNIFORM'; defaultPassword?: string },
): Promise<ImportPreviewResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/student-imports/preview`,
        toFormData(file, {
          passwordMode: opts?.passwordMode ?? 'RANDOM',
          ...(opts?.defaultPassword ? { defaultPassword: opts.defaultPassword } : {}),
          forceChangePassword: true,
        }),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as ImportPreviewResult;
    },
    () => mock.mockPreviewStudentImport(courseId, file),
  );
}

export async function commitStudentImport(
  courseId: number,
  importToken: string,
): Promise<ImportCommitResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/student-imports/${importToken}/commit`,
        { duplicatePolicy: 'SKIP' },
      );
      return data as ImportCommitResult;
    },
    () => mock.mockCommitStudentImport(courseId, importToken),
  );
}

/** @deprecated 一步导入；内部走 preview+commit，供旧调用兼容 */
export async function importStudents(courseId: number, file: File): Promise<ImportResult> {
  const preview = await previewStudentImport(courseId, file);
  if (preview.errorCount > 0) {
    return {
      successCount: 0,
      failCount: preview.errorCount,
      failures: preview.rows
        .filter((r) => r.status === 'ERROR')
        .map((r) => ({ row: r.row, reason: (r.messages ?? []).join('; '), raw: r.studentNo })),
      message: '预检存在错误，请修正后重试',
    };
  }
  const commit = await commitStudentImport(courseId, preview.importToken);
  return {
    successCount: (commit.created ?? 0) + (commit.joined ?? 0),
    failCount: commit.failedRows?.length ?? 0,
    failures: (commit.failedRows ?? []).map((r) => ({
      row: r.row,
      reason: r.reason,
      raw: r.studentNo,
    })),
    credentialExportToken: commit.credentialExportToken,
    message: commit.message,
  };
}

export async function downloadCredentialExport(token: string, filename = '账号凭证.xlsx'): Promise<void> {
  if (FORCE_MOCK) {
    mock.mockDownloadCredential(token);
    return;
  }
  const res = await client.get(`/credential-exports/${token}/download`, {
    responseType: 'blob',
  });
  downloadBlob(res.data as Blob, filename);
}

// ═══ 知识点导入（两步） ═══

export function getKnowledgeImportTemplateUrl(courseId: number): string {
  return `/api/courses/${courseId}/knowledge-imports/template`;
}

export async function previewKnowledgeImport(
  courseId: number,
  file: File,
): Promise<ImportPreviewResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/knowledge-imports/preview`,
        toFormData(file),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as ImportPreviewResult;
    },
    () => mock.mockPreviewKnowledgeImport(courseId, file),
  );
}

export async function commitKnowledgeImport(
  courseId: number,
  importToken: string,
): Promise<ImportCommitResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/knowledge-imports/${importToken}/commit`,
      );
      return data as ImportCommitResult;
    },
    () => mock.mockCommitKnowledgeImport(courseId, importToken),
  );
}

export async function importKnowledgePoints(courseId: number, file: File): Promise<ImportResult> {
  const preview = await previewKnowledgeImport(courseId, file);
  if (preview.errorCount > 0) {
    return {
      successCount: 0,
      failCount: preview.errorCount,
      failures: preview.rows
        .filter((r) => r.status === 'ERROR')
        .map((r) => ({ row: r.row, reason: (r.messages ?? []).join('; ') })),
    };
  }
  const commit = await commitKnowledgeImport(courseId, preview.importToken);
  return {
    successCount: commit.created ?? commit.successCount ?? preview.valid,
    failCount: commit.failedRows?.length ?? commit.failCount ?? 0,
    failures: (commit.failedRows ?? []).map((r) => ({ row: r.row, reason: r.reason })),
    message: commit.message,
  };
}

// ═══ 资源 ═══

export async function fetchResources(courseId: number): Promise<TeachingResource[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/resources`, {
        params: { page: 1, pageSize: 200 },
      });
      return unwrapList<Record<string, unknown>>(data)
        .map((r) => mapResource(r, courseId))
        .filter((r) => r.courseId === courseId || !r.courseId);
    },
    () => mock.mockFetchResources(courseId),
  );
}

export async function createResource(
  courseId: number,
  params: CreateResourceParams,
): Promise<TeachingResource> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/resources`, {
        name: params.name,
        resourceType: toApiResourceType(params.type),
        url: params.url,
        nodeIds: params.nodeIds,
      });
      const raw = data as Record<string, unknown>;
      if (raw.resourceId && !raw.name) {
        return {
          id: Number(raw.resourceId),
          courseId,
          name: params.name,
          type: params.type,
          url: params.url,
          nodeIds: params.nodeIds,
          createdAt: new Date().toISOString(),
        };
      }
      return mapResource(raw, courseId);
    },
    () => mock.mockCreateResource(courseId, params),
  );
}

export async function deleteResource(courseId: number, resourceId: number): Promise<void> {
  return withFallback(
    async () => {
      try {
        await client.delete(`/resources/${resourceId}`);
      } catch {
        await client.delete(`/courses/${courseId}/resources/${resourceId}`);
      }
    },
    () => mock.mockDeleteResource(courseId, resourceId),
  );
}

// ═══ 题库 ═══

export async function fetchBankQuestions(courseId: number): Promise<BankQuestion[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/questions`, {
        params: { page: 1, pageSize: 200 },
      });
      return unwrapList<Record<string, unknown>>(data).map((q) => mapQuestion(q, courseId));
    },
    () => mock.mockFetchQuestions(courseId),
  );
}

export async function createBankQuestion(
  courseId: number,
  params: CreateBankQuestionParams,
): Promise<BankQuestion> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/questions`, questionBody(params));
      const raw = data as Record<string, unknown>;
      if (raw.questionId && !raw.stem && !raw.content) {
        return {
          id: Number(raw.questionId),
          courseId,
          content: params.content,
          type: params.type,
          options: params.options,
          answer: params.answer,
          score: params.score,
          nodeIds: params.nodeIds,
          createdAt: new Date().toISOString(),
        };
      }
      return mapQuestion(raw, courseId);
    },
    () => mock.mockCreateQuestion(courseId, params),
  );
}

export function getQuestionImportTemplateUrl(courseId: number): string {
  return `/api/courses/${courseId}/questions/imports/template`;
}

export async function previewQuestionImport(
  courseId: number,
  file: File,
): Promise<ImportPreviewResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/questions/imports/preview`,
        toFormData(file),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as ImportPreviewResult;
    },
    () => mock.mockPreviewQuestionImport(courseId, file),
  );
}

export async function commitQuestionImport(
  courseId: number,
  importToken: string,
): Promise<ImportCommitResult> {
  return withFallback(
    async () => {
      const { data } = await client.post(
        `/courses/${courseId}/questions/imports/${importToken}/commit`,
      );
      return data as ImportCommitResult;
    },
    () => mock.mockCommitQuestionImport(courseId, importToken),
  );
}

export async function importBankQuestions(courseId: number, file: File): Promise<ImportResult> {
  const preview = await previewQuestionImport(courseId, file);
  if (preview.errorCount > 0) {
    return {
      successCount: 0,
      failCount: preview.errorCount,
      failures: preview.rows
        .filter((r) => r.status === 'ERROR')
        .map((r) => ({ row: r.row, reason: (r.messages ?? []).join('; ') })),
    };
  }
  const commit = await commitQuestionImport(courseId, preview.importToken);
  return {
    successCount: commit.created ?? commit.successCount ?? preview.valid,
    failCount: commit.failedRows?.length ?? 0,
    failures: (commit.failedRows ?? []).map((r) => ({ row: r.row, reason: r.reason })),
  };
}

// ═══ 作业（教师） ═══

export async function fetchAssignments(courseId: number): Promise<Assignment[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/assignments`, {
        params: { page: 1, pageSize: 200 },
      });
      return unwrapList<Record<string, unknown>>(data).map((a) => mapAssignment(a, courseId));
    },
    () => mock.mockFetchAssignments(courseId),
  );
}

export async function createAssignment(
  courseId: number,
  params: CreateAssignmentParams,
): Promise<Assignment> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/assignments`, assignmentBody(params));
      const raw = data as Record<string, unknown>;
      const created = mapAssignment(
        { ...raw, title: params.title, description: params.description, submissionType: params.submitType },
        courseId,
      );
      if (params.publish && created.id) {
        return publishAssignment(courseId, created.id);
      }
      return { ...created, title: params.title || created.title, submitType: params.submitType };
    },
    () => mock.mockCreateAssignment(courseId, params),
  );
}

export async function publishAssignment(courseId: number, assignmentId: number): Promise<Assignment> {
  return withFallback(
    async () => {
      try {
        const { data } = await client.post(`/assignments/${assignmentId}/publish`);
        return mapAssignment(data as Record<string, unknown>, courseId);
      } catch {
        const { data } = await client.post(`/courses/${courseId}/assignments/${assignmentId}/publish`);
        return mapAssignment(data as Record<string, unknown>, courseId);
      }
    },
    () => mock.mockPublishAssignment(courseId, assignmentId),
  );
}

// ═══ 测验（教师） ═══

export async function fetchCourseQuizzes(courseId: number): Promise<CourseQuiz[]> {
  return withFallback(
    async () => {
      const { data } = await client.get(`/courses/${courseId}/quizzes`, {
        params: { page: 1, pageSize: 200 },
      });
      return unwrapList<Record<string, unknown>>(data).map((q) => mapCourseQuiz(q, courseId));
    },
    () => mock.mockFetchQuizzes(courseId),
  );
}

export async function publishQuiz(courseId: number, params: PublishQuizParams): Promise<CourseQuiz> {
  return withFallback(
    async () => {
      const { data } = await client.post(`/courses/${courseId}/quizzes`, quizBody(params));
      let quiz = mapCourseQuiz(data as Record<string, unknown>, courseId);
      if (!quiz.name) quiz = { ...quiz, name: params.name, nodeId: params.nodeId, questionIds: params.questionIds };
      if (params.publish !== false && quiz.id) {
        quiz = await publishCourseQuiz(courseId, quiz.id);
      }
      return quiz;
    },
    () => mock.mockPublishQuiz(courseId, params),
  );
}

export async function publishCourseQuiz(courseId: number, quizId: number): Promise<CourseQuiz> {
  return withFallback(
    async () => {
      try {
        const { data } = await client.post(`/quizzes/${quizId}/publish`);
        return mapCourseQuiz(data as Record<string, unknown>, courseId);
      } catch {
        const { data } = await client.post(`/courses/${courseId}/quizzes/${quizId}/publish`);
        return mapCourseQuiz(data as Record<string, unknown>, courseId);
      }
    },
    () => mock.mockPublishCourseQuiz(courseId, quizId),
  );
}

// ═══ 学生作业 ═══

export async function fetchStudentAssignments(courseId: number): Promise<StudentAssignmentView[]> {
  return withFallback(
    async () => {
      const { data } = await client.get('/student/assignments', {
        params: { page: 1, pageSize: 200, courseId },
      });
      const list = unwrapList<Record<string, unknown>>(data)
        .map((a) => mapStudentAssignment(a, courseId))
        .filter((a) => !courseId || a.courseId === courseId || a.courseId === 0);
      if (list.length) return list;
      // 别名回退
      const { data: legacy } = await client.get(`/courses/${courseId}/assignments/mine`);
      return unwrapList<Record<string, unknown>>(legacy).map((a) => mapStudentAssignment(a, courseId));
    },
    () => mock.mockFetchStudentAssignments(courseId),
  );
}

/** POST /api/assignments/{id}/submissions — multipart: content + files */
export async function submitAssignment(
  courseId: number,
  assignmentId: number,
  params: SubmitAssignmentParams,
): Promise<StudentAssignmentView> {
  return withFallback(
    async () => {
      const fd = new FormData();
      if (params.textAnswer != null) fd.append('content', params.textAnswer);
      (params.files ?? []).forEach((f) => fd.append('files', f));
      try {
        const { data } = await client.post(`/assignments/${assignmentId}/submissions`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return mapStudentAssignment(
          { ...(data as object), submitted: true, title: '' },
          courseId,
        );
      } catch {
        const { data } = await client.post(
          `/courses/${courseId}/assignments/${assignmentId}/submit`,
          { textAnswer: params.textAnswer, fileName: params.files?.[0]?.name ?? params.fileName },
        );
        return data as StudentAssignmentView;
      }
    },
    () => mock.mockSubmitAssignment(courseId, assignmentId, params),
  );
}
