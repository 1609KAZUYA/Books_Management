package com.bookmanagement.controller;

import com.bookmanagement.domain.enums.BookStatus;
import com.bookmanagement.dto.book.BookListResponse;
import com.bookmanagement.dto.book.CreateBookRequest;
import com.bookmanagement.dto.book.ImportByIsbnRequest;
import com.bookmanagement.dto.book.UpdateBookRequest;
import com.bookmanagement.dto.book.UpdateStatusRequest;
import com.bookmanagement.dto.book.UserBookDetailResponse;
import com.bookmanagement.service.book.BookService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService bookService;

    @GetMapping
    public BookListResponse searchBooks(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BookStatus status,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) Boolean favorite,
            @RequestParam(required = false, defaultValue = "updatedAtDesc") String sort,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return bookService.searchBooks(userId, keyword, status, tagId, favorite, sort, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserBookDetailResponse createManualBook(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody CreateBookRequest request
    ) {
        return bookService.createManualBook(userId, request);
    }

    @PostMapping("/import-by-isbn")
    @ResponseStatus(HttpStatus.CREATED)
    public UserBookDetailResponse importByIsbn(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody ImportByIsbnRequest request
    ) {
        return bookService.importByIsbn(userId, request);
    }

    @GetMapping("/{userBookId}")
    public UserBookDetailResponse getBookDetail(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long userBookId
    ) {
        return bookService.getBookDetail(userId, userBookId);
    }

    @PatchMapping("/{userBookId}")
    public UserBookDetailResponse updateBook(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long userBookId,
            @Valid @RequestBody UpdateBookRequest request
    ) {
        return bookService.updateBook(userId, userBookId, request);
    }

    @DeleteMapping("/{userBookId}")
    public ResponseEntity<Void> deleteBook(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long userBookId
    ) {
        bookService.deleteBook(userId, userBookId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userBookId}/status")
    public UserBookDetailResponse updateStatus(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long userBookId,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        return bookService.updateStatus(userId, userBookId, request);
    }

    @PostMapping("/{userBookId}/tags/{tagId}")
    public ResponseEntity<Void> addTag(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long userBookId,
            @PathVariable Long tagId
    ) {
        bookService.addTag(userId, userBookId, tagId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userBookId}/tags/{tagId}")
    public ResponseEntity<Void> removeTag(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long userBookId,
            @PathVariable Long tagId
    ) {
        bookService.removeTag(userId, userBookId, tagId);
        return ResponseEntity.noContent().build();
    }
}
