package com.bookmanagement.controller;

import com.bookmanagement.dto.isbn.IsbnLookupResponse;
import com.bookmanagement.dto.isbn.IsbnReloadRequest;
import com.bookmanagement.service.isbn.IsbnLookupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/isbn")
public class IsbnController {

    private final IsbnLookupService isbnLookupService;

    @GetMapping("/{isbn}")
    public IsbnLookupResponse lookup(@PathVariable String isbn) {
        return isbnLookupService.lookup(isbn, false);
    }

    @PostMapping("/reload")
    public IsbnLookupResponse reload(@Valid @RequestBody IsbnReloadRequest request) {
        return isbnLookupService.lookup(request.isbn(), true);
    }
}
