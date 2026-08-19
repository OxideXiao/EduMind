package com.example.smartteachingplatform.auth.service;

import java.util.Map;

public interface AuthService {
    Map<String, Object> register(String name, String email, String password, String role);
    Map<String, Object> login(String email, String password);
    Map<String, Object> me(Long userId);
}
