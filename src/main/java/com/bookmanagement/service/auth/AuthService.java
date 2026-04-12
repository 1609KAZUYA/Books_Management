package com.bookmanagement.service.auth;

import com.bookmanagement.common.exception.UnauthorizedException;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.dto.auth.LoginRequest;
import com.bookmanagement.dto.auth.LoginResponse;
import com.bookmanagement.dto.auth.MeResponse;
import com.bookmanagement.repository.UserRepository;
import com.bookmanagement.service.user.UserContextService;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserContextService userContextService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (!Boolean.TRUE.equals(user.getIsActive()) || !StringUtils.hasText(request.password())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        return new LoginResponse("dev-token", "Bearer", 3600, toMeResponse(user));
    }

    @Transactional(readOnly = true)
    public MeResponse me(Long headerUserId) {
        return toMeResponse(userContextService.requireCurrentUser(headerUserId));
    }

    private MeResponse toMeResponse(User user) {
        return new MeResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}
