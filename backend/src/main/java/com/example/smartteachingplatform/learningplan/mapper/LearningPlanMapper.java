package com.example.smartteachingplatform.learningplan.mapper;

import com.example.smartteachingplatform.learningplan.entity.LearningPlan;
import org.apache.ibatis.annotations.*;

@Mapper
public interface LearningPlanMapper {

    /** 查询学生最新的学习计划 */
    @Select("SELECT * FROM learning_plans WHERE course_id = #{courseId} AND student_id = #{studentId} " +
            "AND status = 'active' ORDER BY created_at DESC LIMIT 1")
    LearningPlan findLatestByCourseAndStudent(@Param("courseId") Long courseId,
                                              @Param("studentId") Long studentId);

    /** 插入学习计划 */
    @Insert("INSERT INTO learning_plans (course_id, student_id, title, plan_content, generated_by, status, created_at, updated_at) " +
            "VALUES (#{courseId}, #{studentId}, #{title}, #{planContent}, #{generatedBy}, #{status}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(LearningPlan plan);
}
