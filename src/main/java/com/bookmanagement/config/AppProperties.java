package com.bookmanagement.config;

import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
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
        private String secret = "booksMemo-development-jwt-secret-key-for-HS256-algorithm-32bytes";

        private long expirySeconds = 86400L;
    }
}
