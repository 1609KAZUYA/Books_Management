package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ImportByIsbnRequest(
        @NotBlank String isbn,
        @NotNull BookStatus status,
        @Size(max = 10000) String memo,
        Long categoryId
) {
}
