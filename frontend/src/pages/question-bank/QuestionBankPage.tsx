import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  App, Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, Spin, Empty,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, ReloadOutlined, DatabaseOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { BankQuestion, QuestionType } from '../../api/types';
import {
  createBankQuestion, fetchBankQuestions, importBankQuestions,
} from '../../api/teacher';
import { fetchGraph } from '../../api/graph';
import ImportUploadPanel from '../../components/ImportUploadPanel';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

const TYPE_LABEL: Record<QuestionType, string> = {
  SINGLE: '单选',
  JUDGE: '判断',
  MULTIPLE: '多选',
  SHORT: '简答',
  FILE: '文件题',
};

const TYPE_COLOR: Record<QuestionType, string> = {
  SINGLE: 'blue',
  JUDGE: 'green',
  MULTIPLE: 'purple',
  SHORT: 'gold',
  FILE: 'default',
};

/** FE-04 题库管理 */
export default function QuestionBankPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const numCourseId = Number(courseId);
  const { message } = App.useApp();
  const [list, setList] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [nodeOptions, setNodeOptions] = useState<{ label: string; value: number }[]>([]);
  const [form] = Form.useForm();
  const qType = Form.useWatch('type', form);

  const load = () => {
    if (!numCourseId) return;
    setLoading(true);
    fetchBankQuestions(numCourseId)
      .then(setList)
      .catch(() => message.error('加载题库失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetchGraph(numCourseId, 'teacher')
      .then((g) => setNodeOptions(g.nodes.map((n) => ({ label: n.name, value: n.id }))))
      .catch(() => setNodeOptions([]));
  }, [numCourseId]);

  const filteredList = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const content = (item.content ?? '').toLowerCase();
      const answer = (item.answer ?? '').toLowerCase();
      const type = (TYPE_LABEL[item.type] ?? item.type).toLowerCase();
      const nodes = (item.nodeNames?.length
        ? item.nodeNames.join(' ')
        : item.nodeIds.map((id) => String(id)).join(' ')
      ).toLowerCase();
      const score = String(item.score ?? '');
      return content.includes(q)
        || answer.includes(q)
        || type.includes(q)
        || nodes.includes(q)
        || score.includes(q);
    });
  }, [list, keyword]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const options = typeof values.optionsText === 'string'
        ? values.optionsText.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : undefined;
      await createBankQuestion(numCourseId, {
        content: values.content.trim(),
        type: values.type,
        options,
        answer: values.answer?.trim(),
        score: values.score,
        nodeIds: values.nodeIds ?? [],
      });
      message.success('题目已添加');
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<BankQuestion> = [
    {
      title: '题干',
      dataIndex: 'content',
      ellipsis: true,
      render: (t: string) => <span className="course-page-cell-name">{t}</span>,
    },
    {
      title: '题型',
      dataIndex: 'type',
      width: 90,
      render: (t: QuestionType) => <Tag color={TYPE_COLOR[t] ?? 'default'}>{TYPE_LABEL[t] ?? t}</Tag>,
    },
    {
      title: '分值',
      dataIndex: 'score',
      width: 70,
      render: (v: number) => <span className="dashboard-mastery">{v}</span>,
    },
    {
      title: '关联知识点',
      dataIndex: 'nodeNames',
      render: (names: string[] | undefined, row) => {
        const text = (names?.length ? names : row.nodeIds.map((id) => `#${id}`)).join('、') || '—';
        return <span className="course-page-cell-muted">{text}</span>;
      },
    },
  ];

  return (
    <div className="course-page course-page--question-bank page-enter">
      <CoursePageHeader
        title="题库管理"
        description="维护课程题目，支持单题录入与批量导入"
        badges={(
          <span className="course-page-badge">
            <DatabaseOutlined /> {list.length} 道题目
          </span>
        )}
        actions={(
          <Space wrap>
            <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>批量导入</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增题目</Button>
          </Space>
        )}
      />

      <section className="course-page-panel course-page-panel--accent">
        {loading ? (
          <div className="course-page-loading">
            <Spin size="large" />
            <span>加载题库…</span>
          </div>
        ) : (
          <>
            <div className="course-page-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="搜索题干、题型、知识点或答案"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="course-page-search"
              />
              <Button
                className="course-page-refresh"
                icon={<ReloadOutlined />}
                onClick={load}
                title="刷新"
                aria-label="刷新"
              />
              {keyword.trim() && (
                <span className="course-page-search-hint">
                  找到 {filteredList.length} / {list.length} 道
                </span>
              )}
            </div>
            {list.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无题目" className="dashboard-empty">
                <Space>
                  <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>批量导入</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增题目</Button>
                </Space>
              </Empty>
            ) : (
              <Table
                className="course-page-table"
                rowKey="id"
                columns={columns}
                dataSource={filteredList}
                locale={{ emptyText: '没有匹配的题目' }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            )}
          </>
        )}
      </section>

      <Modal
        title="新增题目"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={saving}
        destroyOnHidden
        width={640}
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }} initialValues={{ type: 'SINGLE', score: 5, nodeIds: [] }}>
          <Form.Item name="type" label="题型" rules={[{ required: true }]}>
            <Select options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="content" label="题干" rules={[{ required: true, message: '请输入题干' }]}>
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
          {(qType === 'SINGLE' || qType === 'MULTIPLE' || qType === 'JUDGE') && (
            <Form.Item name="optionsText" label="选项（每行一个）" rules={[{ required: true, message: '请填写选项' }]}>
              <Input.TextArea rows={4} placeholder={'A. ...\nB. ...'} />
            </Form.Item>
          )}
          <Form.Item name="answer" label="参考答案">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="score" label="分值" rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nodeIds" label="关联知识点">
            <Select mode="multiple" allowClear options={nodeOptions} optionFilterProp="label" placeholder="选择知识点" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入题目"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <ImportUploadPanel
          title="上传题库文件"
          hint="支持 CSV / Excel。题型字段建议：SINGLE / JUDGE / SHORT / FILE"
          onImport={(file) => importBankQuestions(numCourseId, file)}
          onSuccess={() => load()}
        />
      </Modal>
    </div>
  );
}
