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

    private void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new BusinessException(400, "密码不能为空");
        }
        if (password.length() < 8) {
            throw new BusinessException(400, "密码长度不能少于 8 位");
        }
        if (password.length() > 64) {
            throw new BusinessException(400, "密码长度不能超过 64 位");
        }
    }

    @Override
    @Transactional
    public Map<String, Object> register(String name, String email, String password, String role) {
        if (userMapper.findByEmail(email) != null) {
            throw new BusinessException(400, "该邮箱已被注册");
        }
        validatePassword(password);

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
    public Map<String, Object> login(String account, String password) {
        User user = userMapper.findByAccount(account);
        if (user == null) {
            throw new BusinessException(401, "账号或密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BusinessException(401, "账号已被禁用");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(401, "账号或密码错误");
        }

        String role = safeRole(user);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getRealName(), role);

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("realName", user.getRealName());
        userInfo.put("role", role);
        userInfo.put("mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("user", userInfo);
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
        result.put("mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword()));
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> changePassword(Long userId, String oldPassword, String newPassword) {
        validatePassword(newPassword);

        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException(400, "原密码错误");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new BusinessException(400, "新密码不能与原密码相同");
        }

        // 更新密码，并清除「必须改密」标记
        userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));

        // 重新签发 token（前端替换本地 token）
        String role = safeRole(user);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getRealName(), role);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        return result;
    }
}
