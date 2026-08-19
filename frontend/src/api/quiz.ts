import client from './client';
import type { Quiz, SubmitResult } from './types';

export type { QuizQuestion, Quiz, SubmitResult } from './types';

/** 后端选项 {label, text} → 前端 string[] */
function mapOptions(opts: Array<{ label: string; text: string }> | undefined): string[] {
  return Array.isArray(opts) ? opts.map(o => o.text) : [];
}

/** GET /api/quizzes/:quizId */
export async function fetchQuiz(quizId: number): Promise<Quiz> {
  const raw: any = await client.get(`/quizzes/${quizId}`).then(r => r.data);
  return {
    id: raw.quizId ?? raw.id ?? 0,
    name: raw.name ?? '',
    courseId: raw.courseId ?? 0,
    nodeId: raw.nodeId ?? raw.knowledgeNodeId ?? 0,
    deadline: raw.deadline,
    questions: Array.isArray(raw.questions)
      ? raw.questions.map((q: any) => ({
          id: q.questionId ?? q.id ?? 0,
          content: q.content ?? q.stem ?? '',
          type: q.type ?? q.questionType ?? 'SINGLE',
          options: mapOptions(q.options),
          score: q.score ?? 0,
        }))
      : [],
  };
}

/** POST /api/quizzes/:quizId/submit */
export async function submitQuiz(quizId: number, answers: Record<number, string>): Promise<SubmitResult> {
  const raw: any = await client.post(`/quizzes/${quizId}/submit`, { answers }).then(r => r.data);
  return {
    score: Number(raw.score ?? 0),
    totalScore: Number(raw.totalScore ?? 100),
    masteryUpdates: Array.isArray(raw.masteryUpdates)
      ? raw.masteryUpdates.map((u: any) => ({
          nodeId: u.nodeId ?? 0,
          label: u.nodeName ?? u.label ?? '',
          change: Number(u.delta ?? u.change ?? 0),
        }))
      : [],
  };
}
