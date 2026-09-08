import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App, Typography, Button, Table, Spin, Empty } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FireOutlined,
  WarningOutlined,
  LineChartOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import type { DashboardData } from '../../api/types';
import { fetchDashboard, triggerHeartbeat as apiHeartbeat } from '../../api/dashboard';
import StatCard from '../../components/StatCard';

function scoreColor(score: number) {
  if (score < 40) return 'var(--danger)';
  if (score < 60) return 'var(--warning)';
  return 'var(--accent)';
}

function PanelHead({
  icon, title, subtitle, accent = 'var(--accent)',
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="dashboard-panel__head">
      <div className="dashboard-panel__icon" style={{ color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}>
        {icon}
      </div>
      <div>
        <Typography.Title level={4} className="dashboard-panel__title">{title}</Typography.Title>
        {subtitle && <span className="dashboard-panel__subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [heartbeatRunning, setHeartbeatRunning] = useState(false);

  const reload = () => {
    setLoading(true);
    return fetchDashboard(Number(courseId))
      .then(setData)
      .catch(() => message.error('加载看板数据失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [courseId]);

  const triggerHeartbeat = async () => {
    setHeartbeatRunning(true);
    try {
      const result = await apiHeartbeat();
      message.success(`Heartbeat 完成：扫描 ${result.total} 人，生成 ${result.reminded} 条提醒`);
      await reload();
    } catch {
      message.error('Heartbeat 执行失败，请稍后重试');
    } finally {
      setHeartbeatRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <span>加载学情数据…</span>
      </div>
    );
  }
  if (!data) return null;

  const riskColumns: ColumnsType<DashboardData['riskStudents'][number]> = [
    {
      title: '姓名', dataIndex: 'name', key: 'name',
      render: (v: string, r) => (
        <span className="dashboard-name-cell">
          <span className={`dashboard-status-dot${r.avgMastery < 40 ? ' is-danger' : ' is-warning'}`} />
          {v}
        </span>
      ),
    },
    {
      title: '掌握度', dataIndex: 'avgMastery', key: 'avgMastery',
      render: (v: number) => (
        <span className="dashboard-mastery" style={{ color: v < 40 ? 'var(--danger)' : 'var(--text-primary)' }}>
          {Math.round(v)}%
        </span>
      ),
    },
    { title: '活跃天数', dataIndex: 'activeDays', key: 'activeDays' },
    { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin' },
    {
      title: '', key: 'action', width: 88,
      render: (_, r) => (
        <Button type="link" size="small" className="dashboard-link-btn"
          onClick={() => navigate(`/courses/${courseId}/students/${r.studentId}`)}>
          下钻 →
        </Button>
      ),
    },
  ];

  const chartOption = {
    grid: { top: 16, right: 16, bottom: 28, left: 44 },
    xAxis: {
      type: 'category' as const,
      data: data.activeTrend.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: { color: 'var(--border-default)' } },
      axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'var(--border-default)', type: 'dashed' } },
      axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'var(--bg-elevated)',
      borderColor: 'var(--border-default)',
      textStyle: { color: 'var(--text-primary)', fontSize: 13 },
    },
    series: [{
      type: 'line',
      data: data.activeTrend.map((d) => d.count),
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { color: '#4f6d8c', width: 2.5 },
      itemStyle: { color: '#4f6d8c', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79,109,140,0.18)' },
            { offset: 1, color: 'rgba(79,109,140,0)' },
          ],
        },
      },
    }],
  };

  const maxWeakScore = Math.max(...data.weakKnowledgePoints.map((p) => p.avgScore), 1);

  return (
    <div className="dashboard-page page-enter">
      {/* 页头 */}
      <header className="dashboard-header">
        <div>
          <Typography.Title level={2} className="dashboard-header__title">学情看板</Typography.Title>
          <Typography.Text className="dashboard-header__desc">
            数据结构与算法 · 全班学情概览与风险预警
          </Typography.Text>
        </div>
        <div className="dashboard-header__badges">
          <span className={`dashboard-badge${data.riskStudentCount > 0 ? ' is-warn' : ' is-ok'}`}>
            {data.riskStudentCount > 0 ? <AlertOutlined /> : <RiseOutlined />}
            {data.riskStudentCount > 0 ? `${data.riskStudentCount} 人需关注` : '学情正常'}
          </span>
        </div>
      </header>

      {/* AI 心跳 */}
      <section className="dashboard-heartbeat">
        <div className="dashboard-heartbeat__info">
          <div className="dashboard-heartbeat__icon">
            <ClockCircleOutlined />
          </div>
          <div>
            <div className="dashboard-heartbeat__title">AI 学情分析</div>
            <div className="dashboard-heartbeat__desc">手动触发即时扫描 · 每日 22:00 自动运行</div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={heartbeatRunning}
          onClick={triggerHeartbeat}
          className="dashboard-heartbeat__btn"
        >
          执行 Heartbeat
        </Button>
      </section>

      {/* 核心指标 */}
      <section className="dashboard-stats">
        <StatCard
          label="课程完成率"
          value={Math.round(data.completionRate)}
          suffix="%"
          color={data.completionRate >= 60 ? 'var(--accent)' : 'var(--danger)'}
          icon={<RiseOutlined />}
          hint={data.completionRate >= 60 ? '进度良好' : '低于预期，需跟进'}
        />
        <StatCard
          label="学习活跃度"
          value={Math.round(data.activeRate)}
          suffix="%"
          color={data.activeRate >= 50 ? 'var(--info)' : 'var(--warning)'}
          icon={<FireOutlined />}
          hint="近 7 日活跃占比"
        />
        <StatCard
          label="风险学生"
          value={data.riskStudentCount}
          suffix="人"
          color={data.riskStudentCount === 0 ? 'var(--success)' : 'var(--danger)'}
          icon={<WarningOutlined />}
          hint={data.riskStudentCount === 0 ? '暂无预警' : '掌握度或活跃异常'}
        />
      </section>

      {/* 趋势 + 薄弱点 */}
      <section className="dashboard-grid-2">
        <div className="dashboard-panel dashboard-panel--accent">
          <PanelHead
            icon={<LineChartOutlined />}
            title="活跃度趋势"
            subtitle="近 7 日登录活跃人数"
          />
          <ReactECharts option={chartOption} className="dashboard-chart" />
        </div>

        <div className="dashboard-panel dashboard-panel--danger">
          <PanelHead
            icon={<WarningOutlined />}
            title="薄弱知识点"
            subtitle="全班平均掌握度 Top 5"
            accent="var(--danger)"
          />
          <ul className="dashboard-weak-list">
            {data.weakKnowledgePoints.map((item, i) => {
              const color = scoreColor(item.avgScore);
              return (
                <li key={item.nodeId} className="dashboard-weak-item">
                  <div className="dashboard-weak-item__row">
                    <span className={`dashboard-weak-rank${i < 3 ? ' is-top' : ''}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="dashboard-weak-label">{item.label}</span>
                    <span className="dashboard-weak-score" style={{ color }}>{Math.round(item.avgScore)}%</span>
                  </div>
                  <div className="dashboard-weak-bar">
                    <span
                      className="dashboard-weak-bar__fill"
                      style={{ width: `${(item.avgScore / maxWeakScore) * 100}%`, background: color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 风险学生 */}
      <section className={`dashboard-panel dashboard-panel--table${data.riskStudentCount > 0 ? ' dashboard-panel--danger' : ' dashboard-panel--success'}`}>
        <PanelHead
          icon={<AlertOutlined />}
          title="风险学生"
          subtitle={data.riskStudentCount === 0 ? '全部正常' : '掌握度或活跃偏低'}
          accent={data.riskStudentCount > 0 ? 'var(--danger)' : 'var(--success)'}
        />
        {data.riskStudents.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无风险学生" className="dashboard-empty" />
        ) : (
          <Table
            className="dashboard-table"
            dataSource={data.riskStudents}
            columns={riskColumns}
            rowKey="studentId"
            pagination={false}
            size="middle"
            rowClassName={(r) => (r.avgMastery < 40 ? 'dashboard-row--risk' : '')}
          />
        )}
      </section>
    </div>
  );
}
