package com.bookmanagement.common.exception;

import org.springframework.http.HttpStatus;

public class ExternalDependencyException extends ApiException {

    public ExternalDependencyException(String message) {
        super(HttpStatus.FAILED_DEPENDENCY, "ISBN-424", message);
    }
}
