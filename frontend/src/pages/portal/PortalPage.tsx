import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  message,
  Row,
  Col,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  NodeIndexOutlined,
  BulbOutlined,
  DashboardOutlined,
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  RocketOutlined,
  StarFilled,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { login } from '../../api/auth';
import LiquidEther from '../../components/LiquidEther';

const { Title, Text } = Typography;

/* ═══════════════════════════════════════════════════════════
   功能卡片数据
   ═══════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: <NodeIndexOutlined style={{ fontSize: 28 }} />,
    title: '知识图谱可视化',
    desc: '交互式课程知识图谱，直观展示知识点间的依赖与关联，掌握度用颜色一目了然。',
    color: '#4f6d8c',
  },
  {
    icon: <BulbOutlined style={{ fontSize: 28 }} />,
    title: 'AI 智能推荐',
    desc: '基于掌握度分析，自动生成个性化学习路径与练习题推荐，因材施教。',
    color: '#7c3aed',
  },
  {
    icon: <DashboardOutlined style={{ fontSize: 28 }} />,
    title: '学情数据分析',
    desc: '多维度学情看板，全班掌握度热力图、个体轨迹曲线，数据驱动教学决策。',
    color: '#0891b2',
  },
  {
    icon: <CalendarOutlined style={{ fontSize: 28 }} />,
    title: '智能计划与提醒',
    desc: 'AI 自动规划学习周计划，智能推送复习提醒，科学安排备考节奏。',
    color: '#d97706',
  },
];

/* ═══════════════════════════════════════════════════════════
   亮点数据
   ═══════════════════════════════════════════════════════════ */
const HIGHLIGHTS = [
  { icon: <StarFilled />, value: 'G6 图谱引擎', label: '高性能渲染' },
  { icon: <SafetyOutlined />, value: 'JWT 认证', label: '安全可靠' },
  { icon: <TeamOutlined />, value: '师生双角色', label: '全场景覆盖' },
];

/* ═══════════════════════════════════════════════════════════
   门户主页
   ═══════════════════════════════════════════════════════════ */
export default function PortalPage() {
  const [loading, setLoading] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuth();
  const [form] = Form.useForm();

  /* 监听滚动：滑过 Hero 后导航栏吸附并显示白底 */
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (heroRef.current) {
          const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight;
          setIsSticky(window.scrollY >= heroBottom - 80);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /** 滚动到 CTA 登录区 */
  const scrollToCta = useCallback(() => {
    ctaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleEnter = useCallback(() => {
    if (isAuthenticated) {
      navigate('/courses');
    } else {
      scrollToCta();
    }
  }, [isAuthenticated, navigate, scrollToCta]);

  /** 登录提交 */
  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await login(values);
      setAuth(res.user, res.token);
      message.success(`欢迎回来，${res.user.name}`);
      navigate('/courses');
    } catch {
      message.error('登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-root)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══ 固定导航栏 — 滑过 Hero 后才显示 ═══ */}
      <header
        className={isSticky ? 'sticky-header' : ''}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          padding: '0 48px',
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          transform: isSticky ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: '50%' }}
            />
            <span
              style={{
                fontSize: 19,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: '#1a1a2e',
              }}
            >
              智慧教学平台
            </span>
          </button>

          {/* 右侧按钮组 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 'auto' }}>
            <button
              onClick={() =>
                document
                  .getElementById('how-it-works')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                fontWeight: 500,
                color: '#333',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              使用流程
            </button>
            <button
              onClick={() =>
                document
                  .getElementById('features')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                fontWeight: 500,
                color: '#333',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              核心功能
            </button>

            <Button
              onClick={handleEnter}
              style={{
                height: 46,
                padding: '0 28px',
                fontSize: 17,
                fontWeight: 600,
                borderRadius: 9,
                backgroundColor: '#e67e22',
                borderColor: '#e67e22',
                color: '#fff',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#cf711f';
                e.currentTarget.style.borderColor = '#cf711f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e67e22';
                e.currentTarget.style.borderColor = '#e67e22';
              }}
            >
              立即开始
            </Button>
          </div>
        </nav>
      </header>

      {/* ═══ Hero ═══ */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'center',
        }}
      >
        {/* 导航栏 */}
        <header
          style={{
            zIndex: 100,
            width: '100%',
            padding: '28px 48px 0',
          }}
        >
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: '50%' }}
              />
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  color: '#1a1a2e',
                }}
              >
                智慧教学平台
              </span>
            </button>

            {/* 右侧按钮组 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 'auto' }}>
              <button
                onClick={() =>
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#1a1a2e',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                使用流程
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#1a1a2e',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                核心功能
              </button>

              <Button
                onClick={handleEnter}
                style={{
                  height: 46,
                  padding: '0 28px',
                  fontSize: 17,
                  fontWeight: 600,
                  borderRadius: 9,
                  backgroundColor: '#e67e22',
                  borderColor: '#e67e22',
                  color: '#fff',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#cf711f';
                  e.currentTarget.style.borderColor = '#cf711f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e67e22';
                  e.currentTarget.style.borderColor = '#e67e22';
                }}
              >
                立即开始
              </Button>
            </div>
          </nav>
        </header>

        {/* LiquidEther 流体背景层 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        >
          <LiquidEther
            colors={['#e8956a', '#f2bc94', '#fdf2e9']}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>

        {/* 遮罩渐变 — 保证文字可读 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'linear-gradient(180deg, rgba(253,242,233,0.05) 0%, rgba(253,242,233,0.30) 50%, rgba(253,242,233,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* 内容层 */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: 720,
            padding: '40px 24px 80px',
          }}
        >

          <Title
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              fontWeight: 700,
              color: '#3d2c1e',
              lineHeight: 1.3,
              marginBottom: 20,
              animation: 'moveInLeft 0.9s ease-out 0.15s backwards',
            }}
          >
            让知识在
            <span style={{ color: '#e8956a' }}>星空</span>
            中连接
          </Title>

          <Text
            style={{
              fontSize: 17,
              color: 'rgba(61, 44, 30, 0.55)',
              lineHeight: 1.8,
              display: 'block',
              maxWidth: 540,
              margin: '0 auto 40px',
              animation: 'moveInRight 0.9s ease-out 0.4s backwards',
            }}
          >
            基于知识图谱与 AI 的智慧教学辅助平台，为教师提供学情洞察，
            为学生规划个性化学习路径，让教与学更科学高效。
          </Text>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'moveInBottom 0.9s ease-out 0.65s backwards',
            }}
          >
            <Button
              className="hero-btn hero-btn-animated"
              onClick={handleEnter}
            >
              开始你的知识连接
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ 亮点条 ═══ */}
      <section
        style={{
          height: '25vh',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: 64,
            flexWrap: 'wrap',
          }}
        >
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={i}
              style={{ textAlign: 'center', color: 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--accent)', marginRight: 4 }}>
                {h.icon}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {h.value}
              </span>
              <Text
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {h.label}
              </Text>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 使用流程 ═══ */}
      <section
        id="how-it-works"
        style={{
          padding: '9.6rem 0',
          background: 'var(--bg-root)',
        }}
      >
        {/* 标题区 */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 3.2rem' }}>
          <span
            style={{
              display: 'block',
              fontSize: 16,
              fontWeight: 500,
              color: '#e67e22',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              marginBottom: 16,
            }}
          >
            使用流程
          </span>
          <Title
            level={2}
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              marginBottom: 0,
              fontSize: 36,
            }}
          >
            三步开启智慧教学
          </Title>
        </div>

        {/* 步骤内容 — 2 列 Grid Z 字形 */}
        <div
          style={{
            maxWidth: 1200,
            margin: '9.6rem auto 0',
            padding: '0 3.2rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: '6.4rem',
            rowGap: '9.6rem',
            alignItems: 'center',
          }}
        >
          {/* ── Step 01：文字左 · 图片右 ── */}
          <div>
            <p className="step-number">01</p>
            <Title
              level={3}
              style={{ marginBottom: 16, fontWeight: 600, color: 'var(--text-primary)' }}
            >
              创建课程
            </Title>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
              }}
            >
              教师创建课程并导入知识点，系统自动构建知识图谱，直观展示知识点间的依赖与关联关系。
            </Text>
          </div>
          <div className="step-img-box">
            <div className="step-icon">
              <BookOutlined />
            </div>
          </div>

          {/* ── Step 02：图片左 · 文字右 ── */}
          <div className="step-img-box">
            <div className="step-icon">
              <BarChartOutlined />
            </div>
          </div>
          <div>
            <p className="step-number">02</p>
            <Title
              level={3}
              style={{ marginBottom: 16, fontWeight: 600, color: 'var(--text-primary)' }}
            >
              智能分析
            </Title>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
              }}
            >
              学生完成测验后，AI 实时分析知识点掌握度，生成多维度学情报告与掌握度热力图。
            </Text>
          </div>

          {/* ── Step 03：文字左 · 图片右 ── */}
          <div>
            <p className="step-number">03</p>
            <Title
              level={3}
              style={{ marginBottom: 16, fontWeight: 600, color: 'var(--text-primary)' }}
            >
              因材施教
            </Title>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
              }}
            >
              根据学情分析结果，自动推荐个性化学习路径与练习题目，科学规划备考节奏。
            </Text>
          </div>
          <div className="step-img-box">
            <div className="step-icon">
              <RocketOutlined />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 功能介绍 ═══ */}
      <section
        id="features"
        style={{
          padding: '88px 24px',
          background: 'var(--bg-root)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Title
              level={2}
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              核心功能
            </Title>
            <Text
              style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                maxWidth: 480,
                display: 'block',
                margin: '0 auto',
              }}
            >
              四大核心模块，覆盖教学全场景，用技术赋能每一堂课
            </Text>
          </div>

          {/* 卡片 */}
          <Row gutter={[24, 24]}>
            {FEATURES.map((f, i) => (
              <Col xs={24} sm={12} lg={6} key={i}>
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '32px 24px',
                    border: '1px solid var(--border-default)',
                    height: '100%',
                    transition:
                      'transform var(--duration-normal) var(--ease-out-expo), box-shadow var(--duration-normal) var(--ease-out-expo)',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 'var(--radius-md)',
                      background: `${f.color}14`,
                      color: f.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 20,
                    }}
                  >
                    {f.icon}
                  </div>
                  <Title
                    level={5}
                    style={{
                      color: 'var(--text-primary)',
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    {f.title}
                  </Title>
                  <Text
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      lineHeight: 1.8,
                    }}
                  >
                    {f.desc}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ═══ CTA / 登录 ═══ */}
      <section
        ref={ctaRef}
        style={{
          padding: '5.6rem 3.2rem 8rem',
          background: 'var(--bg-root)',
        }}
      >
        <div
          className="cta-grid"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            borderRadius: 11,
            overflow: 'hidden',
            boxShadow: '0 2.4rem 4.8rem rgba(0,0,0,0.15)',
          }}
        >
          {/* 左侧：登录表单 */}
          <div
            style={{
              padding: '40px 64px 48px 64px',
              color: '#45260a',
            }}
            className="cta-left"
          >
            <Title
              level={2}
              style={{
                fontFamily: 'var(--font-display)',
                color: '#45260a',
                marginBottom: 12,
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              准备好开始了吗？
            </Title>
            <Text
              style={{
                color: '#45260a',
                fontSize: 18,
                lineHeight: 1.8,
                display: 'block',
                marginBottom: 36,
              }}
            >
              免费使用，无需安装，即刻体验 AI 驱动的智慧教学
            </Text>

            <Form
              form={form}
              layout="vertical"
              size="large"
              onFinish={onFinish}
              autoComplete="off"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 32,
                  rowGap: 20,
                }}
              >
                {/* 邮箱地址 */}
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '邮箱格式不正确' },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <label className="cta-label">邮箱地址</label>
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="zhangsan@example.com"
                      className="cta-input"
                    />
                  </div>
                </Form.Item>

                {/* 密码 */}
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <label className="cta-label">密码</label>
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      className="cta-input"
                    />
                  </div>
                </Form.Item>

                {/* 登录按钮 */}
                <div>
                  <label className="cta-label">&nbsp;</label>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    className="cta-btn"
                    style={{
                      height: 48,
                      fontSize: 20,
                      fontWeight: 600,
                      borderRadius: 9,
                      background: '#45260a',
                      borderColor: '#45260a',
                      color: '#fdf2e9',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = '#555';
                      e.currentTarget.style.borderColor = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#45260a';
                      e.currentTarget.style.color = '#fdf2e9';
                      e.currentTarget.style.borderColor = '#45260a';
                    }}
                  >
                    登 录
                  </Button>
                </div>

                {/* 占位 */}
                <div />
              </div>
            </Form>

            {/* 底部注册提示 */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ color: '#45260a', fontSize: 14 }}>
                还没有账号？
              </span>
              <Link
                to="/register"
                style={{
                  color: '#45260a',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'underline',
                  marginLeft: 4,
                }}
              >
                去注册
              </Link>
            </div>
          </div>

          {/* 右侧：装饰区 */}
          <div
            className="cta-right"
            style={{
              backgroundImage:
                'linear-gradient(to right bottom, rgba(235,152,78,0.35), rgba(230,126,34,0.35)), url("https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer
        style={{
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-default)',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 28, height: 28, borderRadius: '50%' }}
            />
            <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              智慧教学平台 © 2026 CCF 服务计算创新大赛
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['关于我们', '使用条款', '联系方式'].map((t) => (
              <Text
                key={t}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {t}
              </Text>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
