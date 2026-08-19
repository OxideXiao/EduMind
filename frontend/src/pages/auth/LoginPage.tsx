import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, message } from "antd";
import { HomeOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { login } from "../../api/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await login(values);
      setAuth(res.user, res.token);
      message.success(`欢迎回来，${res.user.name}`);
      navigate("/courses");
    } catch {
      message.error("登录失败，请检查邮箱和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* ── 返回首页 ── */}
      <Button
        type="text"
        icon={<HomeOutlined />}
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
          color: "var(--accent)",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        返回首页
      </Button>

      {/* ── 左栏：品牌 ── */}
      <div
        style={{
          flex: "0 0 42%",
          background: "var(--accent-light)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          animation: "slide-in-left 500ms var(--ease-out-expo)",
        }}
      >
        {/* 浮动节点 */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 10 + Math.random() * 16,
              height: 10 + Math.random() * 16,
              borderRadius: "50%",
              background: "rgba(79, 109, 140, 0.09)",
              left: `${8 + Math.random() * 84}%`,
              top: `${8 + Math.random() * 84}%`,
              animation: `float-node ${3 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}

        {/* 学校 Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#ffffff",
            border: "2px solid var(--accent-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <img src="/logo.png" alt="学校Logo" style={{ width: 56, height: 56, objectFit: "contain" }} />
        </div>

        <Typography.Title
          level={1}
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--accent)",
            marginBottom: 12,
            fontWeight: 700,
            fontSize: 34,
          }}
        >
          智慧教学平台
        </Typography.Title>
        <Typography.Text
          style={{
            color: "var(--text-secondary)",
            fontSize: 15,
            fontStyle: "italic",
          }}
        >
          "让知识在星空中连接"
        </Typography.Text>
        <Typography.Text
          style={{
            position: "absolute",
            bottom: 40,
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          CCF 服务计算创新大赛 2026
        </Typography.Text>
      </div>

      {/* ── 右栏：表单 ── */}
      <div
        style={{
          flex: "0 0 58%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          background: "var(--bg-root)",
          animation: "page-enter 400ms var(--ease-out-expo) 200ms both",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <Typography.Title
            level={2}
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            登录
          </Typography.Title>
          <Typography.Text
            style={{
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: 36,
            }}
          >
            欢迎回来
          </Typography.Text>

          <Form
            layout="vertical"
            size="large"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "邮箱格式不正确" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱地址" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 48, fontSize: 16 }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <Typography.Text
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              display: "block",
              marginTop: 24,
            }}
          >
            还没有账号？
            <Link to="/register" style={{ marginLeft: 4, fontWeight: 600 }}>
              去注册 →
            </Link>
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}
