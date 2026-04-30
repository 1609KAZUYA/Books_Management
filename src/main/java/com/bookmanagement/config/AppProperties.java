package com.bookmanagement.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    @NotBlank
    private String defaultUserEmail = "demo@example.com";

    private final Isbn isbn = new Isbn();
    private final Jwt jwt = new Jwt();
    private final Security security = new Security();

    @Getter
    @Setter
    public static class Isbn {

        @NotBlank
        private String openbdUrl = "https://api.openbd.jp/v1/get";

        @NotBlank
        private String googleBooksUrl = "https://www.googleapis.com/books/v1/volumes";

        private Duration cacheTtl = Duration.ofDays(7);
    }

    @Getter
    @Setter
    public static class Jwt {

        @NotBlank
        @Size(min = 32)
        private String secret = "booksMemo-development-jwt-secret-key-for-HS256-algorithm-32bytes";

        private long expirySeconds = 86400L;

        @NotBlank
        private String issuer = "books-memo-api";

        @NotBlank
        private String audience = "books-memo-web";

        @Min(0)
        private long allowedClockSkewSeconds = 30L;
    }

    @Getter
    @Setter
    public static class Security {

        private final Cors cors = new Cors();
        private final LoginRateLimit loginRateLimit = new LoginRateLimit();

        @Getter
        @Setter
        public static class Cors {

            private List<String> allowedOrigins = new ArrayList<>(
                    List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        }

        @Getter
        @Setter
        public static class LoginRateLimit {

            @Min(1)
            private int maxFailures = 5;

            private Duration window = Duration.ofMinutes(15);

            private Duration lockout = Duration.ofMinutes(15);
        }
    }
}
