package com.example.smartteachingplatform.course.mapper;

import com.example.smartteachingplatform.course.entity.CourseMember;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface CourseMemberMapper {

    @Insert("INSERT INTO course_members (course_id, user_id, member_role, joined_at, status) " +
            "VALUES (#{courseId}, #{userId}, #{memberRole}, NOW(), 'active')")
    int insert(CourseMember member);

    @Select("SELECT cm.*, u.real_name AS user_name FROM course_members cm " +
            "JOIN users u ON cm.user_id = u.id " +
            "WHERE cm.course_id = #{courseId} AND cm.member_role = 'student' AND cm.status = 'active' " +
            "ORDER BY cm.joined_at")
    @Results({
            @Result(column = "user_name", property = "userName")
    })
    List<CourseMember> findStudentsByCourseId(Long courseId);

    @Select("SELECT * FROM course_members WHERE course_id = #{courseId} AND user_id = #{userId} AND status = 'active'")
    CourseMember findByCourseIdAndUserId(@Param("courseId") Long courseId,
                                         @Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM course_members WHERE course_id = #{courseId} AND status = 'active'")
    int countByCourseId(Long courseId);
}
