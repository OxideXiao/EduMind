import { useAuth } from '../../hooks/useAuth';
import AssignmentsPage from './AssignmentsPage';
import StudentAssignmentsPage from './StudentAssignmentsPage';

/** 同一路径按角色分发：教师管理 / 学生提交 */
export default function AssignmentsEntry() {
  const { isTeacher } = useAuth();
  return isTeacher ? <AssignmentsPage /> : <StudentAssignmentsPage />;
}
