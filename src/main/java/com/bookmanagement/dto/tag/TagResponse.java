package com.bookmanagement.dto.tag;

public record TagResponse(
        Long id,
        String name,
        String colorHex,
        int sortOrder
) {
}
