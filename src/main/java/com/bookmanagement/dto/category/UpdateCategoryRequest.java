package com.bookmanagement.dto.category;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @Size(max = 50) String name,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String colorHex,
        Integer sortOrder
) {
}
