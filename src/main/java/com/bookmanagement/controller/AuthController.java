package com.bookmanagement.controller;

import com.bookmanagement.common.exception.UnauthorizedException;
import com.bookmanagement.dto.auth.LoginRequest;
import com.bookmanagement.dto.auth.LoginResponse;
import com.bookmanagement.dto.auth.MeResponse;
import com.bookmanagement.dto.auth.RegisterRequest;
import com.bookmanagement.security.LoginRateLimiter;
import com.bookmanagement.service.auth.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
/**
 * 認証まわりのAPI入口です。
 *
 * Laravelでいう Controller に近く、URLとServiceの処理をつなぐ役割です。
 * ここではDB操作などの細かい処理はせず、AuthServiceへ処理を渡します。
 */
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimiter loginRateLimiter;

    @PostMapping("/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        // @RequestBody は、フロントから送られたJSONを LoginRequest に変換します。
        // @Valid は、LoginRequest に書かれた入力チェックを実行します。
        loginRateLimiter.assertAllowed(request.email(), httpRequest);
        try {
            LoginResponse response = authService.login(request);
            loginRateLimiter.recordSuccess(request.email(), httpRequest);
            return response;
        } catch (UnauthorizedException ex) {
            loginRateLimiter.recordFailure(request.email(), httpRequest);
            throw ex;
        }
    }

    @PostMapping("/auth/register")
    public LoginResponse register(@Valid @RequestBody RegisterRequest request) {
        // 新規登録の実処理は AuthService.register(...) に任せます。
        return authService.register(request);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout() {
        // JWT方式ではサーバー側にログイン状態を保存していないため、
        // フロント側でトークンを消せばログアウトできます。ここは204だけ返します。
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse me() {
        // 現在ログインしているユーザー情報を返します。
        return authService.me();
    }
}
