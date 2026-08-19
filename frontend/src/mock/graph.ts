import type { GraphData, ViewRole } from '../api/graph';

/**
 * 模拟知识图谱数据 — "数据结构与算法"课程
 * 后端 API 就绪后删除此文件，直接调 fetchGraph 即可
 */

/** 学生视图：当前学生各知识点掌握度 */
function studentGraph(): GraphData {
  return {
    courseId: 1,
    nodes: [
      { id: 1,  name: '数组与链表',   description: '线性表的顺序与链式存储结构，插入删除操作的时间复杂度分析',           order: 1,  x: 100, y: 50,  masteryScore: 95, masteryLevel: 'GREEN',  isRecommended: false, isWeakTop: false },
      { id: 2,  name: '栈与队列',     description: '先进后出与先进先出的受限线性表，表达式求值与括号匹配应用',           order: 2,  x: 100, y: 160, masteryScore: 88, masteryLevel: 'GREEN',  isRecommended: false, isWeakTop: false },
      { id: 3,  name: '递归',          description: '函数自调用与分治思想，汉诺塔与阶乘问题求解',                        order: 3,  x: 320, y: 100, masteryScore: 70, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 4,  name: '二叉树基础',    description: '二叉树的定义、遍历方式（前中后序）与链式存储结构',                  order: 4,  x: 320, y: 270, masteryScore: 65, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 5,  name: '二叉搜索树',    description: '左小右大的有序二叉树，查找插入删除的平均 O(log n) 性能',           order: 5,  x: 520, y: 240, masteryScore: 48, masteryLevel: 'RED',    isRecommended: true,  isWeakTop: false },
      { id: 6,  name: '平衡二叉树',    description: 'AVL 树与红黑树的旋转调整，保持树高 O(log n) 的平衡策略',             order: 6,  x: 700, y: 240, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 7,  name: '堆与优先队列',  description: '完全二叉树的堆序性质，堆排序与 Top-K 问题的堆解法',                  order: 7,  x: 520, y: 360, masteryScore: 40, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 8,  name: '哈希表',        description: '键值映射与散列函数设计，链地址法与开放地址法解决冲突',              order: 8,  x: 520, y: 50,  masteryScore: 75, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 9,  name: '图的表示',      description: '邻接矩阵与邻接表的存储方式，有向图与无向图的结构差异',              order: 9,  x: 100, y: 450, masteryScore: 30, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 10, name: '图的遍历',      description: '深度优先搜索 DFS 与广度优先搜索 BFS 的递归/迭代实现',               order: 10, x: 320, y: 450, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 11, name: '最短路径',      description: 'Dijkstra 算法与 Floyd-Warshall 算法求解单源/多源最短路径',           order: 11, x: 520, y: 460, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 12, name: '最小生成树',    description: 'Prim 与 Kruskal 算法构建连通图的最小代价生成树',                     order: 12, x: 700, y: 460, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 13, name: '冒泡排序',      description: '相邻元素两两比较交换的简单排序，时间复杂度 O(n²)',                   order: 13, x: 720, y: 360, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 14, name: '快速排序',      description: '分治选取基准元素划分数组，平均 O(n log n) 的高效排序算法',           order: 14, x: 840, y: 290, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 15, name: '归并排序',      description: '分治递归拆分再合并有序子数组，稳定排序 O(n log n)',                  order: 15, x: 840, y: 420, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 16, name: '动态规划基础',  description: '最优子结构与重叠子问题，记忆化搜索与状态转移方程推导',               order: 16, x: 700, y: 100, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 17, name: '贪心算法',      description: '局部最优推导全局最优，活动选择与零钱兑换问题',                        order: 17, x: 840, y: 140, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
      { id: 18, name: '字符串匹配',    description: 'KMP 算法利用部分匹配表避免回溯，实现 O(n+m) 高效匹配',                order: 18, x: 840, y: 260, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
    ],
    edges: [
      { from: 1,  to: 2,  type: 'PREREQUISITE' },
      { from: 1,  to: 8,  type: 'PREREQUISITE' },
      { from: 1,  to: 4,  type: 'PREREQUISITE' },
      { from: 1,  to: 9,  type: 'PREREQUISITE' },
      { from: 1,  to: 13, type: 'PREREQUISITE' },
      { from: 2,  to: 3,  type: 'PREREQUISITE' },
      { from: 4,  to: 5,  type: 'PREREQUISITE' },
      { from: 5,  to: 6,  type: 'PREREQUISITE' },
      { from: 4,  to: 7,  type: 'PREREQUISITE' },
      { from: 9,  to: 10, type: 'PREREQUISITE' },
      { from: 10, to: 11, type: 'PREREQUISITE' },
      { from: 11, to: 12, type: 'PREREQUISITE' },
      { from: 13, to: 14, type: 'PREREQUISITE' },
      { from: 13, to: 15, type: 'PREREQUISITE' },
      { from: 3,  to: 16, type: 'PREREQUISITE' },
      { from: 3,  to: 17, type: 'PREREQUISITE' },
      { from: 16, to: 18, type: 'PREREQUISITE' },
    ],
    meta: {
      viewType: 'STUDENT',
      recommendedNodeId: 5,
      weakNodeIds: [],
    },
  };
}

/** 教师视图：班级整体掌握度 + 薄弱点标记 */
function teacherGraph(): GraphData {
  return {
    courseId: 1,
    nodes: [
      { id: 1,  name: '数组与链表',   description: '线性表的顺序与链式存储结构',                        order: 1,  x: 100, y: 50,  masteryScore: 85, masteryLevel: 'GREEN',  isRecommended: false, isWeakTop: false },
      { id: 2,  name: '栈与队列',     description: '先进后出与先进先出的受限线性表',                    order: 2,  x: 100, y: 160, masteryScore: 78, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 3,  name: '递归',          description: '函数自调用与分治思想',                             order: 3,  x: 320, y: 100, masteryScore: 62, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 4,  name: '二叉树基础',    description: '二叉树的定义与遍历方式',                           order: 4,  x: 320, y: 270, masteryScore: 55, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 5,  name: '二叉搜索树',    description: '左小右大的有序二叉树',                             order: 5,  x: 520, y: 240, masteryScore: 42, masteryLevel: 'RED',    isRecommended: false, isWeakTop: true },
      { id: 6,  name: '平衡二叉树',    description: 'AVL 树与红黑树的旋转调整',                         order: 6,  x: 700, y: 240, masteryScore: 28, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 7,  name: '堆与优先队列',  description: '完全二叉树的堆序性质',                             order: 7,  x: 520, y: 360, masteryScore: 35, masteryLevel: 'RED',    isRecommended: false, isWeakTop: true },
      { id: 8,  name: '哈希表',        description: '键值映射与散列函数设计',                           order: 8,  x: 520, y: 50,  masteryScore: 68, masteryLevel: 'YELLOW', isRecommended: false, isWeakTop: false },
      { id: 9,  name: '图的表示',      description: '邻接矩阵与邻接表的存储方式',                       order: 9,  x: 100, y: 450, masteryScore: 25, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 10, name: '图的遍历',      description: 'DFS 与 BFS 的实现',                                order: 10, x: 320, y: 450, masteryScore: 18, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 11, name: '最短路径',      description: 'Dijkstra 与 Floyd-Warshall 算法',                   order: 11, x: 520, y: 460, masteryScore: 12, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 12, name: '最小生成树',    description: 'Prim 与 Kruskal 算法',                              order: 12, x: 700, y: 460, masteryScore: 8,  masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 13, name: '冒泡排序',      description: '相邻元素两两比较交换',                             order: 13, x: 720, y: 360, masteryScore: 10, masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 14, name: '快速排序',      description: '分治选取基准元素划分数组',                         order: 14, x: 840, y: 290, masteryScore: 5,  masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 15, name: '归并排序',      description: '分治递归拆分再合并有序子数组',                     order: 15, x: 840, y: 420, masteryScore: 5,  masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 16, name: '动态规划基础',  description: '最优子结构与重叠子问题',                           order: 16, x: 700, y: 100, masteryScore: 3,  masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 17, name: '贪心算法',      description: '局部最优推导全局最优',                             order: 17, x: 840, y: 140, masteryScore: 2,  masteryLevel: 'RED',    isRecommended: false, isWeakTop: false },
      { id: 18, name: '字符串匹配',    description: 'KMP 算法部分匹配表',                                order: 18, x: 840, y: 260, masteryScore: 0,  masteryLevel: 'GRAY',   isRecommended: false, isWeakTop: false },
    ],
    edges: [
      { from: 1,  to: 2,  type: 'PREREQUISITE' },
      { from: 1,  to: 8,  type: 'PREREQUISITE' },
      { from: 1,  to: 4,  type: 'PREREQUISITE' },
      { from: 1,  to: 9,  type: 'PREREQUISITE' },
      { from: 1,  to: 13, type: 'PREREQUISITE' },
      { from: 2,  to: 3,  type: 'PREREQUISITE' },
      { from: 4,  to: 5,  type: 'PREREQUISITE' },
      { from: 5,  to: 6,  type: 'PREREQUISITE' },
      { from: 4,  to: 7,  type: 'PREREQUISITE' },
      { from: 9,  to: 10, type: 'PREREQUISITE' },
      { from: 10, to: 11, type: 'PREREQUISITE' },
      { from: 11, to: 12, type: 'PREREQUISITE' },
      { from: 13, to: 14, type: 'PREREQUISITE' },
      { from: 13, to: 15, type: 'PREREQUISITE' },
      { from: 3,  to: 16, type: 'PREREQUISITE' },
      { from: 3,  to: 17, type: 'PREREQUISITE' },
      { from: 16, to: 18, type: 'PREREQUISITE' },
    ],
    meta: {
      viewType: 'TEACHER',
      recommendedNodeId: null,
      weakNodeIds: [5, 7],
    },
  };
}

export function getMockGraph(_courseId: number, role: ViewRole): GraphData {
  return role === 'teacher' ? teacherGraph() : studentGraph();
}
