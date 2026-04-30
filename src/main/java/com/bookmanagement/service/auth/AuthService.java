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
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * 認証の「実際の処理」を担当するクラスです。
 *
 * Laravelでいうと、Controllerから呼ばれるServiceクラスに近いです。
 * Controllerは入口だけ、Serviceは「登録する」「ログインする」などの業務ルールを書きます。
 */
public class AuthService {

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password1234",
            "password12345",
            "password123456",
            "qwerty123456",
            "admin123456",
            "letmein123456",
            "booksmemo1234"
    );

    private final UserRepository userRepository;
    private final UserContextService userContextService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        // 1. 入力値を保存しやすい形に整えます。
        String email = normalizeEmail(request.email());
        String displayName = normalizeDisplayName(request.displayName());
        validatePasswordStrength(request.password(), email, displayName);

        // 2. 同じメールアドレスが既に使われていないかDBで確認します。
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateException("USER-409", "このメールアドレスは既に登録されています");
        }

        // 3. Userエンティティを作り、DBに保存する値をセットします。
        //    Laravelの Eloquent Model に値を詰めて save() するイメージです。
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(displayName);
        // パスワードはそのまま保存せず、BCryptでハッシュ化して保存します。
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setLastLoginAt(OffsetDateTime.now());

        // 4. DBに保存し、ログイン済みとしてJWTトークンも返します。
        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getId());
        return new LoginResponse(token, "Bearer", (int) jwtService.getExpirySeconds(), toMeResponse(saved));
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // メールアドレスは大文字小文字や前後スペースの差で別扱いにならないよう整えます。
        String email = normalizeEmail(request.email());

        // メールアドレスからユーザーを探します。見つからなければ認証エラーです。
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        // アカウントが有効か、入力パスワードが保存済みハッシュと一致するかを確認します。
        if (!Boolean.TRUE.equals(user.getIsActive())
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // 最終ログイン日時を更新します。
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        // ログイン成功時は、以後のAPI呼び出しに使うJWTトークンを返します。
        String token = jwtService.generateToken(user.getId());
        return new LoginResponse(token, "Bearer", (int) jwtService.getExpirySeconds(), toMeResponse(user));
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        // JWTから現在のユーザーを特定し、画面表示用の情報だけ返します。
        return toMeResponse(userContextService.requireCurrentUser());
    }

    private MeResponse toMeResponse(User user) {
        // Entityをそのまま返さず、APIレスポンス用DTOに詰め替えます。
        // Laravelでいう Resource / API Resource に近い考え方です。
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

    private void validatePasswordStrength(String password, String email, String displayName) {
        // 登録時のパスワードだけ強めにチェックします。
        // 既存ユーザーのログインでは、保存済みハッシュとの照合だけを行います。
        if (password == null || password.length() < 12) {
            throw new ValidationException("VALIDATION_ERROR", "パスワードは12文字以上で入力してください");
        }

        String normalizedPassword = password.toLowerCase(Locale.ROOT);
        String emailLocalPart = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        boolean containsEmail = emailLocalPart.length() >= 3
                && normalizedPassword.contains(emailLocalPart.toLowerCase(Locale.ROOT));
        boolean containsDisplayName = displayName.length() >= 3
                && normalizedPassword.contains(displayName.toLowerCase(Locale.ROOT));
        if (COMMON_PASSWORDS.contains(normalizedPassword) || containsEmail || containsDisplayName) {
            throw new ValidationException("VALIDATION_ERROR", "推測されやすいパスワードは使用できません");
        }
    }
}
