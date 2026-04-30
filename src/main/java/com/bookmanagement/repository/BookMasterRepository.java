package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.BookMaster;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * book_masterテーブルを操作するRepositoryです。
 *
 * BookMasterは「本そのものの共通情報」です。
 * 同じ本を複数ユーザーが登録しても、タイトルやISBNなどはここで共有します。
 */
public interface BookMasterRepository extends JpaRepository<BookMaster, Long> {

    // ISBN13が一致する本を探します。ISBNは本を一意に探すキーとして使いやすいです。
    Optional<BookMaster> findByIsbn13(String isbn13);

    // ISBNがない手入力本を、タイトルだけで探します。
    Optional<BookMaster> findFirstByTitleIgnoreCaseAndIsbn13IsNull(String title);

    // 手入力で後からISBNが判明した本を補修するため、近いタイトルの本を探します。
    @Query("""
            select bm
            from BookMaster bm
            where bm.isbn13 is null
              and (
                lower(bm.title) = lower(:title)
                or lower(:title) like concat(lower(bm.title), '%')
                or lower(bm.title) like concat(lower(:title), '%')
              )
            order by bm.id asc
            """)
    List<BookMaster> findRepairableBookMasters(@Param("title") String title);
}
