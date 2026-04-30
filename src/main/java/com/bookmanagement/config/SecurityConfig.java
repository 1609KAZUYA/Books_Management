package com.bookmanagement.config;

import com.bookmanagement.common.api.ApiErrorResponse;
import com.bookmanagement.common.web.RequestIdFilter;
import com.bookmanagement.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
/**
 * Spring Securityの設定です。
 *
 * Laravelでいう middleware/auth.php や config/auth.php に近い役割です。
 * 「どのURLはログイン不要か」「JWTをどこで確認するか」をここで決めています。
 */
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // APIだけのアプリなので、ブラウザのフォーム送信向けCSRF保護は使いません。
                .csrf(AbstractHttpConfigurer::disable)
                // フロントエンド(localhost:5173)からAPI(localhost:8080)を呼べるようにします。
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // JWT方式ではサーバー側にセッションを持たないためSTATELESSにします。
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ログイン・新規登録・ヘルスチェックだけは未ログインでも許可します。
                        .requestMatchers("/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/register").permitAll()
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        // それ以外のAPIはJWTでログイン済みである必要があります。
                        .anyRequest().authenticated()
                )
                .headers(headers -> headers
                        // APIレスポンスにも基本的な防御ヘッダーを付けます。
                        // 画面を表示する用途ではないため、CSPはかなり厳しめにしています。
                        .contentSecurityPolicy(csp ->
                                csp.policyDirectives("default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(Customizer.withDefaults())
                        .httpStrictTransportSecurity(hsts ->
                                hsts.includeSubDomains(true).preload(true).maxAgeInSeconds(31536000))
                        .referrerPolicy(referrer ->
                                referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .permissionsPolicyHeader(permissions ->
                                permissions.policy("camera=(), microphone=(), geolocation=(), payment=()"))
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, e) -> {
                            // 未ログインで保護APIにアクセスした時のJSONレスポンスです。
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ApiErrorResponse body = new ApiErrorResponse(
                                    "AUTH-401",
                                    "Unauthorized",
                                    resolveRequestId(response),
                                    List.of()
                            );
                            objectMapper.writeValue(response.getWriter(), body);
                        })
                )
                // Controllerに届く前にJWTを確認するフィルターを差し込みます。
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCryptの計算コストを標準値(10)より強めにしています。
        // コストを上げると総当たり攻撃に強くなりますが、ログイン処理も少し重くなります。
        return new BCryptPasswordEncoder(12);
    }

    private String resolveRequestId(HttpServletResponse response) {
        String requestId = response.getHeader(RequestIdFilter.HEADER_NAME);
        return requestId == null || requestId.isBlank() ? UUID.randomUUID().toString() : requestId;
    }
}
