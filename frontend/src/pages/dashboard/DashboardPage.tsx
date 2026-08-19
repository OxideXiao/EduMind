import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Table, Spin, message } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import type { DashboardData, CourseMember } from '../../api/types';
import { fetchDashboard, triggerHeartbeat as apiHeartbeat } from '../../api/dashboard';
import { fetchMembers } from '../../api/course';
import StatCard from '../../components/StatCard';

export default function DashboardPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [heartbeatRunning, setHeartbeatRunning] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboard(Number(courseId)),
      fetchMembers(Number(courseId)),
    ])
      .then(([d, m]) => { setData(d); setMembers(m); })
      .catch(() => message.error('加载看板数据失败'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const triggerHeartbeat = async () => {
    setHeartbeatRunning(true);
    try {
      const result = await apiHeartbeat();
      message.success(`Heartbeat 完成：扫描 ${result.total} 人，生成 ${result.reminded} 条提醒`);
    } catch {
      message.error('Heartbeat 执行失败，请稍后重试');
    }
    setHeartbeatRunning(false);

    // 刷新看板数据
    setLoading(true);
    Promise.all([
      fetchDashboard(Number(courseId)),
      fetchMembers(Number(courseId)),
    ])
      .then(([d, m]) => { setData(d); setMembers(m); })
      .finally(() => setLoading(false));
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;
  if (!data) return null;

  const columns: ColumnsType<DashboardData['riskStudents'][number]> = [
    {
      title: '姓名', dataIndex: 'name', key: 'name',
      render: (v: string, r) => (
        <span style={{ fontWeight: 500 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: r.avgMastery < 40 ? 'var(--danger)' : 'var(--warning)',
            marginRight: 8,
          }} />
          {v}
        </span>
      ),
    },
    {
      title: '掌握度', dataIndex: 'avgMastery', key: 'avgMastery',
      render: (v: number) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: v < 40 ? 'var(--danger)' : 'var(--text-primary)' }}>
          {Math.round(v)}%
        </span>
      ),
    },
    { title: '活跃天数', dataIndex: 'activeDays', key: 'activeDays' },
    { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin' },
    {
      title: '', key: 'action', width: 80,
      render: (_, r) => (
        <Button type="link" size="small" style={{ color: 'var(--accent)' }}
          onClick={() => navigate(`/courses/${courseId}/students/${r.studentId}`)}>
          下钻 →
        </Button>
      ),
    },
  ];

  const chartOption = {
    grid: { top: 10, right: 20, bottom: 20, left: 40 },
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
      backgroundColor: 'var(--bg-elevated)',
      borderColor: 'var(--border-default)',
      textStyle: { color: 'var(--text-primary)', fontSize: 13 },
    },
    series: [{
      type: 'line',
      data: data.activeTrend.map((d) => d.count),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#4f6d8c', width: 2.5 },
      itemStyle: { color: '#4f6d8c' },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79,109,140,0.15)' },
            { offset: 1, color: 'rgba(79,109,140,0)' },
          ],
        },
      },
    }],
  };

  return (
    <div>
      {/* ── 顶部 ── */}
      <Button type="text" icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/courses')}
        style={{ color: 'var(--text-secondary)', paddingLeft: 0, marginBottom: 4, marginTop: 4 }}>
        返回课程
      </Button>
      <Typography.Title level={2} style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: 28 }}>
        学情看板
      </Typography.Title>
      <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
        数据结构与算法 · 全班学情概览
      </Typography.Text>

      {/* ── 统计卡片 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32, marginBottom: 36 }}>
        <StatCard label="课程完成率" value={Math.round(data.completionRate)} suffix="%" color={data.completionRate >= 60 ? 'var(--accent)' : 'var(--danger)'} />
        <StatCard label="学习活跃度" value={Math.round(data.activeRate)} suffix="%" color={data.activeRate >= 50 ? 'var(--info)' : 'var(--warning)'} />
        <StatCard label="风险学生" value={data.riskStudentCount} suffix="人" color={data.riskStudentCount === 0 ? 'var(--success)' : 'var(--danger)'} />
      </div>

      {/* ── AI 心跳 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', marginBottom: 28,
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClockCircleOutlined style={{ fontSize: 20, color: 'var(--accent)' }} />
          <div>
            <span style={{ fontWeight: 500, fontSize: 14 }}>AI 学情分析</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 12 }}>
              点击按钮手动触发 · 每日 22:00 自动运行
            </span>
          </div>
        </div>
        <Button icon={<ThunderboltOutlined />} loading={heartbeatRunning}
          onClick={triggerHeartbeat}
          style={{ borderRadius: 'var(--radius-md)' }}>
          手动执行 Heartbeat
        </Button>
      </div>

      {/* ── 趋势图 + 薄弱排行 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}>
        {/* 活跃趋势 */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)',
          padding: '28px 28px 20px',
        }}>
          <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 18 }}>
            活跃度趋势（近7天）
          </Typography.Title>
          <ReactECharts option={chartOption} style={{ height: 260 }} />
        </div>

        {/* 薄弱知识点 Top5 */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--danger)', borderRadius: 'var(--radius-lg)',
          padding: '28px 28px 24px',
        }}>
          <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 18 }}>
            薄弱知识点 Top 5
          </Typography.Title>
          {data.weakKnowledgePoints.map((item, i) => {
            const color = item.avgScore < 40 ? 'var(--danger)' : item.avgScore < 60 ? 'var(--warning)' : 'var(--text-secondary)';
            return (
              <div key={item.nodeId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 0',
                borderBottom: i < data.weakKnowledgePoints.length - 1 ? '1px solid var(--border-default)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                    color: i < 3 ? 'var(--danger)' : 'var(--text-muted)', width: 20,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color }}>
                  {Math.round(item.avgScore)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 风险学生 ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderTop: data.riskStudentCount > 0 ? '3px solid var(--danger)' : '3px solid var(--success)',
        borderRadius: 'var(--radius-lg)', padding: '28px 28px 24px', marginBottom: 48,
      }}>
        <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 18 }}>
          风险学生
          {data.riskStudentCount === 0 && <span style={{ fontSize: 14, color: 'var(--success)', fontWeight: 400, marginLeft: 8 }}>— 全部正常</span>}
        </Typography.Title>
        {data.riskStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            暂无风险学生
          </div>
        ) : (
          <Table
            dataSource={data.riskStudents}
            columns={columns}
            rowKey="studentId"
            pagination={false}
            size="middle"
            rowClassName={(r) => r.avgMastery < 40 ? 'risk-row' : ''}
          />
        )}
      </div>
      <style>{`.risk-row td:first-child { border-left: 3px solid var(--danger) !important; }`}</style>

      {/* ── 全班学生 ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderTop: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)',
        padding: '28px 28px 24px', marginBottom: 48,
      }}>
        <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: 18 }}>
          <TeamOutlined style={{ marginRight: 8 }} />全班学生
        </Typography.Title>
        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>暂无学生</div>
        ) : (
          <Table
            dataSource={members}
            columns={[
              {
                title: '姓名', dataIndex: 'name', key: 'name',
                render: (v: string) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--accent-light)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: 12,
                    }}>
                      {v.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ),
              },
              {
                title: '加入时间', dataIndex: 'joinedAt', key: 'joinedAt',
                render: (v: string) => v.slice(0, 10),
              },
              {
                title: '', key: 'action', width: 80,
                render: (_, r) => (
                  <Button type="link" size="small" style={{ color: 'var(--accent)' }}
                    onClick={() => navigate(`/courses/${courseId}/students/${r.userId}`)}>
                    查看详情 →
                  </Button>
                ),
              },
            ]}
            rowKey="userId"
            pagination={members.length > 10 ? { pageSize: 10, size: 'small' } : false}
            size="middle"
          />
        )}
      </div>
    </div>
  );
}
