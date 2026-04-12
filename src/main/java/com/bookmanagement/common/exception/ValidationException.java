package com.bookmanagement.common.exception;

import java.util.List;
import org.springframework.http.HttpStatus;

public class ValidationException extends ApiException {

    public ValidationException(String message) {
        super(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
    }

    public ValidationException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
    }

    public ValidationException(String code, String message, List<String> details) {
        super(HttpStatus.BAD_REQUEST, code, message, details);
    }
}
