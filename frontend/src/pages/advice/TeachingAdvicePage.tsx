import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Button, Tag, Spin, message, Alert } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import type { TeachingAdvice } from '../../api/types';
import { generateTeachingAdvice } from '../../api/agent';

const priorityColor: Record<string, string> = { HIGH: 'red', MEDIUM: 'gold', LOW: 'default' };
const priorityLabel: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };

export default function TeachingAdvicePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [advice, setAdvice] = useState<TeachingAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateTeachingAdvice(Number(courseId));
      setAdvice(result);
    } catch { message.error('生成失败，请重试'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: 28 }}>
        教学建议
      </Typography.Title>
      <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15, display: 'block', marginBottom: 32 }}>
        AI 根据全班学情数据生成个性化教学建议
      </Typography.Text>

      {/* ── 未生成 ── */}
      {!advice && !loading && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <BulbOutlined style={{ fontSize: 44, color: 'var(--accent)', opacity: 0.4, marginBottom: 20, display: 'block' }} />
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15, display: 'block', marginBottom: 24 }}>
            点击生成，AI 将分析全班学情并提供教学建议
          </Typography.Text>
          <Button type="primary" size="large" icon={<BulbOutlined />}
            onClick={handleGenerate}
            style={{ height: 48, padding: '0 36px', fontSize: 16, borderRadius: 'var(--radius-md)' }}>
            生成教学建议
          </Button>
        </div>
      )}

      {/* ── 生成中 ── */}
      {loading && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'var(--bg-surface)', border: '1px solid var(--accent-dim)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <Spin size="large" />
          <Typography.Text style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 20, fontSize: 15 }}>
            AI 正在分析学情数据...
          </Typography.Text>
        </div>
      )}

      {/* ── 建议内容 ── */}
      {advice && !loading && (
        <>
          <Alert message="问题诊断" description={advice.problem} type="warning" showIcon
            style={{
              background: 'var(--accent-light)', borderColor: 'var(--accent-dim)',
              borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 28,
            }} />

          <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 18 }}>
            建议方案
          </Typography.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
            {advice.suggestions.map((s, idx) => (
              <div key={s.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderTop: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                animation: `fade-in-scale var(--duration-fast) var(--ease-out-expo) ${idx * 80}ms both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, paddingTop: 1 }}>
                      {String(s.id).padStart(2, '0')}
                    </span>
                    <Typography.Text style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.7 }}>
                      {s.content}
                    </Typography.Text>
                  </div>
                  <Tag color={priorityColor[s.priority]} style={{ flexShrink: 0, borderRadius: 6 }}>
                    {priorityLabel[s.priority]}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
