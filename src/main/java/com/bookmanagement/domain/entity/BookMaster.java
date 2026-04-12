package com.bookmanagement.domain.entity;

import com.bookmanagement.domain.enums.SourceName;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(schema = "app", name = "book_master")
public class BookMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 13, columnDefinition = "bpchar(13)")
    private String isbn13;

    @Column(length = 10, columnDefinition = "bpchar(10)")
    private String isbn10;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String subtitle;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "authors_json", columnDefinition = "jsonb")
    private List<String> authorsJson = new ArrayList<>();

    @Column(length = 255)
    private String publisher;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "language_code", length = 10)
    private String languageCode;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "thumbnail_url", columnDefinition = "text")
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_primary", nullable = false, length = 30)
    private SourceName sourcePrimary;

    @Column(name = "source_last_fetched_at")
    private OffsetDateTime sourceLastFetchedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
