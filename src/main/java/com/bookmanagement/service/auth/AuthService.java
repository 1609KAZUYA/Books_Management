package com.bookmanagement.service.auth;

import com.bookmanagement.common.exception.UnauthorizedException;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.dto.auth.LoginRequest;
import com.bookmanagement.dto.auth.LoginResponse;
import com.bookmanagement.dto.auth.MeResponse;
import com.bookmanagement.repository.UserRepository;
import com.bookmanagement.security.JwtService;
import com.bookmanagement.service.user.UserContextService;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserContextService userContextService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getIsActive())
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId());
        return new LoginResponse(token, "Bearer", (int) jwtService.getExpirySeconds(), toMeResponse(user));
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        return toMeResponse(userContextService.requireCurrentUser());
    }

    private MeResponse toMeResponse(User user) {
        return new MeResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}
