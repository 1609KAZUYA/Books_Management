package com.bookmanagement.controller;

import com.bookmanagement.dto.category.CategoryListResponse;
import com.bookmanagement.dto.category.CategoryResponse;
import com.bookmanagement.dto.category.CreateCategoryRequest;
import com.bookmanagement.dto.category.UpdateCategoryRequest;
import com.bookmanagement.service.category.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/categories")
/**
 * カテゴリー管理のAPI入口です。
 *
 * Laravelでいう CategoryController に近いです。
 * 「カテゴリ一覧」「作成」「更新」「削除」のURLを受け持ちます。
 */
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public CategoryListResponse listCategories() {
        // ログイン中ユーザーのカテゴリだけを一覧で返します。
        return categoryService.listCategories();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        // 入力されたカテゴリ名・色・並び順を使って新規作成します。
        return categoryService.createCategory(request);
    }

    @PatchMapping("/{categoryId}")
    public CategoryResponse updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        // 指定されたカテゴリIDの内容を更新します。
        return categoryService.updateCategory(categoryId, request);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        // カテゴリを削除します。関連する本側はDB設定でカテゴリなしになります。
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
