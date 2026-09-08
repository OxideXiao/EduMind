import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  App,
  Form,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  NodeIndexOutlined,
  BulbOutlined,
  DashboardOutlined,
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { login } from '../../api/auth';
import LiquidEther from '../../components/LiquidEther';

const { Text } = Typography;

const FEATURES = [
  {
    icon: <NodeIndexOutlined />,
    title: '知识图谱可视化',
    desc: '交互式课程知识图谱，直观展示知识点间的依赖与关联，掌握度用颜色一目了然。',
  },
  {
    icon: <BulbOutlined />,
    title: 'AI 智能推荐',
    desc: '基于掌握度分析，自动生成个性化学习路径与练习题推荐，因材施教。',
  },
  {
    icon: <DashboardOutlined />,
    title: '学情数据分析',
    desc: '多维度学情看板，全班掌握度热力图、个体轨迹曲线，数据驱动教学决策。',
  },
  {
    icon: <CalendarOutlined />,
    title: '智能计划与提醒',
    desc: 'AI 自动规划学习周计划，智能推送复习提醒，科学安排备考节奏。',
  },
];

export default function PortalPage() {
  const [loading, setLoading] = useState(false);
  const [portalRole, setPortalRole] = useState<'teacher' | 'student'>('teacher');
  const ctaRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { isAuthenticated, setAuth } = useAuth();
  const [form] = Form.useForm();

  const closeNav = useCallback(() => {
    const el = document.getElementById('navi-toggle') as HTMLInputElement | null;
    if (el) el.checked = false;
  }, []);

  const goSection = useCallback((id: string) => {
    closeNav();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, [closeNav]);

  const handleEnter = useCallback(() => {
    closeNav();
    if (isAuthenticated) {
      navigate('/courses');
    } else {
      ctaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAuthenticated, navigate, closeNav]);

  const selectRoleAndGoLogin = useCallback((role: 'teacher' | 'student') => {
    setPortalRole(role);
    closeNav();
    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
  }, [closeNav]);

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
      className="portal-page"
      style={{
        minHeight: '100vh',
        background: 'var(--color-white)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══ Natours 圆形展开导航 ═══ */}
      <div className="navigation">
        <input type="checkbox" className="navigation__checkbox" id="navi-toggle" />
        <label htmlFor="navi-toggle" className="navigation__button" aria-label="打开菜单">
          <span className="navigation__icon">&nbsp;</span>
        </label>
        <div className="navigation__background">&nbsp;</div>
        <nav className="navigation__nav" aria-label="门户导航">
          <ul className="navigation__list">
            <li className="navigation__item">
              <a
                href="#how-it-works"
                className="navigation__link"
                onClick={(e) => { e.preventDefault(); goSection('how-it-works'); }}
              >
                <span>01</span>使用流程
              </a>
            </li>
            <li className="navigation__item">
              <a
                href="#features"
                className="navigation__link"
                onClick={(e) => { e.preventDefault(); goSection('features'); }}
              >
                <span>02</span>核心功能
              </a>
            </li>
            <li className="navigation__item">
              <a
                href="#roles"
                className="navigation__link"
                onClick={(e) => { e.preventDefault(); goSection('roles'); }}
              >
                <span>03</span>角色选择
              </a>
            </li>
            <li className="navigation__item">
              <a
                href="#stories"
                className="navigation__link"
                onClick={(e) => { e.preventDefault(); goSection('stories'); }}
              >
                <span>04</span>用户反馈
              </a>
            </li>
            <li className="navigation__item">
              <a
                href="#cta"
                className="navigation__link"
                onClick={(e) => { e.preventDefault(); handleEnter(); }}
              >
                <span>05</span>{isAuthenticated ? '进入课程' : '登录开始'}
              </a>
            </li>
            <li className="navigation__item">
              <Link to="/register" className="navigation__link" onClick={closeNav}>
                <span>06</span>注册账号
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* ═══ Hero ═══ */}
      <section className="portal-header">
        <div className="portal-header__liquid">
          <LiquidEther
            colors={['#3d5a75', '#7a9bb5', '#243848']}
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

        <div className="portal-header__logo-box">
          <div className="portal-header__logo-btn">
            <img src="/logo.png" alt="Logo" className="portal-header__logo" />
            <span className="portal-header__brand">智慧教学平台</span>
          </div>
        </div>

        <div className="portal-header__text-box">
          <h1 className="heading-primary">
            <span className="heading-primary--main">智慧教学</span>
            <span className="heading-primary--sub">让知识在星空中连接</span>
          </h1>
          <div className="portal-header__actions">
            <button type="button" className="btn btn--white btn--animated" onClick={handleEnter}>
              开始你的知识连接
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 使用流程 ═══ */}
      <section
        id="how-it-works"
        className="section section-how"
        style={{ background: 'var(--color-white)' }}
      >
        <div className="u-center-text" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 3.2rem' }}>
          <h2 className="heading-secondary">三步开启智慧教学</h2>
        </div>

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
          <div>
            <p className="step-number">01</p>
            <h3 className="heading-tertiary">创建课程</h3>
            <p className="paragraph">
              教师创建课程并导入知识点，系统自动构建知识图谱，直观展示知识点间的依赖与关联关系。
            </p>
          </div>
          <div className="step-img-box">
            <div className="step-icon">
              <BookOutlined />
            </div>
          </div>

          <div className="step-img-box">
            <div className="step-icon">
              <BarChartOutlined />
            </div>
          </div>
          <div>
            <p className="step-number">02</p>
            <h3 className="heading-tertiary">智能分析</h3>
            <p className="paragraph">
              学生完成测验后，AI 实时分析知识点掌握度，生成多维度学情报告与掌握度热力图。
            </p>
          </div>

          <div>
            <p className="step-number">03</p>
            <h3 className="heading-tertiary">因材施教</h3>
            <p className="paragraph">
              根据学情分析结果，自动推荐个性化学习路径与练习题目，科学规划备考节奏。
            </p>
          </div>
          <div className="step-img-box">
            <div className="step-icon">
              <RocketOutlined />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 功能介绍 ═══ */}
      <section id="features" className="section section-features">
        <div className="section-features__inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.4rem' }}>
          <Row gutter={[48, 48]}>
            {FEATURES.map((f, i) => (
              <Col xs={24} sm={12} lg={6} key={i}>
                <div className="feature-box">
                  <span className="feature-box__icon" aria-hidden>
                    {f.icon}
                  </span>
                  <h3 className="heading-tertiary" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {f.title}
                  </h3>
                  <p className="paragraph">{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ═══ 角色双卡 ═══ */}
      <section id="roles" className="section section-roles">
        <div className="u-center-text u-margin-bottom-big">
          <h2 className="heading-secondary">选择你的角色</h2>
        </div>

        <div className="roles-row">
          <div className="role-card">
            <div className="role-card__side role-card__side--front">
              <div className="role-card__picture role-card__picture--teacher" />
              <h4 className="role-card__heading">
                <span className="role-card__heading-span role-card__heading-span--teacher">
                  教师端
                </span>
              </h4>
              <div className="role-card__details">
                <ul>
                  <li>构建课程知识图谱</li>
                  <li>发布作业与测验</li>
                  <li>掌握度热力分析</li>
                  <li>AI 教学建议</li>
                  <li>班级学情总览</li>
                </ul>
              </div>
            </div>
            <div className="role-card__side role-card__side--back role-card__side--back-teacher">
              <div className="role-card__cta">
                <div className="role-card__price-box">
                  <p className="role-card__price-only">适用角色</p>
                  <p className="role-card__price-value">教师</p>
                </div>
                <a
                  href="#cta"
                  className="btn btn--white"
                  onClick={(e) => {
                    e.preventDefault();
                    selectRoleAndGoLogin('teacher');
                  }}
                >
                  开始体验
                </a>
              </div>
            </div>
          </div>

          <div className="role-card">
            <div className="role-card__side role-card__side--front">
              <div className="role-card__picture role-card__picture--student" />
              <h4 className="role-card__heading">
                <span className="role-card__heading-span role-card__heading-span--student">
                  学生端
                </span>
              </h4>
              <div className="role-card__details">
                <ul>
                  <li>可视化学习路径</li>
                  <li>节点练习与作业</li>
                  <li>AI 智能推荐</li>
                  <li>薄弱点精准补强</li>
                  <li>个人掌握度追踪</li>
                </ul>
              </div>
            </div>
            <div className="role-card__side role-card__side--back role-card__side--back-student">
              <div className="role-card__cta">
                <div className="role-card__price-box">
                  <p className="role-card__price-only">适用角色</p>
                  <p className="role-card__price-value">学生</p>
                </div>
                <a
                  href="#cta"
                  className="btn btn--white"
                  onClick={(e) => {
                    e.preventDefault();
                    selectRoleAndGoLogin('student');
                  }}
                >
                  开始体验
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stories ═══ */}
      <section id="stories" className="section section-stories">
        <div className="bg-video">
          <video
            className="bg-video__content"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="u-center-text u-margin-bottom-big">
          <h2 className="heading-secondary">师生真实反馈</h2>
        </div>

        <div className="stories-row">
          <div className="story">
            <figure className="story__shape">
              <img
                src="/profile-1.jpg"
                alt="教师用户"
                className="story__img"
              />
              <figcaption className="story__caption">特种兵</figcaption>
            </figure>
            <div className="story__text">
              <h3 className="heading-tertiary u-margin-bottom-small">
                备课从「猜学情」变成「看数据」
              </h3>
              <p>
                以前只能凭经验判断班级薄弱点。用上 EduMind 的掌握度热力图和知识图谱后，
                我能一眼看到哪些节点卡住了全班，再针对性布置练习。课堂反馈快了很多。
              </p>
            </div>
          </div>
        </div>

        <div className="stories-row">
          <div className="story">
            <figure className="story__shape">
              <img
                src="/profile-2.jpg"
                alt="学生用户"
                className="story__img"
              />
              <figcaption className="story__caption">工天剑</figcaption>
            </figure>
            <div className="story__text">
              <h3 className="heading-tertiary u-margin-bottom-small">
                终于知道该先补哪一块
              </h3>
              <p>
                图谱把知识点依赖关系画清楚了，AI 推荐也不会乱推题。跟着路径练了两周，
                以前一碰就慌的章节现在也能稳住节奏，复习不再漫无目的。
              </p>
            </div>
          </div>
        </div>

        <div className="u-center-text u-margin-top-huge">
          <a
            href="#cta"
            className="btn-text"
            onClick={(e) => {
              e.preventDefault();
              goSection('cta');
            }}
          >
            开始体验 &rarr;
          </a>
        </div>
      </section>

      {/* ═══ CTA / 登录（Natours book）═══ */}
      <section
        id="cta"
        ref={ctaRef}
        className="section section-book"
      >
        <div className="book-row">
          <div className="book">
            <div className="book__form">
              <h2 className="heading-secondary u-margin-bottom-small" style={{ textTransform: 'none', letterSpacing: 0 }}>
                准备好开始了吗？
              </h2>

              <Form form={form} className="form" onFinish={onFinish} autoComplete="off">
                <div className="form__group">
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '邮箱格式不正确' },
                    ]}
                    noStyle
                  >
                    <input
                      type="email"
                      className="form__input"
                      placeholder="邮箱地址"
                      id="login-email"
                      required
                    />
                  </Form.Item>
                  <label htmlFor="login-email" className="form__label">
                    邮箱地址
                  </label>
                </div>

                <div className="form__group">
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                    noStyle
                  >
                    <input
                      type="password"
                      className="form__input"
                      placeholder="密码"
                      id="login-password"
                      required
                    />
                  </Form.Item>
                  <label htmlFor="login-password" className="form__label">
                    密码
                  </label>
                </div>

                <div className="form__group u-margin-bottom-medium">
                  <div className="form__radio-group">
                    <input
                      type="radio"
                      className="form__radio-input"
                      id="role-teacher"
                      name="portal-role"
                      checked={portalRole === 'teacher'}
                      onChange={() => setPortalRole('teacher')}
                    />
                    <label htmlFor="role-teacher" className="form__radio-label">
                      <span className="form__radio-button" />
                      教师端
                    </label>
                  </div>
                  <div className="form__radio-group">
                    <input
                      type="radio"
                      className="form__radio-input"
                      id="role-student"
                      name="portal-role"
                      checked={portalRole === 'student'}
                      onChange={() => setPortalRole('student')}
                    />
                    <label htmlFor="role-student" className="form__radio-label">
                      <span className="form__radio-button" />
                      学生端
                    </label>
                  </div>
                </div>

                <div className="form__group">
                  <button type="submit" className="btn btn--green" disabled={loading}>
                    {loading ? '登录中…' : '登录 →'}
                  </button>
                </div>
              </Form>

              <div className="book__register">
                <span>还没有账号？</span>
                <Link to="/register">去注册</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer
        style={{
          background: 'var(--color-grey-light-1)',
          borderTop: '1px solid var(--color-grey-light-2)',
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
            <Text style={{ color: 'var(--color-grey-dark)', fontSize: 13 }}>
              智慧教学平台 © 2026 CCF 服务计算创新大赛
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['关于我们', '使用条款', '联系方式'].map((t) => (
              <Text
                key={t}
                style={{ color: 'var(--color-grey-dark-2)', fontSize: 13, cursor: 'pointer' }}
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
