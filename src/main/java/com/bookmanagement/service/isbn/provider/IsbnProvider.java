package com.bookmanagement.service.isbn.provider;

import com.bookmanagement.domain.enums.SourceName;
import com.bookmanagement.service.isbn.BookMetadata;
import java.util.Optional;

public interface IsbnProvider {

    SourceName sourceName();

    Optional<BookMetadata> lookup(String normalizedIsbn13);
}
