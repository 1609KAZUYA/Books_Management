package com.bookmanagement.security;

import com.bookmanagement.common.exception.TooManyRequestsException;
import com.bookmanagement.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LoginRateLimiter {

    private final AppProperties appProperties;
    private final ConcurrentMap<String, AttemptBucket> buckets = new ConcurrentHashMap<>();

    public void assertAllowed(String email, HttpServletRequest request) {
        // メールアドレス単位とIPアドレス単位の両方で制限します。
        // 片方だけだと、同一IPから複数メールを試す攻撃や、同一メールへの集中攻撃を防ぎにくいためです。
        assertKeyAllowed(emailKey(email));
        assertKeyAllowed(ipKey(clientIp(request)));
    }

    public void recordFailure(String email, HttpServletRequest request) {
        recordFailure(emailKey(email));
        recordFailure(ipKey(clientIp(request)));
    }

    public void recordSuccess(String email, HttpServletRequest request) {
        buckets.remove(emailKey(email));
        buckets.remove(ipKey(clientIp(request)));
    }

    private void assertKeyAllowed(String key) {
        AttemptBucket bucket = buckets.get(key);
        if (bucket == null) {
            return;
        }

        Instant now = Instant.now();
        synchronized (bucket) {
            if (bucket.lockedUntil != null && bucket.lockedUntil.isAfter(now)) {
                throw new TooManyRequestsException("ログイン試行が多すぎます。しばらく時間をおいてから再試行してください");
            }
        }
    }

    private void recordFailure(String key) {
        AppProperties.Security.LoginRateLimit settings = appProperties.getSecurity().getLoginRateLimit();
        int maxFailures = settings.getMaxFailures();
        Duration window = settings.getWindow();
        Duration lockout = settings.getLockout();
        Instant now = Instant.now();

        AttemptBucket bucket = buckets.computeIfAbsent(key, ignored -> new AttemptBucket(now));
        synchronized (bucket) {
            if (bucket.windowStartedAt.plus(window).isBefore(now)) {
                bucket.windowStartedAt = now;
                bucket.failures = 0;
                bucket.lockedUntil = null;
            }

            bucket.failures++;
            if (bucket.failures >= maxFailures) {
                bucket.lockedUntil = now.plus(lockout);
            }
        }
    }

    private String emailKey(String email) {
        return "email:" + (email == null ? "" : email.trim().toLowerCase(Locale.ROOT));
    }

    private String ipKey(String ip) {
        return "ip:" + ip;
    }

    private String clientIp(HttpServletRequest request) {
        // 本番でロードバランサーやリバースプロキシを使う場合は、
        // 信頼済みプロキシでForwarded/X-Forwarded-Forを正規化してからアプリへ渡してください。
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private static class AttemptBucket {

        private Instant windowStartedAt;
        private int failures;
        private Instant lockedUntil;

        private AttemptBucket(Instant windowStartedAt) {
            this.windowStartedAt = windowStartedAt;
        }
    }
}
