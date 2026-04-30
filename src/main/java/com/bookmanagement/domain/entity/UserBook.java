package com.bookmanagement.domain.entity;

import com.bookmanagement.domain.enums.BookStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(schema = "app", name = "user_book")
/**
 * user_bookテーブルに対応するEntityです。
 *
 * Laravelでいう中間テーブル用Modelに近いですが、単なる中間テーブルではありません。
 * 「ユーザーごとの読書状態・評価・メモ」を持つため、このアプリの本棚の中心データです。
 */
public class UserBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    // どのユーザーの本棚に入っているかを表します。
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_master_id", nullable = false)
    // 本そのものの共通情報です。タイトル・著者・ISBNなどはBookMaster側にあります。
    private BookMaster bookMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    // ユーザーが自由に設定する分類です。未分類の場合はnullです。
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookStatus status;

    @Column(precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "favorite_flag", nullable = false)
    private boolean favoriteFlag;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "finish_date")
    private LocalDate finishDate;

    @Column(columnDefinition = "text")
    private String memo;

    @Column(name = "location_note", length = 255)
    private String locationNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    // nullなら有効、日時が入っていれば削除済みとして扱うソフトデリート用カラムです。
    private OffsetDateTime deletedAt;
}
