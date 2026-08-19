package com.example.smartteachingplatform.auth.controller;

import com.example.smartteachingplatform.auth.service.AuthService;
import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        return Result.success(authService.register(
                body.get("name"),
                body.get("email"),
                body.get("password"),
                body.get("role")
        ));
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        return Result.success(authService.login(
                body.get("email"),
                body.get("password")
        ));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> me() {
        return Result.success(authService.me(SecurityUtils.getUserId()));
    }
}
