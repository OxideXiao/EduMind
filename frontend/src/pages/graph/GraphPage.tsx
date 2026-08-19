import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Typography, Spin, Drawer, Tag, Button, Progress, List, Avatar } from 'antd';
import { UndoOutlined, UserOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { fetchGraph } from '../../api/graph';
import type { GraphData, GraphNode, ViewRole } from '../../api/graph';
import { fetchNodeStudents } from '../../api/student';
import type { NodeStudentsResponse } from '../../api/student';
import GraphCanvas from '../../components/graph/GraphCanvas';
import type { GraphCanvasHandle } from '../../components/graph/GraphCanvas';
import GraphLegend from '../../components/graph/GraphLegend';
import { MASTERY_COLOR, MASTERY_LABEL } from '../../utils/colorMap';
import { useAuth } from '../../hooks/useAuth';

/**
 * 知识图谱页 — ECharts 力导向图
 * 根据当前登录角色自动显示学生/教师视图
 */
export default function GraphPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const numCourseId = Number(courseId);
  const { isTeacher } = useAuth();

  // 根据登录角色自动确定视图
  const viewRole: ViewRole = useMemo(() => (isTeacher ? 'teacher' : 'student'), [isTeacher]);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeStudents, setNodeStudents] = useState<NodeStudentsResponse | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const canvasRef = useRef<GraphCanvasHandle>(null);

  /** 教师视图：点击节点时拉取该节点的学生掌握度列表 */
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      if (!isTeacher) return;
      setStudentsLoading(true);
      setNodeStudents(null);
      fetchNodeStudents(numCourseId, node.id)
        .then(setNodeStudents)
        .catch(() => setNodeStudents(null))
        .finally(() => setStudentsLoading(false));
    },
    [isTeacher, numCourseId],
  );

  const loadGraph = useCallback(async () => {
    if (!numCourseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGraph(numCourseId, viewRole);
      setGraphData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载知识图谱失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [numCourseId, viewRole]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  return (
    <div>
      {/* 标题区 + 视图切换 */}
      <section
        style={{
          padding: '40px 0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Typography.Title
            level={1}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 700,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            知识图谱
          </Typography.Title>
          {graphData && (
            <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
              {graphData.nodes.length} 个知识点
            </Typography.Text>
          )}
        </div>
      </section>

      {/* 图例 */}
      <GraphLegend viewRole={viewRole} />

      {/* 图谱画布 */}
      <div
        style={{
          height: 650,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface)',
              zIndex: 2,
            }}
          >
            <Spin size="large" tip="加载知识图谱…" />
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Typography.Text type="danger">{error}</Typography.Text>
            <a onClick={loadGraph} style={{ cursor: 'pointer', color: '#4f6d8c' }}>
              重试
            </a>
          </div>
        )}

        {graphData && !loading && (
          <GraphCanvas
            ref={canvasRef}
            data={graphData}
            viewRole={viewRole}
            mini={false}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* 复位按钮 */}
        {graphData && !loading && (
          <Button
            icon={<UndoOutlined />}
            shape="circle"
            size="small"
            title="复原视图"
            onClick={() => canvasRef.current?.resetLayout()}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 3,
              background: 'var(--bg-surface)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
        )}
      </div>

      {/* 节点详情抽柜 */}
      <Drawer
        title={
          selectedNode ? (
            <span style={{ fontSize: 18, fontWeight: 600 }}>{selectedNode.name}</span>
          ) : undefined
        }
        placement="right"
        width={400}
        open={!!selectedNode}
        onClose={() => {
          setSelectedNode(null);
          setNodeStudents(null);
        }}
        destroyOnClose
      >
        {selectedNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ── 掌握度 ── */}
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                {isTeacher ? '全班平均掌握度' : '掌握度'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: MASTERY_COLOR[selectedNode.masteryLevel],
                  }}
                />
                <span style={{ fontSize: 24, fontWeight: 700 }}>
                  {Math.round(selectedNode.masteryScore)}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  分 · {MASTERY_LABEL[selectedNode.masteryLevel]}
                </span>
              </div>
              {isTeacher && (
                <Progress
                  percent={selectedNode.masteryScore}
                  size="small"
                  strokeColor={MASTERY_COLOR[selectedNode.masteryLevel]}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            {/* ── 知识点描述 ── */}
            {selectedNode.description && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  知识点描述
                </div>
                <Typography.Paragraph
                  style={{ color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: 0 }}
                >
                  {selectedNode.description}
                </Typography.Paragraph>
              </div>
            )}

            {/* ── 序号 ── */}
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                学习顺序
              </div>
              <span style={{ fontSize: 16, fontWeight: 500 }}>第 {selectedNode.order} 个</span>
            </div>

            {/* ── 标记 ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedNode.isRecommended && (
                <Tag color="#4f6d8c" style={{ fontSize: 13, padding: '2px 10px' }}>
                  ⭐ 推荐学习
                </Tag>
              )}
              {selectedNode.isWeakTop && isTeacher && (
                <Tag color="#ef4444" style={{ fontSize: 13, padding: '2px 10px' }}>
                  ⚠️ 班级薄弱点
                </Tag>
              )}
            </div>

            {/* ── 教师视图：学生列表 ── */}
            {isTeacher && (
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>学生掌握度</span>
                  {nodeStudents && (
                    <span style={{ fontSize: 12 }}>
                      共 {nodeStudents.totalStudents} 人
                    </span>
                  )}
                </div>
                {studentsLoading && <Spin size="small" />}
                {nodeStudents && !studentsLoading && (
                  <List
                    size="small"
                    dataSource={nodeStudents.students}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          padding: '8px 0',
                          cursor: 'pointer',
                          borderRadius: 6,
                          transition: 'background .15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <Link
                          to={`/courses/${numCourseId}/students/${item.studentId}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <Avatar
                            size={28}
                            icon={<UserOutlined />}
                            style={{ marginRight: 10, flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                            {item.studentName}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: MASTERY_COLOR[item.masteryLevel],
                            }}
                          >
                            {Math.round(item.masteryScore)}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              marginLeft: 6,
                              minWidth: 36,
                            }}
                          >
                            {MASTERY_LABEL[item.masteryLevel]}
                          </span>
                        </Link>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}

            {/* ── 学生视图：跳转节点学习页 ── */}
            {!isTeacher && (
              <Link
                to={`/courses/${numCourseId}/nodes/${selectedNode.id}/learn`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 12,
                  padding: '10px 24px',
                  background: '#4f6d8c',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity .2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
                }}
              >
                去学习 →
              </Link>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
