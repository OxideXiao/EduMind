import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";
import { RequireAuth, RequireRole, RedirectIfAuth } from "./guards";
import AppLayout from "../components/layout/AppLayout";
import { Role } from "../utils/constants";

// ── 懒加载页面 ──
const PortalPage = lazy(() => import("../pages/portal/PortalPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const CourseListPage = lazy(() => import("../pages/course/CourseListPage"));
const GraphPage = lazy(() => import("../pages/graph/GraphPage"));
const NodeLearnPage = lazy(() => import("../pages/learn/NodeLearnPage"));
const QuizPage = lazy(() => import("../pages/quiz/QuizPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const StudentDetailPage = lazy(
  () => import("../pages/student/StudentDetailPage"),
);
const LearningPlanPage = lazy(() => import("../pages/plan/LearningPlanPage"));
const TeachingAdvicePage = lazy(
  () => import("../pages/advice/TeachingAdvicePage"),
);
const NotificationListPage = lazy(
  () => import("../pages/notification/NotificationListPage"),
);

/** 加载中占位 */
function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 300,
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── 路由树 ──
export default function AppRoutes() {
  return (
    <Routes>
      {/* 门户首页 - 公开访问 */}
      <Route
        path="/"
        element={
          <Lazy>
            <PortalPage />
          </Lazy>
        }
      />

      {/* 公开路由：登录 / 注册（已登录会自动跳转） */}
      <Route element={<RedirectIfAuth />}>
        <Route
          path="/login"
          element={
            <Lazy>
              <LoginPage />
            </Lazy>
          }
        />
        <Route
          path="/register"
          element={
            <Lazy>
              <RegisterPage />
            </Lazy>
          }
        />
      </Route>

      {/* 需登录路由 */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>

          {/* 所有角色 */}
          <Route
            path="/courses"
            element={
              <Lazy>
                <CourseListPage />
              </Lazy>
            }
          />
          <Route
            path="/courses/:courseId/graph"
            element={
              <Lazy>
                <GraphPage />
              </Lazy>
            }
          />
          <Route
            path="/courses/:courseId/nodes/:nodeId/learn"
            element={
              <Lazy>
                <NodeLearnPage />
              </Lazy>
            }
          />
          <Route
            path="/courses/:courseId/quizzes/:quizId"
            element={
              <Lazy>
                <QuizPage />
              </Lazy>
            }
          />
          <Route
            path="/notifications"
            element={
              <Lazy>
                <NotificationListPage />
              </Lazy>
            }
          />

          {/* 教师专属 */}
          <Route element={<RequireRole role={Role.TEACHER} />}>
            <Route
              path="/courses/:courseId/dashboard"
              element={
                <Lazy>
                  <DashboardPage />
                </Lazy>
              }
            />
            <Route
              path="/courses/:courseId/advice"
              element={
                <Lazy>
                  <TeachingAdvicePage />
                </Lazy>
              }
            />
            <Route
              path="/courses/:courseId/students/:studentId"
              element={
                <Lazy>
                  <StudentDetailPage />
                </Lazy>
              }
            />
          </Route>

          {/* 学生专属 */}
          <Route element={<RequireRole role={Role.STUDENT} />}>
            <Route
              path="/courses/:courseId/plan"
              element={
                <Lazy>
                  <LearningPlanPage />
                </Lazy>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
