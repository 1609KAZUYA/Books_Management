package com.bookmanagement.service.isbn;

import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.config.AppProperties;
import com.bookmanagement.domain.entity.IsbnLookupCache;
import com.bookmanagement.domain.enums.SourceName;
import com.bookmanagement.dto.isbn.IsbnLookupCandidateResponse;
import com.bookmanagement.dto.isbn.IsbnLookupResponse;
import com.bookmanagement.repository.IsbnLookupCacheRepository;
import com.bookmanagement.service.book.BookCoverService;
import com.bookmanagement.service.isbn.provider.GoogleBooksProvider;
import com.bookmanagement.service.isbn.provider.OpenBdProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IsbnLookupService {

    private final OpenBdProvider openBdProvider;
    private final GoogleBooksProvider googleBooksProvider;
    private final IsbnLookupCacheRepository isbnLookupCacheRepository;
    private final IsbnNormalizer isbnNormalizer;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;
    private final BookCoverService bookCoverService;

    @Transactional
    public IsbnLookupResponse lookup(String rawIsbn, boolean forceReload) {
        String normalizedIsbn13 = normalizeOrThrow(rawIsbn);
        List<SourceLookup> flow = List.of(
                new SourceLookup(SourceName.OPENBD, openBdProvider),
                new SourceLookup(SourceName.GOOGLE_BOOKS, googleBooksProvider)
        );

        for (SourceLookup lookup : flow) {
            if (!forceReload) {
                CacheLookup cacheLookup = findFromCache(normalizedIsbn13, lookup.sourceName());
                if (cacheLookup.metadata().isPresent()) {
                    return toLookupResponse(normalizedIsbn13, cacheLookup.metadata().get());
                }
                if (cacheLookup.notFoundCached()) {
                    continue;
                }
            }

            Optional<BookMetadata> fetched = lookup.provider().lookup(normalizedIsbn13);
            if (fetched.isPresent()) {
                BookMetadata metadata = bookCoverService.withFallbackCover(fetched.get());
                saveCache(normalizedIsbn13, lookup.sourceName(), 200, metadata);
                return toLookupResponse(normalizedIsbn13, metadata);
            }
            saveCache(normalizedIsbn13, lookup.sourceName(), 404, null);
        }

        throw new NotFoundException("ISBN-404", "No external metadata found for ISBN: " + normalizedIsbn13);
    }

    @Transactional
    public BookMetadata lookupFirstForImport(String rawIsbn) {
        IsbnLookupResponse response = lookup(rawIsbn, false);
        if (response.candidates().isEmpty()) {
            throw new NotFoundException("ISBN-404", "No candidate found");
        }
        IsbnLookupCandidateResponse first = response.candidates().get(0);
        return new BookMetadata(
                first.isbn13(),
                first.isbn10(),
                first.title(),
                first.subtitle(),
                first.authors(),
                first.publisher(),
                first.publishedDate(),
                first.thumbnailUrl(),
                first.description(),
                first.sourceName(),
                first.cacheHit()
        );
    }

    private String normalizeOrThrow(String rawIsbn) {
        return isbnNormalizer.normalizeToIsbn13(rawIsbn)
                .orElseThrow(() -> new ValidationException("ISBN-400", "Invalid ISBN format"));
    }

    private CacheLookup findFromCache(String isbn13, SourceName sourceName) {
        OffsetDateTime now = OffsetDateTime.now();
        Optional<IsbnLookupCache> cacheOpt = isbnLookupCacheRepository
                .findTopByIsbn13AndSourceNameAndExpiresAtAfterOrderByExpiresAtDesc(isbn13, sourceName, now);
        if (cacheOpt.isEmpty()) {
            return new CacheLookup(Optional.empty(), false);
        }
        IsbnLookupCache cache = cacheOpt.get();
        cache.setHitCount(cache.getHitCount() + 1);
        isbnLookupCacheRepository.save(cache);

        JsonNode payload = cache.getNormalizedPayloadJson();
        if (payload == null || payload.isNull()) {
            return new CacheLookup(Optional.empty(), cache.getHttpStatus() == 404);
        }
        try {
            BookMetadata metadata = objectMapper.treeToValue(payload, BookMetadata.class).withCacheHit(true);
            return new CacheLookup(Optional.of(metadata), false);
        } catch (Exception ex) {
            return new CacheLookup(Optional.empty(), false);
        }
    }

    private void saveCache(String isbn13, SourceName sourceName, int status, BookMetadata metadata) {
        IsbnLookupCache cache = new IsbnLookupCache();
        cache.setIsbn13(isbn13);
        cache.setSourceName(sourceName);
        cache.setHttpStatus(status);
        cache.setExpiresAt(OffsetDateTime.now().plus(appProperties.getIsbn().getCacheTtl()));
        cache.setHitCount(1);
        if (metadata != null) {
            JsonNode payload = objectMapper.valueToTree(metadata.withCacheHit(false));
            cache.setResponseJson(payload);
            cache.setNormalizedPayloadJson(payload);
        }
        isbnLookupCacheRepository.save(cache);
    }

    private IsbnLookupResponse toLookupResponse(String queryIsbn, BookMetadata metadata) {
        BookMetadata enrichedMetadata = bookCoverService.withFallbackCover(metadata);
        IsbnLookupCandidateResponse candidate = new IsbnLookupCandidateResponse(
                enrichedMetadata.isbn13(),
                enrichedMetadata.isbn10(),
                enrichedMetadata.title(),
                enrichedMetadata.subtitle(),
                enrichedMetadata.authors(),
                enrichedMetadata.publisher(),
                enrichedMetadata.publishedDate(),
                enrichedMetadata.thumbnailUrl(),
                enrichedMetadata.description(),
                enrichedMetadata.sourceName(),
                enrichedMetadata.cacheHit()
        );
        return new IsbnLookupResponse(queryIsbn, List.of(candidate));
    }

    private record CacheLookup(Optional<BookMetadata> metadata, boolean notFoundCached) {
    }

    private record SourceLookup(SourceName sourceName, com.bookmanagement.service.isbn.provider.IsbnProvider provider) {
    }
}
