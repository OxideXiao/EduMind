import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  App, Typography, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Spin, Empty,
} from 'antd';
import { PlusOutlined, ReloadOutlined, FormOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Assignment, AssignmentStatus, AssignmentSubmitType } from '../../api/types';
import { createAssignment, fetchAssignments, publishAssignment } from '../../api/teacher';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

const STATUS_MAP: Record<AssignmentStatus, { className: string; label: string }> = {
  DRAFT: { className: 'assignments-status assignments-status--draft', label: '草稿' },
  PUBLISHED: { className: 'assignments-status assignments-status--published', label: '已发布' },
  CLOSED: { className: 'assignments-status assignments-status--closed', label: '已截止' },
};

const SUBMIT_LABEL: Record<AssignmentSubmitType, string> = {
  ONLINE: '在线作答',
  FILE: '文件提交',
  MIXED: '在线 + 文件',
};

/** FE-05 作业发布 */
export default function AssignmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const numCourseId = Number(courseId);
  const { message } = App.useApp();
  const [list, setList] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const load = () => {
    if (!numCourseId) return;
    setLoading(true);
    fetchAssignments(numCourseId)
      .then(setList)
      .catch(() => message.error('加载作业失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [numCourseId]);

  const counts = useMemo(() => ({
    total: list.length,
    draft: list.filter((a) => a.status === 'DRAFT').length,
    published: list.filter((a) => a.status === 'PUBLISHED').length,
  }), [list]);

  const filteredList = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const title = (a.title ?? '').toLowerCase();
      const desc = (a.description ?? '').toLowerCase();
      const status = (STATUS_MAP[a.status]?.label ?? a.status).toLowerCase();
      const submit = (SUBMIT_LABEL[a.submitType] ?? a.submitType).toLowerCase();
      const deadline = a.deadline
        ? dayjs(a.deadline).format('YYYY-MM-DD HH:mm').toLowerCase()
        : '';
      return title.includes(q)
        || desc.includes(q)
        || status.includes(q)
        || submit.includes(q)
        || deadline.includes(q);
    });
  }, [list, keyword]);

  const handleCreate = async (publish: boolean) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createAssignment(numCourseId, {
        title: values.title.trim(),
        description: values.description?.trim() ?? '',
        deadline: values.deadline ? values.deadline.toISOString() : undefined,
        questionCount: values.questionCount,
        submitType: values.submitType,
        publish,
      });
      message.success(publish ? '作业已发布' : '草稿已保存');
      setOpen(false);
      form.resetFields();
      load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (row: Assignment) => {
    try {
      await publishAssignment(numCourseId, row.id);
      message.success('已发布');
      load();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '发布失败');
    }
  };

  const columns: ColumnsType<Assignment> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, row) => (
        <div className="assignments-title-cell">
          <span className="course-page-cell-name">{v}</span>
          {row.description && (
            <span className="course-page-cell-muted assignments-title-cell__desc">{row.description}</span>
          )}
        </div>
      ),
    },
    {
      title: '提交方式',
      dataIndex: 'submitType',
      width: 130,
      render: (t: AssignmentSubmitType) => (
        <span className="assignments-submit">{SUBMIT_LABEL[t] ?? t}</span>
      ),
    },
    {
      title: '题量',
      dataIndex: 'questionCount',
      width: 72,
      render: (v: number) => <span className="dashboard-mastery">{v}</span>,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      width: 170,
      render: (v?: string) => (
        <span className="dashboard-date">
          {v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: AssignmentStatus) => {
        const meta = STATUS_MAP[s];
        return <span className={meta.className}>{meta.label}</span>;
      },
    },
    {
      title: '操作',
      width: 100,
      render: (_, row) =>
        row.status === 'DRAFT' ? (
          <Button type="link" size="small" className="dashboard-link-btn" onClick={() => handlePublish(row)}>
            发布
          </Button>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ];

  return (
    <div className="course-page course-page--assignments page-enter">
      <CoursePageHeader
        title="作业管理"
        description="发布作业，支持在线作答、文件提交或混合方式"
        badges={(
          <>
            <span className="course-page-badge">
              <FormOutlined /> {counts.total} 份作业
            </span>
            {counts.draft > 0 && (
              <span className="course-page-badge course-page-badge--muted">
                {counts.draft} 草稿
              </span>
            )}
            {counts.published > 0 && (
              <span className="course-page-badge course-page-badge--ok">
                {counts.published} 已发布
              </span>
            )}
          </>
        )}
        actions={(
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            发布作业
          </Button>
        )}
      />

      <section className="course-page-panel course-page-panel--accent">
        {loading ? (
          <div className="course-page-loading">
            <Spin size="large" />
            <span>加载作业列表…</span>
          </div>
        ) : (
          <>
            <div className="course-page-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="搜索标题、状态、提交方式或截止时间"
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
                  找到 {filteredList.length} / {list.length} 份
                </span>
              )}
            </div>
            {list.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无作业"
                className="dashboard-empty"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                  发布作业
                </Button>
              </Empty>
            ) : (
              <Table
                className="course-page-table"
                rowKey="id"
                columns={columns}
                dataSource={filteredList}
                locale={{ emptyText: '没有匹配的作业' }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            )}
          </>
        )}
      </section>

      <Modal
        title="创建 / 发布作业"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        destroyOnHidden
        width={640}
        footer={[
          <Button key="cancel" onClick={() => { setOpen(false); form.resetFields(); }}>取消</Button>,
          <Button key="draft" loading={saving} onClick={() => handleCreate(false)}>存为草稿</Button>,
          <Button key="pub" type="primary" loading={saving} onClick={() => handleCreate(true)}>直接发布</Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 12 }}
          initialValues={{ submitType: 'MIXED', questionCount: 5 }}
        >
          <Form.Item name="title" label="作业标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={60} placeholder="例如：第3周链表巩固作业" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="作业要求、提交说明等" />
          </Form.Item>
          <Form.Item name="submitType" label="提交方式" rules={[{ required: true }]}>
            <Select options={[
              { value: 'ONLINE', label: '在线作答' },
              { value: 'FILE', label: '文件提交（非选择题 / 实践说明）' },
              { value: 'MIXED', label: '在线作答 + 文件' },
            ]} />
          </Form.Item>
          <Form.Item name="questionCount" label="题目数量" rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
