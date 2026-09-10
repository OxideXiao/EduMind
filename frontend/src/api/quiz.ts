import client from './client';
import type {
  Quiz,
  QuizOption,
  QuizSubmissionAnswer,
  QuizSubmissionRecord,
  SubmitResult,
} from './types';
import { normalizeQuestionType } from '../utils/apiNormalize';

export type {
  QuizQuestion,
  Quiz,
  SubmitResult,
  QuizSubmissionRecord,
  QuizSubmissionAnswer,
} from './types';

function mapOptions(raw: unknown): QuizOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o: Record<string, unknown>, i: number) => {
    if (typeof o === 'string') {
      return { label: String.fromCharCode(65 + i), content: o };
    }
    const label = String(o.label ?? String.fromCharCode(65 + i));
    const content = String(o.content ?? o.text ?? '');
    const opt: QuizOption = { label, content };
    if (typeof o.isCorrect === 'boolean') opt.isCorrect = o.isCorrect;
    return opt;
  });
}

function mapQuestion(q: Record<string, unknown>) {
  return {
    id: Number(q.questionId ?? q.id ?? 0),
    content: String(q.content ?? q.stem ?? ''),
    type: normalizeQuestionType(q.type ?? q.questionType),
    options: mapOptions(q.options),
    score: Number(q.score ?? 0),
  };
}

/** GET /api/quizzes/:quizId */
export async function fetchQuiz(quizId: number): Promise<Quiz> {
  const raw: Record<string, unknown> = await client.get(`/quizzes/${quizId}`).then((r) => r.data);
  return {
    id: Number(raw.quizId ?? raw.id ?? 0),
    name: String(raw.name ?? raw.title ?? ''),
    courseId: Number(raw.courseId ?? 0),
    nodeId: Number(raw.nodeId ?? raw.knowledgeNodeId ?? 0),
    deadline: raw.deadline as string | undefined,
    questions: Array.isArray(raw.questions)
      ? (raw.questions as Record<string, unknown>[]).map(mapQuestion)
      : [],
  };
}

/** POST /api/quizzes/:quizId/attempts（兼容旧 /submit） */
export async function submitQuiz(
  quizId: number,
  answers: Record<number, string>,
): Promise<SubmitResult> {
  const payload = {
    answers: Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [String(k), v]),
    ),
  };

  let raw: Record<string, unknown>;
  try {
    raw = await client.post(`/quizzes/${quizId}/attempts`, payload).then((r) => r.data);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status && status !== 404) throw err;
    raw = await client.post(`/quizzes/${quizId}/submit`, payload).then((r) => r.data);
  }

  return {
    submissionId: raw.submissionId != null ? Number(raw.submissionId) : undefined,
    score: Number(raw.score ?? 0),
    totalScore: Number(raw.totalScore ?? 100),
    masteryUpdates: Array.isArray(raw.masteryUpdates)
      ? (raw.masteryUpdates as Record<string, unknown>[]).map((u) => ({
          nodeId: Number(u.nodeId ?? 0),
          label: String(u.nodeName ?? u.label ?? ''),
          change: Number(u.delta ?? u.change ?? 0),
        }))
      : [],
  };
}

function mapSubmissionAnswer(raw: Record<string, unknown>): QuizSubmissionAnswer {
  const answer: QuizSubmissionAnswer = {
    questionId: Number(raw.questionId ?? 0),
    type: String(raw.type ?? ''),
    stem: String(raw.stem ?? raw.content ?? ''),
    options: mapOptions(raw.options),
    studentAnswer: String(raw.studentAnswer ?? ''),
  };
  if (raw.correctAnswer != null) answer.correctAnswer = String(raw.correctAnswer);
  if (typeof raw.isCorrect === 'boolean') answer.isCorrect = raw.isCorrect;
  if (raw.score != null) answer.score = Number(raw.score);
  if (raw.analysis != null) answer.analysis = String(raw.analysis);
  return answer;
}

/** GET /api/quiz-submissions/{submissionId} */
export async function fetchQuizSubmission(submissionId: number): Promise<QuizSubmissionRecord> {
  const raw: Record<string, unknown> = await client
    .get(`/quiz-submissions/${submissionId}`)
    .then((r) => r.data);
  return {
    submissionId: Number(raw.submissionId ?? submissionId),
    score: Number(raw.score ?? 0),
    totalScore: Number(raw.totalScore ?? 0),
    submittedAt: String(raw.submittedAt ?? ''),
    answers: Array.isArray(raw.answers)
      ? (raw.answers as Record<string, unknown>[]).map(mapSubmissionAnswer)
      : [],
  };
}
