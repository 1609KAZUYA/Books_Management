package com.bookmanagement.dto.auth;

public record LoginResponse(
        String accessToken,
        String tokenType,
        int expiresIn,
        MeResponse user
) {
}
