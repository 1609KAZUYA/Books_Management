package com.bookmanagement.service.book;

import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.domain.enums.SourceName;
import com.bookmanagement.dto.book.ExternalBookSearchCandidateResponse;
import com.bookmanagement.dto.book.ExternalBookSearchResponse;
import com.bookmanagement.dto.book.ExternalBookSearchType;
import com.bookmanagement.service.isbn.BookMetadata;
import com.bookmanagement.service.isbn.IsbnNormalizer;
import com.bookmanagement.service.isbn.provider.GoogleBooksProvider;
import java.io.StringReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;

@Service
@RequiredArgsConstructor
public class ExternalBookSearchService {

    private final GoogleBooksProvider googleBooksProvider;
    private final IsbnNormalizer isbnNormalizer;
    private final RestClient restClient;
    private final BookCoverService bookCoverService;

    public ExternalBookSearchResponse search(String query, ExternalBookSearchType type, int maxResults, int startIndex) {
        if (!StringUtils.hasText(query)) {
            throw new ValidationException("VALIDATION_ERROR", "query is required");
        }
        ExternalBookSearchType resolvedType = type == null ? ExternalBookSearchType.KEYWORD : type;
        String trimmedQuery = query.trim();
        List<ExternalBookSearchCandidateResponse> candidates = searchCandidates(
                trimmedQuery,
                resolvedType,
                maxResults,
                Math.max(0, startIndex)
        );
        return new ExternalBookSearchResponse(trimmedQuery, resolvedType, candidates);
    }

    private List<ExternalBookSearchCandidateResponse> searchCandidates(
            String query,
            ExternalBookSearchType type,
            int maxResults,
            int startIndex
    ) {
        Map<String, ExternalBookSearchCandidateResponse> results = new LinkedHashMap<>();
        for (String googleQuery : toGoogleBooksQueries(query, type)) {
            googleBooksProvider.search(googleQuery, maxResults, startIndex).stream()
                    .map(this::toResponse)
                    .forEach(candidate -> results.putIfAbsent(candidateKey(candidate), candidate));
            if (results.size() >= maxResults) {
                break;
            }
        }
        if (results.isEmpty()) {
            searchNdl(query, type, maxResults, startIndex)
                    .forEach(candidate -> results.putIfAbsent(candidateKey(candidate), candidate));
        }
        return new ArrayList<>(results.values()).stream().limit(maxResults).toList();
    }

    private List<String> toGoogleBooksQueries(String query, ExternalBookSearchType type) {
        return switch (type) {
            case ISBN -> List.of("isbn:" + isbnNormalizer.normalizeToIsbn13(query)
                    .orElseThrow(() -> new ValidationException("ISBN-400", "Invalid ISBN format")));
            case TITLE -> List.of("intitle:" + cleaned(query), query);
            case AUTHOR -> List.of("inauthor:" + cleaned(query), query);
            case KEYWORD -> isbnNormalizer.normalizeToIsbn13(query)
                    .map(isbn13 -> List.of("isbn:" + isbn13))
                    .orElseGet(() -> List.of(query));
        };
    }

    private String cleaned(String value) {
        return value.replace("\"", "").trim();
    }

    private ExternalBookSearchCandidateResponse toResponse(BookMetadata metadata) {
        BookMetadata enrichedMetadata = bookCoverService.withFallbackCover(metadata);
        return new ExternalBookSearchCandidateResponse(
                enrichedMetadata.isbn13(),
                enrichedMetadata.isbn10(),
                enrichedMetadata.title(),
                enrichedMetadata.subtitle(),
                enrichedMetadata.authors(),
                enrichedMetadata.publisher(),
                enrichedMetadata.publishedDate(),
                enrichedMetadata.thumbnailUrl(),
                enrichedMetadata.description(),
                enrichedMetadata.sourceName()
        );
    }

    private List<ExternalBookSearchCandidateResponse> searchNdl(
            String query,
            ExternalBookSearchType type,
            int maxResults,
            int startIndex
    ) {
        List<ExternalBookSearchCandidateResponse> candidates = new ArrayList<>();
        String fallbackIsbn13 = isbnNormalizer.normalizeToIsbn13(query).orElse(null);

        for (String uri : toNdlUris(query, type, maxResults, startIndex)) {
            try {
                String body = restClient.get().uri(uri).retrieve().body(String.class);
                if (!StringUtils.hasText(body)) {
                    continue;
                }
                candidates.addAll(parseNdlCandidates(body, fallbackIsbn13, maxResults - candidates.size()));
                if (candidates.size() >= maxResults) {
                    break;
                }
            } catch (Exception ignored) {
                // Keep Google Books as the primary provider; NDL is a best-effort fallback.
            }
        }
        return candidates.stream().limit(maxResults).toList();
    }

    private List<String> toNdlUris(String query, ExternalBookSearchType type, int maxResults, int startIndex) {
        String baseUrl = "https://ndlsearch.ndl.go.jp/api/opensearch";
        List<String> uris = new ArrayList<>();
        UriComponentsBuilder params = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("cnt", maxResults)
                .queryParam("idx", Math.max(0, startIndex) + 1);
        isbnNormalizer.normalizeToIsbn13(query).ifPresent(isbn13 -> uris.add(params.cloneBuilder()
                .queryParam("isbn", isbn13)
                .build()
                .encode()
                .toUriString()));

        switch (type) {
            case ISBN -> {
                if (uris.isEmpty()) {
                    uris.add(params.cloneBuilder()
                            .queryParam("isbn", query.replaceAll("[-\\s]", ""))
                            .build()
                            .encode()
                            .toUriString());
                }
            }
            case TITLE -> {
                uris.add(params.cloneBuilder().queryParam("title", query).build().encode().toUriString());
                uris.add(params.cloneBuilder().queryParam("any", query).build().encode().toUriString());
            }
            case AUTHOR -> {
                uris.add(params.cloneBuilder().queryParam("creator", query).build().encode().toUriString());
                uris.add(params.cloneBuilder().queryParam("any", query).build().encode().toUriString());
            }
            case KEYWORD -> uris.add(params.cloneBuilder().queryParam("any", query).build().encode().toUriString());
        }
        return uris;
    }

    private List<ExternalBookSearchCandidateResponse> parseNdlCandidates(
            String xml,
            String fallbackIsbn13,
            int maxResults
    ) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        NodeList items = document.getElementsByTagName("item");

        List<ExternalBookSearchCandidateResponse> candidates = new ArrayList<>();
        for (int i = 0; i < items.getLength() && candidates.size() < maxResults; i++) {
            if (!(items.item(i) instanceof Element item)) {
                continue;
            }
            ExternalBookSearchCandidateResponse candidate = toNdlCandidate(item, fallbackIsbn13);
            if (candidate != null) {
                candidates.add(candidate);
            }
        }
        return candidates;
    }

    private ExternalBookSearchCandidateResponse toNdlCandidate(Element item, String fallbackIsbn13) {
        String title = firstText(item, "dc:title");
        if (!StringUtils.hasText(title)) {
            title = firstText(item, "title");
        }
        if (!StringUtils.hasText(title)) {
            return null;
        }

        String isbn13 = extractNdlIsbn13(item);
        if (!StringUtils.hasText(isbn13)) {
            isbn13 = extractIsbn13FromText(firstText(item, "description"));
        }
        if (!StringUtils.hasText(isbn13)) {
            isbn13 = fallbackIsbn13;
        }
        String isbn10 = isbnNormalizer.toIsbn10(isbn13).orElse(null);

        return new ExternalBookSearchCandidateResponse(
                isbn13,
                isbn10,
                title,
                null,
                texts(item, "dc:creator"),
                publisher(item),
                publishedDate(item),
                bookCoverService.resolveThumbnailUrl(isbn13, null),
                stripHtml(firstText(item, "description")),
                SourceName.OPENBD
        );
    }

    private String extractNdlIsbn13(Element item) {
        NodeList identifiers = item.getElementsByTagName("dc:identifier");
        for (int i = 0; i < identifiers.getLength(); i++) {
            String value = identifiers.item(i).getTextContent();
            if (!StringUtils.hasText(value)) {
                continue;
            }
            String cleaned = value.replaceAll("[-\\s]", "").toUpperCase();
            if (cleaned.matches("^(97[89])?\\d{9}[\\dX]$")) {
                return isbnNormalizer.normalizeToIsbn13(cleaned).orElse(null);
            }
        }
        return null;
    }

    private String extractIsbn13FromText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("(?:97[89][-\\s]?)?\\d[-\\s]?\\d{2,5}[-\\s]?\\d{2,7}[-\\s]?[\\dX]", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(value);
        while (matcher.find()) {
            String cleaned = matcher.group().replaceAll("[-\\s]", "").toUpperCase();
            Optional<String> isbn13 = isbnNormalizer.normalizeToIsbn13(cleaned);
            if (isbn13.isPresent()) {
                return isbn13.get();
            }
        }
        return null;
    }

    private String publisher(Element item) {
        List<String> publishers = texts(item, "dc:publisher");
        return publishers.isEmpty() ? null : String.join(" / ", publishers);
    }

    private LocalDate publishedDate(Element item) {
        String raw = firstText(item, "dcterms:issued");
        if (!StringUtils.hasText(raw)) {
            raw = firstText(item, "dc:date");
        }
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String digits = raw.replaceAll("[^0-9]", "");
        try {
            if (digits.length() >= 8) {
                return LocalDate.parse(digits.substring(0, 8), DateTimeFormatter.BASIC_ISO_DATE);
            }
            if (digits.length() >= 6) {
                return LocalDate.parse(digits.substring(0, 6) + "01", DateTimeFormatter.BASIC_ISO_DATE);
            }
            if (digits.length() >= 4) {
                return LocalDate.of(Integer.parseInt(digits.substring(0, 4)), 1, 1);
            }
            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private List<String> texts(Element item, String tagName) {
        NodeList nodes = item.getElementsByTagName(tagName);
        List<String> values = new ArrayList<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            String value = nodes.item(i).getTextContent();
            if (StringUtils.hasText(value)) {
                values.add(value.trim());
            }
        }
        return values;
    }

    private String firstText(Element item, String tagName) {
        NodeList nodes = item.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) {
            return null;
        }
        String value = nodes.item(0).getTextContent();
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String stripHtml(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
    }

    private String candidateKey(ExternalBookSearchCandidateResponse candidate) {
        if (StringUtils.hasText(candidate.isbn13())) {
            return "isbn13:" + candidate.isbn13();
        }
        if (StringUtils.hasText(candidate.isbn10())) {
            return "isbn10:" + candidate.isbn10();
        }
        return "title:" + candidate.title().toLowerCase() + ":" + String.join(",", candidate.authors()).toLowerCase();
    }
}
