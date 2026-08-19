package com.example.smartteachingplatform.course.mapper;

import com.example.smartteachingplatform.course.entity.Course;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface CourseMapper {

    @Insert("INSERT INTO courses (course_name, semester, description, teacher_id, invite_code, status, created_at, updated_at) " +
            "VALUES (#{courseName}, #{semester}, #{description}, #{teacherId}, #{inviteCode}, 'active', NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Course course);

    @Select("SELECT * FROM courses WHERE id = #{id}")
    Course findById(Long id);

    @Select("SELECT * FROM courses WHERE invite_code = #{inviteCode} AND status = 'active'")
    Course findByInviteCode(String inviteCode);

    @Select("SELECT c.*, cm.member_role, " +
            "(SELECT COUNT(*) FROM course_members WHERE course_id = c.id AND status = 'active') AS member_count, " +
            "(SELECT COUNT(*) FROM course_members WHERE course_id = c.id AND status = 'active' AND member_role = 'student') AS student_count, " +
            "(SELECT COUNT(*) FROM knowledge_nodes WHERE course_id = c.id AND status = 'active') AS node_count " +
            "FROM courses c " +
            "JOIN course_members cm ON c.id = cm.course_id " +
            "WHERE cm.user_id = #{userId} AND cm.status = 'active' " +
            "ORDER BY c.created_at DESC")
    @Results({
            @Result(column = "member_role", property = "role"),
            @Result(column = "member_count", property = "memberCount"),
            @Result(column = "student_count", property = "studentCount"),
            @Result(column = "node_count", property = "nodeCount")
    })
    List<Course> findMyCourses(Long userId);

    @Select("SELECT teacher_id FROM courses WHERE id = #{courseId}")
    Long findTeacherIdByCourseId(Long courseId);
}
