import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Tag, Spin, message, Empty } from 'antd';
import { ArrowLeftOutlined, FilePdfOutlined, PlayCircleOutlined, LinkOutlined, FormOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { NodeLearningData } from '../../api/types';
import { fetchNodeLearning } from '../../api/node';

const typeIcon: Record<string, React.ReactNode> = {
  PDF: <FilePdfOutlined style={{ fontSize: 20, color: '#ef4444' }} />,
  VIDEO: <PlayCircleOutlined style={{ fontSize: 20, color: '#3b82f6' }} />,
  LINK: <LinkOutlined style={{ fontSize: 20, color: 'var(--accent)' }} />,
};

const typeLabel: Record<string, string> = { PDF: 'PDF 课件', VIDEO: '视频讲解', LINK: '外部链接' };

export default function NodeLearnPage() {
  const { courseId, nodeId } = useParams<{ courseId: string; nodeId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<NodeLearningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !nodeId) return;
    setLoading(true);
    fetchNodeLearning(Number(courseId), Number(nodeId))
      .then(setData)
      .catch(() => message.error('加载学习资料失败'))
      .finally(() => setLoading(false));
  }, [courseId, nodeId]);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '160px auto' }} />;
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 24', opacity: 0.3 }}>
          <circle cx="32" cy="32" r="28" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M24 28h16M24 34h12M24 40h8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <Typography.Title level={3} style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 8 }}>
          暂无学习内容
        </Typography.Title>
        <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          该知识点的学习资料尚未上传，请稍后再来
        </Typography.Text>
        <div style={{ marginTop: 28 }}>
          <Button type="primary" icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/courses/${courseId}/graph`)}>
            返回知识图谱
          </Button>
        </div>
      </div>
    );
  }

  const { node, resources, quizzes } = data;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* ── 返回 ── */}
      <Button type="text" icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/courses/${courseId}/graph`)}
        style={{ color: 'var(--text-secondary)', paddingLeft: 0, marginBottom: 8, marginTop: 8 }}>
        返回图谱
      </Button>

      {/* ── 知识点标题 ── */}
      <Typography.Title level={2} style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: 28 }}>
        {node.name}
      </Typography.Title>

      {/* ── 描述 ── */}
      <Typography.Paragraph style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.9, marginBottom: 36 }}>
        {node.description}
      </Typography.Paragraph>

      {/* ── 学习资源 ── */}
      <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>
        学习资源
      </Typography.Title>

      {resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', marginBottom: 36 }}>
          暂无学习资源
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
          {resources.map((res, i) => (
            <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 22px', background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
                color: 'inherit', textDecoration: 'none',
                transition: 'all var(--duration-fast) var(--ease-out-expo)',
                animation: `fade-in-scale var(--duration-fast) var(--ease-out-expo) ${i * 60}ms both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-dim)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              {typeIcon[res.type] ?? typeIcon.LINK}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{res.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{typeLabel[res.type]}</div>
              </div>
              <Button type="link" size="small" style={{ color: 'var(--accent)' }}>打开</Button>
            </a>
          ))}
        </div>
      )}

      {/* ── 分隔 ── */}
      <hr className="divider-gradient" />

      {/* ── 关联测验 ── */}
      <Typography.Title level={4} style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>
        关联测验
      </Typography.Title>

      {quizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', marginBottom: 32 }}>
          暂无关联测验
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 60 }}>
          {quizzes.map((quiz, i) => (
            <div key={quiz.quizId}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', background: 'var(--accent-light)',
                border: '1px solid var(--accent-dim)', borderRadius: 'var(--radius-lg)',
                animation: `fade-in-scale var(--duration-fast) var(--ease-out-expo) ${i * 60}ms both`,
              }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  <FormOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
                  {quiz.name}
                </div>
                {quiz.deadline && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 28 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    截止 {quiz.deadline.slice(0, 10)}
                  </div>
                )}
              </div>
              <Button type="primary" size="large"
                onClick={() => navigate(`/courses/${courseId}/quizzes/${quiz.quizId}`)}
                style={{ height: 40, borderRadius: 'var(--radius-md)', fontSize: 14 }}>
                开始测验
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
