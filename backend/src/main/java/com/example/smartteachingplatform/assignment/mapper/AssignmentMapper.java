package com.example.smartteachingplatform.assignment.mapper;

import com.example.smartteachingplatform.assignment.entity.Assignment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AssignmentMapper {

    @Insert("INSERT INTO assignments (course_id, title, description, submission_type, start_time, end_time, total_score, status, created_by, created_at, updated_at) " +
            "VALUES (#{courseId}, #{title}, #{description}, #{submissionType}, #{startTime}, #{endTime}, #{totalScore}, #{status}, #{createdBy}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Assignment assignment);

    @Update("UPDATE assignments SET title = #{title}, description = #{description}, submission_type = #{submissionType}, " +
            "start_time = #{startTime}, end_time = #{endTime}, total_score = #{totalScore}, updated_at = NOW() " +
            "WHERE id = #{id}")
    int update(Assignment assignment);

    @Select("SELECT * FROM assignments WHERE id = #{id}")
    Assignment findById(Long id);

    /** 教师分页查询 + 提交人数 */
    @Select("SELECT a.*, (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) AS submission_count " +
            "FROM assignments a WHERE a.course_id = #{courseId} " +
            "ORDER BY a.created_at DESC LIMIT #{limit} OFFSET #{offset}")
    List<Assignment> findPageByCourseId(@Param("courseId") Long courseId,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM assignments WHERE course_id = #{courseId}")
    long countByCourseId(Long courseId);

    // ── 节点绑定 ──

    @Insert("INSERT INTO assignment_nodes (assignment_id, knowledge_node_id) VALUES (#{assignmentId}, #{nodeId})")
    int bindNode(@Param("assignmentId") Long assignmentId, @Param("nodeId") Long nodeId);

    @Delete("DELETE FROM assignment_nodes WHERE assignment_id = #{assignmentId}")
    int deleteNodes(Long assignmentId);

    @Select("SELECT knowledge_node_id FROM assignment_nodes WHERE assignment_id = #{assignmentId}")
    List<Long> findNodeIds(Long assignmentId);
}
