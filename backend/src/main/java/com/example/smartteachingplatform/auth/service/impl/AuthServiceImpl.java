package com.example.smartteachingplatform.auth.service.impl;

import com.example.smartteachingplatform.auth.entity.User;
import com.example.smartteachingplatform.auth.mapper.UserMapper;
import com.example.smartteachingplatform.auth.service.AuthService;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    private static String safeRole(User u) {
        return u.getRoleCode() != null ? u.getRoleCode().toUpperCase() : "STUDENT";
    }

    @Override
    @Transactional
    public Map<String, Object> register(String name, String email, String password, String role) {
        if (userMapper.findByEmail(email) != null) {
            throw new BusinessException(400, "该邮箱已被注册");
        }

        User user = new User();
        user.setUsername(email.split("@")[0]);
        user.setRealName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));

        try {
            userMapper.insert(user);
            userMapper.insertUserRole(user.getId(), role.toLowerCase());
        } catch (DuplicateKeyException e) {
            throw new BusinessException(400, "该邮箱已被注册");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRealName(), role);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getId());
        result.put("token", token);
        return result;
    }

    @Override
    public Map<String, Object> login(String email, String password) {
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new BusinessException(401, "邮箱或密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BusinessException(401, "账号已被禁用");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(401, "邮箱或密码错误");
        }

        String role = safeRole(user);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getRealName(), role);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getRealName());
        result.put("role", role);
        result.put("token", token);
        return result;
    }

    @Override
    public Map<String, Object> me(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getRealName());
        result.put("email", user.getEmail());
        result.put("role", safeRole(user));
        return result;
    }
}
