import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Table, Timeline, Spin, message } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { StudentTrajectory, QuizRecord } from '../../api/types';
import { fetchStudentTrajectory } from '../../api/student';
import { fetchStudentGraph } from '../../api/student';
import type { GraphData } from '../../api/graph';
import GraphCanvas from '../../components/graph/GraphCanvas';

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

export default function StudentDetailPage() {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>();
  const numCourseId = Number(courseId);
  const numStudentId = Number(studentId);
  const navigate = useNavigate();

  // ── dev2: 轨迹数据 ──
  const [data, setData] = useState<StudentTrajectory | null>(null);
  const [loading, setLoading] = useState(true);

  // ── dev1: 个人图谱 ──
  const [studentGraph, setStudentGraph] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);

  // 基础信息：从本地 STUDENT_INFO 查找，找不到用默认值
  const info = STUDENT_INFO[Number(studentId)] ?? { name: `学生#${studentId}`, avgMastery: 0, risk: false };

  // 从图谱数据计算平均掌握度
  const avgScore = studentGraph
    ? Math.round(
        studentGraph.nodes.reduce((sum, n) => sum + n.masteryScore, 0) /
          (studentGraph.nodes.length || 1),
      )
    : 0;

  // 取高者作为显示值
  const displayMastery = Math.max(info.avgMastery, avgScore);

  // 加载学生个人图谱 (dev1)
  useEffect(() => {
    if (!numCourseId || !numStudentId) return;
    setGraphLoading(true);
    fetchStudentGraph(numCourseId, numStudentId)
      .then(setStudentGraph)
      .catch(() => setStudentGraph(null))
      .finally(() => setGraphLoading(false));
  }, [numCourseId, numStudentId]);

  // 加载学生轨迹数据 (dev2)
  useEffect(() => {
    setLoading(true);
    fetchStudentTrajectory(Number(courseId), Number(studentId))
      .then(setData)
      .catch(() => message.error('加载学生数据失败'))
      .finally(() => setLoading(false));
  }, [courseId, studentId]);

  if (loading && graphLoading)
    return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  const studentName = info.name ?? `学生#${numStudentId}`;

  const quizColumns: ColumnsType<QuizRecord> = [
    { title: '测验', dataIndex: 'quizName', key: 'quizName' },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (v: number) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color:
              v >= 80
                ? 'var(--success)'
                : v >= 60
                  ? 'var(--warning)'
                  : 'var(--danger)',
          }}
        >
          {v}
        </span>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (v: string) => v.slice(0, 16).replace('T', ' '),
    },
  ];

  return (
    <div>
      {/* ── 头部信息 ── */}
      <section style={{ padding: '40px 0 32px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/courses/${courseId}/dashboard`)}
          style={{
            color: 'var(--text-secondary)',
            paddingLeft: 0,
            marginBottom: 16,
          }}
        >
          返回看板
        </Button>
        <Typography.Title
          level={1}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          {studentName} · 学习详情
        </Typography.Title>
        <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          数据结构与算法 · 平均掌握度 {graphLoading ? '...' : `${displayMastery}%`}
        </Typography.Text>
      </section>

      {/* ── 风险标记 (dev2) ── */}
      {info.risk && (
        <div
          style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: 4,
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--danger)',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          ⚠ 风险学生 — 超3天未学习或掌握度低于40%
        </div>
      )}

      {/* ── 个人知识图谱 (dev1: GraphCanvas) ── */}
      <section className="reveal" style={{ marginBottom: 36 }}>
        <div
          style={{
            height: 420,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          {graphLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
              }}
            >
              <Spin />
            </div>
          ) : studentGraph ? (
            <GraphCanvas data={studentGraph} viewRole="student" />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
              }}
            >
              暂无个人图谱数据
            </div>
          )}
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '12px 20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 32,
              fontWeight: 600,
              color:
                displayMastery >= 80
                  ? 'var(--success)'
                  : displayMastery >= 40
                    ? 'var(--warning)'
                    : 'var(--danger)',
            }}
          >
            {displayMastery}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>平均掌握度</div>
        </div>
      </section>

      {/* ── 测验记录 + 学习日志 (dev2) ── */}
      {data && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            marginBottom: 48,
          }}
        >
          {/* 测验记录 */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderTop: '3px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 28px',
            }}
          >
            <Typography.Title
              level={4}
              style={{
                fontFamily: 'var(--font-display)',
                marginBottom: 18,
                fontSize: 18,
              }}
            >
              近5次测验记录
            </Typography.Title>
            {data.recentQuizzes.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  color: 'var(--text-muted)',
                }}
              >
                暂无测验记录
              </div>
            ) : (
              <Table
                dataSource={data.recentQuizzes}
                columns={quizColumns}
                rowKey="quizName"
                pagination={false}
                size="middle"
              />
            )}
          </div>

          {/* 学习日志 */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderTop: '3px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 28px',
            }}
          >
            <Typography.Title
              level={4}
              style={{
                fontFamily: 'var(--font-display)',
                marginBottom: 18,
                fontSize: 18,
              }}
            >
              学习日志
            </Typography.Title>
            {data.recentLogs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  color: 'var(--text-muted)',
                }}
              >
                暂无学习记录
              </div>
            ) : (
              <Timeline
                items={data.recentLogs.map((log) => {
                  const isQuiz = log.action === 'QUIZ';
                  return {
                    color: isQuiz ? 'var(--accent)' : 'var(--accent-dim)',
                    dot: isQuiz ? (
                      <ClockCircleOutlined style={{ fontSize: 14 }} />
                    ) : undefined,
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          {actionLabel[log.action] ?? log.action}
                          <span
                            style={{
                              color: 'var(--accent)',
                              fontWeight: 400,
                              marginLeft: 6,
                            }}
                          >
                            {log.nodeName}
                          </span>
                        </div>
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 12,
                            marginTop: 3,
                          }}
                        >
                          {log.createdAt.slice(0, 16).replace('T', ' ')}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
