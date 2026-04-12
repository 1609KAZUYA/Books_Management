package com.bookmanagement.dto.isbn;

import java.util.List;

public record IsbnLookupResponse(
        String queryIsbn,
        List<IsbnLookupCandidateResponse> candidates
) {
}
