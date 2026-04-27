package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.BookMaster;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookMasterRepository extends JpaRepository<BookMaster, Long> {

    Optional<BookMaster> findByIsbn13(String isbn13);

    Optional<BookMaster> findFirstByTitleIgnoreCaseAndIsbn13IsNull(String title);

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
