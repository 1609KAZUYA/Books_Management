package com.bookmanagement.dto.auth;

import com.bookmanagement.domain.enums.UserRole;

public record MeResponse(
        Long id,
        String email,
        String displayName,
        UserRole role
) {
}
