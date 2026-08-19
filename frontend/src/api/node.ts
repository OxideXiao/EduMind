import client from './client';
import type { NodeLearningData } from './types';

export type { NodeInfo, ResourceItem, QuizBrief, NodeLearningData } from './types';

/** GET /api/courses/{courseId}/nodes/{nodeId}/learning */
export async function fetchNodeLearning(courseId: number, nodeId: number): Promise<NodeLearningData | null> {
  const { data } = await client.get(`/courses/${courseId}/nodes/${nodeId}/learning`);
  return data;
}
