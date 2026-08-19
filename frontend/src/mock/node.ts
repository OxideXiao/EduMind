/**
 * Mock Node Learning — 对齐 api-spec §5 + demo-seed-spec §3.1
 * 覆盖全部 18 个知识点，每个节点都有学习资源 + 关联测验
 */

import type { NodeLearningData } from '../api/types';

function delay() {
  return new Promise<void>((r) => setTimeout(r, 200 + Math.random() * 200));
}

/** 全部 18 个知识节点的学习资料 */
const MOCK_LEARNING: Record<number, NodeLearningData> = {
  // ── 1. 数组与链表 ──
  1: {
    node: {
      id: 1,
      name: '数组与链表',
      description:
        '数组是一块连续的内存空间，支持 O(1) 的随机访问，但插入删除需要 O(n) 的元素移动。链表由节点和指针组成，插入删除只需 O(1) 改指针，但查找需要 O(n) 遍历。理解两者的内存模型和操作复杂度，是后续所有数据结构的基础。',
    },
    resources: [
      { id: 101, name: '数组与链表入门 PPT', type: 'PDF', url: '/files/array-list.pdf' },
      { id: 102, name: '链表操作动画演示', type: 'VIDEO', url: 'https://example.com/linkedlist-animation' },
      { id: 103, name: 'LeetCode 数组/链表专题', type: 'LINK', url: 'https://leetcode.cn/tag/array/' },
    ],
    quizzes: [{ quizId: 1, name: '线性表基础测验', deadline: '2026-06-20T23:59:59' }],
  },

  // ── 2. 栈与队列 ──
  2: {
    node: {
      id: 2,
      name: '栈与队列',
      description:
        '栈是后进先出（LIFO）的线性结构，push/pop 都在栈顶操作。队列是先进先出（FIFO）结构，enqueue 在队尾、dequeue 在队头。栈常用于函数调用、括号匹配、表达式求值；队列用于 BFS、任务调度、消息缓冲。',
    },
    resources: [
      { id: 201, name: '栈与队列详解 PDF', type: 'PDF', url: '/files/stack-queue.pdf' },
      { id: 202, name: '表达式求值实战视频', type: 'VIDEO', url: 'https://example.com/expr-eval' },
      { id: 203, name: '栈实现括号匹配题解', type: 'LINK', url: 'https://leetcode.cn/problems/valid-parentheses/' },
    ],
    quizzes: [{ quizId: 1, name: '线性表基础测验', deadline: '2026-06-20T23:59:59' }],
  },

  // ── 3. 递归 ──
  3: {
    node: {
      id: 3,
      name: '递归',
      description:
        '递归是函数直接或间接调用自身的过程。核心三要素：递归终止条件（base case）、递归关系式、状态传递。经典案例包括斐波那契数列、汉诺塔、全排列生成。递归代码简洁但需警惕栈溢出和重复计算——记忆化搜索是其重要的优化手段。',
    },
    resources: [
      { id: 301, name: '递归思想讲解 PPT', type: 'PDF', url: '/files/recursion-basics.pdf' },
      { id: 302, name: '汉诺塔递归推演动画', type: 'VIDEO', url: 'https://example.com/hanoi-video' },
      { id: 303, name: '递归题单练习', type: 'LINK', url: 'https://leetcode.cn/tag/recursion/' },
    ],
    quizzes: [{ quizId: 2, name: '树与遍历测验', deadline: '2026-06-25T23:59:59' }],
  },

  // ── 4. 二叉树基础 ──
  4: {
    node: {
      id: 4,
      name: '二叉树基础',
      description:
        '二叉树是每个节点最多有两个子节点的树形结构。重要概念包括：根节点、叶节点、父节点、子节点、深度、高度。二叉树的遍历方式分为深度优先（前序、中序、后序）和广度优先（层序）。理解二叉树是掌握更复杂的树结构（BST、AVL、堆）的前提。',
    },
    resources: [
      { id: 401, name: '二叉树基础概念 PPT', type: 'PDF', url: '/files/binary-tree.pdf' },
      { id: 402, name: '二叉树遍历动画演示', type: 'VIDEO', url: 'https://example.com/bt-traversal' },
      { id: 403, name: '二叉树遍历 LeetCode 题集', type: 'LINK', url: 'https://leetcode.cn/tag/binary-tree/' },
    ],
    quizzes: [{ quizId: 2, name: '树与遍历测验', deadline: '2026-06-25T23:59:59' }],
  },

  // ── 5. 二叉搜索树 ──
  5: {
    node: {
      id: 5,
      name: '二叉搜索树',
      description:
        'BST（Binary Search Tree）是一棵有序二叉树：对任意节点，左子树所有值 ≤ 该节点值 ≤ 右子树所有值。查找、插入、删除的平均时间复杂度为 O(log n)，但在退化（链式）情况下退化为 O(n)。掌握 BST 的增删查操作是理解后续平衡树的关键。',
    },
    resources: [
      { id: 501, name: 'BST 操作详解 PDF', type: 'PDF', url: '/files/bst-ops.pdf' },
      { id: 502, name: 'BST 插入删除动画', type: 'VIDEO', url: 'https://example.com/bst-video' },
      { id: 503, name: '验证二叉搜索树题解', type: 'LINK', url: 'https://leetcode.cn/problems/validate-binary-search-tree/' },
    ],
    quizzes: [{ quizId: 2, name: '树与遍历测验', deadline: '2026-06-25T23:59:59' }],
  },

  // ── 6. 平衡二叉树 ──
  6: {
    node: {
      id: 6,
      name: '平衡二叉树',
      description:
        '平衡二叉树是为了解决 BST 退化问题而设计的数据结构。AVL 树通过旋转操作（LL、RR、LR、RL）保持任意节点左右子树高度差 ≤ 1。红黑树则通过颜色约束和旋转来维持近似平衡，插入删除最多旋转 3 次。实际工程中（如 Java TreeMap、C++ std::map）广泛使用红黑树。',
    },
    resources: [
      { id: 601, name: 'AVL 树旋转详解 PPT', type: 'PDF', url: '/files/avl-tree.pdf' },
      { id: 602, name: '红黑树可视化演示', type: 'VIDEO', url: 'https://example.com/rbtree' },
      { id: 603, name: 'Red-Black Tree 可视化网站', type: 'LINK', url: 'https://www.cs.usfca.edu/~galles/visualization/RedBlack.html' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 7. 堆与优先队列 ──
  7: {
    node: {
      id: 7,
      name: '堆与优先队列',
      description:
        '堆是一棵满足堆序性质的完全二叉树：大顶堆的父节点 ≥ 子节点，小顶堆反之。堆的插入和删除操作（上滤和下滤）均为 O(log n)。优先队列以堆为底层实现，广泛应用于 Dijkstra 最短路径、Top-K 问题、堆排序、事件驱动模拟等场景。',
    },
    resources: [
      { id: 701, name: '堆的实现与应用 PDF', type: 'PDF', url: '/files/heap.pdf' },
      { id: 702, name: '堆排序动画演示', type: 'VIDEO', url: 'https://example.com/heap-sort' },
      { id: 703, name: 'Top-K 问题 LeetCode 题集', type: 'LINK', url: 'https://leetcode.cn/problems/kth-largest-element-in-an-array/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 8. 哈希表 ──
  8: {
    node: {
      id: 8,
      name: '哈希表',
      description:
        '哈希表通过散列函数将键映射到数组索引，实现 O(1) 平均查找。解决哈希冲突的两种主要方法：链地址法（每个桶用链表存储）和开放地址法（线性探测、二次探测）。哈希表是工程中最常用的数据结构之一，Python dict、Java HashMap、数据库索引都基于哈希思想。',
    },
    resources: [
      { id: 801, name: '哈希表原理与冲突解决 PPT', type: 'PDF', url: '/files/hash-table.pdf' },
      { id: 802, name: '哈希函数设计视频讲解', type: 'VIDEO', url: 'https://example.com/hash-video' },
      { id: 803, name: '两数之和 LeetCode 题解', type: 'LINK', url: 'https://leetcode.cn/problems/two-sum/' },
    ],
    quizzes: [{ quizId: 1, name: '线性表基础测验', deadline: '2026-06-20T23:59:59' }],
  },

  // ── 9. 图的表示 ──
  9: {
    node: {
      id: 9,
      name: '图的表示',
      description:
        '图由顶点（Vertex）和边（Edge）组成。两种主要的存储方式：邻接矩阵（用二维数组，O(V²) 空间，适合稠密图）和邻接表（用链表/动态数组，O(V+E) 空间，适合稀疏图）。有向图和无向图在邻接矩阵和邻接表的表示上有细微差异。选择合适的表示方式是图算法的基础。',
    },
    resources: [
      { id: 901, name: '图的存储结构 PPT', type: 'PDF', url: '/files/graph-representation.pdf' },
      { id: 902, name: '邻接表实现代码讲解', type: 'VIDEO', url: 'https://example.com/adj-list' },
      { id: 903, name: '图论入门题集', type: 'LINK', url: 'https://leetcode.cn/tag/graph/' },
    ],
    quizzes: [],
  },

  // ── 10. 图的遍历 ──
  10: {
    node: {
      id: 10,
      name: '图的遍历',
      description:
        '图的遍历是访问图中所有顶点的方法，主要有两种：深度优先搜索（DFS）沿路径深入直至无法继续，适合拓扑排序、连通分量、桥检测；广度优先搜索（BFS）逐层扩展，适合最短路径、社交网络层级。两者时间复杂度均为 O(V+E)，区别在于辅助数据结构——DFS 用栈（递归），BFS 用队列。',
    },
    resources: [
      { id: 1001, name: 'DFS 与 BFS 详解 PPT', type: 'PDF', url: '/files/graph-traversal.pdf' },
      { id: 1002, name: '图遍历算法动画', type: 'VIDEO', url: 'https://example.com/graph-traversal-video' },
      { id: 1003, name: '岛屿数量 LeetCode 题解', type: 'LINK', url: 'https://leetcode.cn/problems/number-of-islands/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 11. 最短路径 ──
  11: {
    node: {
      id: 11,
      name: '最短路径',
      description:
        '最短路径问题是图论中最经典的优化问题之一。Dijkstra 算法通过贪心策略求解单源最短路径（适用于非负权图），时间复杂度 O(V²) 或使用堆优化到 O((V+E)log V)。Floyd-Warshall 算法使用动态规划求解所有节点对之间的最短路径，时间复杂度 O(V³)。Bellman-Ford 可处理负权边。',
    },
    resources: [
      { id: 1101, name: '最短路径算法导论 PPT', type: 'PDF', url: '/files/shortest-path.pdf' },
      { id: 1102, name: 'Dijkstra 算法可视化', type: 'VIDEO', url: 'https://example.com/dijkstra' },
      { id: 1103, name: '网络延迟时间 LeetCode 题解', type: 'LINK', url: 'https://leetcode.cn/problems/network-delay-time/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 12. 最小生成树 ──
  12: {
    node: {
      id: 12,
      name: '最小生成树',
      description:
        'MST 是连接图中所有顶点的最小代价生成树。Prim 算法从一个顶点开始不断扩展最小权边，适合稠密图（邻接矩阵实现 O(V²)）。Kruskal 算法按边权排序，用并查集判环，适合稀疏图（O(E log E)）。典型应用包括：通信网络布线、电路设计、聚类分析中的层次聚类。',
    },
    resources: [
      { id: 1201, name: 'Prim 与 Kruskal 算法 PPT', type: 'PDF', url: '/files/mst.pdf' },
      { id: 1202, name: 'MST 算法动画演示', type: 'VIDEO', url: 'https://example.com/mst-video' },
      { id: 1203, name: 'Kruskal 实现与并查集详解', type: 'LINK', url: 'https://leetcode.cn/problems/min-cost-to-connect-all-points/' },
    ],
    quizzes: [],
  },

  // ── 13. 冒泡排序 ──
  13: {
    node: {
      id: 13,
      name: '冒泡排序',
      description:
        '冒泡排序是最直观的排序算法：重复遍历数组，比较相邻元素并交换错序对，每轮将最大（或最小）元素"冒泡"到末端。时间复杂度 O(n²)，空间复杂度 O(1)，是稳定的原地排序算法。虽然效率低，但它是理解排序思想（比较、交换、优化标记）的最佳入门。优化版可通过标志位提前终止。',
    },
    resources: [
      { id: 1301, name: '排序算法入门 PPT', type: 'PDF', url: '/files/sort-basics.pdf' },
      { id: 1302, name: '冒泡排序逐步动画', type: 'VIDEO', url: 'https://example.com/bubble-sort' },
      { id: 1303, name: '排序可视化工具', type: 'LINK', url: 'https://visualgo.net/zh/sorting' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 14. 快速排序 ──
  14: {
    node: {
      id: 14,
      name: '快速排序',
      description:
        '快速排序是分治思想的经典应用：选取基准元素（pivot），将数组划分为小于和大于基准的两部分，然后递归排序子数组。平均时间复杂度 O(n log n)，最坏 O(n²)（可通过随机 pivot 避免）。它是实际工程中最常用的排序算法，C 语言 qsort、Java Arrays.sort 均采用其变体。',
    },
    resources: [
      { id: 1401, name: '快速排序详解 PDF', type: 'PDF', url: '/files/quicksort.pdf' },
      { id: 1402, name: '快排分区过程动画', type: 'VIDEO', url: 'https://example.com/quicksort-video' },
      { id: 1403, name: '颜色分类 LeetCode 题解', type: 'LINK', url: 'https://leetcode.cn/problems/sort-colors/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 15. 归并排序 ──
  15: {
    node: {
      id: 15,
      name: '归并排序',
      description:
        '归并排序采用分治策略：将数组递归地分成两半直至每段只有一个元素，然后自底向上合并两个有序子数组。时间复杂度恒为 O(n log n)，是稳定的排序算法，但需要 O(n) 额外空间。归并排序在外排序（处理海量数据无法全部加载到内存时）中有着不可替代的作用。',
    },
    resources: [
      { id: 1501, name: '归并排序原理 PPT', type: 'PDF', url: '/files/mergesort.pdf' },
      { id: 1502, name: '归并排序合并过程讲解', type: 'VIDEO', url: 'https://example.com/mergesort-video' },
      { id: 1503, name: '合并两个有序数组题解', type: 'LINK', url: 'https://leetcode.cn/problems/merge-sorted-array/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 16. 动态规划基础 ──
  16: {
    node: {
      id: 16,
      name: '动态规划基础',
      description:
        '动态规划（DP）是将复杂问题分解为重叠子问题，自底向上递推求解的最优化方法。核心四步：① 定义状态（dp 数组含义）② 推导状态转移方程 ③ 初始化边界条件 ④ 确定遍历顺序。经典问题包括背包问题、最长公共子序列、最长递增子序列、编辑距离、矩阵连乘。DP 是算法面试最重要的考察点之一。',
    },
    resources: [
      { id: 1601, name: 'DP 入门：从递归到递推 PPT', type: 'PDF', url: '/files/dp-intro.pdf' },
      { id: 1602, name: '动态规划专题精讲视频', type: 'VIDEO', url: 'https://example.com/dp-video' },
      { id: 1603, name: '爬楼梯 LeetCode 入门题', type: 'LINK', url: 'https://leetcode.cn/problems/climbing-stairs/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 17. 贪心算法 ──
  17: {
    node: {
      id: 17,
      name: '贪心算法',
      description:
        '贪心算法在每个步骤都做出当前看起来最优的选择，希望最终得到全局最优解。贪心是否成立取决于问题是否具有贪心选择性质和最优子结构。经典案例：活动选择问题、霍夫曼编码、最小生成树（Prim/Kruskal 本质也是贪心）、零钱兑换（特定面额下）。并非所有问题都适合贪心——需严格证明正确性。',
    },
    resources: [
      { id: 1701, name: '贪心算法策略详解 PPT', type: 'PDF', url: '/files/greedy.pdf' },
      { id: 1702, name: '贪心算法实例讲解视频', type: 'VIDEO', url: 'https://example.com/greedy-video' },
      { id: 1703, name: '跳跃游戏 LeetCode 题解', type: 'LINK', url: 'https://leetcode.cn/problems/jump-game/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },

  // ── 18. 字符串匹配 ──
  18: {
    node: {
      id: 18,
      name: '字符串匹配',
      description:
        '字符串匹配查找模式串在文本串中出现的位置。朴素算法逐位比较，最坏 O(nm)。KMP（Knuth-Morris-Pratt）算法利用部分匹配表（next 数组）避免回溯主串指针，实现 O(n+m) 的线性匹配。Rabin-Karp 使用哈希加速，Boyer-Moore 从右向左匹配在实践中非常高效。KMP 是理解"预处理模式串信息以加速匹配"思想的典范。',
    },
    resources: [
      { id: 1801, name: 'KMP 算法详解 PDF', type: 'PDF', url: '/files/kmp.pdf' },
      { id: 1802, name: 'KMP 部分匹配表推导视频', type: 'VIDEO', url: 'https://example.com/kmp-video' },
      { id: 1803, name: '实现 strStr() LeetCode 题', type: 'LINK', url: 'https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/' },
    ],
    quizzes: [{ quizId: 3, name: '算法设计测验', deadline: '2026-06-28T23:59:59' }],
  },
};

/** GET /api/courses/{courseId}/nodes/{nodeId}/learning */
export async function fetchNodeLearning(
  courseId: number,
  nodeId: number,
): Promise<NodeLearningData | null> {
  await delay();
  return MOCK_LEARNING[nodeId] ?? null;
}
