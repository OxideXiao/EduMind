package com.example.smartteachingplatform.quiz.mapper;

import com.example.smartteachingplatform.quiz.entity.Question;
import com.example.smartteachingplatform.quiz.entity.QuestionOption;
import org.apache.ibatis.annotations.*;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import java.util.Map;
@Mapper
public interface QuestionMapper {

    @Insert("INSERT INTO questions (course_id, knowledge_node_id, question_type, stem, answer, analysis, difficulty, created_by, created_at, updated_at) " +
            "VALUES (#{courseId}, #{knowledgeNodeId}, #{questionType}, #{stem}, #{answer}, #{analysis}, #{difficulty}, #{createdBy}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Question question);

    @Insert("INSERT INTO question_options (question_id, option_label, option_content, is_correct) " +
            "VALUES (#{questionId}, #{optionLabel}, #{optionContent}, #{isCorrect})")
    int insertOption(QuestionOption option);

    @Select("SELECT * FROM questions WHERE id = #{id}")
    Question findById(Long id);

    @Select("SELECT * FROM questions WHERE course_id = #{courseId}")
    List<Question> findByCourseId(Long courseId);

    @Select("SELECT * FROM question_options WHERE question_id = #{questionId} ORDER BY id")
    List<QuestionOption> findOptionsByQuestionId(Long questionId);

    /** 分页查课程题目 */
    @Select("SELECT * FROM questions WHERE course_id = #{courseId} " +
            "ORDER BY id DESC LIMIT #{limit} OFFSET #{offset}")
    List<Question> findPageByCourseId(@Param("courseId") Long courseId,
                                      @Param("limit") int limit,
                                      @Param("offset") int offset);

    /** 统计课程题目总数 */
    @Select("SELECT COUNT(*) FROM questions WHERE course_id = #{courseId}")
    long countByCourseId(@Param("courseId") Long courseId);

    /** 批量查题目选项 */
    List<QuestionOption> findOptionsByQuestionIds(@Param("ids") List<Long> ids);

    /** 批量查题目关联节点 id  */
    List<Map<String, Object>> findNodeIdsByQuestionIds(@Param("ids") List<Long> ids);
}
