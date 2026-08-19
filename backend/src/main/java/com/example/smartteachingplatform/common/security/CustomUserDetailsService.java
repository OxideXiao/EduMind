package com.example.smartteachingplatform.common.security;

import com.example.smartteachingplatform.auth.entity.User;
import com.example.smartteachingplatform.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + email);
        }
        return new CustomUserDetails(
                user.getId(),
                user.getRealName(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRoleCode()
        );
    }
}
