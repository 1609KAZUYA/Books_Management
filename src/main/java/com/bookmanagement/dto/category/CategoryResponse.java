package com.bookmanagement.dto.category;

public record CategoryResponse(
        Long id,
        String name,
        String colorHex,
        int sortOrder
) {
}
