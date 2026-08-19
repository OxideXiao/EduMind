package com.example.smartteachingplatform.auth.mapper;

import com.example.smartteachingplatform.auth.entity.User;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserMapper {

    @Select("SELECT u.*, r.role_code FROM users u " +
            "LEFT JOIN user_roles ur ON u.id = ur.user_id " +
            "LEFT JOIN roles r ON ur.role_id = r.id " +
            "WHERE u.id = #{id}")
    @Results({
            @Result(column = "role_code", property = "roleCode")
    })
    User findById(Long id);

    @Select("SELECT u.*, r.role_code FROM users u " +
            "LEFT JOIN user_roles ur ON u.id = ur.user_id " +
            "LEFT JOIN roles r ON ur.role_id = r.id " +
            "WHERE u.email = #{email}")
    @Results({
            @Result(column = "role_code", property = "roleCode")
    })
    User findByEmail(String email);

    @Insert("INSERT INTO users (username, password_hash, real_name, email, status, created_at, updated_at) " +
            "VALUES (#{username}, #{passwordHash}, #{realName}, #{email}, 'active', NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Insert("INSERT INTO user_roles (user_id, role_id) " +
            "SELECT #{userId}, id FROM roles WHERE role_code = #{roleCode}")
    int insertUserRole(Long userId, String roleCode);
}
