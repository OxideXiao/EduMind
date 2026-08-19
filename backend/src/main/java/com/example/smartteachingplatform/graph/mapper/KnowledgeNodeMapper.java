package com.example.smartteachingplatform.graph.mapper;

import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface KnowledgeNodeMapper {

    /** 学生视图：节点 + 该学生的掌握度 */
    @Select("SELECT kn.id, kn.course_id, kn.parent_id, kn.node_name, kn.node_desc, " +
            "kn.difficulty, kn.sort_order, kn.x_position, kn.y_position, kn.status, " +
            "kn.created_at, kn.updated_at, " +
            "COALESCE(km.mastery_score, 0.00) AS mastery_score " +
            "FROM knowledge_nodes kn " +
            "LEFT JOIN knowledge_mastery km ON kn.id = km.knowledge_node_id " +
            "  AND km.student_id = #{studentId} AND km.course_id = #{courseId} " +
            "WHERE kn.course_id = #{courseId} AND kn.status = 'active' " +
            "ORDER BY kn.sort_order")
    @Results({
            @Result(column = "course_id", property = "courseId"),
            @Result(column = "parent_id", property = "parentId"),
            @Result(column = "node_name", property = "nodeName"),
            @Result(column = "node_desc", property = "nodeDesc"),
            @Result(column = "sort_order", property = "sortOrder"),
            @Result(column = "x_position", property = "xPosition"),
            @Result(column = "y_position", property = "yPosition"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt"),
            @Result(column = "mastery_score", property = "masteryScore")
    })
    List<KnowledgeNode> findNodesWithStudentMastery(@Param("courseId") Long courseId,
                                                     @Param("studentId") Long studentId);

    /** 教师视图：节点 + 全班平均掌握度 */
    @Select("SELECT kn.id, kn.course_id, kn.parent_id, kn.node_name, kn.node_desc, " +
            "kn.difficulty, kn.sort_order, kn.x_position, kn.y_position, kn.status, " +
            "kn.created_at, kn.updated_at, " +
            "COALESCE(AVG(km.mastery_score), 0.00) AS mastery_score " +
            "FROM knowledge_nodes kn " +
            "LEFT JOIN knowledge_mastery km ON kn.id = km.knowledge_node_id " +
            "  AND km.course_id = #{courseId} " +
            "WHERE kn.course_id = #{courseId} AND kn.status = 'active' " +
            "GROUP BY kn.id " +
            "ORDER BY kn.sort_order")
    @Results({
            @Result(column = "course_id", property = "courseId"),
            @Result(column = "parent_id", property = "parentId"),
            @Result(column = "node_name", property = "nodeName"),
            @Result(column = "node_desc", property = "nodeDesc"),
            @Result(column = "sort_order", property = "sortOrder"),
            @Result(column = "x_position", property = "xPosition"),
            @Result(column = "y_position", property = "yPosition"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt"),
            @Result(column = "mastery_score", property = "masteryScore")
    })
    List<KnowledgeNode> findNodesWithAvgMastery(@Param("courseId") Long courseId);

    /** 按 ID 查单个节点 */
    @Select("SELECT * FROM knowledge_nodes WHERE id = #{id}")
    KnowledgeNode findById(@Param("id") Long id);

    /** 插入单个知识点节点 */
    @Insert("INSERT INTO knowledge_nodes (course_id, parent_id, node_name, node_desc, " +
            "difficulty, sort_order, x_position, y_position, status, created_at, updated_at) " +
            "VALUES (#{courseId}, #{parentId}, #{nodeName}, #{nodeDesc}, #{difficulty}, " +
            "#{sortOrder}, #{xPosition}, #{yPosition}, #{status}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(KnowledgeNode node);

    /** 按课程ID删除所有节点（供种子数据幂等清理） */
    @Delete("DELETE FROM knowledge_nodes WHERE course_id = #{courseId}")
    int deleteByCourseId(@Param("courseId") Long courseId);

    /** 获取某知识点下所有学生的掌握度 */
    @Select("SELECT u.id AS student_id, u.real_name AS student_name, " +
            "COALESCE(km.mastery_score, 0) AS mastery_score " +
            "FROM course_members cm " +
            "JOIN users u ON u.id = cm.user_id " +
            "LEFT JOIN knowledge_mastery km ON km.student_id = cm.user_id " +
            "  AND km.knowledge_node_id = #{nodeId} AND km.course_id = #{courseId} " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' " +
            "ORDER BY COALESCE(km.mastery_score, 0) ASC")
    List<Map<String, Object>> findStudentsByNodeId(@Param("courseId") Long courseId,
                                                     @Param("nodeId") Long nodeId);
}
