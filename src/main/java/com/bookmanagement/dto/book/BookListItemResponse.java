package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import com.bookmanagement.dto.category.CategoryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record BookListItemResponse(
        Long id,
        BookStatus status,
        BigDecimal rating,
        boolean favoriteFlag,
        LocalDate purchaseDate,
        LocalDate startDate,
        LocalDate finishDate,
        OffsetDateTime updatedAt,
        CategoryResponse category,
        BookMasterSummaryResponse bookMaster
) {
}
