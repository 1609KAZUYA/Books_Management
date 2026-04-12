package com.bookmanagement.service.user;

import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.config.AppProperties;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.domain.enums.UserRole;
import com.bookmanagement.repository.UserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserContextService {

    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public User requireCurrentUser(Long headerUserId) {
        if (headerUserId != null) {
            return userRepository.findById(headerUserId)
                    .orElseThrow(() -> new NotFoundException("AUTH-404", "User not found"));
        }
        return userRepository.findByEmailIgnoreCase(appProperties.getDefaultUserEmail())
                .orElseGet(this::createDefaultUser);
    }

    @Transactional
    protected User createDefaultUser() {
        User user = new User();
        user.setEmail(appProperties.getDefaultUserEmail().toLowerCase(Locale.ROOT));
        user.setPasswordHash("dev-password-placeholder");
        user.setDisplayName("Demo User");
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        return userRepository.save(user);
    }
}
