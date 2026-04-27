package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import com.bookmanagement.dto.category.CategoryResponse;
import com.bookmanagement.dto.tag.TagResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record UserBookDetailResponse(
        Long id,
        BookStatus status,
        BigDecimal rating,
        boolean favoriteFlag,
        LocalDate purchaseDate,
        LocalDate startDate,
        LocalDate finishDate,
        OffsetDateTime updatedAt,
        CategoryResponse category,
        List<TagResponse> tags,
        BookMasterSummaryResponse bookMaster,
        String memo,
        String locationNote,
        OffsetDateTime createdAt,
        OffsetDateTime deletedAt
) {
}
