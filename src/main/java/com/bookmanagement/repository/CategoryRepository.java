package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUser_IdOrderBySortOrderAscIdAsc(Long userId);

    Optional<Category> findByIdAndUser_Id(Long categoryId, Long userId);

    boolean existsByUser_IdAndNameIgnoreCase(Long userId, String name);
}
