/**
 * 教师端本地 Mock — 后端未就绪时兜底，联调稳定后可删除引用
 */
import type {
  Assignment,
  BankQuestion,
  CourseMember,
  CreateAssignmentParams,
  CreateBankQuestionParams,
  CreateResourceParams,
  ImportResult,
  TeachingResource,
} from '../api/types';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

let resourceSeq = 100;
let questionSeq = 200;
let assignmentSeq = 300;

const membersStore: Record<number, CourseMember[]> = {};
const resourcesStore: Record<number, TeachingResource[]> = {};
const questionsStore: Record<number, BankQuestion[]> = {};
const assignmentsStore: Record<number, Assignment[]> = {};

function ensureCourse(courseId: number) {
  if (!membersStore[courseId]) {
    membersStore[courseId] = [
      { userId: 101, name: '张三', email: 'student1@demo.com', joinedAt: '2026-03-01' },
      { userId: 102, name: '李四', email: 'student2@demo.com', joinedAt: '2026-03-01' },
      { userId: 103, name: '王五', email: 'student3@demo.com', joinedAt: '2026-03-02' },
    ];
  }
  if (!resourcesStore[courseId]) {
    resourcesStore[courseId] = [
      {
        id: 1,
        courseId,
        name: '链表课件.pdf',
        type: 'PDF',
        url: 'https://example.com/list.pdf',
        nodeIds: [1],
        nodeNames: ['数组与链表'],
        createdAt: '2026-03-10T10:00:00',
      },
      {
        id: 2,
        courseId,
        name: '二叉搜索树讲解视频',
        type: 'VIDEO',
        url: 'https://example.com/bst-video',
        nodeIds: [5],
        nodeNames: ['二叉搜索树'],
        createdAt: '2026-03-11T10:00:00',
      },
    ];
  }
  if (!questionsStore[courseId]) {
    questionsStore[courseId] = [
      {
        id: 1,
        courseId,
        content: '单链表中，已知结点 p，删除其后继结点的时间复杂度是？',
        type: 'SINGLE',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        answer: 'O(1)',
        score: 5,
        nodeIds: [1],
        nodeNames: ['数组与链表'],
        createdAt: '2026-03-12T09:00:00',
      },
      {
        id: 3,
        courseId,
        content: '下列关于二叉搜索树查找时间复杂度的描述，正确的是？',
        type: 'SINGLE',
        options: ['总是 O(1)', '平均 O(log n)，最坏 O(n)', '总是 O(n²)', '与节点颜色有关'],
        answer: '平均 O(log n)，最坏 O(n)',
        score: 5,
        nodeIds: [5],
        nodeNames: ['二叉搜索树'],
        createdAt: '2026-03-12T10:00:00',
      },
      {
        id: 2,
        courseId,
        content: '请简述二叉树的前序遍历过程，并上传练习截图。',
        type: 'FILE',
        score: 10,
        nodeIds: [2],
        nodeNames: ['栈与队列'],
        createdAt: '2026-03-12T09:30:00',
      },
    ];
  }
  if (!assignmentsStore[courseId]) {
    assignmentsStore[courseId] = [
      {
        id: 1,
        courseId,
        title: '第3周链表巩固作业',
        description: '完成选择题并上传手写链表图示。',
        deadline: '2026-04-01T23:59:00',
        questionCount: 5,
        submitType: 'MIXED',
        status: 'PUBLISHED',
        createdAt: '2026-03-20T08:00:00',
      },
    ];
  }
}

export async function mockImportStudents(courseId: number, _file: File): Promise<ImportResult> {
  ensureCourse(courseId);
  await delay();
  membersStore[courseId].push(
    { userId: 900 + membersStore[courseId].length, name: '导入学生A', email: 'import.a@demo.com', joinedAt: new Date().toISOString().slice(0, 10) },
    { userId: 901 + membersStore[courseId].length, name: '导入学生B', email: 'import.b@demo.com', joinedAt: new Date().toISOString().slice(0, 10) },
  );
  return {
    successCount: 2,
    failCount: 1,
    failures: [{ row: 4, reason: '邮箱格式不正确', raw: 'bad,,' }],
    message: '（Mock）导入完成，后端就绪后将写入真实账号',
  };
}

export async function mockImportKnowledge(_courseId: number, _file: File): Promise<ImportResult> {
  await delay();
  return {
    successCount: 8,
    failCount: 0,
    failures: [],
    message: '（Mock）知识点导入成功，请刷新知识图谱',
  };
}

export async function mockFetchResources(courseId: number): Promise<TeachingResource[]> {
  ensureCourse(courseId);
  await delay(300);
  return [...resourcesStore[courseId]];
}

export async function mockCreateResource(courseId: number, params: CreateResourceParams): Promise<TeachingResource> {
  ensureCourse(courseId);
  await delay();
  const item: TeachingResource = {
    id: ++resourceSeq,
    courseId,
    ...params,
    nodeNames: params.nodeIds.map((id) => `知识点#${id}`),
    createdAt: new Date().toISOString(),
  };
  resourcesStore[courseId].unshift(item);
  return item;
}

export async function mockDeleteResource(courseId: number, resourceId: number): Promise<void> {
  ensureCourse(courseId);
  await delay(200);
  resourcesStore[courseId] = resourcesStore[courseId].filter((r) => r.id !== resourceId);
}

export async function mockFetchQuestions(courseId: number): Promise<BankQuestion[]> {
  ensureCourse(courseId);
  await delay(300);
  return [...questionsStore[courseId]];
}

export async function mockCreateQuestion(courseId: number, params: CreateBankQuestionParams): Promise<BankQuestion> {
  ensureCourse(courseId);
  await delay();
  const item: BankQuestion = {
    id: ++questionSeq,
    courseId,
    ...params,
    nodeNames: params.nodeIds.map((id) => `知识点#${id}`),
    createdAt: new Date().toISOString(),
  };
  questionsStore[courseId].unshift(item);
  return item;
}

export async function mockImportQuestions(courseId: number, _file: File): Promise<ImportResult> {
  ensureCourse(courseId);
  await delay();
  return {
    successCount: 5,
    failCount: 1,
    failures: [{ row: 6, reason: '题型不支持', raw: 'ESSAY,...' }],
    message: '（Mock）题库导入完成',
  };
}

export async function mockFetchAssignments(courseId: number): Promise<Assignment[]> {
  ensureCourse(courseId);
  await delay(300);
  return [...assignmentsStore[courseId]];
}

export async function mockCreateAssignment(courseId: number, params: CreateAssignmentParams): Promise<Assignment> {
  ensureCourse(courseId);
  await delay();
  const item: Assignment = {
    id: ++assignmentSeq,
    courseId,
    title: params.title,
    description: params.description,
    deadline: params.deadline,
    questionCount: params.questionCount,
    submitType: params.submitType,
    status: params.publish ? 'PUBLISHED' : 'DRAFT',
    createdAt: new Date().toISOString(),
  };
  assignmentsStore[courseId].unshift(item);
  return item;
}

export async function mockPublishAssignment(courseId: number, assignmentId: number): Promise<Assignment> {
  ensureCourse(courseId);
  await delay();
  const item = assignmentsStore[courseId].find((a) => a.id === assignmentId);
  if (!item) throw new Error('作业不存在');
  item.status = 'PUBLISHED';
  return item;
}
