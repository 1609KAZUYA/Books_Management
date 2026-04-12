package com.bookmanagement.service.isbn.provider;

import com.bookmanagement.config.AppProperties;
import com.bookmanagement.domain.enums.SourceName;
import com.bookmanagement.service.isbn.BookMetadata;
import com.bookmanagement.service.isbn.IsbnNormalizer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenBdProvider implements IsbnProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;
    private final IsbnNormalizer isbnNormalizer;

    @Override
    public SourceName sourceName() {
        return SourceName.OPENBD;
    }

    @Override
    public Optional<BookMetadata> lookup(String normalizedIsbn13) {
        try {
            String uri = UriComponentsBuilder
                    .fromHttpUrl(appProperties.getIsbn().getOpenbdUrl())
                    .queryParam("isbn", normalizedIsbn13)
                    .toUriString();

            String body = restClient.get().uri(uri).retrieve().body(String.class);
            if (!StringUtils.hasText(body)) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(body);
            if (!root.isArray() || root.isEmpty() || root.get(0).isNull()) {
                return Optional.empty();
            }
            JsonNode first = root.get(0);
            JsonNode summary = first.path("summary");

            String title = text(summary, "title");
            if (!StringUtils.hasText(title)) {
                return Optional.empty();
            }

            String rawAuthor = text(summary, "author");
            List<String> authors = splitAuthors(rawAuthor);
            String publisher = text(summary, "publisher");
            LocalDate publishedDate = parsePublishedDate(text(summary, "pubdate"));
            String thumbnail = text(summary, "cover");
            String description = extractDescription(first);

            String isbn10 = extractIsbn10(text(summary, "isbn"), normalizedIsbn13);

            BookMetadata metadata = new BookMetadata(
                    normalizedIsbn13,
                    isbn10,
                    title,
                    null,
                    authors,
                    publisher,
                    publishedDate,
                    thumbnail,
                    description,
                    SourceName.OPENBD,
                    false
            );
            return Optional.of(metadata);
        } catch (Exception ex) {
            log.warn("openBD lookup failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String extractDescription(JsonNode root) {
        JsonNode textContents = root.path("onix").path("CollateralDetail").path("TextContent");
        if (textContents.isArray()) {
            for (JsonNode node : textContents) {
                String text = text(node, "Text");
                if (StringUtils.hasText(text)) {
                    return text;
                }
            }
        }
        return null;
    }

    private String extractIsbn10(String summaryIsbn, String isbn13) {
        if (StringUtils.hasText(summaryIsbn) && summaryIsbn.length() == 10) {
            return summaryIsbn;
        }
        return isbnNormalizer.toIsbn10(isbn13).orElse(null);
    }

    private String text(JsonNode node, String key) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode target = node.path(key);
        if (target.isMissingNode() || target.isNull()) {
            return null;
        }
        String value = target.asText(null);
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private List<String> splitAuthors(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        String[] parts = raw.split("[/,／、;]");
        List<String> authors = new ArrayList<>();
        for (String part : parts) {
            String name = part.trim();
            if (!name.isBlank()) {
                authors.add(name);
            }
        }
        return authors;
    }

    private LocalDate parsePublishedDate(String rawDate) {
        if (!StringUtils.hasText(rawDate)) {
            return null;
        }
        String digits = rawDate.replaceAll("[^0-9]", "");
        try {
            if (digits.length() == 8) {
                return LocalDate.parse(digits, DateTimeFormatter.BASIC_ISO_DATE);
            }
            if (digits.length() == 6) {
                return LocalDate.parse(digits + "01", DateTimeFormatter.BASIC_ISO_DATE);
            }
            if (digits.length() == 4) {
                return LocalDate.of(Integer.parseInt(digits), 1, 1);
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }
}
