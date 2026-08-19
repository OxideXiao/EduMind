package com.example.smartteachingplatform.auth.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    private String passwordHash;
    private String realName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 从 user_roles + roles 表 JOIN 查出来的角色代码 */
    private String roleCode;
}
