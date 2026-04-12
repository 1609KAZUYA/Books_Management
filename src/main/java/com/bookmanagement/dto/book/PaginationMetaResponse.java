package com.bookmanagement.dto.book;

public record PaginationMetaResponse(
        int page,
        int size,
        long totalItems,
        int totalPages
) {
}
