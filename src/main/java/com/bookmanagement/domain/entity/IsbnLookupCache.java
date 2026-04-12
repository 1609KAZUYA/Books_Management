package com.bookmanagement.domain.entity;

import com.bookmanagement.domain.enums.SourceName;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(schema = "app", name = "isbn_lookup_cache")
public class IsbnLookupCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 13, columnDefinition = "bpchar(13)")
    private String isbn13;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_name", nullable = false, length = 30)
    private SourceName sourceName;

    @Column(name = "http_status", nullable = false)
    private int httpStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_json", columnDefinition = "jsonb")
    private JsonNode responseJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "normalized_payload_json", columnDefinition = "jsonb")
    private JsonNode normalizedPayloadJson;

    @CreationTimestamp
    @Column(name = "fetched_at", nullable = false, updatable = false)
    private OffsetDateTime fetchedAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "hit_count", nullable = false)
    private int hitCount = 1;
}
