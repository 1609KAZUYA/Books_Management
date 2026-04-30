package com.bookmanagement.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * ログインAPIでフロントから受け取るJSONの形です。
 *
 * Laravelでいう FormRequest に近く、@NotBlank や @Email で入力チェックも行います。
 */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password
) {
}
