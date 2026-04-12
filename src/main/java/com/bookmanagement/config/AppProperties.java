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

    @Getter
    @Setter
    public static class Isbn {

        @NotBlank
        private String openbdUrl = "https://openbd.jp/get";

        @NotBlank
        private String googleBooksUrl = "https://www.googleapis.com/books/v1/volumes";

        private Duration cacheTtl = Duration.ofDays(7);
    }
}
