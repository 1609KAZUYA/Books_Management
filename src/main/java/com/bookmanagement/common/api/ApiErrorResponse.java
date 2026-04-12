package com.bookmanagement.common.api;

import java.util.List;

public record ApiErrorResponse(
        String code,
        String message,
        String requestId,
        List<String> details
) {
}
