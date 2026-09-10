package com.example.smartteachingplatform.quiz.mapper;

import com.example.smartteachingplatform.quiz.entity.Question;
import com.example.smartteachingplatform.quiz.entity.QuestionOption;
import org.apache.ibatis.annotations.*;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import java.util.Map;
@Mapper
public interface QuestionMapper {

    @Insert("INSERT INTO questions (course_id, knowledge_node_id, question_code, question_type, stem, answer, analysis, " +
            "difficulty, created_by, created_at, updated_at) " +
            "VALUES (#{courseId}, #{knowledgeNodeId}, #{questionCode}, #{questionType}, #{stem}, #{answer}, #{analysis}," +
            "#{difficulty}, #{createdBy}, NOW(), NOW())")
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

    /** 绑定知识点 */
    @Insert("INSERT INTO question_knowledge (question_id, knowledge_node_id) VALUES (#{questionId}, #{nodeId})")
    int bindKnowledgeNode(@Param("questionId") Long questionId, @Param("nodeId") Long nodeId);

    /** 更新题目 */
    @Update("UPDATE questions SET question_code = #{questionCode}, question_type = #{questionType}, " +
            "stem = #{stem}, answer = #{answer}, analysis = #{analysis}, difficulty = #{difficulty}, " +
            "knowledge_node_id = #{knowledgeNodeId}, updated_at = NOW() WHERE id = #{id}")
    int update(Question question);

    /** 删除题目所有选项 */
    @Delete("DELETE FROM question_options WHERE question_id = #{questionId}")
    int deleteOptionsByQuestionId(Long questionId);

    /** 删除题目所有知识点关联 */
    @Delete("DELETE FROM question_knowledge WHERE question_id = #{questionId}")
    int deleteKnowledgeByQuestionId(Long questionId);

    /** 查课程下已用题号 */
    @Select("SELECT question_code FROM questions WHERE course_id = #{courseId} AND question_code IS NOT NULL")
    List<String> findQuestionCodesByCourseId(Long courseId);

    /** 题号唯一校验 */
    @Select("SELECT COUNT(*) FROM questions WHERE course_id = #{courseId} AND question_code = #{questionCode}")
    int countByCourseIdAndCode(@Param("courseId") Long courseId, @Param("questionCode") String questionCode);

    /** 题号唯一校验（ */
    @Select("SELECT COUNT(*) FROM questions WHERE course_id = #{courseId} AND question_code = #{questionCode} AND id <>" +
            "#{excludeId}")
    int countByCourseIdAndCodeExclude(@Param("courseId") Long courseId,
                                      @Param("questionCode") String questionCode,
                                      @Param("excludeId") Long excludeId);

    /** 检查题目是否被测验引用 */
    @Select("SELECT COUNT(*) FROM quiz_questions WHERE question_id = #{questionId}")
    int countQuizReferences(Long questionId);

    /** 删除题目 */
    @Delete("DELETE FROM questions WHERE id = #{id}")
    int deleteById(Long id);

    /** 按题号查题目 */
    @Select("SELECT * FROM questions WHERE course_id = #{courseId} AND question_code = #{questionCode}")
    Question findByCourseIdAndCode(@Param("courseId") Long courseId, @Param("questionCode") String questionCode);

    /** 绑定节点（幂等，重复绑定忽略） */
    @Insert("INSERT INTO question_knowledge (question_id, knowledge_node_id) " +
            "VALUES (#{questionId}, #{nodeId}) ON CONFLICT DO NOTHING")
    int bindNodeIfAbsent(@Param("questionId") Long questionId, @Param("nodeId") Long nodeId);

    /** 解绑节点 */
    @Delete("DELETE FROM question_knowledge WHERE question_id = #{questionId} AND knowledge_node_id = #{nodeId}")
    int unbindNode(@Param("questionId") Long questionId, @Param("nodeId") Long nodeId);

    /** 更新题目的主节点冗余（knowledge_node_id） */
    @Update("UPDATE questions SET knowledge_node_id = #{nodeId}, updated_at = NOW() WHERE id = #{questionId}")
    int updateKnowledgeNodeId(@Param("questionId") Long questionId, @Param("nodeId") Long nodeId);

    /** 查题目的第一个绑定节点 */
    @Select("SELECT knowledge_node_id FROM question_knowledge WHERE question_id = #{questionId} ORDER BY id LIMIT 1")
    Long findFirstNodeIdByQuestionId(Long questionId);
}
