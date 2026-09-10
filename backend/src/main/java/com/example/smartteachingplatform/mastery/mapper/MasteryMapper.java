package com.example.smartteachingplatform.mastery.mapper;

import com.example.smartteachingplatform.mastery.dto.MasteryHistoryItemResponse;
import com.example.smartteachingplatform.mastery.dto.MasteryItemResponse;
import com.example.smartteachingplatform.mastery.dto.NodeSummaryResponse;
import com.example.smartteachingplatform.quiz.entity.KnowledgeMastery;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface MasteryMapper {

    @Select("SELECT kn.id AS node_id, kn.node_name AS node_name, " +
            "COALESCE(km.mastery_score, 0) AS mastery_score, " +
            "COALESCE(UPPER(km.mastery_level), 'GRAY') AS mastery_level, " +
            "km.last_learned_at AS last_learned_at " +
            "FROM knowledge_nodes kn " +
            "LEFT JOIN knowledge_mastery km ON km.knowledge_node_id = kn.id " +
            "  AND km.course_id = #{courseId} AND km.student_id = #{studentId} " +
            "WHERE kn.course_id = #{courseId} AND kn.status = 'active' " +
            "ORDER BY kn.sort_order, kn.id")
    List<MasteryItemResponse> findStudentMastery(@Param("courseId") Long courseId,
                                                 @Param("studentId") Long studentId);

    @Select("SELECT COUNT(*) FROM course_members WHERE course_id = #{courseId} AND member_role = 'student' AND status = 'active'")
    int countStudentsByCourse(Long courseId);

    @Select("SELECT COALESCE(AVG(COALESCE(km.mastery_score, 0)), 0) " +
            "FROM course_members cm " +
            "LEFT JOIN knowledge_mastery km ON km.student_id = cm.user_id " +
            "  AND km.course_id = cm.course_id AND km.knowledge_node_id = #{nodeId} " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' AND cm.status = 'active'")
    BigDecimal avgMasteryScore(@Param("courseId") Long courseId, @Param("nodeId") Long nodeId);

    @Select("SELECT COALESCE(km.mastery_level, 'gray') AS level, COUNT(*) AS cnt " +
            "FROM course_members cm " +
            "LEFT JOIN knowledge_mastery km ON km.student_id = cm.user_id " +
            "  AND km.course_id = cm.course_id AND km.knowledge_node_id = #{nodeId} " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' AND cm.status = 'active' " +
            "GROUP BY COALESCE(km.mastery_level, 'gray')")
    List<Map<String, Object>> distribution(@Param("courseId") Long courseId, @Param("nodeId") Long nodeId);

    @Select("SELECT cm.user_id AS student_id, u.user_no AS student_no, u.real_name AS real_name, " +
            "COALESCE(km.mastery_score, 0) AS score " +
            "FROM course_members cm " +
            "JOIN users u ON u.id = cm.user_id " +
            "LEFT JOIN knowledge_mastery km ON km.student_id = cm.user_id " +
            "  AND km.course_id = cm.course_id AND km.knowledge_node_id = #{nodeId} " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' AND cm.status = 'active' " +
            "  AND COALESCE(km.mastery_score, 0) < 60 " +
            "ORDER BY COALESCE(km.mastery_score, 0) ASC")
    List<NodeSummaryResponse.AtRiskStudent> atRiskStudents(@Param("courseId") Long courseId,
                                                           @Param("nodeId") Long nodeId);

    List<MasteryHistoryItemResponse> findHistoryPage(@Param("courseId") Long courseId,
                                                     @Param("studentId") Long studentId,
                                                     @Param("nodeId") Long nodeId,
                                                     @Param("limit") int limit,
                                                     @Param("offset") int offset);

    long countHistory(@Param("courseId") Long courseId,
                      @Param("studentId") Long studentId,
                      @Param("nodeId") Long nodeId);

    @Select("SELECT * FROM knowledge_mastery WHERE course_id = #{courseId} AND student_id = #{studentId} AND knowledge_node_id = #{nodeId}")
    KnowledgeMastery findMastery(@Param("courseId") Long courseId, @Param("studentId") Long studentId, @Param("nodeId") Long nodeId);

    @Insert("INSERT INTO knowledge_mastery (course_id, student_id, knowledge_node_id, mastery_score, mastery_level, updated_at) " +
            "VALUES (#{courseId}, #{studentId}, #{knowledgeNodeId}, #{masteryScore}, #{masteryLevel}, NOW()) " +
            "ON CONFLICT (course_id, student_id, knowledge_node_id) DO UPDATE SET " +
            "mastery_score = EXCLUDED.mastery_score, mastery_level = EXCLUDED.mastery_level, updated_at = NOW()")
    int upsertMasteryScore(KnowledgeMastery mastery);

    @Insert("INSERT INTO mastery_history (mastery_id, course_id, student_id, knowledge_node_id, old_score, new_score, change_reason, created_at) " +
            "VALUES (#{masteryId}, #{courseId}, #{studentId}, #{knowledgeNodeId}, #{oldScore}, #{newScore}, #{changeReason}, NOW())")
    int insertMasteryHistory(@Param("masteryId") Long masteryId, @Param("courseId") Long courseId,
                             @Param("studentId") Long studentId, @Param("knowledgeNodeId") Long nodeId,
                             @Param("oldScore") BigDecimal oldScore, @Param("newScore") BigDecimal newScore,
                             @Param("changeReason") String changeReason);
}
