package com.example.smartteachingplatform.analytics.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface AnalyticsMapper {

    /** 课程学生数 */
    @Select("SELECT COUNT(*) FROM course_members WHERE course_id = #{courseId} AND member_role = 'student'")
    int countStudents(@Param("courseId") Long courseId);

    /** 至少提交过一次测验的学生数 */
    @Select("SELECT COUNT(DISTINCT cm.user_id) FROM course_members cm " +
            "JOIN quiz_submissions qs ON qs.student_id = cm.user_id " +
            "JOIN quizzes q ON q.id = qs.quiz_id AND q.course_id = #{courseId} " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student'")
    int countStudentsWithSubmission(@Param("courseId") Long courseId);

    /** 近7天有学习记录的学生数 */
    @Select("SELECT COUNT(DISTINCT cm.user_id) FROM course_members cm " +
            "JOIN learning_logs ll ON ll.student_id = cm.user_id AND ll.course_id = cm.course_id " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' " +
            "AND ll.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'")
    int countActiveStudents(@Param("courseId") Long courseId);

    /** 每个知识点的平均掌握度 */
    @Select("SELECT kn.id AS node_id, kn.node_name AS name, COALESCE(AVG(km.mastery_score), 0) AS avg_score " +
            "FROM knowledge_nodes kn " +
            "LEFT JOIN knowledge_mastery km ON kn.id = km.knowledge_node_id AND km.course_id = #{courseId} " +
            "WHERE kn.course_id = #{courseId} AND kn.status = 'active' " +
            "GROUP BY kn.id, kn.node_name ORDER BY avg_score ASC LIMIT 5")
    List<Map<String, Object>> weakKnowledgePoints(@Param("courseId") Long courseId);

    /** 风险学生：3天无记录或平均掌握度<40 */
    @Select("SELECT u.id AS user_id, u.real_name AS name, " +
            "COALESCE(AVG(km.mastery_score), 0) AS avg_mastery, " +
            "MAX(ll.created_at) AS last_activity, " +
            "CASE WHEN MAX(ll.created_at) IS NULL OR MAX(ll.created_at) < CURRENT_TIMESTAMP - INTERVAL '3 days' " +
            "     THEN '3天未学习' ELSE '平均掌握度<40' END AS reason " +
            "FROM course_members cm " +
            "JOIN users u ON u.id = cm.user_id " +
            "LEFT JOIN knowledge_mastery km ON km.student_id = cm.user_id AND km.course_id = cm.course_id " +
            "LEFT JOIN learning_logs ll ON ll.student_id = cm.user_id AND ll.course_id = cm.course_id " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' " +
            "GROUP BY u.id, u.real_name " +
            "HAVING MAX(ll.created_at) IS NULL OR MAX(ll.created_at) < CURRENT_TIMESTAMP - INTERVAL '3 days' " +
            "   OR COALESCE(AVG(km.mastery_score), 0) < 40")
    List<Map<String, Object>> riskStudents(@Param("courseId") Long courseId);

    /** 近7天每日活跃人数趋势 */
    @Select("SELECT d::date AS date, COUNT(DISTINCT ll.student_id) AS active_count " +
            "FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d " +
            "LEFT JOIN learning_logs ll ON ll.created_at::date = d::date AND ll.course_id = #{courseId} " +
            "GROUP BY d::date ORDER BY d::date")
    List<Map<String, Object>> activeTrend(@Param("courseId") Long courseId);

    /** 学生最近的测验提交 */
    @Select("SELECT q.title AS quiz_name, qs.total_score AS score, qs.submit_time AS submitted_at " +
            "FROM quiz_submissions qs JOIN quizzes q ON q.id = qs.quiz_id " +
            "WHERE qs.student_id = #{studentId} AND q.course_id = #{courseId} " +
            "ORDER BY qs.submit_time DESC LIMIT 10")
    List<Map<String, Object>> recentQuizzes(@Param("courseId") Long courseId,
                                            @Param("studentId") Long studentId);

    /** 学生最近的学习日志 */
    @Select("SELECT ll.action_type AS action, COALESCE(kn.node_name, '') AS node_name, ll.created_at " +
            "FROM learning_logs ll " +
            "LEFT JOIN knowledge_nodes kn ON kn.id = ll.knowledge_node_id " +
            "WHERE ll.student_id = #{studentId} AND ll.course_id = #{courseId} " +
            "ORDER BY ll.created_at DESC LIMIT 10")
    List<Map<String, Object>> recentLogs(@Param("courseId") Long courseId,
                                         @Param("studentId") Long studentId);

    /** Daily：课程所有学生的学情汇总 */
    @Select("SELECT cm.user_id AS student_id, u.real_name AS student_name " +
            "FROM course_members cm JOIN users u ON u.id = cm.user_id " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student'")
    List<Map<String, Object>> dailyStudents(@Param("courseId") Long courseId);

    /** 单个学生的完成率 */
    @Select("SELECT CASE WHEN total_quizzes > 0 THEN submitted::float / total_quizzes ELSE 0 END " +
            "FROM (SELECT COUNT(*) AS total_quizzes FROM quizzes WHERE course_id = #{courseId}) tq, " +
            "(SELECT COUNT(DISTINCT qs.quiz_id) AS submitted FROM quiz_submissions qs " +
            " JOIN quizzes q ON q.id = qs.quiz_id AND q.course_id = #{courseId} " +
            " WHERE qs.student_id = #{studentId}) sq")
    double studentCompletionRate(@Param("courseId") Long courseId, @Param("studentId") Long studentId);

    /** 单个学生近7天活跃天数 */
    @Select("SELECT COUNT(DISTINCT created_at::date) FROM learning_logs " +
            "WHERE student_id = #{studentId} AND course_id = #{courseId} " +
            "AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'")
    int studentActiveDays(@Param("courseId") Long courseId, @Param("studentId") Long studentId);

    /** 单个学生测验均分 */
    @Select("SELECT COALESCE(AVG(qs.total_score), 0) FROM quiz_submissions qs " +
            "JOIN quizzes q ON q.id = qs.quiz_id AND q.course_id = #{courseId} " +
            "WHERE qs.student_id = #{studentId}")
    double studentQuizAvg(@Param("courseId") Long courseId, @Param("studentId") Long studentId);

    /** 单个学生各知识点掌握度 (返回 node_name → score) */
    @Select("SELECT kn.node_name, km.mastery_score FROM knowledge_mastery km " +
            "JOIN knowledge_nodes kn ON kn.id = km.knowledge_node_id " +
            "WHERE km.student_id = #{studentId} AND km.course_id = #{courseId} AND kn.status = 'active'")
    List<Map<String, Object>> studentMasteryMap(@Param("courseId") Long courseId,
                                                @Param("studentId") Long studentId);

    /** 全班各知识点的平均掌握度 (返回 node_name → avg_score 0-100) */
    @Select("SELECT kn.node_name, COALESCE(AVG(km.mastery_score), 0) AS avg_score " +
            "FROM knowledge_nodes kn " +
            "LEFT JOIN knowledge_mastery km ON kn.id = km.knowledge_node_id AND km.course_id = #{courseId} " +
            "WHERE kn.course_id = #{courseId} AND kn.status = 'active' " +
            "GROUP BY kn.id, kn.node_name")
    List<Map<String, Object>> courseAvgMastery(@Param("courseId") Long courseId);
}
