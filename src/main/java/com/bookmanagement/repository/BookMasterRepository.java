package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.BookMaster;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookMasterRepository extends JpaRepository<BookMaster, Long> {

    Optional<BookMaster> findByIsbn13(String isbn13);

    Optional<BookMaster> findFirstByTitleIgnoreCaseAndIsbn13IsNull(String title);
}
