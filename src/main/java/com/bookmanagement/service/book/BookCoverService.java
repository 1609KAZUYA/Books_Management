package com.bookmanagement.service.book;

import com.bookmanagement.service.isbn.BookMetadata;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class BookCoverService {

    public String resolveThumbnailUrl(String isbn13, String currentThumbnailUrl) {
        if (StringUtils.hasText(currentThumbnailUrl)) {
            return currentThumbnailUrl;
        }
        return null;
    }

    public BookMetadata withFallbackCover(BookMetadata metadata) {
        if (metadata == null) {
            return null;
        }
        String thumbnailUrl = resolveThumbnailUrl(metadata.isbn13(), metadata.thumbnailUrl());
        if (thumbnailUrl == metadata.thumbnailUrl()
                || (thumbnailUrl != null && thumbnailUrl.equals(metadata.thumbnailUrl()))) {
            return metadata;
        }
        return new BookMetadata(
                metadata.isbn13(),
                metadata.isbn10(),
                metadata.title(),
                metadata.subtitle(),
                metadata.authors(),
                metadata.publisher(),
                metadata.publishedDate(),
                thumbnailUrl,
                metadata.description(),
                metadata.sourceName(),
                metadata.cacheHit()
        );
    }
}
