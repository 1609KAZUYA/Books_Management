package com.bookmanagement.dto.book;

import java.util.List;

public record BookListResponse(
        List<BookListItemResponse> items,
        PaginationMetaResponse meta
) {
}
