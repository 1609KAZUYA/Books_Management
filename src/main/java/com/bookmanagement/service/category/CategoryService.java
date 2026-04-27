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
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserContextService userContextService;

    @Transactional(readOnly = true)
    public CategoryListResponse listCategories() {
        User user = userContextService.requireCurrentUser();
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
        if (categoryRepository.existsByUser_IdAndNameIgnoreCase(user.getId(), name)) {
            throw new DuplicateException("CATEGORY-409", "Category name already exists");
        }

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
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, user.getId())
                .orElseThrow(() -> new NotFoundException("CATEGORY-404", "Category not found"));

        if (request.name() != null) {
            String name = normalizeCategoryName(request.name());
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
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, user.getId())
                .orElseThrow(() -> new NotFoundException("CATEGORY-404", "Category not found"));
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public Category resolveCategory(Long userId, Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndUser_Id(categoryId, userId)
                .orElseThrow(() -> new NotFoundException("CATEGORY-404", "Category not found"));
    }

    @Transactional(readOnly = true)
    public List<Category> resolveCategories(Long userId, Collection<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return List.of();
        }
        return categoryRepository.findByUser_IdAndIdIn(userId, categoryIds);
    }

    private String normalizeCategoryName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ValidationException("VALIDATION_ERROR", "Category name is required");
        }
        return name.trim();
    }

    public CategoryResponse toResponse(Category category) {
        if (category == null) {
            return null;
        }
        return new CategoryResponse(category.getId(), category.getName(), category.getColorHex(), category.getSortOrder());
    }
}
