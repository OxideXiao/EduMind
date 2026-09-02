import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Typography, Button, Modal, Input, DatePicker, Form, Row, Col, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { RightOutlined, BookOutlined, NodeIndexOutlined, TeamOutlined, CopyOutlined } from '@ant-design/icons';
import { useRole } from '../../hooks/useAuth';
import BrandCard from '../../components/BrandCard';
import EmptyState from '../../components/EmptyState';
import type { Course, CourseMember } from '../../api/types';
import { fetchCourses, createCourse, joinCourse, fetchMembers } from '../../api/course';

export default function CourseListPage() {
  const { message } = App.useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const { isTeacher, isStudent } = useRole();
  const navigate = useNavigate();

  const loadCourses = () => {
    setLoading(true);
    fetchCourses()
      .then(setCourses)
      .catch(() => message.error('加载课程列表失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCourses(); }, []);

  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const [start, end] = values.semesterRange as [Dayjs, Dayjs];
      const semester = `${start.format('YYYY.MM')} - ${end.format('YYYY.MM')}`;
      setCreating(true);
      const course = await createCourse({ name: values.name.trim(), semester, description: values.description?.trim() ?? '' });
      setCreateOpen(false);
      createForm.resetFields();
      if (course.inviteCode) {
        setCreatedCode(course.inviteCode);
        setCodeOpen(true);
      } else {
        message.success('课程创建成功');
      }
      loadCourses();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return; // 表单校验不通过
      message.error('创建失败');
    } finally { setCreating(false); }
  };

  // ── 成员管理 ──
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [currentCourseName, setCurrentCourseName] = useState('');

  const handleViewMembers = (course: Course) => {
    setCurrentCourseName(course.name);
    setMembersOpen(true);
    setMembersLoading(true);
    fetchMembers(course.id)
      .then(setMembers)
      .catch(() => message.error('加载成员列表失败'))
      .finally(() => setMembersLoading(false));
  };

  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinCourse(inviteCode);
      message.success('加入成功');
      setJoinOpen(false);
      setInviteCode('');
      loadCourses();
    } catch { message.error('邀请码无效'); } finally { setJoining(false); }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '160px auto' }} />;
  }

  return (
    <div>
      {/* ── Hero 区 ── */}
      <section style={{ padding: '64px 0 56px', textAlign: 'center' }}>
        <Typography.Title
          level={1}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          我的课程
        </Typography.Title>
        <Typography.Text
          style={{ color: 'var(--text-secondary)', fontSize: 17, display: 'block', maxWidth: 480, margin: '0 auto 36px' }}
        >
          {isTeacher
            ? '创建课程，构建知识图谱，开启智慧教学之旅'
            : '加入课程，探索知识星空，开启个性化学习'}
        </Typography.Text>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          {isTeacher && (
            <button type="button" className="btn-slide btn-slide--wide" onClick={() => setCreateOpen(true)}>
              <span className="btn-slide__visible">创建课程
              </span>
              <span className="btn-slide__invisible">构建知识图谱</span>
            </button>
          )}
          {isStudent && (
            <button type="button" className="btn-slide" onClick={() => setJoinOpen(true)}>
              <span className="btn-slide__visible">
                加入课程
              </span>
              <span className="btn-slide__invisible">立即加入</span>
            </button>
          )}
        </div>
      </section>

      {/* ── 课程网格 ── */}
      {courses.length === 0 ? (
        <EmptyState
          title="暂无课程"
          description={isTeacher ? '点击上方按钮创建你的第一门课程' : '点击上方按钮输入邀请码加入课程'}
        />
      ) : (
        <Row gutter={[28, 28]}>
          {courses.map((course, idx) => (
            <Col key={course.id} xs={24} sm={12} lg={8}>
              <BrandCard
                className="course-card"
                onClick={() => navigate(`/courses/${course.id}/graph`)}
                hover
                style={{ animation: `course-card-enter var(--duration-slow) var(--ease-out-expo) ${idx * 60}ms both` }}
              >
                <div className="course-card__body">
                  <div className="course-card__head">
                    <div className="course-card__icon">
                      <BookOutlined />
                    </div>
                    <span className="course-card__semester">{course.semester}</span>
                  </div>

                  <Typography.Title level={3} className="course-card__title">
                    {course.name}
                  </Typography.Title>

                  {course.description ? (
                    <p className="course-card__desc">{course.description}</p>
                  ) : null}

                  <div className="course-card__stats">
                    <span className="course-card__stat">
                      <NodeIndexOutlined />
                      {course.nodeCount ?? 0} 知识点
                    </span>
                    <span className="course-card__stat">
                      <TeamOutlined />
                      {course.studentCount ?? 0} 名学生
                    </span>
                  </div>

                  {isTeacher && course.inviteCode && (
                    <div className="course-card__invite">
                      邀请码
                      <span className="course-card__invite-code">{course.inviteCode}</span>
                      <CopyOutlined
                        className="course-card__copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(course.inviteCode!);
                          message.success('已复制');
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="course-card__footer">
                  {isTeacher ? (
                    <Button
                      type="link"
                      size="small"
                      className="course-card__members"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}/members`);
                      }}
                    >
                      <TeamOutlined style={{ marginRight: 2 }} />
                      成员 ({course.studentCount ?? 0})
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <Button type="text" size="small" className="course-card__enter">
                      进入课程 <RightOutlined style={{ fontSize: 10, marginLeft: 2 }} />
                    </Button>
                  </div>
                </div>
              </BrandCard>
            </Col>
          ))}
        </Row>
      )}

      {/* ── 创建课程 Modal ── */}
      <Modal
        title={<span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>创建课程</span>}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ paddingTop: 8 }} autoComplete="off">
          <Form.Item
            name="name"
            label="课程名称"
            rules={[
              { required: true, message: '请输入课程名称' },
              { min: 2, message: '课程名称至少2个字符' },
              { max: 30, message: '课程名称不超过30个字符' },
            ]}
          >
            <Input placeholder="例如：数据结构与算法" size="large" maxLength={30} />
          </Form.Item>

          <Form.Item
            name="semesterRange"
            label="学期起止日期"
            rules={[{ required: true, message: '请选择学期起止月份' }]}
          >
            <DatePicker.RangePicker
              picker="month"
              size="large"
              style={{ width: '100%' }}
              placeholder={['开始月份', '结束月份']}
              format="YYYY年MM月"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="课程描述"
            rules={[{ max: 200, message: '课程描述不超过200个字符' }]}
          >
            <Input.TextArea placeholder="简要描述课程内容和目标（可选）" rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 加入课程 Modal ── */}
      <Modal
        title={<span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>加入课程</span>}
        open={joinOpen} onCancel={() => setJoinOpen(false)} onOk={handleJoin}
        confirmLoading={joining} okText="加入" cancelText="取消"
      >
        <div style={{ paddingTop: 8 }}>
          <Input placeholder="输入6位邀请码" value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)} size="large" maxLength={6}
            style={{ textAlign: 'center', letterSpacing: 10, fontSize: 22, fontFamily: 'var(--font-mono)' }} />
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            演示邀请码：DEMO01
          </div>
        </div>
      </Modal>

      {/* ── 成员管理 ── */}
      <Modal
        title={<span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>成员管理 · {currentCourseName}</span>}
        open={membersOpen}
        onCancel={() => setMembersOpen(false)}
        footer={<Button onClick={() => setMembersOpen(false)}>关闭</Button>}
        loading={membersLoading}
      >
        {members.length === 0 && !membersLoading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>暂无学生加入</div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            maxHeight: 420, overflowY: 'auto',
            paddingRight: 4,
          }}>
            {members.map((m, i) => (
              <div key={m.userId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)',
                animation: `fade-in-scale var(--duration-fast) var(--ease-out-expo) ${i * 50}ms both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: 13,
                  }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      加入于 {m.joinedAt.slice(0, 10)}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  ID: {m.userId}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── 创建成功 → 邀请码 ── */}
      <Modal
        title={<span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>🎉 课程创建成功</span>}
        open={codeOpen}
        onCancel={() => setCodeOpen(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(createdCode); message.success('邀请码已复制'); }}>
            复制邀请码
          </Button>,
          <Button key="ok" type="primary" onClick={() => setCodeOpen(false)}>知道了</Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Typography.Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 16 }}>
            将邀请码分享给学生，即可加入本课程
          </Typography.Text>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700,
            color: 'var(--accent)', letterSpacing: 8,
            background: 'var(--accent-light)', padding: '12px 24px',
            borderRadius: 'var(--radius-md)', display: 'inline-block',
          }}>
            {createdCode}
          </div>
        </div>
      </Modal>
    </div>
  );
}
