package com.bookmanagement.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateException extends ApiException {

    public DuplicateException(String code, String message) {
        super(HttpStatus.CONFLICT, code, message);
    }
}
