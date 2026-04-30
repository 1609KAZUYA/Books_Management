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
/**
 * 本に関するAPI入口です。
 *
 * Laravelでいう BooksController に近いです。
 * Controllerは「URLから受け取った値」をServiceへ渡し、Serviceの結果をJSONとして返します。
 */
public class BookController {

    private final BookService bookService;
    private final ExternalBookSearchService externalBookSearchService;

    @GetMapping
    public BookListResponse searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BookStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean uncategorized,
            @RequestParam(required = false) Boolean favorite,
            @RequestParam(required = false, defaultValue = "updatedAtDesc") String sort,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        // クエリパラメータ例: /api/v1/books?keyword=Java&page=1
        // RequestParam はURLの ?key=value を受け取るための指定です。
        return bookService.searchBooks(keyword, status, categoryId, uncategorized, favorite, sort, page, size);
    }

    @GetMapping("/external-search")
    public ExternalBookSearchResponse searchExternalBooks(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "KEYWORD") ExternalBookSearchType type,
            @RequestParam(required = false, defaultValue = "10") @Min(1) @Max(40) int maxResults,
            @RequestParam(required = false, defaultValue = "0") @Min(0) int startIndex
    ) {
        // Google BooksやNDLなど、外部の本検索APIを使って候補を探します。
        return externalBookSearchService.search(query, type, maxResults, startIndex);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserBookDetailResponse createManualBook(@Valid @RequestBody CreateBookRequest request) {
        // 手入力で本を登録します。入力チェック後、BookServiceでDB保存します。
        return bookService.createManualBook(request);
    }

    @PostMapping("/import-by-isbn")
    @ResponseStatus(HttpStatus.CREATED)
    public UserBookDetailResponse importByIsbn(@Valid @RequestBody ImportByIsbnRequest request) {
        // ISBNから本の情報を探し、見つかった情報を使って登録します。
        return bookService.importByIsbn(request);
    }

    @GetMapping("/{userBookId}")
    public UserBookDetailResponse getBookDetail(@PathVariable Long userBookId) {
        // @PathVariable は /books/123 の 123 のようなURL内の値を受け取ります。
        return bookService.getBookDetail(userBookId);
    }

    @PatchMapping("/{userBookId}")
    public UserBookDetailResponse updateBook(
            @PathVariable Long userBookId,
            @Valid @RequestBody UpdateBookRequest request
    ) {
        // 本のステータス・評価・メモ・カテゴリなどを更新します。
        return bookService.updateBook(userBookId, request);
    }

    @DeleteMapping("/{userBookId}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long userBookId) {
        // 実際には完全削除ではなく、deletedAtを入れるソフトデリートです。
        bookService.deleteBook(userBookId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userBookId}/status")
    public UserBookDetailResponse updateStatus(
            @PathVariable Long userBookId,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        // 一覧画面などからステータスだけを素早く変更するためのAPIです。
        return bookService.updateStatus(userBookId, request);
    }

}
