package com.example.smartteachingplatform.quiz.mapper;

import com.example.smartteachingplatform.quiz.dto.QuizListItemResponse;
import com.example.smartteachingplatform.quiz.dto.QuizQuestionRow;
import com.example.smartteachingplatform.quiz.entity.Quiz;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface QuizMapper {

    @Insert("INSERT INTO quizzes (course_id, title, description, start_time, end_time, total_score, status, created_by, created_at, updated_at) " +
            "VALUES (#{courseId}, #{title}, #{description}, #{startTime}, #{endTime}, #{totalScore}, #{status}, #{createdBy}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Quiz quiz);

    @Insert("INSERT INTO quiz_questions (quiz_id, question_id, score, sort_order) " +
            "VALUES (#{quizId}, #{questionId}, #{score}, #{sortOrder})")
    int insertQuizQuestion(@Param("quizId") Long quizId, @Param("questionId") Long questionId,
                           @Param("score") java.math.BigDecimal score, @Param("sortOrder") int sortOrder);

    @Select("SELECT * FROM quizzes WHERE id = #{id}")
    Quiz findById(Long id);

    @Select("SELECT * FROM quizzes WHERE course_id = #{courseId}")
    List<Quiz> findByCourseId(Long courseId);

    /** 查测验下的所有题目 ID */
    @Select("SELECT question_id FROM quiz_questions WHERE quiz_id = #{quizId} ORDER BY sort_order")
    List<Long> findQuestionIdsByQuizId(Long quizId);

    /** 查测验下一道题的分数 */
    @Select("SELECT score FROM quiz_questions WHERE quiz_id = #{quizId} AND question_id = #{questionId}")
    java.math.BigDecimal findQuestionScore(@Param("quizId") Long quizId, @Param("questionId") Long questionId);

    List<QuizListItemResponse> findPageByCourseId(@Param("courseId") Long courseId,
                                                  @Param("studentOnly") boolean studentOnly,
                                                  @Param("limit") int limit,
                                                  @Param("offset") int offset);

    long countByCourseId(@Param("courseId") Long courseId,
                         @Param("studentOnly") boolean studentOnly);

    @Select("SELECT qq.question_id, qq.score, qq.sort_order, q.question_type, q.stem " +
            "FROM quiz_questions qq " +
            "JOIN questions q ON qq.question_id = q.id " +
            "WHERE qq.quiz_id = #{quizId} ORDER BY qq.sort_order")
    List<QuizQuestionRow> findQuizQuestionRows(Long quizId);

    @Update("UPDATE quizzes SET title = #{title}, description = #{description}, " +
            "start_time = #{startTime}, end_time = #{endTime}, total_score = #{totalScore}, " +
            "attempt_limit = #{attemptLimit}, updated_at = NOW() WHERE id = #{id}")
    int update(Quiz quiz);

    @Delete("DELETE FROM quiz_questions WHERE quiz_id = #{quizId}")
    int deleteQuizQuestions(Long quizId);

    @Delete("DELETE FROM quizzes WHERE id = #{quizId}")
    int deleteById(Long quizId);
}
