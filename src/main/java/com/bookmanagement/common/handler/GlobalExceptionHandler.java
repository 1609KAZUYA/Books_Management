package com.bookmanagement.common.handler;

import com.bookmanagement.common.api.ApiErrorResponse;
import com.bookmanagement.common.exception.ApiException;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex) {
        return ResponseEntity
                .status(ex.getStatus())
                .body(new ApiErrorResponse(ex.getCode(), ex.getMessage(), currentRequestId(), ex.getDetails()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldMessage)
                .toList();
        ApiErrorResponse body = new ApiErrorResponse(
                "VALIDATION_ERROR",
                "Request validation failed",
                currentRequestId(),
                details
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler({
            ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception ex) {
        ApiErrorResponse body = new ApiErrorResponse(
                "VALIDATION_ERROR",
                ex.getMessage(),
                currentRequestId(),
                List.of()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        ApiErrorResponse body = new ApiErrorResponse(
                "SYS-500",
                "Unexpected internal error",
                currentRequestId(),
                List.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private String toFieldMessage(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() == null ? "invalid" : error.getDefaultMessage());
    }

    private String currentRequestId() {
        String requestId = MDC.get("requestId");
        return requestId == null || requestId.isBlank() ? UUID.randomUUID().toString() : requestId;
    }
}
