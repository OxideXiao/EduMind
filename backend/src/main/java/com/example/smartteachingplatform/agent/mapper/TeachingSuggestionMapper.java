package com.example.smartteachingplatform.agent.mapper;

import com.example.smartteachingplatform.agent.entity.TeachingSuggestion;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TeachingSuggestionMapper {

    @Insert("INSERT INTO teaching_suggestions (course_id, teacher_id, problem, suggestions, priority, weak_node_ids) " +
            "VALUES (#{courseId}, #{teacherId}, #{problem}, CAST(#{suggestions} AS jsonb), #{priority}, " +
            "CAST(#{weakNodeIds} AS jsonb))")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TeachingSuggestion s);

    @Select("SELECT id, course_id, teacher_id, problem, suggestions::text AS suggestions, " +
            "priority, weak_node_ids::text AS weak_node_ids, created_at " +
            "FROM teaching_suggestions WHERE course_id = #{courseId} " +
            "ORDER BY created_at DESC, id DESC LIMIT 1")
    TeachingSuggestion findLatestByCourseId(Long courseId);

    @Select("SELECT id, course_id, teacher_id, problem, suggestions::text AS suggestions, " +
            "priority, weak_node_ids::text AS weak_node_ids, created_at " +
            "FROM teaching_suggestions WHERE course_id = #{courseId} " +
            "ORDER BY created_at DESC, id DESC LIMIT #{limit} OFFSET #{offset}")
    List<TeachingSuggestion> findPage(@Param("courseId") Long courseId,
                                      @Param("offset") int offset, @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM teaching_suggestions WHERE course_id = #{courseId}")
    long countByCourseId(Long courseId);
}
