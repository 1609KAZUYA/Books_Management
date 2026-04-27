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
public class GoogleBooksProvider implements IsbnProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;
    private final IsbnNormalizer isbnNormalizer;

    @Override
    public SourceName sourceName() {
        return SourceName.GOOGLE_BOOKS;
    }

    @Override
    public Optional<BookMetadata> lookup(String normalizedIsbn13) {
        try {
            String uri = UriComponentsBuilder
                    .fromHttpUrl(appProperties.getIsbn().getGoogleBooksUrl())
                    .queryParam("q", "isbn:" + normalizedIsbn13)
                    .build()
                    .encode()
                    .toUriString();

            String body = restClient.get().uri(uri).retrieve().body(String.class);
            if (!StringUtils.hasText(body)) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode items = root.path("items");
            if (!items.isArray() || items.isEmpty()) {
                return Optional.empty();
            }
            return parseVolume(items.get(0).path("volumeInfo"), normalizedIsbn13);
        } catch (Exception ex) {
            log.warn("Google Books lookup failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    public List<BookMetadata> search(String query, int maxResults) {
        return search(query, maxResults, 0);
    }

    public List<BookMetadata> search(String query, int maxResults, int startIndex) {
        try {
            String uri = UriComponentsBuilder
                    .fromHttpUrl(appProperties.getIsbn().getGoogleBooksUrl())
                    .queryParam("q", query)
                    .queryParam("maxResults", maxResults)
                    .queryParam("startIndex", Math.max(0, startIndex))
                    .build()
                    .encode()
                    .toUriString();

            String body = restClient.get().uri(uri).retrieve().body(String.class);
            if (!StringUtils.hasText(body)) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode items = root.path("items");
            if (!items.isArray() || items.isEmpty()) {
                return List.of();
            }
            List<BookMetadata> results = new ArrayList<>();
            for (JsonNode item : items) {
                parseVolume(item.path("volumeInfo"), null).ifPresent(results::add);
            }
            return results;
        } catch (Exception ex) {
            log.warn("Google Books search failed: {}", ex.getMessage());
            return List.of();
        }
    }

    private Optional<BookMetadata> parseVolume(JsonNode volumeInfo, String fallbackIsbn13) {
        String title = text(volumeInfo, "title");
        if (!StringUtils.hasText(title)) {
            return Optional.empty();
        }

        JsonNode identifiers = volumeInfo.path("industryIdentifiers");
        String isbn13 = extractIsbn13(identifiers, fallbackIsbn13);
        String isbn10 = extractIsbn10(identifiers, isbn13);
        String subtitle = text(volumeInfo, "subtitle");
        List<String> authors = arrayOfText(volumeInfo.path("authors"));
        String publisher = text(volumeInfo, "publisher");
        LocalDate publishedDate = parsePublishedDate(text(volumeInfo, "publishedDate"));
        String thumbnail = text(volumeInfo.path("imageLinks"), "thumbnail");
        String description = text(volumeInfo, "description");

        return Optional.of(new BookMetadata(
                isbn13,
                isbn10,
                title,
                subtitle,
                authors,
                publisher,
                publishedDate,
                thumbnail,
                description,
                SourceName.GOOGLE_BOOKS,
                false
        ));
    }

    private String extractIsbn13(JsonNode industryIdentifiers, String fallbackIsbn13) {
        if (industryIdentifiers.isArray()) {
            for (JsonNode identifier : industryIdentifiers) {
                String type = text(identifier, "type");
                String value = text(identifier, "identifier");
                if ("ISBN_13".equals(type) && StringUtils.hasText(value)) {
                    return isbnNormalizer.normalizeToIsbn13(value).orElse(null);
                }
            }
            for (JsonNode identifier : industryIdentifiers) {
                String type = text(identifier, "type");
                String value = text(identifier, "identifier");
                if ("ISBN_10".equals(type) && StringUtils.hasText(value)) {
                    return isbnNormalizer.normalizeToIsbn13(value).orElse(null);
                }
            }
        }
        return fallbackIsbn13;
    }

    private String extractIsbn10(JsonNode industryIdentifiers, String isbn13) {
        if (industryIdentifiers.isArray()) {
            for (JsonNode identifier : industryIdentifiers) {
                String type = text(identifier, "type");
                String value = text(identifier, "identifier");
                if ("ISBN_10".equals(type) && StringUtils.hasText(value)) {
                    return value;
                }
            }
        }
        return isbnNormalizer.toIsbn10(isbn13).orElse(null);
    }

    private List<String> arrayOfText(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        for (JsonNode element : node) {
            String text = element.asText();
            if (StringUtils.hasText(text)) {
                values.add(text.trim());
            }
        }
        return values;
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

    private LocalDate parsePublishedDate(String rawDate) {
        if (!StringUtils.hasText(rawDate)) {
            return null;
        }
        try {
            if (rawDate.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                return LocalDate.parse(rawDate, DateTimeFormatter.ISO_LOCAL_DATE);
            }
            if (rawDate.matches("^\\d{4}-\\d{2}$")) {
                return LocalDate.parse(rawDate + "-01", DateTimeFormatter.ISO_LOCAL_DATE);
            }
            if (rawDate.matches("^\\d{4}$")) {
                return LocalDate.of(Integer.parseInt(rawDate), 1, 1);
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }
}
