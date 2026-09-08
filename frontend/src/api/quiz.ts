import client from './client';
import type { Quiz, SubmitResult } from './types';
import { buildMockQuizDetail } from '../mock/teacher';
import * as quizMock from '../mock/quiz';

export type { QuizQuestion, Quiz, SubmitResult } from './types';

const FORCE_MOCK = import.meta.env.VITE_TEACHER_API_MOCK !== 'false'
  || import.meta.env.VITE_QUIZ_API_MOCK === 'true';

function isNetworkishError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true;
  const anyErr = err as { response?: { status?: number } };
  const status = anyErr.response?.status;
  return !status || status === 404 || status >= 500;
}

/** 后端选项 {label, text|content} → 前端 string[] */
function mapOptions(opts: Array<{ label: string; text?: string; content?: string }> | string[] | undefined): string[] {
  if (!Array.isArray(opts)) return [];
  if (opts.length && typeof opts[0] === 'string') return opts as string[];
  return (opts as Array<{ label: string; text?: string; content?: string }>).map(
    (o) => o.text ?? o.content ?? o.label ?? '',
  );
}

function mapQuiz(raw: Record<string, unknown>): Quiz {
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  return {
    id: Number(raw.quizId ?? raw.id ?? 0),
    name: String(raw.name ?? raw.title ?? ''),
    courseId: Number(raw.courseId ?? 0),
    nodeId: Number(raw.nodeId ?? raw.knowledgeNodeId ?? 0),
    deadline: (raw.deadline ?? raw.endTime) as string | undefined,
    questions: questions.map((q: Record<string, unknown>) => {
      const typeRaw = String(q.type ?? q.questionType ?? 'SINGLE');
      const type = typeRaw === 'TRUE_FALSE' || typeRaw === 'JUDGE'
        ? 'JUDGE' as const
        : 'SINGLE' as const;
      return {
        id: Number(q.questionId ?? q.id ?? 0),
        content: String(q.content ?? q.stem ?? ''),
        type,
        options: mapOptions(q.options as Array<{ label: string; text: string }> | string[] | undefined),
        score: Number(q.score ?? 0),
      };
    }),
  };
}

async function resolveMockQuiz(quizId: number): Promise<Quiz> {
  const fromBank = buildMockQuizDetail(quizId);
  if (fromBank) return fromBank;
  return quizMock.fetchQuiz(quizId);
}

/** GET /api/quizzes/:quizId */
export async function fetchQuiz(quizId: number): Promise<Quiz> {
  if (FORCE_MOCK) return resolveMockQuiz(quizId);
  try {
    const raw = await client.get(`/quizzes/${quizId}`).then((r) => r.data as Record<string, unknown>);
    return mapQuiz(raw);
  } catch (err) {
    if (isNetworkishError(err)) {
      console.warn('[quiz API] 后端未就绪，使用 Mock：', err);
      return resolveMockQuiz(quizId);
    }
    throw err;
  }
}

/** POST /api/quizzes/:quizId/attempts（旧 submit 别名仍可用） */
export async function submitQuiz(quizId: number, answers: Record<number, string>): Promise<SubmitResult> {
  if (FORCE_MOCK) return quizMock.submitQuiz(quizId, answers);
  try {
    const payload = { answers: Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [String(k), v]),
    ) };
    let raw: Record<string, unknown>;
    try {
      raw = await client.post(`/quizzes/${quizId}/attempts`, payload).then((r) => r.data as Record<string, unknown>);
    } catch {
      raw = await client.post(`/quizzes/${quizId}/submit`, { answers }).then((r) => r.data as Record<string, unknown>);
    }
    return {
      score: Number(raw.score ?? 0),
      totalScore: Number(raw.totalScore ?? 100),
      masteryUpdates: Array.isArray(raw.masteryUpdates)
        ? (raw.masteryUpdates as Array<Record<string, unknown>>).map((u) => ({
            nodeId: Number(u.nodeId ?? 0),
            label: String(u.nodeName ?? u.label ?? ''),
            change: Number(u.delta ?? u.change ?? 0),
          }))
        : [],
    };
  } catch (err) {
    if (isNetworkishError(err)) return quizMock.submitQuiz(quizId, answers);
    throw err;
  }
}
