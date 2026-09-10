/**
 * Mock Quiz — 对齐 api-spec §5 + demo-seed-spec §6 + 作答记录格式
 */

import type {
  Quiz,
  QuizSubmissionRecord,
  SubmitResult,
} from '../api/types';

function delay(ms?: number) {
  return new Promise<void>((r) => setTimeout(r, ms ?? 300 + Math.random() * 300));
}

const MOCK_QUIZZES: Record<number, Quiz> = {
  1: {
    id: 1, name: '线性表基础测验', courseId: 1, nodeId: 5,
    questions: [
      { id: 1, content: '数组在内存中的存储方式是？', type: 'SINGLE', options: [
        { label: 'A', content: '连续存储' }, { label: 'B', content: '链式存储' },
        { label: 'C', content: '索引存储' }, { label: 'D', content: '散列存储' },
      ], score: 20 },
      { id: 2, content: '链表相比于数组的优势是？', type: 'SINGLE', options: [
        { label: 'A', content: '随机访问快' }, { label: 'B', content: '插入删除快' },
        { label: 'C', content: '内存占用小' }, { label: 'D', content: '缓存友好' },
      ], score: 20 },
      { id: 3, content: '栈的特点是先进先出。', type: 'JUDGE', options: [
        { label: 'A', content: '正确' }, { label: 'B', content: '错误' },
      ], score: 20 },
      { id: 4, content: '以下哪个不是线性表？', type: 'SINGLE', options: [
        { label: 'A', content: '数组' }, { label: 'B', content: '链表' },
        { label: 'C', content: '树' }, { label: 'D', content: '队列' },
      ], score: 20 },
      { id: 5, content: '队列只能在队尾插入元素。', type: 'JUDGE', options: [
        { label: 'A', content: '正确' }, { label: 'B', content: '错误' },
      ], score: 20 },
    ],
  },
  2: {
    id: 2, name: '树与遍历测验', courseId: 1, nodeId: 10,
    questions: [
      { id: 1, content: '二叉树的前序遍历顺序是？', type: 'SINGLE', options: [
        { label: 'A', content: '左→根→右' }, { label: 'B', content: '根→左→右' },
        { label: 'C', content: '左→右→根' }, { label: 'D', content: '根→右→左' },
      ], score: 20 },
      { id: 2, content: '满二叉树一定是完全二叉树。', type: 'JUDGE', options: [
        { label: 'A', content: '正确' }, { label: 'B', content: '错误' },
      ], score: 20 },
      { id: 3, content: '二叉搜索树的中序遍历结果是？', type: 'SINGLE', options: [
        { label: 'A', content: '无序序列' }, { label: 'B', content: '递减序列' },
        { label: 'C', content: '递增序列' }, { label: 'D', content: '不确定' },
      ], score: 20 },
      { id: 4, content: '层序遍历通常使用栈来实现。', type: 'JUDGE', options: [
        { label: 'A', content: '正确' }, { label: 'B', content: '错误' },
      ], score: 20 },
      { id: 5, content: '一棵有 n 个节点的二叉树，其空指针域个数为？', type: 'SINGLE', options: [
        { label: 'A', content: 'n' }, { label: 'B', content: 'n-1' },
        { label: 'C', content: 'n+1' }, { label: 'D', content: '2n' },
      ], score: 20 },
    ],
  },
};

/** 正确答案：label */
const CORRECT: Record<string, string> = {
  '1-1': 'A', '1-2': 'B', '1-3': 'B', '1-4': 'C', '1-5': 'B',
  '2-1': 'B', '2-2': 'A', '2-3': 'C', '2-4': 'B', '2-5': 'C',
};

const TYPE_TO_API: Record<string, string> = {
  SINGLE: 'SINGLE_CHOICE',
  JUDGE: 'TRUE_FALSE',
  MULTIPLE: 'MULTIPLE_CHOICE',
  SHORT: 'SHORT_ANSWER',
  FILE: 'SHORT_ANSWER',
};

let submissionSeq = 100;
const submissionStore: Record<number, QuizSubmissionRecord> = {};

/** GET /api/quizzes/{quizId} — 不含正确答案 */
export async function fetchQuiz(quizId: number): Promise<Quiz> {
  await delay();
  const quiz = MOCK_QUIZZES[quizId];
  if (!quiz) throw new Error('测验不存在');
  return quiz;
}

/** POST /api/quizzes/{quizId}/attempts */
export async function submitQuiz(quizId: number, answers: Record<number, string>): Promise<SubmitResult> {
  await delay(600);
  const quiz = MOCK_QUIZZES[quizId];
  if (!quiz) throw new Error('测验不存在');

  let earned = 0;
  const totalScore = quiz.questions.reduce((s, q) => s + q.score, 0);
  const detailAnswers = quiz.questions.map((q) => {
    const key = `${quizId}-${q.id}`;
    const correctAnswer = CORRECT[key] ?? 'A';
    const studentAnswer = answers[q.id] ?? '';
    const isCorrect = studentAnswer === correctAnswer;
    if (isCorrect) earned += q.score;
    return {
      questionId: q.id,
      type: TYPE_TO_API[q.type] ?? q.type,
      stem: q.content,
      options: q.options.map((o) => ({
        ...o,
        isCorrect: o.label === correctAnswer,
      })),
      studentAnswer,
      correctAnswer,
      isCorrect,
      score: isCorrect ? q.score : 0,
      analysis: isCorrect ? '回答正确' : `正确答案为 ${correctAnswer}`,
    };
  });

  const submissionId = ++submissionSeq;
  submissionStore[submissionId] = {
    submissionId,
    score: earned,
    totalScore,
    submittedAt: new Date().toISOString().slice(0, 19),
    answers: detailAnswers,
  };

  return {
    submissionId,
    score: earned,
    totalScore,
    masteryUpdates: [
      {
        nodeId: quiz.nodeId,
        label: quiz.name,
        change: Math.round((earned / Math.max(totalScore, 1)) * 15 * 10) / 10,
      },
    ],
  };
}

/** GET /api/quiz-submissions/{submissionId} — Mock 默认返回教师完整字段 */
export async function fetchQuizSubmission(submissionId: number): Promise<QuizSubmissionRecord> {
  await delay(200);
  const record = submissionStore[submissionId];
  if (!record) throw new Error('作答记录不存在');
  // 浅拷贝，避免调用方改到 store
  return {
    ...record,
    answers: record.answers.map((a) => ({
      ...a,
      options: a.options.map((o) => ({ ...o })),
    })),
  };
}
