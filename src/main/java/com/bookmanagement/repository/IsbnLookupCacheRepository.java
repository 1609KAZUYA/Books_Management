package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.IsbnLookupCache;
import com.bookmanagement.domain.enums.SourceName;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IsbnLookupCacheRepository extends JpaRepository<IsbnLookupCache, Long> {

    Optional<IsbnLookupCache> findTopByIsbn13AndSourceNameAndExpiresAtAfterOrderByExpiresAtDesc(
            String isbn13,
            SourceName sourceName,
            OffsetDateTime now
    );
}
