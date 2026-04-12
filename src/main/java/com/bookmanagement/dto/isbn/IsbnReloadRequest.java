package com.bookmanagement.dto.isbn;

import jakarta.validation.constraints.NotBlank;

public record IsbnReloadRequest(@NotBlank String isbn) {
}
