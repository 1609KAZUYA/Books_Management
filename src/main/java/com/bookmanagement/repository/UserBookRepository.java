package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.UserBook;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserBookRepository extends JpaRepository<UserBook, Long>, JpaSpecificationExecutor<UserBook> {

    @EntityGraph(attributePaths = {"bookMaster", "tagLinks", "tagLinks.tag"})
    Optional<UserBook> findByIdAndUser_IdAndDeletedAtIsNull(Long id, Long userId);

    @EntityGraph(attributePaths = {"bookMaster", "tagLinks", "tagLinks.tag"})
    Optional<UserBook> findByUser_IdAndBookMaster_IdAndDeletedAtIsNull(Long userId, Long bookMasterId);

    @EntityGraph(attributePaths = {"bookMaster", "tagLinks", "tagLinks.tag"})
    @Query("""
            select ub
            from UserBook ub
            where ub.user.id = :userId
              and ub.bookMaster.isbn13 is null
              and (
                lower(ub.bookMaster.title) = lower(:title)
                or lower(:title) like concat(lower(ub.bookMaster.title), '%')
                or lower(ub.bookMaster.title) like concat(lower(:title), '%')
              )
              and ub.deletedAt is null
            order by ub.id asc
            """)
    List<UserBook> findRepairableUserBooks(@Param("userId") Long userId, @Param("title") String title);

    boolean existsByUser_IdAndBookMaster_IdAndDeletedAtIsNull(Long userId, Long bookMasterId);

    @Override
    @EntityGraph(attributePaths = {"bookMaster", "tagLinks", "tagLinks.tag"})
    Page<UserBook> findAll(Specification<UserBook> spec, Pageable pageable);
}
