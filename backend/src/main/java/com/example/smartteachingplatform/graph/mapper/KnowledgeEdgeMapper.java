package com.example.smartteachingplatform.graph.mapper;

import com.example.smartteachingplatform.graph.entity.KnowledgeEdge;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface KnowledgeEdgeMapper {

    @Select("SELECT id, course_id, source_node_id, target_node_id, relation_type, weight, created_at " +
            "FROM knowledge_edges " +
            "WHERE course_id = #{courseId}")
    @Results({
            @Result(column = "course_id", property = "courseId"),
            @Result(column = "source_node_id", property = "sourceNodeId"),
            @Result(column = "target_node_id", property = "targetNodeId"),
            @Result(column = "relation_type", property = "relationType"),
            @Result(column = "created_at", property = "createdAt")
    })
    List<KnowledgeEdge> findByCourseId(@Param("courseId") Long courseId);

    /** 插入边关系 */
    @Insert("INSERT INTO knowledge_edges (course_id, source_node_id, target_node_id, " +
            "relation_type, weight, created_at) " +
            "VALUES (#{courseId}, #{sourceNodeId}, #{targetNodeId}, #{relationType}, #{weight}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(KnowledgeEdge edge);

    /** 按课程ID删除所有边（供种子数据幂等清理） */
    @Delete("DELETE FROM knowledge_edges WHERE course_id = #{courseId}")
    int deleteByCourseId(@Param("courseId") Long courseId);
}
