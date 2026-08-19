/**
 * Mock Quiz — 对齐 api-spec §5 + demo-seed-spec §6
 */

import type { Quiz, SubmitResult } from '../api/types';

function delay(ms?: number) {
  return new Promise<void>((r) => setTimeout(r, ms ?? 300 + Math.random() * 300));
}

const MOCK_QUIZZES: Record<number, Quiz> = {
  // 线性表基础测（demo-seed-spec §6）
  1: {
    id: 1, name: '线性表基础测验', courseId: 1, nodeId: 5,
    questions: [
      { id: 1, content: '数组在内存中的存储方式是？', type: 'SINGLE', options: ['连续存储', '链式存储', '索引存储', '散列存储'], score: 20 },
      { id: 2, content: '链表相比于数组的优势是？', type: 'SINGLE', options: ['随机访问快', '插入删除快', '内存占用小', '缓存友好'], score: 20 },
      { id: 3, content: '栈的特点是先进先出。', type: 'JUDGE', options: ['正确', '错误'], score: 20 },
      { id: 4, content: '以下哪个不是线性表？', type: 'SINGLE', options: ['数组', '链表', '树', '队列'], score: 20 },
      { id: 5, content: '队列只能在队尾插入元素。', type: 'JUDGE', options: ['正确', '错误'], score: 20 },
    ],
  },
  // 树与遍历测
  2: {
    id: 2, name: '树与遍历测验', courseId: 1, nodeId: 10,
    questions: [
      { id: 1, content: '二叉树的前序遍历顺序是？', type: 'SINGLE', options: ['左→根→右', '根→左→右', '左→右→根', '根→右→左'], score: 20 },
      { id: 2, content: '满二叉树一定是完全二叉树。', type: 'JUDGE', options: ['正确', '错误'], score: 20 },
      { id: 3, content: '二叉搜索树的中序遍历结果是？', type: 'SINGLE', options: ['无序序列', '递减序列', '递增序列', '不确定'], score: 20 },
      { id: 4, content: '层序遍历通常使用栈来实现。', type: 'JUDGE', options: ['正确', '错误'], score: 20 },
      { id: 5, content: '一棵有 n 个节点的二叉树，其空指针域个数为？', type: 'SINGLE', options: ['n', 'n-1', 'n+1', '2n'], score: 20 },
    ],
  },
};

/** GET /api/quizzes/{quizId} — 不含正确答案 */
export async function fetchQuiz(quizId: number): Promise<Quiz> {
  await delay();
  const quiz = MOCK_QUIZZES[quizId];
  if (!quiz) throw new Error('测验不存在');
  return quiz;
}

/** POST /api/quizzes/{quizId}/submit */
export async function submitQuiz(quizId: number, answers: Record<number, string>): Promise<SubmitResult> {
  await delay(600);
  const quiz = MOCK_QUIZZES[quizId];
  if (!quiz) throw new Error('测验不存在');

  const correctMap: Record<number, string> = {
    // 测验1 答案
    '1-1': '连续存储', '1-2': '插入删除快', '1-3': '错误', '1-4': '树', '1-5': '正确',
    // 测验2 答案
    '2-1': '根→左→右', '2-2': '正确', '2-3': '递增序列', '2-4': '错误', '2-5': 'n+1',
  };

  let correct = 0;
  quiz.questions.forEach((q) => {
    const key = `${quizId}-${q.id}`;
    if (answers[q.id] === correctMap[key]) correct++;
  });

  const score = Math.round((correct / quiz.questions.length) * 100);
  return {
    score,
    totalScore: 100,
    masteryUpdates: quiz.questions.slice(0, 2).map((q) => ({
      nodeId: quiz.nodeId,
      label: q.content.slice(0, 12) + '…',
      change: Math.round((Math.random() * 20 - 5) * 10) / 10,
    })),
  };
}
