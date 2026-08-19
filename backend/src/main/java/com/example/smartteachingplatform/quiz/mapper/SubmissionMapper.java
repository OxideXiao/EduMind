package com.example.smartteachingplatform.quiz.mapper;

import com.example.smartteachingplatform.quiz.entity.KnowledgeMastery;
import com.example.smartteachingplatform.quiz.entity.QuizAnswer;
import com.example.smartteachingplatform.quiz.entity.QuizSubmission;
import org.apache.ibatis.annotations.*;

import java.math.BigDecimal;

@Mapper
public interface SubmissionMapper {

    // ────── 提交 ──────

    @Insert("INSERT INTO quiz_submissions (quiz_id, student_id, attempt_no, submit_time, total_score, correct_rate, status) " +
            "VALUES (#{quizId}, #{studentId}, #{attemptNo}, NOW(), #{totalScore}, #{correctRate}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertSubmission(QuizSubmission submission);

    @Insert("INSERT INTO quiz_answers (submission_id, question_id, student_answer, is_correct, score) " +
            "VALUES (#{submissionId}, #{questionId}, #{studentAnswer}, #{isCorrect}, #{score})")
    int insertAnswer(QuizAnswer answer);

    @Select("SELECT COALESCE(MAX(attempt_no), 0) FROM quiz_submissions WHERE quiz_id = #{quizId} AND student_id = #{studentId}")
    int getMaxAttemptNo(@Param("quizId") Long quizId, @Param("studentId") Long studentId);

    // ────── 掌握度 ──────

    @Select("SELECT * FROM knowledge_mastery WHERE course_id = #{courseId} AND student_id = #{studentId} AND knowledge_node_id = #{nodeId}")
    KnowledgeMastery findMastery(@Param("courseId") Long courseId, @Param("studentId") Long studentId, @Param("nodeId") Long nodeId);

    @Insert("INSERT INTO knowledge_mastery (course_id, student_id, knowledge_node_id, mastery_score, mastery_level, last_quiz_score, updated_at) " +
            "VALUES (#{courseId}, #{studentId}, #{knowledgeNodeId}, #{masteryScore}, #{masteryLevel}, #{lastQuizScore}, NOW()) " +
            "ON CONFLICT (course_id, student_id, knowledge_node_id) DO UPDATE SET " +
            "mastery_score = EXCLUDED.mastery_score, mastery_level = EXCLUDED.mastery_level, " +
            "last_quiz_score = EXCLUDED.last_quiz_score, updated_at = NOW()")
    int upsertMastery(KnowledgeMastery mastery);

    @Insert("INSERT INTO mastery_history (mastery_id, course_id, student_id, knowledge_node_id, old_score, new_score, change_reason, created_at) " +
            "VALUES (#{masteryId}, #{courseId}, #{studentId}, #{knowledgeNodeId}, #{oldScore}, #{newScore}, #{changeReason}, NOW())")
    int insertMasteryHistory(@Param("masteryId") Long masteryId, @Param("courseId") Long courseId,
                             @Param("studentId") Long studentId, @Param("knowledgeNodeId") Long nodeId,
                             @Param("oldScore") BigDecimal oldScore, @Param("newScore") BigDecimal newScore,
                             @Param("changeReason") String changeReason);

    // ────── 学习日志 ──────

    @Insert("INSERT INTO learning_logs (course_id, student_id, knowledge_node_id, action_type, target_id, created_at) " +
            "VALUES (#{courseId}, #{studentId}, #{nodeId}, 'finish_quiz', #{targetId}, NOW())")
    int insertLearningLog(@Param("courseId") Long courseId, @Param("studentId") Long studentId,
                          @Param("nodeId") Long nodeId, @Param("targetId") Long targetId);
}
