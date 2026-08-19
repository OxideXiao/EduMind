package com.example.smartteachingplatform.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 内部 API 认证过滤器：校验 X-Internal-Token，用于 Agent → Spring 的内部调用。
 * 覆盖路径：/api/students/** 的 memory 接口。
 */
@Slf4j
@Component
public class InternalTokenAuthenticationFilter extends OncePerRequestFilter {

    @Value("${agent.service.internal-token}")
    private String internalToken;

    @Value("${agent.service.allowed-ips}")
    private String allowedIps;

    private static final String INTERNAL_API_PREFIX = "/api/students/";
    private static final String INTERNAL_POST_PATHS = "/api/notifications,/api/learning-plans";
    private static final String INTERNAL_GET_PATHS = "/api/analytics/daily";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 判断是否为内部 API
        boolean isInternalApi = path.startsWith(INTERNAL_API_PREFIX)
                || ("POST".equalsIgnoreCase(method) && isInList(path, INTERNAL_POST_PATHS))
                || ("GET".equalsIgnoreCase(method) && isInList(path, INTERNAL_GET_PATHS));

        if (isInternalApi) {
            // IP 白名单校验
            String clientIp = request.getRemoteAddr();
            Set<String> allowedIpSet = new HashSet<>(Arrays.asList(allowedIps.split("\\s*,\\s*")));
            if (!allowedIpSet.contains(clientIp)) {
                log.warn("内部 API IP 拒绝: {} {} from {}", request.getMethod(), path, clientIp);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":403,\"message\":\"禁止访问\"}");
                return;
            }

            String token = request.getHeader("X-Internal-Token");

            if (!StringUtils.hasText(token) || !token.equals(internalToken)) {
                log.warn("内部 API Token 认证失败: {} {}", request.getMethod(), path);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"内部认证失败\"}");
                return;
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken("INTERNAL_SERVICE", null,
                            List.of(new SimpleGrantedAuthority("ROLE_INTERNAL")));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isInList(String path, String commaSeparatedPaths) {
        for (String p : commaSeparatedPaths.split(",")) {
            if (path.equals(p.trim())) return true;
        }
        return false;
    }
}
