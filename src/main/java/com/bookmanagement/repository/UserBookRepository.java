package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.UserBook;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserBookRepository extends JpaRepository<UserBook, Long>, JpaSpecificationExecutor<UserBook> {

    @EntityGraph(attributePaths = {"bookMaster", "tagLinks", "tagLinks.tag"})
    Optional<UserBook> findByIdAndUser_IdAndDeletedAtIsNull(Long id, Long userId);

    boolean existsByUser_IdAndBookMaster_IdAndDeletedAtIsNull(Long userId, Long bookMasterId);

    @Override
    @EntityGraph(attributePaths = {"bookMaster", "tagLinks", "tagLinks.tag"})
    Page<UserBook> findAll(Specification<UserBook> spec, Pageable pageable);
}
