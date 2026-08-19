import client from './client';
import type { MasteryLevel } from '../utils/colorMap';

/** 知识图谱节点（对齐后端 GraphNodeVO） */
export interface GraphNode {
  id: number;
  name: string;
  description: string;
  order: number;
  x: number;
  y: number;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  isRecommended: boolean;
  isWeakTop: boolean;
}

/** 知识图谱边（对齐后端 GraphEdgeVO） */
export interface GraphEdge {
  from: number;
  to: number;
  type: string;
}

/** 图谱元信息 */
export interface GraphMeta {
  viewType: 'STUDENT' | 'TEACHER';
  recommendedNodeId: number | null;
  weakNodeIds: number[];
}

/** 图谱完整数据 */
export interface GraphData {
  courseId: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: GraphMeta;
}

export type ViewRole = 'student' | 'teacher';
export async function fetchGraph(courseId: number, role: ViewRole): Promise<GraphData> {
  const res = await client.get(`/courses/${courseId}/graph`, {
    params: { role },
  });
  return res.data as unknown as GraphData;
}
