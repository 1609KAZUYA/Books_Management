package com.bookmanagement.service.auth;

import com.bookmanagement.common.exception.DuplicateException;
import com.bookmanagement.common.exception.UnauthorizedException;
import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.domain.enums.UserRole;
import com.bookmanagement.dto.auth.LoginRequest;
import com.bookmanagement.dto.auth.LoginResponse;
import com.bookmanagement.dto.auth.MeResponse;
import com.bookmanagement.dto.auth.RegisterRequest;
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
    public LoginResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String displayName = normalizeDisplayName(request.displayName());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateException("USER-409", "このメールアドレスは既に登録されています");
        }

        User user = new User();
        user.setEmail(email);
        user.setDisplayName(displayName);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setLastLoginAt(OffsetDateTime.now());

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getId());
        return new LoginResponse(token, "Bearer", (int) jwtService.getExpirySeconds(), toMeResponse(saved));
    }

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

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ValidationException("VALIDATION_ERROR", "メールアドレスを入力してください");
        }
        return email.trim().toLowerCase();
    }

    private String normalizeDisplayName(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            throw new ValidationException("VALIDATION_ERROR", "表示名を入力してください");
        }
        return displayName.trim();
    }
}
