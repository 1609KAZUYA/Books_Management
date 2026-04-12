package com.bookmanagement.dto.tag;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateTagRequest(
        @Size(min = 1, max = 50) String name,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String colorHex,
        Integer sortOrder
) {
}
