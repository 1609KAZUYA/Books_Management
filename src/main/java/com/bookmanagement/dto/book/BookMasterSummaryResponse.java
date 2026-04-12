package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.SourceName;
import java.time.LocalDate;
import java.util.List;

public record BookMasterSummaryResponse(
        Long id,
        String isbn13,
        String isbn10,
        String title,
        String subtitle,
        List<String> authors,
        String publisher,
        LocalDate publishedDate,
        String thumbnailUrl,
        SourceName sourcePrimary
) {
}
