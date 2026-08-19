import { useState, useEffect, useReducer } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Radio, Progress, Spin, message, Empty, Modal } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, TrophyOutlined, RiseOutlined } from '@ant-design/icons';
import type { Quiz, SubmitResult } from '../../api/types';
import { fetchQuiz, submitQuiz } from '../../api/quiz';

/* ── 答题状态 ── */
interface QuizState {
  quiz: Quiz | null;
  answers: Record<number, string>;
  currentIndex: number;
  submitted: boolean;
  result: SubmitResult | null;
}
type Action =
  | { type: 'LOAD'; quiz: Quiz }
  | { type: 'ANSWER'; questionId: number; value: string }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'JUMP'; index: number }
  | { type: 'SUBMIT'; result: SubmitResult };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, quiz: action.quiz, answers: {}, currentIndex: 0, submitted: false, result: null };
    case 'ANSWER':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case 'NEXT':
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, (state.quiz?.questions.length ?? 1) - 1) };
    case 'PREV':
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
    case 'JUMP':
      return { ...state, currentIndex: action.index };
    case 'SUBMIT':
      return { ...state, submitted: true, result: action.result };
    default:
      return state;
  }
}

export default function QuizPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [state, dispatch] = useReducer(reducer, {
    quiz: null, answers: {}, currentIndex: 0, submitted: false, result: null,
  });

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    fetchQuiz(Number(quizId))
      .then((quiz) => dispatch({ type: 'LOAD', quiz }))
      .catch(() => setError('测验不存在'))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleSubmit = async () => {
    if (!quizId) return;
    setSubmitting(true);
    try {
      const result = await submitQuiz(Number(quizId), state.answers);
      dispatch({ type: 'SUBMIT', result });
      message.success('提交成功！');
    } catch { message.error('提交失败'); }
    finally { setSubmitting(false); }
  };

  // ── 加载态 ──
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '160px auto' }} />;

  // ── 错误态 ──
  if (error || !state.quiz) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Empty description={error || '测验不存在'} />
        <Button type="primary" style={{ marginTop: 16 }}
          onClick={() => navigate(`/courses/${courseId}/graph`)}>返回图谱</Button>
      </div>
    );
  }

  const { quiz } = state;
  const total = quiz.questions.length;
  const current = state.currentIndex;
  const question = quiz.questions[current];
  const progress = Math.round(((current + 1) / total) * 100);
  const answeredCount = Object.keys(state.answers).length;

  // ── 提交结果页 ──
  if (state.submitted && state.result) {
    const r = state.result;
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0 40px' }}>
          <div style={{ animation: 'score-pop var(--duration-slow) var(--ease-spring) both' }}>
            <TrophyOutlined style={{ fontSize: 56, color: 'var(--accent)', marginBottom: 20 }} />
          </div>
          <Typography.Title level={1} style={{
            fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700,
            marginBottom: 8, animation: 'fade-in-scale var(--duration-slow) var(--ease-out-expo) 150ms both',
          }}>
            {r.score} 分
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            满分 {r.totalScore} 分 · 正确率 {r.totalScore > 0 ? Math.round((r.score / r.totalScore) * 100) : 0}%
          </Typography.Text>
        </div>

        {/* 掌握度变化 */}
        {r.masteryUpdates.length > 0 && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 32,
          }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 14, fontSize: 15 }}>
              <RiseOutlined style={{ marginRight: 6, color: 'var(--accent)' }} />掌握度变化
            </Typography.Text>
            {r.masteryUpdates.map((u, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < r.masteryUpdates.length - 1 ? '1px solid var(--border-default)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{u.label}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15,
                  color: u.change >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                  {u.change >= 0 ? '+' : ''}{u.change}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <Button size="large" onClick={() => navigate(`/courses/${courseId}/graph`)}
            style={{ height: 46, padding: '0 28px', borderRadius: 'var(--radius-md)' }}>
            返回图谱
          </Button>
          <Button type="primary" size="large"
            onClick={() => { dispatch({ type: 'LOAD', quiz }); }}
            style={{ height: 46, padding: '0 28px', borderRadius: 'var(--radius-md)' }}>
            重新作答
          </Button>
        </div>
      </div>
    );
  }

  // ── 答题页 ──
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* 顶部 */}
      <Button type="text" icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/courses/${courseId}/graph`)}
        style={{ color: 'var(--text-secondary)', paddingLeft: 0, marginBottom: 4, marginTop: 4 }}>
        返回图谱
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ fontFamily: 'var(--font-display)', marginBottom: 0, fontSize: 26 }}>
            {quiz.name}
          </Typography.Title>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          已答 {answeredCount}/{total} 题
        </span>
      </div>

      <Progress percent={progress} showInfo={false}
        strokeColor="var(--accent)" trailColor="var(--border-default)" style={{ marginBottom: 28 }} />

      {/* 题目 */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)', padding: '36px 40px', marginBottom: 24,
        boxShadow: 'var(--shadow-sm)', minHeight: 280,
        animation: 'fade-in-scale var(--duration-fast) var(--ease-out-expo)',
      }} key={question.id}>
        <div style={{
          display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--accent)', background: 'var(--accent-light)',
          padding: '2px 10px', borderRadius: 4, marginBottom: 18,
        }}>
          {question.type === 'SINGLE' ? '单选题' : '判断题'}
        </div>
        <Typography.Title level={3} style={{ fontSize: 19, fontWeight: 600, marginBottom: 28, lineHeight: 1.6 }}>
          {current + 1}. {question.content}
        </Typography.Title>

        <Radio.Group
          value={state.answers[question.id]}
          onChange={(e) => dispatch({ type: 'ANSWER', questionId: question.id, value: e.target.value })}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {question.options.map((opt, i) => (
            <div key={i} style={{
              padding: '13px 18px', borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${state.answers[question.id] === opt ? 'var(--accent)' : 'var(--border-default)'}`,
              background: state.answers[question.id] === opt ? 'var(--accent-light)' : 'var(--bg-surface)',
              cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-out-expo)',
            }}
              onClick={() => dispatch({ type: 'ANSWER', questionId: question.id, value: opt })}
              onMouseEnter={(e) => {
                if (state.answers[question.id] !== opt) {
                  e.currentTarget.style.borderColor = 'var(--accent-dim)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (state.answers[question.id] !== opt) {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }
              }}>
              <Radio value={opt} style={{ fontSize: 15 }}>
                <span style={{ fontSize: 15 }}>{String.fromCharCode(65 + i)}. {opt}</span>
              </Radio>
            </div>
          ))}
        </Radio.Group>
      </div>

      {/* 底部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 40 }}>
        <Button size="large" disabled={current === 0}
          onClick={() => dispatch({ type: 'PREV' })}
          style={{ height: 46, padding: '0 24px', borderRadius: 'var(--radius-md)' }}>
          上一题
        </Button>

        {/* 题号导航 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {quiz.questions.map((q, i) => (
            <button key={q.id}
              onClick={() => dispatch({ type: 'JUMP', index: i })}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1.5px solid',
                borderColor: i === current ? 'var(--accent)' : state.answers[q.id] ? 'var(--accent-dim)' : 'var(--border-default)',
                background: i === current ? 'var(--accent)' : state.answers[q.id] ? 'var(--accent-light)' : 'transparent',
                color: i === current ? '#fff' : state.answers[q.id] ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-out-expo)',
              }}>
              {i + 1}
            </button>
          ))}
        </div>

        {current < total - 1 ? (
          <Button type="primary" size="large"
            onClick={() => dispatch({ type: 'NEXT' })}
            style={{ height: 46, padding: '0 24px', borderRadius: 'var(--radius-md)' }}>
            下一题
          </Button>
        ) : (
          <Button type="primary" size="large"
            onClick={handleSubmit} loading={submitting}
            disabled={answeredCount < total}
            style={{ height: 46, padding: '0 28px', borderRadius: 'var(--radius-md)', background: answeredCount === total ? 'var(--accent)' : undefined }}>
            <CheckCircleOutlined /> 交卷
          </Button>
        )}
      </div>
    </div>
  );
}
