import { useState, useEffect, useReducer } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App, Typography, Button, Radio, Progress, Spin, Empty, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Quiz, QuizSubmissionRecord, SubmitResult } from '../../api/types';
import { fetchQuiz, fetchQuizSubmission, submitQuiz } from '../../api/quiz';
import { normalizeQuestionType } from '../../utils/apiNormalize';

const TYPE_LABEL: Record<string, string> = {
  SINGLE: '单选题',
  JUDGE: '判断题',
  MULTIPLE: '多选题',
  SHORT: '简答题',
  FILE: '文件题',
  SINGLE_CHOICE: '单选题',
  TRUE_FALSE: '判断题',
  MULTIPLE_CHOICE: '多选题',
  FILL_BLANK: '填空题',
  SHORT_ANSWER: '简答题',
};

/* ── 答题状态 ── */
interface QuizState {
  quiz: Quiz | null;
  answers: Record<number, string>;
  currentIndex: number;
  submitted: boolean;
  result: SubmitResult | null;
  record: QuizSubmissionRecord | null;
}
type Action =
  | { type: 'LOAD'; quiz: Quiz }
  | { type: 'ANSWER'; questionId: number; value: string }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'JUMP'; index: number }
  | { type: 'SUBMIT'; result: SubmitResult; record: QuizSubmissionRecord | null };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        quiz: action.quiz,
        answers: {},
        currentIndex: 0,
        submitted: false,
        result: null,
        record: null,
      };
    case 'ANSWER':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case 'NEXT':
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, (state.quiz?.questions.length ?? 1) - 1) };
    case 'PREV':
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
    case 'JUMP':
      return { ...state, currentIndex: action.index };
    case 'SUBMIT':
      return { ...state, submitted: true, result: action.result, record: action.record };
    default:
      return state;
  }
}

export default function QuizPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [state, dispatch] = useReducer(reducer, {
    quiz: null, answers: {}, currentIndex: 0, submitted: false, result: null, record: null,
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
      let record: QuizSubmissionRecord | null = null;
      if (result.submissionId != null) {
        try {
          record = await fetchQuizSubmission(result.submissionId);
        } catch {
          // 提交成功但拉详情失败时仍展示总分
        }
      }
      dispatch({ type: 'SUBMIT', result, record });
      message.success('提交成功！');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '160px auto' }} />;

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
    const record = state.record;
    const showTeacherFields = Boolean(
      record?.answers.some((a) => a.isCorrect != null || a.correctAnswer != null || a.analysis != null),
    );

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>
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
            满分 {r.totalScore} 分
            {r.totalScore > 0 ? ` · 正确率 ${Math.round((r.score / r.totalScore) * 100)}%` : ''}
            {record?.submittedAt
              ? ` · ${dayjs(record.submittedAt).format('YYYY-MM-DD HH:mm')}`
              : ''}
          </Typography.Text>
        </div>

        {r.masteryUpdates.length > 0 && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 24,
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

        {record && record.answers.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <Typography.Title level={4} style={{ marginBottom: 16 }}>
              作答明细{showTeacherFields ? '（含解析）' : ''}
            </Typography.Title>
            {record.answers.map((a, idx) => {
              const typeKey = normalizeQuestionType(a.type);
              return (
                <div
                  key={a.questionId}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <Typography.Text strong style={{ fontSize: 15, lineHeight: 1.5 }}>
                      {idx + 1}. {a.stem}
                    </Typography.Text>
                    <div style={{ flexShrink: 0 }}>
                      <Tag>{TYPE_LABEL[a.type] ?? TYPE_LABEL[typeKey] ?? a.type}</Tag>
                      {a.isCorrect === true && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>正确</Tag>
                      )}
                      {a.isCorrect === false && (
                        <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
                      )}
                      {a.score != null && <Tag color="blue">{a.score} 分</Tag>}
                    </div>
                  </div>

                  {a.options.length > 0 && (
                    <div style={{ marginBottom: 10, displayLeft: 4 }}>
                      {a.options.map((opt) => {
                        const picked = a.studentAnswer.split(',').map((s) => s.trim()).includes(opt.label);
                        return (
                          <div
                            key={opt.label}
                            style={{
                              fontSize: 14,
                              color: picked ? 'var(--accent)' : 'var(--text-secondary)',
                              fontWeight: picked ? 600 : 400,
                              marginBottom: 4,
                            }}
                          >
                            {opt.label}. {opt.content}
                            {opt.isCorrect === true ? ' ✓' : ''}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Typography.Text style={{ display: 'block', fontSize: 14 }}>
                    你的答案：{a.studentAnswer || '—'}
                  </Typography.Text>
                  {a.correctAnswer != null && (
                    <Typography.Text style={{ display: 'block', fontSize: 14, marginTop: 4 }}>
                      正确答案：{a.correctAnswer}
                    </Typography.Text>
                  )}
                  {a.analysis && (
                    <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                      解析：{a.analysis}
                    </Typography.Paragraph>
                  )}
                </div>
              );
            })}
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
          {TYPE_LABEL[question.type] ?? question.type}
        </div>
        <Typography.Title level={3} style={{ fontSize: 19, fontWeight: 600, marginBottom: 28, lineHeight: 1.6 }}>
          {current + 1}. {question.content}
        </Typography.Title>

        <Radio.Group
          value={state.answers[question.id]}
          onChange={(e) => dispatch({ type: 'ANSWER', questionId: question.id, value: e.target.value })}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {question.options.map((opt) => (
            <div key={opt.label} style={{
              padding: '13px 18px', borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${state.answers[question.id] === opt.label ? 'var(--accent)' : 'var(--border-default)'}`,
              background: state.answers[question.id] === opt.label ? 'var(--accent-light)' : 'var(--bg-surface)',
              cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-out-expo)',
            }}
              onClick={() => dispatch({ type: 'ANSWER', questionId: question.id, value: opt.label })}
              onMouseEnter={(e) => {
                if (state.answers[question.id] !== opt.label) {
                  e.currentTarget.style.borderColor = 'var(--accent-dim)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (state.answers[question.id] !== opt.label) {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }
              }}>
              <Radio value={opt.label} style={{ fontSize: 15 }}>
                <span style={{ fontSize: 15 }}>{opt.label}. {opt.content}</span>
              </Radio>
            </div>
          ))}
        </Radio.Group>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 40 }}>
        <Button size="large" disabled={current === 0}
          onClick={() => dispatch({ type: 'PREV' })}
          style={{ height: 46, padding: '0 24px', borderRadius: 'var(--radius-md)' }}>
          上一题
        </Button>

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
