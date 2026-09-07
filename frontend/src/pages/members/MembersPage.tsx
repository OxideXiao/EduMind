import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App, Table, Button, Modal, Spin, Empty, Input } from 'antd';
import { UploadOutlined, ReloadOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CourseMember } from '../../api/types';
import { fetchMembers } from '../../api/course';
import { getStudentImportTemplateUrl, importStudents } from '../../api/teacher';
import ImportUploadPanel from '../../components/ImportUploadPanel';
import CoursePageHeader from '../../components/layout/CoursePageHeader';

/** FE-01 课程成员 + 学生名单导入 */
export default function MembersPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const numCourseId = Number(courseId);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const load = () => {
    if (!numCourseId) return;
    setLoading(true);
    fetchMembers(numCourseId)
      .then(setMembers)
      .catch(() => message.error('加载成员失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [numCourseId]);

  const filteredMembers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = (m.name ?? '').toLowerCase();
      const email = (m.email ?? '').toLowerCase();
      const id = String(m.userId);
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }, [members, keyword]);

  const columns: ColumnsType<CourseMember> = [
    {
      title: '姓名', dataIndex: 'name', key: 'name',
      render: (v: string) => (
        <div className="dashboard-avatar-cell">
          <span className="dashboard-avatar">{v.charAt(0)}</span>
          <span className="dashboard-name-cell">{v}</span>
        </div>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v) => v || '—' },
    {
      title: '用户 ID', dataIndex: 'userId', key: 'userId', width: 100,
      render: (v: number) => <span className="dashboard-date">#{v}</span>,
    },
    {
      title: '加入时间', dataIndex: 'joinedAt', key: 'joinedAt', width: 140,
      render: (v: string) => <span className="dashboard-date">{v?.slice(0, 10) ?? '—'}</span>,
    },
    {
      title: '', key: 'action', width: 100,
      render: (_, row) => (
        <Button
          type="link"
          size="small"
          className="dashboard-link-btn"
          onClick={() => navigate(`/courses/${numCourseId}/students/${row.userId}`)}
        >
          学生详情 →
        </Button>
      ),
    },
  ];

  return (
    <div className="course-page course-page--members page-enter">
      <CoursePageHeader
        title="课程成员"
        description="查看学生名单，支持批量导入账号"
        badges={(
          <span className="course-page-badge">
            <UserOutlined /> {members.length} 名学生
          </span>
        )}
        actions={(
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            导入学生
          </Button>
        )}
      />

      <section className="course-page-panel course-page-panel--accent">
        {loading ? (
          <div className="course-page-loading">
            <Spin size="large" />
            <span>加载成员列表…</span>
          </div>
        ) : (
          <>
            <div className="members-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="搜索姓名、邮箱或用户 ID"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="members-search"
              />
              <Button
                className="course-page-refresh"
                icon={<ReloadOutlined />}
                onClick={load}
                title="刷新"
                aria-label="刷新"
              />
              {keyword.trim() && (
                <span className="members-search-hint">
                  找到 {filteredMembers.length} / {members.length} 人
                </span>
              )}
            </div>
            {members.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无成员"
                className="dashboard-empty"
              >
                <Button type="primary" icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
                  导入学生
                </Button>
              </Empty>
            ) : (
              <Table
                className="course-page-table"
                rowKey="userId"
                columns={columns}
                dataSource={filteredMembers}
                locale={{ emptyText: '没有匹配的成员' }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
              />
            )}
          </>
        )}
      </section>

      <Modal
        title="导入学生名单"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <ImportUploadPanel
          title="上传学生名单"
          hint="建议包含：姓名、学号/邮箱。导入后将按后端规则生成默认密码。"
          templateUrl={getStudentImportTemplateUrl(numCourseId)}
          onImport={(file) => importStudents(numCourseId, file)}
          onSuccess={() => { load(); }}
        />
      </Modal>
    </div>
  );
}
