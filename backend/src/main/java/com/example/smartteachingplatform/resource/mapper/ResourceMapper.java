package com.example.smartteachingplatform.resource.mapper;

import com.example.smartteachingplatform.resource.entity.Resource;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface ResourceMapper {

    @Insert("INSERT INTO resources (course_id, uploader_id, resource_name, resource_type, file_url, " +
            "file_size, duration, description, created_at, updated_at) " +
            "VALUES (#{courseId}, #{uploaderId}, #{resourceName}, #{resourceType}, #{fileUrl}, " +
            "#{fileSize}, #{duration}, #{description}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Resource resource);

    @Insert("INSERT INTO resource_knowledge (resource_id, knowledge_node_id) " +
            "VALUES (#{resourceId}, #{knowledgeNodeId})")
    int bindKnowledgeNode(@Param("resourceId") Long resourceId,
                          @Param("knowledgeNodeId") Long knowledgeNodeId);

    /** 查询绑定到某知识节点的资源 */
    @Select("SELECT r.* FROM resources r " +
            "JOIN resource_knowledge rk ON r.id = rk.resource_id " +
            "WHERE r.course_id = #{courseId} AND rk.knowledge_node_id = #{nodeId}")
    List<Resource> findByKnowledgeNodeId(@Param("courseId") Long courseId,
                                          @Param("nodeId") Long nodeId);

    /** 查询知识节点关联的测验（用于学习页面） */
    @Select("SELECT DISTINCT q.id AS quiz_id, q.title AS quiz_name, q.end_time AS deadline " +
            "FROM quizzes q " +
            "JOIN quiz_questions qq ON q.id = qq.quiz_id " +
            "JOIN questions qu ON qq.question_id = qu.id " +
            "WHERE q.course_id = #{courseId} " +
            "  AND qu.knowledge_node_id = #{nodeId} " +
            "  AND q.status = 'published'")
    List<Map<String, Object>> findQuizzesByKnowledgeNodeId(@Param("courseId") Long courseId,
                                                            @Param("nodeId") Long nodeId);
}
