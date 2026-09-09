/**
 * 可写知识图谱 Mock — 按 courseId 隔离，支持节点 CRUD / 前置边维护
 */
import type { GraphData, GraphEdge, GraphNode, ViewRole } from '../api/graph';

const STORAGE_KEY = 'edumind_graph_mock_v1';

type GraphStore = Record<string, { nodes: GraphNode[]; edges: GraphEdge[]; seq: number }>;

function cloneTemplate(role: ViewRole): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // 延迟导入模板，避免循环依赖写法；此处内联最小模板副本由 ensure 时从静态快照初始化
  return role === 'teacher' ? teacherSnapshot() : studentSnapshot();
}

function studentSnapshot(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 1, name: '数组与链表', description: '线性表的顺序与链式存储结构，插入删除操作的时间复杂度分析', order: 1, x: 100, y: 50, masteryScore: 95, masteryLevel: 'GREEN', isRecommended: false, isWeakTop: false },
      { id: 2, name: '栈与队列', description: '先进后出与先进先出的受限线性表', order: 2, x: 100, y: 160, masteryScore: 88, masteryLevel: 'GREEN', isRecommended: false, isWeakTop: false },
      { id: 3, name: '递归', description: '函数自调用与分治思想', order: 3, x: 320, y: 100, masteryScore: 70, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 4, name: '二叉树基础', description: '二叉树的定义与遍历方式', order: 4, x: 320, y: 270, masteryScore: 65, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 5, name: '二叉搜索树', description: '左小右大的有序二叉树', order: 5, x: 520, y: 240, masteryScore: 48, masteryLevel: 'RED', isRecommended: true, isWeakTop: false },
      { id: 6, name: '平衡二叉树', description: 'AVL 树与红黑树', order: 6, x: 700, y: 240, masteryScore: 0, masteryLevel: 'GRAY', isRecommended: false, isWeakTop: false },
      { id: 7, name: '堆与优先队列', description: '完全二叉树的堆序性质', order: 7, x: 520, y: 360, masteryScore: 40, masteryLevel: 'RED', isRecommended: false, isWeakTop: false },
      { id: 8, name: '哈希表', description: '键值映射与散列函数', order: 8, x: 520, y: 50, masteryScore: 75, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
    ],
    edges: [
      { from: 1, to: 2, type: 'PREREQUISITE' },
      { from: 1, to: 8, type: 'PREREQUISITE' },
      { from: 1, to: 4, type: 'PREREQUISITE' },
      { from: 2, to: 3, type: 'PREREQUISITE' },
      { from: 4, to: 5, type: 'PREREQUISITE' },
      { from: 5, to: 6, type: 'PREREQUISITE' },
      { from: 4, to: 7, type: 'PREREQUISITE' },
    ],
  };
}

function teacherSnapshot(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const base = studentSnapshot();
  return {
    nodes: base.nodes.map((n) => {
      if (n.id === 5 || n.id === 7) return { ...n, isWeakTop: true, isRecommended: false, masteryScore: n.id === 5 ? 42 : 35, masteryLevel: 'RED' };
      return { ...n, isRecommended: false };
    }),
    edges: base.edges,
  };
}

function loadStore(): GraphStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as GraphStore;
  } catch {
    return {};
  }
}

function saveStore(store: GraphStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let store = loadStore();

function ensureCourse(courseId: number) {
  const k = String(courseId);
  if (store[k]) return store[k];
  // 仅演示课 1 用完整模板；其它课从空图开始
  if (courseId === 1) {
    const snap = teacherSnapshot();
    store[k] = {
      nodes: snap.nodes.map((n) => ({ ...n })),
      edges: snap.edges.map((e) => ({ ...e })),
      seq: Math.max(...snap.nodes.map((n) => n.id), 0) + 1,
    };
  } else {
    store[k] = { nodes: [], edges: [], seq: 1 };
  }
  saveStore(store);
  return store[k];
}

function toGraphData(courseId: number, role: ViewRole): GraphData {
  const bucket = ensureCourse(courseId);
  const nodes = bucket.nodes.map((n) => ({ ...n }));
  // 学生视图略调推荐标记示意
  if (role === 'student') {
    nodes.forEach((n) => {
      n.isWeakTop = false;
      if (n.masteryLevel === 'RED' && n.masteryScore > 0) n.isRecommended = n.id === (nodes.find((x) => x.masteryLevel === 'RED')?.id);
    });
  }
  return {
    courseId,
    nodes,
    edges: bucket.edges.map((e) => ({ ...e })),
    meta: {
      viewType: role === 'teacher' ? 'TEACHER' : 'STUDENT',
      recommendedNodeId: nodes.find((n) => n.isRecommended)?.id ?? null,
      weakNodeIds: nodes.filter((n) => n.isWeakTop).map((n) => n.id),
    },
  };
}

export function getMockGraph(courseId: number, role: ViewRole): GraphData {
  return toGraphData(courseId, role);
}

export interface UpsertNodeParams {
  name: string;
  description?: string;
  order?: number;
  prerequisiteIds?: number[];
}

export async function mockCreateNode(courseId: number, params: UpsertNodeParams): Promise<GraphNode> {
  const bucket = ensureCourse(courseId);
  const id = bucket.seq++;
  const order = params.order ?? (bucket.nodes.length + 1);
  const node: GraphNode = {
    id,
    name: params.name.trim(),
    description: params.description?.trim() ?? '',
    order,
    x: 120 + (bucket.nodes.length % 5) * 140,
    y: 80 + Math.floor(bucket.nodes.length / 5) * 120,
    masteryScore: 0,
    masteryLevel: 'GRAY',
    isRecommended: false,
    isWeakTop: false,
  };
  bucket.nodes.push(node);
  setPrerequisites(bucket, id, params.prerequisiteIds ?? []);
  saveStore(store);
  return { ...node };
}

export async function mockUpdateNode(
  courseId: number,
  nodeId: number,
  params: UpsertNodeParams,
): Promise<GraphNode> {
  const bucket = ensureCourse(courseId);
  const node = bucket.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error('知识点不存在');
  node.name = params.name.trim();
  node.description = params.description?.trim() ?? '';
  if (params.order != null) node.order = params.order;
  if (params.prerequisiteIds) setPrerequisites(bucket, nodeId, params.prerequisiteIds);
  saveStore(store);
  return { ...node };
}

export async function mockDeleteNode(courseId: number, nodeId: number): Promise<void> {
  const bucket = ensureCourse(courseId);
  bucket.nodes = bucket.nodes.filter((n) => n.id !== nodeId);
  bucket.edges = bucket.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
  saveStore(store);
}

function setPrerequisites(
  bucket: { edges: GraphEdge[] },
  nodeId: number,
  prerequisiteIds: number[],
) {
  bucket.edges = bucket.edges.filter((e) => !(e.to === nodeId && e.type === 'PREREQUISITE'));
  for (const from of prerequisiteIds) {
    if (from === nodeId) continue;
    bucket.edges.push({ from, to: nodeId, type: 'PREREQUISITE' });
  }
}

export function getPrerequisiteIds(courseId: number, nodeId: number): number[] {
  const bucket = ensureCourse(courseId);
  return bucket.edges.filter((e) => e.to === nodeId && e.type === 'PREREQUISITE').map((e) => e.from);
}

// 兼容旧 mock/graph 导出名
export { cloneTemplate };
