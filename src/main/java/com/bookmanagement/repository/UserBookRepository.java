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

/**
 * user_bookテーブルを操作するRepositoryです。
 *
 * UserBookは「あるユーザーの本棚に入っている1冊」です。
 * BookMasterが本そのもの、UserBookがユーザーごとの読書状態やメモを持ちます。
 */
public interface UserBookRepository extends JpaRepository<UserBook, Long>, JpaSpecificationExecutor<UserBook> {

    // EntityGraphは、関連するBookMasterとCategoryもまとめて取得する指定です。
    // これにより、後から何度も追加SQLが走るのを防ぎます。
    @EntityGraph(attributePaths = {"bookMaster", "category"})
    Optional<UserBook> findByIdAndUser_IdAndDeletedAtIsNull(Long id, Long userId);

    // 同じユーザーが同じ本を既に登録していないか確認するために使います。
    @EntityGraph(attributePaths = {"bookMaster", "category"})
    Optional<UserBook> findByUser_IdAndBookMaster_IdAndDeletedAtIsNull(Long userId, Long bookMasterId);

    // ISBNなしで登録された本を、後からISBN付き情報に補修するための検索です。
    @EntityGraph(attributePaths = {"bookMaster", "category"})
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

    // Specificationを使った動的検索でも関連データをまとめて取得します。
    @Override
    @EntityGraph(attributePaths = {"bookMaster", "category"})
    Page<UserBook> findAll(Specification<UserBook> spec, Pageable pageable);
}
