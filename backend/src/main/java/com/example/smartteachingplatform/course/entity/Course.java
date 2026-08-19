package com.example.smartteachingplatform.course.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    private Long id;
    private String courseName;
    private String courseCode;
    private String semester;
    private Long teacherId;
    private String description;
    private String inviteCode;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 当前用户在课程中的角色，从 course_members JOIN 获取 */
    private String role;

    /** 课程成员数（含教师），聚合查询 */
    private Integer memberCount;
    /** 学生数，聚合查询 */
    private Integer studentCount;
    /** 知识点数，聚合查询 */
    private Integer nodeCount;
}
