import { useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { Typography, Spin, Drawer, Tag, Button, Progress, List, Avatar, Modal, Empty } from 'antd';
import {
  UndoOutlined, UserOutlined, UploadOutlined, ApartmentOutlined,
  ZoomInOutlined, ZoomOutOutlined, FolderOpenOutlined, DatabaseOutlined,
  LinkOutlined, FilePdfOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { fetchGraph } from '../../api/graph';
import type { GraphData, GraphNode, ViewRole } from '../../api/graph';
import { fetchNodeStudents } from '../../api/student';
import type { NodeStudentsResponse } from '../../api/student';
import { fetchBankQuestions, fetchResources, importKnowledgePoints } from '../../api/teacher';
import type { BankQuestion, QuestionType, TeachingResource } from '../../api/types';import GraphCanvas from '../../components/graph/GraphCanvas';
import type { GraphCanvasHandle } from '../../components/graph/GraphCanvas';
import GraphLegend, { type GraphLegendFilter } from '../../components/graph/GraphLegend';
import ImportUploadPanel from '../../components/ImportUploadPanel';
import CoursePageHeader from '../../components/layout/CoursePageHeader';
import { MASTERY_COLOR, MASTERY_LABEL } from '../../utils/colorMap';
import { useAuth } from '../../hooks/useAuth';

const RESOURCE_TYPE_LABEL: Record<TeachingResource['type'], string> = {
  PDF: 'PDF', VIDEO: '视频', LINK: '链接', OTHER: '其他',
};

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  SINGLE: '单选', JUDGE: '判断', MULTIPLE: '多选', SHORT: '简答', FILE: '文件题',
};

const RESOURCE_ICON: Record<string, ReactNode> = {
  PDF: <FilePdfOutlined />,
  VIDEO: <PlayCircleOutlined />,
  LINK: <LinkOutlined />,
};

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
  const [importOpen, setImportOpen] = useState(false);
  const [legendHover, setLegendHover] = useState<GraphLegendFilter | null>(null);
  const [courseResources, setCourseResources] = useState<TeachingResource[]>([]);
  const [courseQuestions, setCourseQuestions] = useState<BankQuestion[]>([]);
  const canvasRef = useRef<GraphCanvasHandle>(null);

  const linkedResources = useMemo(
    () => (selectedNode
      ? courseResources.filter((r) => r.nodeIds.includes(selectedNode.id))
      : []),
    [courseResources, selectedNode],
  );

  const linkedQuestions = useMemo(
    () => (selectedNode
      ? courseQuestions.filter((q) => q.nodeIds.includes(selectedNode.id))
      : []),
    [courseQuestions, selectedNode],
  );

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

  useEffect(() => {
    if (!numCourseId) return;
    Promise.all([
      fetchResources(numCourseId),
      fetchBankQuestions(numCourseId),
    ])
      .then(([resources, questions]) => {
        setCourseResources(resources);
        setCourseQuestions(questions);
      })
      .catch(() => {
        setCourseResources([]);
        setCourseQuestions([]);
      });
  }, [numCourseId]);

  return (
    <div className="course-page course-page--wide course-page--graph page-enter">
      <CoursePageHeader
        title="知识图谱"
        description={isTeacher ? '可视化课程知识结构，点击节点查看掌握详情' : '探索知识点关联，按推荐路径学习'}
        badges={graphData ? (
          <span className="course-page-badge">
            <ApartmentOutlined /> {graphData.nodes.length} 个知识点
          </span>
        ) : undefined}
        actions={isTeacher ? (
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
            className="graph-import-btn"
          >
            导入知识点
          </Button>
        ) : undefined}
      />

      <div className="graph-canvas-panel">
        {loading && (
          <div className="graph-canvas-panel__overlay">
            <Spin size="large" tip="加载知识图谱…" />
          </div>
        )}

        {error && (
          <div className="graph-canvas-panel__overlay graph-canvas-panel__overlay--error">
            <Typography.Text type="danger">{error}</Typography.Text>
            <a onClick={loadGraph} className="graph-retry-link">重试</a>
          </div>
        )}

        {graphData && !loading && (
          <GraphCanvas
            ref={canvasRef}
            data={graphData}
            viewRole={viewRole}
            mini={false}
            legendFilter={legendHover}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* 掌握度图例（画板内） */}
        {graphData && !loading && (
          <GraphLegend
            viewRole={viewRole}
            activeFilter={legendHover}
            onHover={setLegendHover}
          />
        )}

        {/* 画布工具栏 */}
        {graphData && !loading && (
          <div className="graph-toolbar">
            <Button
              icon={<ZoomOutOutlined />}
              shape="circle"
              size="small"
              title="缩小"
              onClick={() => canvasRef.current?.zoomOut()}
            />
            <Button
              icon={<ZoomInOutlined />}
              shape="circle"
              size="small"
              title="放大"
              onClick={() => canvasRef.current?.zoomIn()}
            />
            <Button
              icon={<UndoOutlined />}
              shape="circle"
              size="small"
              title="复原视图"
              onClick={() => canvasRef.current?.resetLayout()}
            />
          </div>
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
        destroyOnHidden
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

            {/* ── 关联教学资源 ── */}
            <div className="graph-drawer-section">
              <div className="graph-drawer-section__title">
                <FolderOpenOutlined /> 教学资源
                <span className="graph-drawer-section__count">{linkedResources.length}</span>
              </div>
              {linkedResources.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联资源" className="graph-drawer-empty" />
              ) : (
                <ul className="graph-drawer-list">
                  {linkedResources.map((res) => (
                    <li key={res.id} className="graph-drawer-list__item">
                      <span className="graph-drawer-list__icon">{RESOURCE_ICON[res.type] ?? <LinkOutlined />}</span>
                      <div className="graph-drawer-list__main">
                        <a href={res.url} target="_blank" rel="noreferrer" className="graph-drawer-list__link">
                          {res.name}
                        </a>
                        <span className="graph-drawer-list__meta">{RESOURCE_TYPE_LABEL[res.type]}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── 关联题库 ── */}
            <div className="graph-drawer-section">
              <div className="graph-drawer-section__title">
                <DatabaseOutlined /> 题库题目
                <span className="graph-drawer-section__count">{linkedQuestions.length}</span>
              </div>
              {linkedQuestions.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联题目" className="graph-drawer-empty" />
              ) : (
                <ul className="graph-drawer-list graph-drawer-list--questions">
                  {linkedQuestions.map((q) => (
                    <li key={q.id} className="graph-drawer-list__item graph-drawer-list__item--question">
                      <div className="graph-drawer-list__main">
                        <p className="graph-drawer-question__content">{q.content}</p>
                        <div className="graph-drawer-question__meta">
                          <Tag>{QUESTION_TYPE_LABEL[q.type]}</Tag>
                          <span>{q.score} 分</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
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

      <Modal
        title="导入知识点"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <ImportUploadPanel
          title="上传知识点文件"
          hint="导入知识点及可选前置关系。成功后将自动刷新图谱。"
          onImport={(file) => importKnowledgePoints(numCourseId, file)}
          onSuccess={() => {
            setImportOpen(false);
            loadGraph();
          }}
        />
      </Modal>
    </div>
  );
}
