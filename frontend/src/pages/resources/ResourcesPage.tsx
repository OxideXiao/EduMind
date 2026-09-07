import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  App, Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, Spin, Empty,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, FolderOpenOutlined, LinkOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TeachingResource } from '../../api/types';
import { createResource, deleteResource, fetchResources } from '../../api/teacher';
import { fetchGraph } from '../../api/graph';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

const TYPE_LABEL: Record<string, string> = {
  PDF: 'PDF', VIDEO: '视频', LINK: '链接', OTHER: '其他',
};

const TYPE_COLOR: Record<string, string> = {
  PDF: 'blue', VIDEO: 'purple', LINK: 'cyan', OTHER: 'default',
};

/** FE-03 教学资源管理 */
export default function ResourcesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const numCourseId = Number(courseId);
  const { message } = App.useApp();
  const [list, setList] = useState<TeachingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [nodeOptions, setNodeOptions] = useState<{ label: string; value: number }[]>([]);
  const [form] = Form.useForm();

  const load = () => {
    if (!numCourseId) return;
    setLoading(true);
    fetchResources(numCourseId)
      .then(setList)
      .catch(() => message.error('加载资源失败'))
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
    return list.filter((r) => {
      const name = (r.name ?? '').toLowerCase();
      const url = (r.url ?? '').toLowerCase();
      const type = (TYPE_LABEL[r.type] ?? r.type).toLowerCase();
      const nodes = (r.nodeNames?.length
        ? r.nodeNames.join(' ')
        : r.nodeIds.map((id) => String(id)).join(' ')
      ).toLowerCase();
      return name.includes(q) || url.includes(q) || type.includes(q) || nodes.includes(q);
    });
  }, [list, keyword]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createResource(numCourseId, {
        name: values.name.trim(),
        type: values.type,
        url: values.url.trim(),
        nodeIds: values.nodeIds ?? [],
      });
      message.success('资源已添加');
      setOpen(false);
      form.resetFields();
      load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<TeachingResource> = [
    {
      title: '名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="course-page-cell-name">{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (t: string) => <Tag color={TYPE_COLOR[t] ?? 'default'}>{TYPE_LABEL[t] ?? t}</Tag>,
    },
    {
      title: '关联知识点',
      dataIndex: 'nodeNames',
      render: (names: string[] | undefined, row) => {
        const text = (names?.length ? names : row.nodeIds.map((id) => `#${id}`)).join('、') || '—';
        return <span className="course-page-cell-muted">{text}</span>;
      },
    },
    {
      title: '链接',
      dataIndex: 'url',
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noreferrer" className="course-page-link" onClick={(e) => e.stopPropagation()}>
          <LinkOutlined /> {url}
        </a>
      ),
    },
    {
      title: '操作',
      width: 90,
      render: (_, row) => (
        <Popconfirm title="确定删除该资源？" onConfirm={async () => {
          try {
            await deleteResource(numCourseId, row.id);
            message.success('已删除');
            load();
          } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : '删除失败');
          }
        }}>
          <Button type="link" danger size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="course-page course-page--resources page-enter">
      <CoursePageHeader
        title="教学资源"
        description="上传或登记课件、视频与链接，并关联知识点"
        badges={(
          <span className="course-page-badge">
            <FolderOpenOutlined /> {list.length} 个资源
          </span>
        )}
        actions={(
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>添加资源</Button>
        )}
      />

      <section className="course-page-panel course-page-panel--accent">
        {loading ? (
          <div className="course-page-loading">
            <Spin size="large" />
            <span>加载资源列表…</span>
          </div>
        ) : (
          <>
            <div className="course-page-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="搜索名称、类型、知识点或链接"
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
                  找到 {filteredList.length} / {list.length} 个
                </span>
              )}
            </div>
            {list.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无教学资源" className="dashboard-empty">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>添加资源</Button>
              </Empty>
            ) : (
              <Table
                className="course-page-table"
                rowKey="id"
                columns={columns}
                dataSource={filteredList}
                locale={{ emptyText: '没有匹配的资源' }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            )}
          </>
        )}
      </section>

      <Modal
        title="添加教学资源"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={saving}
        destroyOnHidden
        okText="添加"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }} initialValues={{ type: 'PDF', nodeIds: [] }}>
          <Form.Item name="name" label="资源名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：链表课件.pdf" maxLength={80} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'PDF', label: 'PDF' },
              { value: 'VIDEO', label: '视频' },
              { value: 'LINK', label: '外部链接' },
              { value: 'OTHER', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="url" label="访问地址" rules={[{ required: true, message: '请输入 URL' }]}>
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item name="nodeIds" label="关联知识点">
            <Select mode="multiple" allowClear placeholder="选择知识点" options={nodeOptions} optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
