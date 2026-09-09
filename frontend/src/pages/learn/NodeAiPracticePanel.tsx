import { useMemo, useState } from 'react';
import { App, Typography, Button, Select, Radio, InputNumber, Spin, Progress, Space } from 'antd';
import {
  ThunderboltOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { generateQuestions } from '../../api/agent';
import type { AiGeneratedQuestion, AiQuestionSet, AiQuestionType } from '../../api/types';

interface Props {
  courseId: number;
  nodeId: number;
  nodeName?: string;
}

/** 节点学习页内嵌：针对当前知识点 AI 生题并练习 */
export default function NodeAiPracticePanel({ courseId, nodeId, nodeName }: Props) {
  const { message } = App.useApp();
  const [questionType, setQuestionType] = useState<AiQuestionType>('MIXED');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [setData, setSetData] = useState<AiQuestionSet | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setChecked(false);
    setAnswers({});
    try {
      const data = await generateQuestions(courseId, { nodeId, questionType, count });
      setSetData(data);
      message.success('题目已生成');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const scoreInfo = useMemo(() => {
    if (!setData || !checked) return null;
    let correct = 0;
    let total = 0;
    setData.questions.forEach((q) => {
      total += q.score;
      if (q.answer && answers[q.id] === q.answer) correct += q.score;
    });
    const hasAnswerKey = setData.questions.some((q) => Boolean(q.answer));
    return {
      correct,
      total,
      hasAnswerKey,
      ratio: total ? Math.round((correct / total) * 100) : 0,
    };
  }, [setData, checked, answers]);

  const handleCheck = () => {
    if (!setData) return;
    const unanswered = setData.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      message.warning(`还有 ${unanswered.length} 题未作答`);
      return;
    }
    setChecked(true);
  };

  return (
    <section className="node-ai-practice">
      <div className="node-ai-practice__head">
        <div>
          <Typography.Title level={4} className="node-ai-practice__title">
            AI 练习生题
          </Typography.Title>
          <Typography.Text type="secondary">
            针对{nodeName ? `「${nodeName}」` : '本知识点'}生成单选 / 判断练习，可即时核对
          </Typography.Text>
        </div>
        <Button
          type="primary"
          className="graph-import-btn"
          icon={<ThunderboltOutlined />}
          loading={generating}
          onClick={handleGenerate}
        >
          {setData ? '重新生成' : '生成练习'}
        </Button>
      </div>

      <div className="node-ai-practice__config">
        <div className="ai-practice-field">
          <label className="ai-practice-field__label">题型</label>
          <Select
            value={questionType}
            onChange={setQuestionType}
            style={{ width: '100%' }}
            options={[
              { value: 'MIXED', label: '单选 + 判断' },
              { value: 'SINGLE', label: '仅单选' },
              { value: 'JUDGE', label: '仅判断' },
            ]}
          />
        </div>
        <div className="ai-practice-field ai-practice-field--count">
          <label className="ai-practice-field__label">题量</label>
          <InputNumber
            min={3}
            max={10}
            value={count}
            onChange={(v) => setCount(v ?? 5)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {generating && (
        <div className="ai-practice-loading node-ai-practice__loading">
          <Spin size="large" />
          <Typography.Text type="secondary">AI 正在出题…</Typography.Text>
        </div>
      )}

      {!generating && setData && (
        <div className="node-ai-practice__result">
          <div className="ai-practice-result__head">
            <div>
              <div className="ai-practice-result__title" style={{ fontSize: 16, fontWeight: 600 }}>
                {setData.nodeName || nodeName} · 练习卷
              </div>
              <Typography.Text type="secondary">
                {setData.summary ?? '完成作答后可核对解析'}
                {' · '}
                生成于 {dayjs(setData.generatedAt).format('MM-DD HH:mm')}
              </Typography.Text>
            </div>
            {checked && scoreInfo && (
              <div className="ai-practice-score">
                <span className="ai-practice-score__num">
                  {scoreInfo.hasAnswerKey ? `${scoreInfo.ratio}%` : '—'}
                </span>
                <span className="ai-practice-score__hint">
                  {scoreInfo.hasAnswerKey
                    ? `得分 ${scoreInfo.correct} / ${scoreInfo.total}`
                    : '接口未返回答案，仅供浏览'}
                </span>
              </div>
            )}
          </div>

          {checked && scoreInfo?.hasAnswerKey && (
            <Progress
              percent={scoreInfo.ratio}
              showInfo={false}
              strokeColor="var(--accent)"
              style={{ marginBottom: 16 }}
            />
          )}

          <ol className="ai-practice-list">
            {setData.questions.map((q, idx) => (
              <QuestionItem
                key={q.id}
                index={idx + 1}
                question={q}
                value={answers[q.id]}
                checked={checked}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              />
            ))}
          </ol>

          <div className="ai-practice-footer">
            <Space wrap>
              {!checked ? (
                <Button type="primary" className="graph-import-btn" onClick={handleCheck}>
                  提交核对
                </Button>
              ) : (
                <Button
                  className="graph-import-btn"
                  icon={<ReloadOutlined />}
                  onClick={() => { setChecked(false); setAnswers({}); }}
                >
                  再练一次（同卷）
                </Button>
              )}
              <Button
                className="graph-import-btn"
                icon={<ThunderboltOutlined />}
                loading={generating}
                onClick={handleGenerate}
              >
                换一批题
              </Button>
            </Space>
            <Typography.Text type="secondary" className="ai-practice-footnote">
              本页为个性化练习，不计入正式测验成绩
            </Typography.Text>
          </div>
        </div>
      )}
    </section>
  );
}

function QuestionItem({
  index,
  question,
  value,
  checked,
  onChange,
}: {
  index: number;
  question: AiGeneratedQuestion;
  value?: string;
  checked: boolean;
  onChange: (v: string) => void;
}) {
  const isCorrect = checked && question.answer != null && value === question.answer;
  const isWrong = checked && question.answer != null && value != null && value !== question.answer;

  return (
    <li className={`ai-practice-item${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}>
      <div className="ai-practice-item__meta">
        <span className="ai-practice-item__index">{index}</span>
        <span className="ai-practice-item__type">{question.type === 'JUDGE' ? '判断' : '单选'}</span>
        <span className="ai-practice-item__score">{question.score} 分</span>
        {checked && question.answer != null && (
          isCorrect
            ? <CheckCircleOutlined className="ai-practice-item__flag ai-practice-item__flag--ok" />
            : <CloseCircleOutlined className="ai-practice-item__flag ai-practice-item__flag--bad" />
        )}
      </div>
      <p className="ai-practice-item__stem">{question.content}</p>
      <Radio.Group
        className="ai-practice-item__options"
        value={value}
        disabled={checked}
        onChange={(e) => onChange(e.target.value)}
        options={question.options.map((opt) => ({ label: opt, value: opt }))}
      />
      {checked && question.answer && (
        <div className="ai-practice-item__explain">
          <div>参考答案：{question.answer}</div>
          {question.analysis && <div>解析：{question.analysis}</div>}
        </div>
      )}
    </li>
  );
}
