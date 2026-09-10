/**
 * 教师端本地 Mock — 按 courseId 隔离；联调稳定后可删除引用
 */
import type {
  Assignment,
  BankQuestion,
  CourseMember,
  CourseQuiz,
  CreateAssignmentParams,
  CreateBankQuestionParams,
  CreateResourceParams,
  ImportResult,
  PublishQuizParams,
  Quiz,
  StudentAssignmentView,
  SubmitAssignmentParams,
  TeachingResource,
  AssignmentSubmission,
} from '../api/types';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

const STORAGE_KEY = 'edumind_teacher_mock_v2';

type TeacherMockStore = {
  resourceSeq: number;
  questionSeq: number;
  assignmentSeq: number;
  quizSeq: number;
  members: Record<string, CourseMember[]>;
  resources: Record<string, TeachingResource[]>;
  questions: Record<string, BankQuestion[]>;
  assignments: Record<string, Assignment[]>;
  quizzes: Record<string, CourseQuiz[]>;
  /** key: `${courseId}:${assignmentId}` */
  submissions: Record<string, AssignmentSubmission>;
};

function emptyStore(): TeacherMockStore {
  return {
    resourceSeq: 1000,
    questionSeq: 2000,
    assignmentSeq: 3000,
    quizSeq: 4000,
    members: {},
    resources: {},
    questions: {},
    assignments: {},
    quizzes: {},
    submissions: {},
  };
}

function loadStore(): TeacherMockStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as TeacherMockStore;
    return {
      ...emptyStore(),
      ...parsed,
      members: parsed.members ?? {},
      resources: parsed.resources ?? {},
      questions: parsed.questions ?? {},
      assignments: parsed.assignments ?? {},
      quizzes: parsed.quizzes ?? {},
      submissions: parsed.submissions ?? {},
      quizSeq: parsed.quizSeq ?? 4000,
    };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: TeacherMockStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let store = loadStore();

function key(courseId: number): string {
  return String(courseId);
}

/** 仅演示课（id=1）给样例数据；其它课程从空开始，避免「全课共享同一份」的错觉 */
function seedDemoCourse(courseId: number) {
  if (courseId !== 1) return;
  const k = key(courseId);
  if (!store.members[k]) {
    store.members[k] = [
      { userId: 101, name: '张三', email: 'student1@demo.com', joinedAt: '2026-03-01' },
      { userId: 102, name: '李四', email: 'student2@demo.com', joinedAt: '2026-03-01' },
      { userId: 103, name: '王五', email: 'student3@demo.com', joinedAt: '2026-03-02' },
    ];
  }
  if (!store.resources[k]) {
    store.resources[k] = [
      {
        id: 1,
        courseId,
        name: '【数据结构】链表课件.pdf',
        type: 'PDF',
        url: 'https://example.com/dsa/list.pdf',
        nodeIds: [1],
        nodeNames: ['数组与链表'],
        createdAt: '2026-03-10T10:00:00',
      },
      {
        id: 2,
        courseId,
        name: '【数据结构】二叉搜索树讲解视频',
        type: 'VIDEO',
        url: 'https://example.com/dsa/bst-video',
        nodeIds: [5],
        nodeNames: ['二叉搜索树'],
        createdAt: '2026-03-11T10:00:00',
      },
    ];
  }
  if (!store.questions[k]) {
    store.questions[k] = [
      {
        id: 1,
        courseId,
        content: '【数据结构】单链表中，已知结点 p，删除其后继结点的时间复杂度是？',
        type: 'SINGLE',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        answer: 'O(1)',
        score: 5,
        nodeIds: [1],
        nodeNames: ['数组与链表'],
        createdAt: '2026-03-12T09:00:00',
      },
      {
        id: 2,
        courseId,
        content: '【数据结构】请简述二叉树的前序遍历过程，并上传练习截图。',
        type: 'FILE',
        score: 10,
        nodeIds: [2],
        nodeNames: ['栈与队列'],
        createdAt: '2026-03-12T09:30:00',
      },
      {
        id: 3,
        courseId,
        content: '【数据结构】下列关于二叉搜索树查找时间复杂度的描述，正确的是？',
        type: 'SINGLE',
        options: ['总是 O(1)', '平均 O(log n)，最坏 O(n)', '总是 O(n²)', '与节点颜色有关'],
        answer: '平均 O(log n)，最坏 O(n)',
        score: 5,
        nodeIds: [5],
        nodeNames: ['二叉搜索树'],
        createdAt: '2026-03-12T10:00:00',
      },
    ];
  }
  if (!store.assignments[k]) {
    store.assignments[k] = [
      {
        id: 1,
        courseId,
        title: '【数据结构】第3周链表巩固作业',
        description: '完成选择题并上传手写链表图示。',
        deadline: '2026-04-01T23:59:00',
        questionCount: 5,
        submitType: 'MIXED',
        status: 'PUBLISHED',
        createdAt: '2026-03-20T08:00:00',
      },
    ];
  }
  if (!store.quizzes[k]) {
    store.quizzes[k] = [
      {
        id: 1,
        courseId,
        name: '线性表基础测验',
        nodeId: 1,
        nodeName: '数组与链表',
        questionIds: [1, 3],
        questionCount: 2,
        deadline: '2026-04-05T23:59:00',
        status: 'PUBLISHED',
        createdAt: '2026-03-18T08:00:00',
      },
    ];
  }
}

function ensureCourse(courseId: number) {
  const k = key(courseId);
  seedDemoCourse(courseId);
  if (!store.members[k]) store.members[k] = [];
  if (!store.resources[k]) store.resources[k] = [];
  if (!store.questions[k]) store.questions[k] = [];
  if (!store.assignments[k]) store.assignments[k] = [];
  if (!store.quizzes[k]) store.quizzes[k] = [];
}

function ownedResources(courseId: number): TeachingResource[] {
  ensureCourse(courseId);
  return (store.resources[key(courseId)] ?? []).filter((r) => r.courseId === courseId);
}

function ownedQuestions(courseId: number): BankQuestion[] {
  ensureCourse(courseId);
  return (store.questions[key(courseId)] ?? []).filter((q) => q.courseId === courseId);
}

function ownedAssignments(courseId: number): Assignment[] {
  ensureCourse(courseId);
  return (store.assignments[key(courseId)] ?? []).filter((a) => a.courseId === courseId);
}

function ownedQuizzes(courseId: number): CourseQuiz[] {
  ensureCourse(courseId);
  return (store.quizzes[key(courseId)] ?? []).filter((q) => q.courseId === courseId);
}

function submissionKey(courseId: number, assignmentId: number): string {
  return `${courseId}:${assignmentId}`;
}

export async function mockImportStudents(courseId: number, _file: File): Promise<ImportResult> {
  const preview = await mockPreviewStudentImport(courseId, _file);
  if (preview.errorCount > 0) {
    return {
      successCount: 0,
      failCount: preview.errorCount,
      failures: preview.rows
        .filter((r) => r.status === 'ERROR')
        .map((r) => ({ row: r.row, reason: (r.messages ?? []).join('; ') })),
    };
  }
  const commit = await mockCommitStudentImport(courseId, preview.importToken);
  return {
    successCount: (commit.created ?? 0) + (commit.joined ?? 0),
    failCount: commit.failedRows?.length ?? 0,
    failures: [],
    credentialExportToken: commit.credentialExportToken,
    message: commit.message,
  };
}

export async function mockPreviewStudentImport(
  courseId: number,
  _file: File,
): Promise<import('../api/types').ImportPreviewResult> {
  await delay(400);
  return {
    importToken: `mock_stu_${courseId}_${Date.now()}`,
    total: 2,
    valid: 2,
    warningCount: 0,
    errorCount: 0,
    rows: [
      { row: 2, studentNo: 'S001', realName: '导入学生A', status: 'VALID', messages: [] },
      { row: 3, studentNo: 'S002', realName: '导入学生B', status: 'VALID', messages: [] },
    ],
  };
}

export async function mockCommitStudentImport(
  courseId: number,
  _importToken: string,
): Promise<import('../api/types').ImportCommitResult> {
  ensureCourse(courseId);
  await delay();
  const k = key(courseId);
  store.members[k].push(
    {
      userId: 9000 + courseId * 100 + store.members[k].length,
      name: `导入学生A-${courseId}`,
      email: `import.a.c${courseId}@demo.com`,
      joinedAt: new Date().toISOString().slice(0, 10),
    },
    {
      userId: 9001 + courseId * 100 + store.members[k].length,
      name: `导入学生B-${courseId}`,
      email: `import.b.c${courseId}@demo.com`,
      joinedAt: new Date().toISOString().slice(0, 10),
    },
  );
  saveStore(store);
  return {
    created: 2,
    joined: 2,
    skipped: 0,
    failedRows: [],
    credentialExportToken: `cred_mock_${courseId}`,
    message: '（Mock）导入完成，可下载账号凭证',
  };
}

export function mockDownloadCredential(_token: string) {
  const blob = new Blob(['studentNo,realName,username,initialPassword\nS001,导入学生A,S001,MockPass1\n'], {
    type: 'text/csv',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '账号凭证-mock.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function mockImportKnowledge(courseId: number, _file: File): Promise<ImportResult> {
  const preview = await mockPreviewKnowledgeImport(courseId, _file);
  const commit = await mockCommitKnowledgeImport(courseId, preview.importToken);
  return {
    successCount: commit.created ?? 1,
    failCount: 0,
    failures: [],
    message: commit.message,
  };
}

export async function mockPreviewKnowledgeImport(
  courseId: number,
  _file: File,
): Promise<import('../api/types').ImportPreviewResult> {
  await delay(400);
  return {
    importToken: `mock_kp_${courseId}_${Date.now()}`,
    total: 2,
    valid: 2,
    warningCount: 0,
    errorCount: 0,
    rows: [
      { row: 2, status: 'VALID', messages: [], raw: '导入·导论' },
      { row: 3, status: 'VALID', messages: [], raw: '导入·基础结构' },
    ],
  };
}

export async function mockCommitKnowledgeImport(
  courseId: number,
  _importToken: string,
): Promise<import('../api/types').ImportCommitResult> {
  await delay();
  try {
    const { mockCreateNode, getMockGraph } = await import('./graphStore');
    const before = getMockGraph(courseId, 'teacher').nodes.length;
    if (before === 0) {
      await mockCreateNode(courseId, { name: '导入·导论', description: '批量导入样例', order: 1 });
      await mockCreateNode(courseId, {
        name: '导入·基础结构',
        description: '批量导入样例',
        order: 2,
        prerequisiteIds: [],
      });
    } else {
      const g = getMockGraph(courseId, 'teacher');
      const last = g.nodes[g.nodes.length - 1];
      await mockCreateNode(courseId, {
        name: `导入知识点·${g.nodes.length + 1}`,
        description: '（Mock）文件导入新增节点',
        order: g.nodes.length + 1,
        prerequisiteIds: last ? [last.id] : [],
      });
    }
  } catch {
    /* ignore */
  }
  return {
    created: 1,
    failedRows: [],
    message: '（Mock）知识点导入成功，请刷新知识图谱',
  };
}

export async function mockFetchResources(courseId: number): Promise<TeachingResource[]> {
  await delay(300);
  return [...ownedResources(courseId)];
}

export async function mockCreateResource(courseId: number, params: CreateResourceParams): Promise<TeachingResource> {
  ensureCourse(courseId);
  await delay();
  const item: TeachingResource = {
    id: ++store.resourceSeq,
    courseId,
    ...params,
    nodeNames: params.nodeIds.map((id) => `知识点#${id}`),
    createdAt: new Date().toISOString(),
  };
  store.resources[key(courseId)].unshift(item);
  saveStore(store);
  return item;
}

export async function mockDeleteResource(courseId: number, resourceId: number): Promise<void> {
  ensureCourse(courseId);
  await delay(200);
  const k = key(courseId);
  store.resources[k] = store.resources[k].filter(
    (r) => !(r.id === resourceId && r.courseId === courseId),
  );
  saveStore(store);
}

export async function mockFetchQuestions(courseId: number): Promise<BankQuestion[]> {
  await delay(300);
  return [...ownedQuestions(courseId)];
}

export async function mockCreateQuestion(courseId: number, params: CreateBankQuestionParams): Promise<BankQuestion> {
  ensureCourse(courseId);
  await delay();
  const item: BankQuestion = {
    id: ++store.questionSeq,
    courseId,
    ...params,
    nodeNames: params.nodeIds.map((id) => `知识点#${id}`),
    createdAt: new Date().toISOString(),
  };
  store.questions[key(courseId)].unshift(item);
  saveStore(store);
  return item;
}

export async function mockImportQuestions(
  courseId: number,
  _file: File,
  opts?: { targetNodeId?: number },
): Promise<ImportResult> {
  const preview = await mockPreviewQuestionImport(courseId, _file, opts);
  const commit = await mockCommitQuestionImport(courseId, preview.importToken);
  return {
    successCount: commit.created ?? 5,
    failCount: 0,
    failures: [],
    message: '（Mock）题库导入完成',
  };
}

let lastQuestionImportTargetNodeId: number | undefined;

export async function mockPreviewQuestionImport(
  courseId: number,
  _file: File,
  opts?: { targetNodeId?: number },
): Promise<import('../api/types').ImportPreviewResult> {
  await delay(400);
  lastQuestionImportTargetNodeId = opts?.targetNodeId;
  return {
    importToken: `mock_q_${courseId}_${Date.now()}`,
    total: 5,
    valid: 5,
    warningCount: 0,
    errorCount: 0,
    rows: [
      { row: 2, status: 'VALID', messages: [] },
      { row: 3, status: 'VALID', messages: [] },
    ],
  };
}

export async function mockCommitQuestionImport(
  courseId: number,
  _importToken: string,
): Promise<import('../api/types').ImportCommitResult> {
  ensureCourse(courseId);
  await delay();
  const k = key(courseId);
  const nodeIds = lastQuestionImportTargetNodeId != null
    ? [lastQuestionImportTargetNodeId]
    : [];
  lastQuestionImportTargetNodeId = undefined;
  const imported: BankQuestion = {
    id: ++store.questionSeq,
    courseId,
    content: `【课程${courseId}】批量导入样例题`,
    type: 'SINGLE',
    options: ['A', 'B', 'C', 'D'],
    answer: 'A',
    score: 5,
    nodeIds,
    nodeNames: [],
    createdAt: new Date().toISOString(),
  };
  store.questions[k].unshift(imported);
  saveStore(store);
  return { created: 5, failedRows: [], message: '（Mock）题库导入完成' };
}

export async function mockBindQuestionToNode(
  courseId: number,
  questionId: number,
  nodeId: number,
): Promise<void> {
  ensureCourse(courseId);
  await delay(200);
  const q = ownedQuestions(courseId).find((item) => item.id === questionId);
  if (!q) throw new Error('题目不存在');
  if (!q.nodeIds.includes(nodeId)) {
    q.nodeIds = [...q.nodeIds, nodeId];
    saveStore(store);
  }
}

export async function mockUnbindQuestionFromNode(
  courseId: number,
  questionId: number,
  nodeId: number,
): Promise<void> {
  ensureCourse(courseId);
  await delay(200);
  const q = ownedQuestions(courseId).find((item) => item.id === questionId);
  if (!q) throw new Error('题目不存在');
  q.nodeIds = q.nodeIds.filter((id) => id !== nodeId);
  saveStore(store);
}

export async function mockFetchAssignments(courseId: number): Promise<Assignment[]> {
  await delay(300);
  return [...ownedAssignments(courseId)];
}

export async function mockCreateAssignment(courseId: number, params: CreateAssignmentParams): Promise<Assignment> {
  ensureCourse(courseId);
  await delay();
  const item: Assignment = {
    id: ++store.assignmentSeq,
    courseId,
    title: params.title,
    description: params.description,
    deadline: params.deadline,
    questionCount: params.questionCount,
    submitType: params.submitType,
    status: params.publish ? 'PUBLISHED' : 'DRAFT',
    createdAt: new Date().toISOString(),
  };
  store.assignments[key(courseId)].unshift(item);
  saveStore(store);
  return item;
}

export async function mockPublishAssignment(courseId: number, assignmentId: number): Promise<Assignment> {
  ensureCourse(courseId);
  await delay();
  const item = ownedAssignments(courseId).find((a) => a.id === assignmentId);
  if (!item) throw new Error('作业不存在');
  item.status = 'PUBLISHED';
  saveStore(store);
  return item;
}

export async function mockFetchQuizzes(courseId: number): Promise<CourseQuiz[]> {
  await delay(300);
  return [...ownedQuizzes(courseId)];
}

export async function mockPublishQuiz(courseId: number, params: PublishQuizParams): Promise<CourseQuiz> {
  ensureCourse(courseId);
  await delay();
  if (!params.questionIds?.length) throw new Error('请至少选择一道题');
  const questions = ownedQuestions(courseId);
  const picked = params.questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean) as BankQuestion[];
  const invalid = picked.find((q) => q.type !== 'SINGLE' && q.type !== 'JUDGE');
  if (invalid) throw new Error('测验仅支持单选 / 判断题，请重新选题');
  const item: CourseQuiz = {
    id: ++store.quizSeq,
    courseId,
    name: params.name.trim(),
    nodeId: params.nodeId,
    nodeName: `知识点#${params.nodeId}`,
    questionIds: params.questionIds,
    questionCount: params.questionIds.length,
    deadline: params.deadline,
    status: params.publish === false ? 'DRAFT' : 'PUBLISHED',
    createdAt: new Date().toISOString(),
  };
  store.quizzes[key(courseId)].unshift(item);
  saveStore(store);
  return item;
}

export async function mockPublishCourseQuiz(courseId: number, quizId: number): Promise<CourseQuiz> {
  ensureCourse(courseId);
  await delay();
  const item = ownedQuizzes(courseId).find((q) => q.id === quizId);
  if (!item) throw new Error('测验不存在');
  item.status = 'PUBLISHED';
  saveStore(store);
  return item;
}

/** 将 CourseQuiz + 题库拼成学生可答的 Quiz（供测验页 Mock） */
export function buildMockQuizDetail(quizId: number): Quiz | null {
  for (const list of Object.values(store.quizzes)) {
    const meta = list.find((q) => q.id === quizId);
    if (!meta) continue;
    ensureCourse(meta.courseId);
    const bank = ownedQuestions(meta.courseId);
    const questions = meta.questionIds
      .map((id) => bank.find((q) => q.id === id))
      .filter((q): q is BankQuestion => !!q && (q.type === 'SINGLE' || q.type === 'JUDGE'))
      .map((q) => ({
        id: q.id,
        content: q.content,
        type: q.type as 'SINGLE' | 'JUDGE',
        options: (q.options ?? (q.type === 'JUDGE' ? ['正确', '错误'] : [])).map((text, i) => ({
          label: String.fromCharCode(65 + i),
          content: text,
        })),
        score: q.score,
      }));
    if (questions.length === 0) {
      // 回退固定种子测验
      return null;
    }
    return {
      id: meta.id,
      name: meta.name,
      courseId: meta.courseId,
      nodeId: meta.nodeId,
      deadline: meta.deadline,
      questions,
    };
  }
  return null;
}

export async function mockFetchStudentAssignments(courseId: number): Promise<StudentAssignmentView[]> {
  await delay(300);
  return ownedAssignments(courseId)
    .filter((a) => a.status === 'PUBLISHED' || a.status === 'CLOSED')
    .map((a) => {
      const sub = store.submissions[submissionKey(courseId, a.id)];
      return {
        ...a,
        courseName: `课程 ${courseId}`,
        submitted: Boolean(sub),
        submittedAt: sub?.submittedAt,
        score: sub?.score ?? null,
      };
    });
}

export async function mockFetchAssignmentSubmissions(
  courseId: number,
  assignmentId: number,
): Promise<import('../api/types').TeacherSubmissionItem[]> {
  ensureCourse(courseId);
  await delay(300);
  const members = store.members[key(courseId)] ?? [];
  const fallbackMembers: CourseMember[] = members.length
    ? members
    : [
        { userId: 101, name: '张三', joinedAt: new Date().toISOString() },
        { userId: 102, name: '李四', joinedAt: new Date().toISOString() },
        { userId: 103, name: '王五', joinedAt: new Date().toISOString() },
      ];
  const sub = store.submissions[submissionKey(courseId, assignmentId)];
  return fallbackMembers.map((m, index) => {
    const submitted = Boolean(sub) && index === 0;
    return {
      submissionId: submitted ? assignmentId * 10 + m.userId : null,
      studentId: m.userId,
      studentName: m.name,
      content: submitted ? (sub?.textAnswer ?? null) : null,
      status: submitted ? 'submitted' : 'not_submitted',
      score: submitted ? (sub?.score ?? null) : null,
      feedback: null,
      submittedAt: submitted ? (sub?.submittedAt ?? null) : null,
      gradedAt: null,
      files: submitted && sub?.fileName
        ? [{ fileId: 1, fileName: sub.fileName, fileUrl: '#', fileSize: 0 }]
        : [],
    };
  });
}

export async function mockSubmitAssignment(
  courseId: number,
  assignmentId: number,
  params: SubmitAssignmentParams,
): Promise<StudentAssignmentView> {
  ensureCourse(courseId);
  await delay();
  const assignment = ownedAssignments(courseId).find((a) => a.id === assignmentId);
  if (!assignment) throw new Error('作业不存在');
  if (assignment.status === 'DRAFT') throw new Error('作业尚未发布');
  if (assignment.submitType === 'ONLINE' || assignment.submitType === 'MIXED') {
    if (!params.textAnswer?.trim()) throw new Error('请填写在线作答内容');
  }
  if (assignment.submitType === 'FILE' || assignment.submitType === 'MIXED') {
    if (!params.fileName?.trim() && !(params.files && params.files.length > 0)) {
      throw new Error('请选择要提交的文件');
    }
  }
  const submission: AssignmentSubmission = {
    assignmentId,
    courseId,
    textAnswer: params.textAnswer?.trim(),
    fileName: params.fileName?.trim() || params.files?.[0]?.name,
    submittedAt: new Date().toISOString(),
    score: null,
  };
  store.submissions[submissionKey(courseId, assignmentId)] = submission;
  saveStore(store);
  return {
    ...assignment,
    submitted: true,
    submittedAt: submission.submittedAt,
    score: null,
  };
}
