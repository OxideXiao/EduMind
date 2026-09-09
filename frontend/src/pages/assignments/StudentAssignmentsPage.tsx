import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  App, Typography, Table, Button, Modal, Form, Input, Upload, Spin, Empty, Tag,
} from 'antd';
import {
  FormOutlined, ReloadOutlined, SearchOutlined, UploadOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import type { AssignmentSubmitType, StudentAssignmentView } from '../../api/types';
import { fetchStudentAssignments, submitAssignment } from '../../api/teacher';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

const SUBMIT_LABEL: Record<AssignmentSubmitType, string> = {
  ONLINE: '在线作答',
  FILE: '文件提交',
  MIXED: '在线 + 文件',
};

/** FE-06 学生作业列表与提交 */
export default function StudentAssignmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const numCourseId = Number(courseId);
  const { message } = App.useApp();
  const [list, setList] = useState<StudentAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState<StudentAssignmentView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const load = () => {
    if (!numCourseId) return;
    setLoading(true);
    fetchStudentAssignments(numCourseId)
      .then(setList)
      .catch(() => message.error('加载作业失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [numCourseId]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      return (a.title ?? '').toLowerCase().includes(q)
        || (a.description ?? '').toLowerCase().includes(q)
        || (SUBMIT_LABEL[a.submitType] ?? '').toLowerCase().includes(q);
    });
  }, [list, keyword]);

  const counts = useMemo(() => ({
    total: list.length,
    done: list.filter((a) => a.submitted).length,
    todo: list.filter((a) => !a.submitted).length,
  }), [list]);

  const openSubmit = (row: StudentAssignmentView) => {
    setActive(row);
    form.resetFields();
    setFileList([]);
  };

  const handleSubmit = async () => {
    if (!active) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const files = fileList
        .map((f) => f.originFileObj)
        .filter((f): f is File => Boolean(f));
      await submitAssignment(numCourseId, active.id, {
        textAnswer: values.textAnswer,
        files,
        fileName: files[0]?.name,
      });
      message.success('提交成功');
      setActive(null);
      load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<StudentAssignmentView> = [
    {
      title: '作业',
      dataIndex: 'title',
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
      width: 120,
      render: (t: AssignmentSubmitType) => SUBMIT_LABEL[t] ?? t,
    },
    {
      title: '截止',
      dataIndex: 'deadline',
      width: 160,
      render: (v?: string) => (
        <span className="dashboard-date">{v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'}</span>
      ),
    },
    {
      title: '状态',
      width: 110,
      render: (_, row) => (
        row.submitted
          ? <Tag color="success" icon={<CheckCircleOutlined />}>已提交</Tag>
          : <Tag>待提交</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 160,
      render: (v?: string) => (
        <span className="dashboard-date">{v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'}</span>
      ),
    },
    {
      title: '操作',
      width: 110,
      render: (_, row) => (
        <Button
          type="link"
          size="small"
          className="dashboard-link-btn"
          onClick={() => openSubmit(row)}
        >
          {row.submitted ? '查看' : '去提交'}
        </Button>
      ),
    },
  ];

  const needText = active && (active.submitType === 'ONLINE' || active.submitType === 'MIXED');
  const needFile = active && (active.submitType === 'FILE' || active.submitType === 'MIXED');

  return (
    <div className="course-page course-page--assignments page-enter">
      <CoursePageHeader
        title="我的作业"
        description="查看已发布作业并完成在线 / 文件提交"
        badges={(
          <>
            <span className="course-page-badge">
              <FormOutlined /> {counts.total} 份
            </span>
            {counts.todo > 0 && (
              <span className="course-page-badge course-page-badge--muted">
                {counts.todo} 待交
              </span>
            )}
            {counts.done > 0 && (
              <span className="course-page-badge course-page-badge--ok">
                {counts.done} 已交
              </span>
            )}
          </>
        )}
      />

      <section className="course-page-panel course-page-panel--accent">
        {loading ? (
          <div className="course-page-loading">
            <Spin size="large" />
            <span>加载作业…</span>
          </div>
        ) : (
          <>
            <div className="course-page-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="搜索作业标题"
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
            </div>
            {list.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无已发布作业"
                className="dashboard-empty"
              />
            ) : (
              <Table
                className="course-page-table"
                rowKey="id"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            )}
          </>
        )}
      </section>

      <Modal
        title={active?.title ?? '作业详情'}
        open={!!active}
        onCancel={() => setActive(null)}
        destroyOnHidden
        width={640}
        footer={
          active?.submitted
            ? [<Button key="close" onClick={() => setActive(null)}>关闭</Button>]
            : [
                <Button key="cancel" onClick={() => setActive(null)}>取消</Button>,
                <Button key="ok" type="primary" loading={submitting} onClick={handleSubmit}>提交</Button>,
              ]
        }
      >
        {active && (
          <>
            {active.description && (
              <Typography.Paragraph type="secondary">{active.description}</Typography.Paragraph>
            )}
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              提交方式：{SUBMIT_LABEL[active.submitType]}
              {active.deadline && ` · 截止 ${dayjs(active.deadline).format('YYYY-MM-DD HH:mm')}`}
            </div>
            {active.submitted ? (
              <Typography.Text>
                已于 {active.submittedAt ? dayjs(active.submittedAt).format('YYYY-MM-DD HH:mm') : '—'} 提交
                {active.score != null ? ` · 得分 ${active.score}` : ' · 待批改'}
              </Typography.Text>
            ) : (
              <Form form={form} layout="vertical">
                {needText && (
                  <Form.Item
                    name="textAnswer"
                    label="在线作答"
                    rules={[{ required: true, message: '请填写作答内容' }]}
                  >
                    <Input.TextArea rows={5} maxLength={2000} showCount placeholder="输入你的答案或解题说明" />
                  </Form.Item>
                )}
                {needFile && (
                  <Form.Item
                    label="上传文件"
                    required
                    extra="演示环境仅记录文件名，联调后对接真实上传"
                  >
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      fileList={fileList}
                      onChange={({ fileList: fl }) => setFileList(fl)}
                    >
                      <Button icon={<UploadOutlined />}>选择文件</Button>
                    </Upload>
                  </Form.Item>
                )}
              </Form>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
