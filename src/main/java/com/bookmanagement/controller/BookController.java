package com.bookmanagement.controller;

import com.bookmanagement.domain.enums.BookStatus;
import com.bookmanagement.dto.book.BookListResponse;
import com.bookmanagement.dto.book.CreateBookRequest;
import com.bookmanagement.dto.book.ExternalBookSearchResponse;
import com.bookmanagement.dto.book.ExternalBookSearchType;
import com.bookmanagement.dto.book.ImportByIsbnRequest;
import com.bookmanagement.dto.book.UpdateBookRequest;
import com.bookmanagement.dto.book.UpdateStatusRequest;
import com.bookmanagement.dto.book.UserBookDetailResponse;
import com.bookmanagement.service.book.BookService;
import com.bookmanagement.service.book.ExternalBookSearchService;
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
    private final ExternalBookSearchService externalBookSearchService;

    @GetMapping
    public BookListResponse searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BookStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean uncategorized,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) Boolean favorite,
            @RequestParam(required = false, defaultValue = "updatedAtDesc") String sort,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return bookService.searchBooks(keyword, status, categoryId, uncategorized, tagId, favorite, sort, page, size);
    }

    @GetMapping("/external-search")
    public ExternalBookSearchResponse searchExternalBooks(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "KEYWORD") ExternalBookSearchType type,
            @RequestParam(required = false, defaultValue = "10") @Min(1) @Max(40) int maxResults,
            @RequestParam(required = false, defaultValue = "0") @Min(0) int startIndex
    ) {
        return externalBookSearchService.search(query, type, maxResults, startIndex);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserBookDetailResponse createManualBook(@Valid @RequestBody CreateBookRequest request) {
        return bookService.createManualBook(request);
    }

    @PostMapping("/import-by-isbn")
    @ResponseStatus(HttpStatus.CREATED)
    public UserBookDetailResponse importByIsbn(@Valid @RequestBody ImportByIsbnRequest request) {
        return bookService.importByIsbn(request);
    }

    @GetMapping("/{userBookId}")
    public UserBookDetailResponse getBookDetail(@PathVariable Long userBookId) {
        return bookService.getBookDetail(userBookId);
    }

    @PatchMapping("/{userBookId}")
    public UserBookDetailResponse updateBook(
            @PathVariable Long userBookId,
            @Valid @RequestBody UpdateBookRequest request
    ) {
        return bookService.updateBook(userBookId, request);
    }

    @DeleteMapping("/{userBookId}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long userBookId) {
        bookService.deleteBook(userBookId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userBookId}/status")
    public UserBookDetailResponse updateStatus(
            @PathVariable Long userBookId,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        return bookService.updateStatus(userBookId, request);
    }

    @PostMapping("/{userBookId}/tags/{tagId}")
    public ResponseEntity<Void> addTag(
            @PathVariable Long userBookId,
            @PathVariable Long tagId
    ) {
        bookService.addTag(userBookId, tagId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userBookId}/tags/{tagId}")
    public ResponseEntity<Void> removeTag(
            @PathVariable Long userBookId,
            @PathVariable Long tagId
    ) {
        bookService.removeTag(userBookId, tagId);
        return ResponseEntity.noContent().build();
    }
}
