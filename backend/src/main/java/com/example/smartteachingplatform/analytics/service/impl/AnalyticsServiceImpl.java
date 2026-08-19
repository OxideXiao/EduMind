package com.example.smartteachingplatform.analytics.service.impl;

import com.example.smartteachingplatform.analytics.dto.*;
import com.example.smartteachingplatform.analytics.mapper.AnalyticsMapper;
import com.example.smartteachingplatform.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsMapper analyticsMapper;

    @Override
    public DashboardResponse getDashboard(Long courseId) {
        int totalStudents = analyticsMapper.countStudents(courseId);
        int withSubmission = analyticsMapper.countStudentsWithSubmission(courseId);
        int activeStudents = analyticsMapper.countActiveStudents(courseId);

        DashboardResponse resp = new DashboardResponse();

        // 完成率 / 活跃度
        resp.setCompletionRate(totalStudents > 0
                ? BigDecimal.valueOf(withSubmission).divide(BigDecimal.valueOf(totalStudents), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);
        resp.setActiveRate(totalStudents > 0
                ? BigDecimal.valueOf(activeStudents).divide(BigDecimal.valueOf(totalStudents), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);

        // 薄弱知识点 Top5
        List<Map<String, Object>> weakRaw = analyticsMapper.weakKnowledgePoints(courseId);
        List<DashboardResponse.WeakNode> weakNodes = new ArrayList<>();
        for (Map<String, Object> row : weakRaw) {
            DashboardResponse.WeakNode wn = new DashboardResponse.WeakNode();
            wn.setNodeId(toLong(row.get("node_id")));
            wn.setName((String) row.get("name"));
            wn.setAvgScore(toBigDecimal(row.get("avg_score")));
            weakNodes.add(wn);
        }
        resp.setWeakKnowledgePoints(weakNodes);

        // 风险学生
        List<Map<String, Object>> riskRaw = analyticsMapper.riskStudents(courseId);
        List<DashboardResponse.RiskStudent> riskList = new ArrayList<>();
        for (Map<String, Object> row : riskRaw) {
            DashboardResponse.RiskStudent rs = new DashboardResponse.RiskStudent();
            rs.setUserId(toLong(row.get("user_id")));
            rs.setName((String) row.get("name"));
            rs.setReason((String) row.get("reason"));
            rs.setAvgMastery(toBigDecimal(row.get("avg_mastery")));
            riskList.add(rs);
        }
        resp.setRiskStudents(riskList);
        resp.setRiskStudentCount(riskList.size());

        // 活跃趋势
        List<Map<String, Object>> trendRaw = analyticsMapper.activeTrend(courseId);
        List<DashboardResponse.ActiveTrend> trends = new ArrayList<>();
        for (Map<String, Object> row : trendRaw) {
            DashboardResponse.ActiveTrend at = new DashboardResponse.ActiveTrend();
            at.setDate(row.get("date") != null ? row.get("date").toString() : "");
            at.setActiveCount(((Number) row.get("active_count")).intValue());
            trends.add(at);
        }
        resp.setActiveTrend(trends);

        return resp;
    }

    @Override
    public TrajectoryResponse getTrajectory(Long courseId, Long studentId) {
        TrajectoryResponse resp = new TrajectoryResponse();

        List<Map<String, Object>> quizzes = analyticsMapper.recentQuizzes(courseId, studentId);
        List<TrajectoryResponse.QuizRecord> quizRecords = new ArrayList<>();
        for (Map<String, Object> row : quizzes) {
            TrajectoryResponse.QuizRecord qr = new TrajectoryResponse.QuizRecord();
            qr.setQuizName((String) row.get("quiz_name"));
            qr.setScore(toBigDecimal(row.get("score")));
            qr.setSubmittedAt(toLocalDateTime(row.get("submitted_at")));
            quizRecords.add(qr);
        }
        resp.setRecentQuizzes(quizRecords);

        List<Map<String, Object>> logs = analyticsMapper.recentLogs(courseId, studentId);
        List<TrajectoryResponse.LogRecord> logRecords = new ArrayList<>();
        for (Map<String, Object> row : logs) {
            TrajectoryResponse.LogRecord lr = new TrajectoryResponse.LogRecord();
            lr.setAction((String) row.get("action"));
            lr.setNodeName((String) row.get("node_name"));
            lr.setCreatedAt(toLocalDateTime(row.get("created_at")));
            logRecords.add(lr);
        }
        resp.setRecentLogs(logRecords);

        return resp;
    }

    @Override
    public DailyStatsResponse getDailyStats(Long courseId, String date) {
        DailyStatsResponse resp = new DailyStatsResponse();
        resp.setCourseId(courseId);
        resp.setDate(date != null ? date : "");

        List<Map<String, Object>> students = analyticsMapper.dailyStudents(courseId);
        List<DailyStatsResponse.StudentStats> statsList = new ArrayList<>();

        for (Map<String, Object> s : students) {
            Long studentId = toLong(s.get("student_id"));
            DailyStatsResponse.StudentStats ss = new DailyStatsResponse.StudentStats();
            ss.setStudentId(studentId);
            ss.setStudentName((String) s.get("student_name"));
            ss.setCompletionRate(BigDecimal.valueOf(analyticsMapper.studentCompletionRate(courseId, studentId)));
            ss.setActiveDaysThisWeek(analyticsMapper.studentActiveDays(courseId, studentId));
            ss.setQuizAvgScore(BigDecimal.valueOf(analyticsMapper.studentQuizAvg(courseId, studentId)));
            ss.setAtRisk(false); // 简化，由 dashboard 判断

            List<Map<String, Object>> masteryRows = analyticsMapper.studentMasteryMap(courseId, studentId);
            Map<String, BigDecimal> masteryMap = new LinkedHashMap<>();
            for (Map<String, Object> mr : masteryRows) {
                String nodeName = (String) mr.get("node_name");
                BigDecimal score = toBigDecimal(mr.get("mastery_score"))
                        .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                masteryMap.put(nodeName, score);
            }
            ss.setKnowledgeMastery(masteryMap);

            statsList.add(ss);
        }
        resp.setStudents(statsList);
        return resp;
    }

    // ──── 类型转换工具 ────

    private Long toLong(Object obj) {
        if (obj instanceof Long) return (Long) obj;
        if (obj instanceof Integer) return ((Integer) obj).longValue();
        if (obj instanceof Number) return ((Number) obj).longValue();
        return null;
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal) return (BigDecimal) obj;
        return new BigDecimal(obj.toString());
    }

    private java.time.LocalDateTime toLocalDateTime(Object obj) {
        if (obj instanceof java.time.LocalDateTime) return (java.time.LocalDateTime) obj;
        if (obj instanceof java.sql.Timestamp) return ((java.sql.Timestamp) obj).toLocalDateTime();
        return null;
    }
}
