package com.bookmanagement.service.category;

import com.bookmanagement.common.exception.DuplicateException;
import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.domain.entity.Category;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.dto.category.CategoryListResponse;
import com.bookmanagement.dto.category.CategoryResponse;
import com.bookmanagement.dto.category.CreateCategoryRequest;
import com.bookmanagement.dto.category.UpdateCategoryRequest;
import com.bookmanagement.repository.CategoryRepository;
import com.bookmanagement.service.user.UserContextService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
/**
 * カテゴリーに関する業務処理を担当します。
 *
 * Controllerから呼ばれ、Repositoryを使ってDBを読み書きします。
 * Laravelでいうと「Controllerから切り出したService」+「Eloquent操作」に近い層です。
 */
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserContextService userContextService;

    @Transactional(readOnly = true)
    public CategoryListResponse listCategories() {
        // ログイン中のユーザーを取得します。他人のカテゴリを見せないためです。
        User user = userContextService.requireCurrentUser();

        // RepositoryでDBからカテゴリを取得し、Response DTOへ変換して返します。
        List<CategoryResponse> items = categoryRepository.findByUser_IdOrderBySortOrderAscIdAsc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
        return new CategoryListResponse(items);
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        User user = userContextService.requireCurrentUser();
        String name = normalizeCategoryName(request.name());

        // 同じユーザー内で同名カテゴリが重複しないようにチェックします。
        if (categoryRepository.existsByUser_IdAndNameIgnoreCase(user.getId(), name)) {
            throw new DuplicateException("CATEGORY-409", "Category name already exists");
        }

        // Entityを作り、Repository.save(...) でDBへINSERTします。
        Category category = new Category();
        category.setUser(user);
        category.setName(name);
        category.setColorHex(request.colorHex());
        category.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long categoryId, UpdateCategoryRequest request) {
        User user = userContextService.requireCurrentUser();

        // 「指定ID」かつ「ログイン中ユーザーのカテゴリ」で探します。
        // これにより、他人のカテゴリIDを指定されても更新できません。
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, user.getId())
                .orElseThrow(() -> new NotFoundException("CATEGORY-404", "Category not found"));

        if (request.name() != null) {
            String name = normalizeCategoryName(request.name());

            // 変更後の名前が既に使われている場合だけ重複エラーにします。
            boolean duplicated = categoryRepository.existsByUser_IdAndNameIgnoreCase(user.getId(), name)
                    && !name.equalsIgnoreCase(category.getName());
            if (duplicated) {
                throw new DuplicateException("CATEGORY-409", "Category name already exists");
            }
            category.setName(name);
        }
        if (request.colorHex() != null) {
            category.setColorHex(request.colorHex());
        }
        if (request.sortOrder() != null) {
            category.setSortOrder(request.sortOrder());
        }
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        User user = userContextService.requireCurrentUser();
        // 削除対象も必ず「自分のカテゴリ」だけに限定します。
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, user.getId())
                .orElseThrow(() -> new NotFoundException("CATEGORY-404", "Category not found"));
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public Category resolveCategory(Long userId, Long categoryId) {
        // 本の登録・更新時に、指定されたcategoryIdが本当にそのユーザーのものか確認します。
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndUser_Id(categoryId, userId)
                .orElseThrow(() -> new NotFoundException("CATEGORY-404", "Category not found"));
    }

    private String normalizeCategoryName(String name) {
        // null / 空文字 / スペースだけ、を同じ「未入力」として扱います。
        if (!StringUtils.hasText(name)) {
            throw new ValidationException("VALIDATION_ERROR", "Category name is required");
        }
        return name.trim();
    }

    public CategoryResponse toResponse(Category category) {
        // categoryIdが未指定の本はカテゴリなしなので、nullをそのまま返します。
        if (category == null) {
            return null;
        }
        return new CategoryResponse(category.getId(), category.getName(), category.getColorHex(), category.getSortOrder());
    }
}
