package com.example.smartteachingplatform.memory.mapper;

import com.example.smartteachingplatform.memory.entity.StudentMemory;
import org.apache.ibatis.annotations.*;

@Mapper
public interface StudentMemoryMapper {

    /** 查询某个学生在某课程下的记忆 */
    @Select("SELECT * FROM student_memory WHERE student_id = #{studentId} AND course_id = #{courseId}")
    StudentMemory findByStudentIdAndCourseId(@Param("studentId") Long studentId,
                                             @Param("courseId") Long courseId);

    /** UPSERT：存在则更新，不存在则插入 */
    @Insert("INSERT INTO student_memory (student_id, course_id, memory_json, updated_at) " +
            "VALUES (#{studentId}, #{courseId}, #{memoryJson}, NOW()) " +
            "ON CONFLICT (student_id, course_id) " +
            "DO UPDATE SET memory_json = EXCLUDED.memory_json, updated_at = NOW()")
    int upsert(@Param("studentId") Long studentId,
               @Param("courseId") Long courseId,
               @Param("memoryJson") String memoryJson);

    /** 按课程ID删除所有记忆（供种子数据幂等清理） */
    @Delete("DELETE FROM student_memory WHERE course_id = #{courseId}")
    int deleteByCourseId(@Param("courseId") Long courseId);
}
