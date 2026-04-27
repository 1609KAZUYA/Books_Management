package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateBookRequest(
        @Pattern(regexp = "^[0-9]{13}$") String isbn13,
        @Pattern(regexp = "^[0-9X]{10}$") String isbn10,
        @NotBlank @Size(max = 500) String title,
        @Size(max = 500) String subtitle,
        List<String> authors,
        @Size(max = 255) String publisher,
        LocalDate publishedDate,
        String description,
        String thumbnailUrl,
        @NotNull BookStatus status,
        @DecimalMin("0.5") @DecimalMax("5.0") BigDecimal rating,
        Boolean favoriteFlag,
        @Size(max = 10000) String memo,
        Long categoryId,
        List<Long> tagIds
) {
}
