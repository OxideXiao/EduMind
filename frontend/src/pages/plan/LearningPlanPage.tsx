import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Button, Checkbox, Spin, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { LearningPlan } from '../../api/types';
import { fetchLatestPlan, generateLearningPlan } from '../../api/agent';

export default function LearningPlanPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const storageKey = `plan_progress_${courseId}`;

  // 加载已有计划
  useEffect(() => {
    fetchLatestPlan(Number(courseId))
      .then((p) => {
        setPlan(p);
        // 恢复保存的进度
        if (p) {
          try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (Array.isArray(saved)) setCheckedTasks(new Set(saved));
          } catch { /* ignore */ }
        }
      })
      .catch(() => message.error('加载学习计划失败'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const newPlan = await generateLearningPlan(Number(courseId));
      setPlan(newPlan);
      setCheckedTasks(new Set());
      localStorage.removeItem(storageKey); // 新计划，清除旧进度
    } catch { message.error('生成失败，请重试'); }
    finally { setGenerating(false); }
  };

  const toggleTask = (task: string) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      next.has(task) ? next.delete(task) : next.add(task);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const allTasks = plan?.dailyPlan.flatMap((d) => d.tasks) ?? [];
  const completedCount = allTasks.filter((t) => checkedTasks.has(t)).length;
  const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* ── Hero ── */}
      <Typography.Title level={2} style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: 28 }}>
        本周学习计划
      </Typography.Title>
      <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15, display: 'block', marginBottom: 32 }}>
        AI 根据你的学习数据自动生成个性化周计划
      </Typography.Text>

      {/* ── 无计划：生成按钮 ── */}
      {!plan && !generating && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <ThunderboltOutlined style={{ fontSize: 44, color: 'var(--accent)', opacity: 0.4, marginBottom: 20, display: 'block' }} />
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15, display: 'block', marginBottom: 24 }}>
            尚未生成本周计划
          </Typography.Text>
          <Button type="primary" size="large" icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            style={{ height: 48, padding: '0 36px', fontSize: 16, borderRadius: 'var(--radius-md)' }}>
            生成本周计划
          </Button>
        </div>
      )}

      {/* ── 生成中 ── */}
      {generating && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'var(--bg-surface)', border: '1px solid var(--accent-dim)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <Spin size="large" />
          <Typography.Text style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 20, fontSize: 15 }}>
            AI 正在分析你的学习数据，生成个性化计划...
          </Typography.Text>
          <Typography.Text style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4, fontSize: 12 }}>
            （模拟 LLM 生成，预计 1-2 秒）
          </Typography.Text>
        </div>
      )}

      {/* ── 计划内容 ── */}
      {plan && !generating && (
        <>
          {/* 概要 + 进度 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '20px 24px', background: 'var(--accent-light)',
            border: '1px solid var(--accent-dim)', borderRadius: 'var(--radius-lg)',
            marginBottom: 28,
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>📋 计划概要</span>
              <p style={{ color: 'var(--text-primary)', marginTop: 8, fontSize: 15, lineHeight: 1.7, marginBottom: 0 }}>
                {plan.summary}
              </p>
            </div>
            <div style={{ textAlign: 'center', marginLeft: 24, flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--accent)' }}>
                {progress}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>已完成</div>
            </div>
          </div>

          {/* 按天计划 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {plan.dailyPlan.map((day, idx) => (
              <div key={day.day} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderLeft: '4px solid var(--accent)', borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                animation: `fade-in-scale var(--duration-fast) var(--ease-out-expo) ${idx * 80}ms both`,
              }}>
                <Typography.Title level={4} style={{
                  fontFamily: 'var(--font-display)', marginBottom: 12, fontSize: 16, fontWeight: 600,
                }}>
                  {day.day}
                </Typography.Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {day.tasks.map((task) => (
                    <Checkbox key={task} checked={checkedTasks.has(task)} onChange={() => toggleTask(task)}
                      style={{
                        color: checkedTasks.has(task) ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: checkedTasks.has(task) ? 'line-through' : 'none',
                        fontSize: 15, transition: 'all var(--duration-fast)',
                      }}>
                      {task}
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 勉励 */}
          <div style={{
            background: 'var(--bg-surface)', borderLeft: '4px solid var(--accent)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px',
            fontStyle: 'italic', marginBottom: 48,
          }}>
            <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              💬 {plan.motivation}
            </Typography.Text>
          </div>
        </>
      )}
    </div>
  );
}
