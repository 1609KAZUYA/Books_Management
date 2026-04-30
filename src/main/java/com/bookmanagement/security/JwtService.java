package com.bookmanagement.security;

import com.bookmanagement.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
/**
 * JWTトークンを作成・検証するクラスです。
 *
 * JWTは「ログイン済みであることを示す署名付きの文字列」です。
 * Laravel SanctumやPassportのアクセストークンに近い使い方をしています。
 */
public class JwtService {

    private static final String DEVELOPMENT_SECRET =
            "booksMemo-development-jwt-secret-key-for-HS256-algorithm-32bytes";

    private final SecretKey key;
    private final long expirySeconds;
    private final String issuer;
    private final String audience;
    private final long allowedClockSkewSeconds;

    public JwtService(AppProperties appProperties, Environment environment) {
        // application.yml の app.jwt.secret を署名キーとして使います。
        // 本番環境で開発用のデフォルト秘密鍵を使う事故は、起動時に止めます。
        String secret = appProperties.getJwt().getSecret();
        if (isProductionProfile(environment) && DEVELOPMENT_SECRET.equals(secret)) {
            throw new IllegalStateException("JWT_SECRET must be changed in production");
        }
        this.key = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8));
        this.expirySeconds = appProperties.getJwt().getExpirySeconds();
        this.issuer = appProperties.getJwt().getIssuer();
        this.audience = appProperties.getJwt().getAudience();
        this.allowedClockSkewSeconds = appProperties.getJwt().getAllowedClockSkewSeconds();
    }

    public String generateToken(Long userId) {
        // subject にユーザーIDを入れ、期限付きのトークンを作ります。
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirySeconds * 1000L);
        return Jwts.builder()
                .issuer(issuer)
                .subject(userId.toString())
                .audience().single(audience)
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .notBefore(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Long extractUserId(String token) {
        // トークンを検証したうえで、中に入っているユーザーIDを取り出します。
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    public boolean isTokenValid(String token) {
        // 署名や有効期限が正しければtrue、改ざんや期限切れならfalseです。
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public long getExpirySeconds() {
        return expirySeconds;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .clockSkewSeconds(allowedClockSkewSeconds)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isProductionProfile(Environment environment) {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> profile.equalsIgnoreCase("prod")
                        || profile.equalsIgnoreCase("production"));
    }
}
