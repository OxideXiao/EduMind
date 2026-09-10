package com.example.smartteachingplatform.assignment.mapper;

import com.example.smartteachingplatform.assignment.entity.AssignmentSubmission;
import com.example.smartteachingplatform.assignment.entity.SubmissionFile;
import com.example.smartteachingplatform.quiz.entity.KnowledgeMastery;
import org.apache.ibatis.annotations.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface AssignmentSubmissionMapper {

    @Select("SELECT * FROM assignment_submissions WHERE assignment_id = #{assignmentId} AND student_id =" +
            "#{studentId}")
    AssignmentSubmission findByAssignmentAndStudent(@Param("assignmentId") Long assignmentId,
                                                    @Param("studentId") Long studentId);

    @Insert("INSERT INTO assignment_submissions (assignment_id, student_id, content, status, submitted_at) " +
            "VALUES (#{assignmentId}, #{studentId}, #{content}, 'submitted', NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AssignmentSubmission submission);

    @Update("UPDATE assignment_submissions SET content = #{content}, status = 'submitted', " +
            "score = NULL, feedback = NULL, submitted_at = NOW(), graded_at = NULL WHERE id = #{id}")
    int updateContent(@Param("id") Long id, @Param("content") String content);

    @Insert("INSERT INTO submission_files (submission_id, file_name, file_url, file_size, created_at) " +
            "VALUES (#{submissionId}, #{fileName}, #{fileUrl}, #{fileSize}, NOW())")
    int insertFile(SubmissionFile file);

    @Delete("DELETE FROM submission_files WHERE submission_id = #{submissionId}")
    int deleteFiles(Long submissionId);

    @Select("SELECT * FROM assignment_submissions WHERE id = #{id}")
    AssignmentSubmission findById(Long id);

    @Select("SELECT u.id AS student_id, u.real_name AS student_name, " +
            "s.id AS id, s.content, s.status, s.score, s.feedback, s.submitted_at, s.graded_at " +
            "FROM course_members cm " +
            "JOIN users u ON cm.user_id = u.id " +
            "LEFT JOIN assignment_submissions s ON s.assignment_id = #{assignmentId} AND s.student_id = cm.user_id " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' AND cm.status = 'active' " +
            "ORDER BY (s.id IS NULL), s.submitted_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<AssignmentSubmission> findPageByAssignment(@Param("assignmentId") Long assignmentId,
                                                    @Param("courseId") Long courseId,
                                                    @Param("offset") int offset,
                                                    @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM course_members cm " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' AND cm.status = 'active'")
    long countStudentsByCourse(@Param("courseId") Long courseId);

    @Update("UPDATE assignment_submissions SET score = #{score}, feedback = #{feedback}, status = 'graded', graded_at = NOW() " +
            "WHERE id = #{id}")
    int grade(@Param("id") Long id, @Param("score") BigDecimal score, @Param("feedback") String feedback);

    @Select("SELECT * FROM submission_files WHERE submission_id = #{submissionId} ORDER BY id")
    List<SubmissionFile> findFiles(Long submissionId);

    @Select("SELECT * FROM knowledge_mastery WHERE course_id = #{courseId} AND student_id = #{studentId} AND knowledge_node_id = #{nodeId}")
    KnowledgeMastery findMastery(@Param("courseId") Long courseId,
                                 @Param("studentId") Long studentId,
                                 @Param("nodeId") Long nodeId);

    @Insert("INSERT INTO knowledge_mastery (course_id, student_id, knowledge_node_id, mastery_score, mastery_level, updated_at) " +
            "VALUES (#{courseId}, #{studentId}, #{knowledgeNodeId}, #{masteryScore}, #{masteryLevel}, NOW()) " +
            "ON CONFLICT (course_id, student_id, knowledge_node_id) DO UPDATE SET " +
            "mastery_score = EXCLUDED.mastery_score, mastery_level = EXCLUDED.mastery_level, updated_at = NOW()")
    int upsertMastery(KnowledgeMastery mastery);

    @Insert("INSERT INTO mastery_history (mastery_id, course_id, student_id, knowledge_node_id, old_score, new_score, change_reason, created_at) " +
            "VALUES (#{masteryId}, #{courseId}, #{studentId}, #{nodeId}, #{oldScore}, #{newScore}, #{changeReason}, NOW())")
    int insertMasteryHistory(@Param("masteryId") Long masteryId,
                             @Param("courseId") Long courseId,
                             @Param("studentId") Long studentId,
                             @Param("nodeId") Long nodeId,
                             @Param("oldScore") BigDecimal oldScore,
                             @Param("newScore") BigDecimal newScore,
                             @Param("changeReason") String changeReason);

    @Insert("INSERT INTO learning_logs (course_id, student_id, knowledge_node_id, action_type, target_id, created_at) " +
            "VALUES (#{courseId}, #{studentId}, #{nodeId}, 'finish_task', #{targetId}, NOW())")
    int insertLearningLog(@Param("courseId") Long courseId,
                          @Param("studentId") Long studentId,
                          @Param("nodeId") Long nodeId,
                          @Param("targetId") Long targetId);
}
