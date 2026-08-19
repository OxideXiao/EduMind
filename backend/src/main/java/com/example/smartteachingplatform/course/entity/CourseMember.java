package com.example.smartteachingplatform.course.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseMember {
    private Long id;
    private Long courseId;
    private Long userId;
    private String memberRole;
    private LocalDateTime joinedAt;
    private String status;

    /** 学生姓名，从 users JOIN 获取 */
    private String userName;
}
