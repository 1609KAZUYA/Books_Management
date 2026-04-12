package com.bookmanagement.dto.book;

import com.bookmanagement.domain.enums.BookStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record UpdateStatusRequest(
        @NotNull BookStatus status,
        LocalDate startDate,
        LocalDate finishDate
) {
}
