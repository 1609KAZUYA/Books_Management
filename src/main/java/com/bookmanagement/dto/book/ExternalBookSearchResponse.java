package com.bookmanagement.dto.book;

import java.util.List;

public record ExternalBookSearchResponse(
        String query,
        ExternalBookSearchType type,
        List<ExternalBookSearchCandidateResponse> candidates
) {
}
