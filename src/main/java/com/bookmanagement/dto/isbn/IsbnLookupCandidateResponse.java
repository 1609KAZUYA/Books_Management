package com.bookmanagement.dto.isbn;

import com.bookmanagement.domain.enums.SourceName;
import java.time.LocalDate;
import java.util.List;

public record IsbnLookupCandidateResponse(
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
}
