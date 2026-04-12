package com.bookmanagement.service.isbn;

import com.bookmanagement.domain.enums.SourceName;
import java.time.LocalDate;
import java.util.List;

public record BookMetadata(
        String isbn13,
        String isbn10,
        String title,
        String subtitle,
        List<String> authors,
        String publisher,
        LocalDate publishedDate,
        String thumbnailUrl,
        String description,
        SourceName sourceName,
        boolean cacheHit
) {

    public BookMetadata withCacheHit(boolean hit) {
        return new BookMetadata(
                isbn13,
                isbn10,
                title,
                subtitle,
                authors,
                publisher,
                publishedDate,
                thumbnailUrl,
                description,
                sourceName,
                hit
        );
    }
}
