import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { App, Typography, Spin, Button } from 'antd';
import { BulbOutlined, ReloadOutlined, AlertOutlined } from '@ant-design/icons';
import type { TeachingAdvice } from '../../api/types';
import { generateTeachingAdvice } from '../../api/agent';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

const priorityClass: Record<string, string> = {
  HIGH: 'advice-priority advice-priority--high',
  MEDIUM: 'advice-priority advice-priority--medium',
  LOW: 'advice-priority advice-priority--low',
};
const priorityLabel: Record<string, string> = { HIGH: '高优先', MEDIUM: '中优先', LOW: '低优先' };

export default function TeachingAdvicePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { message } = App.useApp();
  const [advice, setAdvice] = useState<TeachingAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateTeachingAdvice(Number(courseId));
      setAdvice(result);
    } catch {
      message.error('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-page course-page--advice page-enter">
      <CoursePageHeader
        title="教学建议"
        description="AI 根据全班学情数据生成个性化教学建议"
        badges={advice && !loading ? (
          <span className="course-page-badge">
            <BulbOutlined /> {advice.suggestions.length} 条建议
          </span>
        ) : undefined}
        actions={advice && !loading ? (
          <Button icon={<ReloadOutlined />} onClick={handleGenerate}>
            重新生成
          </Button>
        ) : undefined}
      />

      {!advice && !loading && (
        <section className="advice-hero course-page-panel course-page-panel--accent">
          <div className="advice-hero__icon" aria-hidden>
            <BulbOutlined />
          </div>
          <Typography.Title level={4} className="advice-hero__title">
            尚未生成教学建议
          </Typography.Title>
          <Typography.Text className="advice-hero__desc">
            点击下方按钮，AI 将分析全班掌握度、薄弱知识点与测验表现，输出可执行的教学方案
          </Typography.Text>
          <button type="button" className="btn-slide" onClick={handleGenerate}>
            <span className="btn-slide__visible">生成教学建议</span>
            <span className="btn-slide__invisible">AI 分析</span>
          </button>
        </section>
      )}

      {loading && (
        <section className="advice-hero advice-hero--loading course-page-panel course-page-panel--accent">
          <Spin size="large" />
          <Typography.Text className="advice-hero__desc">
            AI 正在分析学情数据…
          </Typography.Text>
          <Typography.Text className="advice-hero__hint">
            预计数秒内完成
          </Typography.Text>
        </section>
      )}

      {advice && !loading && (
        <div className="advice-result">
          <section className="advice-diagnosis">
            <div className="advice-diagnosis__label">
              <AlertOutlined /> 问题诊断
            </div>
            <p className="advice-diagnosis__text">{advice.problem}</p>
          </section>

          <div className="advice-section-head">
            <Typography.Title level={4} className="dashboard-panel__title">
              建议方案
            </Typography.Title>
            <span className="dashboard-panel__subtitle">按优先级排列，可直接用于本周教学安排</span>
          </div>

          <ol className="advice-list">
            {advice.suggestions.map((s, idx) => (
              <li
                key={s.id}
                className="advice-item"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <span className="advice-item__index">{String(s.id).padStart(2, '0')}</span>
                <div className="advice-item__body">
                  <p className="advice-item__content">{s.content}</p>
                </div>
                <span className={priorityClass[s.priority] ?? priorityClass.LOW}>
                  {priorityLabel[s.priority] ?? s.priority}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
