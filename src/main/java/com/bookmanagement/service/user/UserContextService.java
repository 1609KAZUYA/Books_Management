package com.bookmanagement.service.user;

import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.common.exception.UnauthorizedException;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserContextService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("Not authenticated");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("AUTH-404", "User not found"));
    }
}
