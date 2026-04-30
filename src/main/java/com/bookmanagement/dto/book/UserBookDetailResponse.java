package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import com.bookmanagement.dto.category.CategoryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 本の詳細APIがフロントへ返すJSONの形です。
 *
 * Entityをそのまま返すと、不要な情報や関連データまで混ざりやすくなります。
 * そのため、画面に必要な項目だけをResponse DTOとして定義しています。
 * Laravelでいう API Resource に近い役割です。
 */
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
        BookMasterSummaryResponse bookMaster,
        String memo,
        String locationNote,
        OffsetDateTime createdAt,
        OffsetDateTime deletedAt
) {
}
