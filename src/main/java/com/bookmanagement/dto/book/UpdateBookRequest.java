package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateBookRequest(
        BookStatus status,
        @DecimalMin("0.5") @DecimalMax("5.0") BigDecimal rating,
        Boolean favoriteFlag,
        LocalDate purchaseDate,
        LocalDate startDate,
        LocalDate finishDate,
        @Size(max = 10000) String memo,
        @Size(max = 255) String locationNote,
        List<Long> tagIds
) {
}
