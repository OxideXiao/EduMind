import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App, Typography, Table, Timeline, Spin, Empty, Button } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  FormOutlined,
  HistoryOutlined,
  NodeIndexOutlined,
  RiseOutlined,
  AlertOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { StudentTrajectory, QuizRecord } from '../../api/types';
import { fetchStudentTrajectory, fetchStudentGraph } from '../../api/student';
import type { GraphData } from '../../api/graph';
import GraphCanvas from '../../components/graph/GraphCanvas';
import type { GraphCanvasHandle } from '../../components/graph/GraphCanvas';
import GraphLegend, { type GraphLegendFilter } from '../../components/graph/GraphLegend';
import CoursePageHeader from '../../components/layout/CoursePageHeader';
import StatCard from '../../components/StatCard';

/** 学生基础信息 — demo-seed-spec §4 */
const STUDENT_INFO: Record<number, { name: string; avgMastery: number; risk: boolean }> = {
  101: { name: '张三', avgMastery: 82, risk: false },
  102: { name: '李四', avgMastery: 52, risk: false },
  103: { name: '王五', avgMastery: 28, risk: true },
};

const actionLabel: Record<string, string> = {
  QUIZ: '完成测验',
  VIEW_RESOURCE: '查看资料',
  LOGIN: '登录平台',
};

function masteryColor(score: number) {
  if (score >= 80) return 'var(--success)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export default function StudentDetailPage() {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>();
  const numCourseId = Number(courseId);
  const numStudentId = Number(studentId);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [data, setData] = useState<StudentTrajectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentGraph, setStudentGraph] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [legendHover, setLegendHover] = useState<GraphLegendFilter | null>(null);
  const canvasRef = useRef<GraphCanvasHandle>(null);

  const info = STUDENT_INFO[numStudentId] ?? {
    name: `学生#${studentId}`,
    avgMastery: 0,
    risk: false,
  };

  const avgScore = studentGraph
    ? Math.round(
        studentGraph.nodes.reduce((sum, n) => sum + n.masteryScore, 0)
          / (studentGraph.nodes.length || 1),
      )
    : 0;

  const displayMastery = Math.max(info.avgMastery, avgScore);
  const masteredCount = studentGraph
    ? studentGraph.nodes.filter((n) => n.masteryLevel === 'GREEN').length
    : 0;
  const weakCount = studentGraph
    ? studentGraph.nodes.filter((n) => n.masteryLevel === 'RED' || n.masteryLevel === 'GRAY').length
    : 0;

  useEffect(() => {
    if (!numCourseId || !numStudentId) return;
    setGraphLoading(true);
    fetchStudentGraph(numCourseId, numStudentId)
      .then(setStudentGraph)
      .catch(() => setStudentGraph(null))
      .finally(() => setGraphLoading(false));
  }, [numCourseId, numStudentId]);

  useEffect(() => {
    setLoading(true);
    fetchStudentTrajectory(Number(courseId), Number(studentId))
      .then(setData)
      .catch(() => message.error('加载学生数据失败'))
      .finally(() => setLoading(false));
  }, [courseId, studentId]);

  if (loading && graphLoading) {
    return (
      <div className="course-page-loading">
        <Spin size="large" />
        <span>加载学生详情…</span>
      </div>
    );
  }

  const studentName = info.name ?? `学生#${numStudentId}`;

  const quizColumns: ColumnsType<QuizRecord> = [
    {
      title: '测验',
      dataIndex: 'quizName',
      key: 'quizName',
      render: (v: string) => <span className="course-page-cell-name">{v}</span>,
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 88,
      render: (v: number) => (
        <span className="dashboard-mastery" style={{ color: masteryColor(v) }}>{v}</span>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (v: string) => (
        <span className="dashboard-date">{v.slice(0, 16).replace('T', ' ')}</span>
      ),
    },
  ];

  return (
    <div className="course-page course-page--wide student-detail page-enter">
      <a
        href={`/courses/${courseId}/members`}
        className="btn-text student-detail-back"
        onClick={(e) => {
          e.preventDefault();
          navigate(`/courses/${courseId}/members`);
        }}
      >
        <ArrowLeftOutlined />
        <span>返回成员</span>
      </a>

      <CoursePageHeader
        title={`${studentName} · 学习详情`}
        description="数据结构与算法 · 个人掌握度与学习轨迹"
        badges={(
          <>
            <span className="course-page-badge">
              <RiseOutlined /> 掌握度 {graphLoading ? '…' : `${displayMastery}%`}
            </span>
            {info.risk ? (
              <span className="course-page-badge course-page-badge--warn">
                <AlertOutlined /> 风险学生
              </span>
            ) : (
              <span className="course-page-badge course-page-badge--ok">学情正常</span>
            )}
          </>
        )}
      />

      {info.risk && (
        <div className="student-detail-alert">
          <AlertOutlined />
          <span>风险学生 — 超 3 天未学习或掌握度低于 40%，建议关注并及时干预</span>
        </div>
      )}

      <section className="dashboard-stats student-detail-stats">
        <StatCard
          label="平均掌握度"
          value={graphLoading ? '—' : displayMastery}
          suffix={graphLoading ? undefined : '%'}
          color={masteryColor(displayMastery)}
          icon={<RiseOutlined />}
          hint="综合个人图谱与档案"
        />
        <StatCard
          label="已掌握知识点"
          value={graphLoading ? '—' : masteredCount}
          suffix={graphLoading ? undefined : '个'}
          color="var(--success)"
          icon={<NodeIndexOutlined />}
          hint={studentGraph ? `共 ${studentGraph.nodes.length} 个节点` : '加载中'}
        />
        <StatCard
          label="薄弱 / 未学"
          value={graphLoading ? '—' : weakCount}
          suffix={graphLoading ? undefined : '个'}
          color={weakCount > 0 ? 'var(--danger)' : 'var(--success)'}
          icon={<AlertOutlined />}
          hint="需优先跟进"
        />
      </section>

      {data && (
        <section className="dashboard-grid-2 student-detail-grid">
          <div className="dashboard-panel dashboard-panel--accent">
            <div className="dashboard-panel__head">
              <div
                className="dashboard-panel__icon"
                style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
              >
                <FormOutlined />
              </div>
              <div>
                <Typography.Title level={4} className="dashboard-panel__title">近 5 次测验</Typography.Title>
                <span className="dashboard-panel__subtitle">最近测验成绩</span>
              </div>
            </div>
            {data.recentQuizzes.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无测验记录" className="dashboard-empty" />
            ) : (
              <Table
                className="course-page-table"
                dataSource={data.recentQuizzes}
                columns={quizColumns}
                rowKey="quizName"
                pagination={false}
                size="middle"
              />
            )}
          </div>

          <div className="dashboard-panel dashboard-panel--accent">
            <div className="dashboard-panel__head">
              <div
                className="dashboard-panel__icon"
                style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
              >
                <HistoryOutlined />
              </div>
              <div>
                <Typography.Title level={4} className="dashboard-panel__title">学习日志</Typography.Title>
                <span className="dashboard-panel__subtitle">近期学习行为</span>
              </div>
            </div>
            {data.recentLogs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无学习记录" className="dashboard-empty" />
            ) : (
              <Timeline
                className="student-detail-timeline"
                items={data.recentLogs.map((log) => {
                  const isQuiz = log.action === 'QUIZ';
                  return {
                    color: isQuiz ? 'var(--accent)' : 'var(--accent-dim)',
                    dot: isQuiz ? <ClockCircleOutlined style={{ fontSize: 14 }} /> : undefined,
                    children: (
                      <div className="student-detail-log">
                        <div className="student-detail-log__title">
                          {actionLabel[log.action] ?? log.action}
                          {log.nodeName && (
                            <span className="student-detail-log__node">{log.nodeName}</span>
                          )}
                        </div>
                        <div className="student-detail-log__time">
                          {log.createdAt.slice(0, 16).replace('T', ' ')}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            )}
          </div>
        </section>
      )}

      <section className="student-detail-graph">
        <div className="student-detail-graph__head">
          <Typography.Title level={4} className="dashboard-panel__title">个人知识图谱</Typography.Title>
          <span className="dashboard-panel__subtitle">该学生各知识点掌握情况</span>
        </div>

        <div className="graph-canvas-panel student-detail-graph__panel">
          {graphLoading && (
            <div className="graph-canvas-panel__overlay">
              <Spin size="large" tip="加载个人图谱…" />
            </div>
          )}

          {!graphLoading && !studentGraph && (
            <div className="graph-canvas-panel__overlay graph-canvas-panel__overlay--error">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无个人图谱数据" />
            </div>
          )}

          {studentGraph && !graphLoading && (
            <GraphCanvas
              ref={canvasRef}
              data={studentGraph}
              viewRole="student"
              mini={false}
              legendFilter={legendHover}
            />
          )}

          {studentGraph && !graphLoading && (
            <GraphLegend
              viewRole="student"
              activeFilter={legendHover}
              onHover={setLegendHover}
            />
          )}

          {studentGraph && !graphLoading && (
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
      </section>
    </div>
  );
}
