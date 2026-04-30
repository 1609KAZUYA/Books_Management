package com.bookmanagement.service.book;

import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.domain.entity.BookMaster;
import com.bookmanagement.domain.entity.Category;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.domain.entity.UserBook;
import com.bookmanagement.domain.enums.BookStatus;
import com.bookmanagement.domain.enums.SourceName;
import com.bookmanagement.dto.book.BookListItemResponse;
import com.bookmanagement.dto.book.BookListResponse;
import com.bookmanagement.dto.book.BookMasterSummaryResponse;
import com.bookmanagement.dto.book.CreateBookRequest;
import com.bookmanagement.dto.book.ImportByIsbnRequest;
import com.bookmanagement.dto.book.PaginationMetaResponse;
import com.bookmanagement.dto.book.UpdateBookRequest;
import com.bookmanagement.dto.book.UpdateStatusRequest;
import com.bookmanagement.dto.book.UserBookDetailResponse;
import com.bookmanagement.repository.BookMasterRepository;
import com.bookmanagement.repository.UserBookRepository;
import com.bookmanagement.service.category.CategoryService;
import com.bookmanagement.service.isbn.BookMetadata;
import com.bookmanagement.service.isbn.IsbnLookupService;
import com.bookmanagement.service.isbn.IsbnNormalizer;
import com.bookmanagement.service.user.UserContextService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
/**
 * 本の登録・検索・更新・削除を担当する中心的なServiceです。
 *
 * Laravelでいうと、BooksControllerから呼ばれるServiceクラスです。
 * Repositoryを使ってDBを読み書きし、最後にResponse DTOへ変換してControllerへ返します。
 */
public class BookService {

    private final UserBookRepository userBookRepository;
    private final BookMasterRepository bookMasterRepository;
    private final UserContextService userContextService;
    private final CategoryService categoryService;
    private final IsbnLookupService isbnLookupService;
    private final IsbnNormalizer isbnNormalizer;
    private final BookCoverService bookCoverService;

    @Transactional(readOnly = true)
    public BookListResponse searchBooks(
            String keyword,
            BookStatus status,
            Long categoryId,
            Boolean uncategorized,
            Boolean favorite,
            String sort,
            int page,
            int size
    ) {
        // 1. JWTからログイン中ユーザーを取得します。
        User user = userContextService.requireCurrentUser();

        // 2. page/size/sortをSpring Data JPA用のPageableに変換します。
        Pageable pageable = PageRequest.of(page - 1, size, resolveSort(sort));

        // 3. 検索条件をSpecificationとして組み立てます。
        //    Laravelの query builder で where を足していく感覚に近いです。
        Specification<UserBook> spec = byUser(user.getId())
                .and(activeOnly())
                .and(byStatus(status))
                .and(byCategory(categoryId, uncategorized))
                .and(byFavorite(favorite))
                .and(byKeyword(keyword));

        // 4. DB検索し、一覧用DTOとページ情報DTOに詰め替えて返します。
        Page<UserBook> result = userBookRepository.findAll(spec, pageable);
        List<BookListItemResponse> items = result.getContent().stream().map(this::toListItem).toList();
        PaginationMetaResponse meta = new PaginationMetaResponse(
                result.getNumber() + 1,
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
        return new BookListResponse(items, meta);
    }

    @Transactional
    public UserBookDetailResponse createManualBook(CreateBookRequest request) {
        // 手入力で本を追加する処理です。
        // UserBook = 「このユーザーの本棚にある1冊」
        // BookMaster = 「本そのものの共通情報」です。
        User user = userContextService.requireCurrentUser();
        validateRatingStep(request.rating());
        Category category = categoryService.resolveCategory(user.getId(), request.categoryId());

        // ISBNが入力されていれば正規化し、ISBN13として扱えるようにします。
        String isbn13 = resolveIsbn13(request.isbn13(), request.isbn10());

        // 既に似た手入力本がある場合、ISBNなど不足情報を補って再利用します。
        Optional<UserBook> repairableUserBook = findRepairableUserBook(user.getId(), request, isbn13);
        if (repairableUserBook.isPresent()) {
            return repairUserBookMaster(repairableUserBook.get(), request, isbn13, category);
        }

        // BookMasterを探すか、なければ作成します。
        BookMaster bookMaster = resolveOrCreateManualBookMaster(request, isbn13);

        // 同じユーザーが同じ本を既に登録済みなら、重複登録せず既存データを返します。
        Optional<UserBook> existingUserBook = userBookRepository
                .findByUser_IdAndBookMaster_IdAndDeletedAtIsNull(user.getId(), bookMaster.getId());
        if (existingUserBook.isPresent()) {
            UserBook existing = existingUserBook.get();
            if (request.categoryId() != null) {
                existing.setCategory(category);
                return toDetail(userBookRepository.save(existing));
            }
            return toDetail(existingUserBook.get());
        }

        // ここから新しいUserBookを作成します。
        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBookMaster(bookMaster);
        userBook.setCategory(category);
        userBook.setStatus(request.status());
        userBook.setRating(request.rating());
        userBook.setFavoriteFlag(Boolean.TRUE.equals(request.favoriteFlag()));
        userBook.setMemo(request.memo());
        validateDateRange(userBook.getStartDate(), userBook.getFinishDate());

        UserBook saved = userBookRepository.save(userBook);
        return toDetail(userBookRepository.findByIdAndUser_IdAndDeletedAtIsNull(saved.getId(), user.getId())
                .orElseThrow(() -> new NotFoundException("BOOK-404", "Created book not found")));
    }

    private Optional<UserBook> findRepairableUserBook(Long userId, CreateBookRequest request, String isbn13) {
        if (!StringUtils.hasText(isbn13) || !StringUtils.hasText(request.title())) {
            return Optional.empty();
        }
        return userBookRepository.findRepairableUserBooks(userId, request.title().trim()).stream().findFirst();
    }

    private UserBookDetailResponse repairUserBookMaster(
            UserBook userBook,
            CreateBookRequest request,
            String isbn13,
            Category category
    ) {
        BookMaster repairedMaster = bookMasterRepository.findByIsbn13(isbn13)
                .map(existing -> updateMissingBookMasterFields(existing, request, isbn13))
                .orElseGet(() -> updateMissingBookMasterFields(userBook.getBookMaster(), request, isbn13));
        userBook.setBookMaster(repairedMaster);
        if (request.categoryId() != null) {
            userBook.setCategory(category);
        }
        return toDetail(userBookRepository.save(userBook));
    }

    @Transactional
    public UserBookDetailResponse importByIsbn(ImportByIsbnRequest request) {
        // ISBNから外部APIで本情報を探し、本棚に登録する処理です。
        User user = userContextService.requireCurrentUser();
        Category category = categoryService.resolveCategory(user.getId(), request.categoryId());

        // OpenBD / Google Booksなどから本の情報を取得します。
        BookMetadata metadata = isbnLookupService.lookupFirstForImport(request.isbn());

        // 既に同じISBNのBookMasterがあれば再利用し、なければ作成します。
        BookMaster bookMaster = bookMasterRepository.findByIsbn13(metadata.isbn13())
                .orElseGet(() -> createBookMasterFromMetadata(metadata));

        // 同じユーザーが同じ本を登録済みなら重複させません。
        Optional<UserBook> existingUserBook = userBookRepository
                .findByUser_IdAndBookMaster_IdAndDeletedAtIsNull(user.getId(), bookMaster.getId());
        if (existingUserBook.isPresent()) {
            UserBook existing = existingUserBook.get();
            if (request.categoryId() != null) {
                existing.setCategory(category);
                return toDetail(userBookRepository.save(existing));
            }
            return toDetail(existingUserBook.get());
        }

        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBookMaster(bookMaster);
        userBook.setCategory(category);
        userBook.setStatus(request.status());
        userBook.setFavoriteFlag(false);
        userBook.setMemo(request.memo());
        UserBook saved = userBookRepository.save(userBook);
        return toDetail(userBookRepository.findByIdAndUser_IdAndDeletedAtIsNull(saved.getId(), user.getId())
                .orElseThrow(() -> new NotFoundException("BOOK-404", "Imported book not found")));
    }

    @Transactional(readOnly = true)
    public UserBookDetailResponse getBookDetail(Long userBookId) {
        // 詳細画面用に、ログイン中ユーザーの本だけを取得します。
        User user = userContextService.requireCurrentUser();
        return toDetail(findUserBookOrThrow(user.getId(), userBookId));
    }

    @Transactional
    public UserBookDetailResponse updateBook(Long userBookId, UpdateBookRequest request) {
        // 本棚内の1冊について、ステータス・評価・メモ・日付などを更新します。
        User user = userContextService.requireCurrentUser();
        UserBook userBook = findUserBookOrThrow(user.getId(), userBookId);
        userBook.setCategory(categoryService.resolveCategory(user.getId(), request.categoryId()));

        if (request.status() != null) {
            userBook.setStatus(request.status());
        }
        if (request.rating() != null) {
            validateRatingStep(request.rating());
            userBook.setRating(request.rating());
        }
        if (request.favoriteFlag() != null) {
            userBook.setFavoriteFlag(request.favoriteFlag());
        }
        if (request.purchaseDate() != null) {
            userBook.setPurchaseDate(request.purchaseDate());
        }
        if (request.startDate() != null) {
            userBook.setStartDate(request.startDate());
        }
        if (request.finishDate() != null) {
            userBook.setFinishDate(request.finishDate());
        }
        if (request.memo() != null) {
            userBook.setMemo(request.memo());
        }
        if (request.locationNote() != null) {
            userBook.setLocationNote(request.locationNote());
        }
        validateDateRange(userBook.getStartDate(), userBook.getFinishDate());

        UserBook saved = userBookRepository.save(userBook);
        return toDetail(findUserBookOrThrow(user.getId(), saved.getId()));
    }

    @Transactional
    public void deleteBook(Long userBookId) {
        // 完全削除ではなく deletedAt に日時を入れる「ソフトデリート」です。
        // 後から復元したい場合や履歴を残したい場合に使いやすい方法です。
        User user = userContextService.requireCurrentUser();
        UserBook userBook = findUserBookOrThrow(user.getId(), userBookId);
        userBook.setDeletedAt(OffsetDateTime.now());
        userBookRepository.save(userBook);
    }

    @Transactional
    public UserBookDetailResponse updateStatus(Long userBookId, UpdateStatusRequest request) {
        // ステータス変更専用の処理です。
        // 読書中にしたら開始日、読了にしたら読了日を自動補完します。
        User user = userContextService.requireCurrentUser();
        UserBook userBook = findUserBookOrThrow(user.getId(), userBookId);
        userBook.setStatus(request.status());

        if (request.startDate() != null) {
            userBook.setStartDate(request.startDate());
        }
        if (request.finishDate() != null) {
            userBook.setFinishDate(request.finishDate());
        }
        if (request.status() == BookStatus.READING && userBook.getStartDate() == null) {
            userBook.setStartDate(LocalDate.now());
        }
        if (request.status() == BookStatus.FINISHED && userBook.getFinishDate() == null) {
            userBook.setFinishDate(LocalDate.now());
        }

        validateDateRange(userBook.getStartDate(), userBook.getFinishDate());
        return toDetail(userBookRepository.save(userBook));
    }

    private UserBook findUserBookOrThrow(Long userId, Long userBookId) {
        // 「指定ID」かつ「ログイン中ユーザー」かつ「削除されていない」本だけを探します。
        // 見つからない場合は404相当の例外にします。
        return userBookRepository.findByIdAndUser_IdAndDeletedAtIsNull(userBookId, userId)
                .orElseThrow(() -> new NotFoundException("BOOK-404", "Book not found"));
    }

    private BookMaster resolveOrCreateManualBookMaster(CreateBookRequest request, String isbn13) {
        if (StringUtils.hasText(isbn13)) {
            return bookMasterRepository.findByIsbn13(isbn13)
                    .map(existing -> updateMissingBookMasterFields(existing, request, isbn13))
                    .or(() -> bookMasterRepository.findRepairableBookMasters(request.title().trim()).stream()
                            .findFirst()
                            .map(existing -> updateMissingBookMasterFields(existing, request, isbn13)))
                    .orElseGet(() -> createManualBookMaster(request, isbn13));
        }
        return createManualBookMaster(request, null);
    }

    private BookMaster updateMissingBookMasterFields(BookMaster bookMaster, CreateBookRequest request, String isbn13) {
        boolean updated = false;

        if (!StringUtils.hasText(bookMaster.getIsbn13()) && StringUtils.hasText(isbn13)) {
            bookMaster.setIsbn13(isbn13);
            updated = true;
        }
        if (!StringUtils.hasText(bookMaster.getIsbn10())) {
            String isbn10 = null;
            if (StringUtils.hasText(request.isbn10())) {
                isbn10 = request.isbn10().trim().toUpperCase(Locale.ROOT);
            } else if (StringUtils.hasText(isbn13)) {
                isbn10 = isbnNormalizer.toIsbn10(isbn13).orElse(null);
            }
            if (StringUtils.hasText(isbn10)) {
                bookMaster.setIsbn10(isbn10);
                updated = true;
            }
        }
        if (!StringUtils.hasText(bookMaster.getSubtitle()) && StringUtils.hasText(request.subtitle())) {
            bookMaster.setSubtitle(request.subtitle());
            updated = true;
        }
        if ((bookMaster.getAuthorsJson() == null || bookMaster.getAuthorsJson().isEmpty())
                && request.authors() != null && !request.authors().isEmpty()) {
            bookMaster.setAuthorsJson(request.authors());
            updated = true;
        }
        if (!StringUtils.hasText(bookMaster.getPublisher()) && StringUtils.hasText(request.publisher())) {
            bookMaster.setPublisher(request.publisher());
            updated = true;
        }
        if (bookMaster.getPublishedDate() == null && request.publishedDate() != null) {
            bookMaster.setPublishedDate(request.publishedDate());
            updated = true;
        }
        if (!StringUtils.hasText(bookMaster.getDescription()) && StringUtils.hasText(request.description())) {
            bookMaster.setDescription(request.description());
            updated = true;
        }
        String thumbnailUrl = bookCoverService.resolveThumbnailUrl(isbn13, request.thumbnailUrl());
        if (shouldUpdateThumbnail(bookMaster.getThumbnailUrl(), thumbnailUrl)) {
            bookMaster.setThumbnailUrl(thumbnailUrl);
            updated = true;
        }

        if (!updated) {
            return bookMaster;
        }
        bookMaster.setSourceLastFetchedAt(OffsetDateTime.now());
        return bookMasterRepository.save(bookMaster);
    }

    private boolean shouldUpdateThumbnail(String currentThumbnailUrl, String requestedThumbnailUrl) {
        if (!StringUtils.hasText(requestedThumbnailUrl)) {
            return false;
        }
        if (!StringUtils.hasText(currentThumbnailUrl)) {
            return true;
        }
        if (currentThumbnailUrl.equals(requestedThumbnailUrl)) {
            return false;
        }
        return currentThumbnailUrl.startsWith("/external/openlibrary/");
    }

    private BookMaster createManualBookMaster(CreateBookRequest request, String isbn13) {
        BookMaster bookMaster = new BookMaster();
        bookMaster.setIsbn13(isbn13);
        if (StringUtils.hasText(request.isbn10())) {
            bookMaster.setIsbn10(request.isbn10());
        } else if (StringUtils.hasText(isbn13)) {
            bookMaster.setIsbn10(isbnNormalizer.toIsbn10(isbn13).orElse(null));
        }
        bookMaster.setTitle(request.title().trim());
        bookMaster.setSubtitle(request.subtitle());
        bookMaster.setAuthorsJson(request.authors() == null ? List.of() : request.authors());
        bookMaster.setPublisher(request.publisher());
        bookMaster.setPublishedDate(request.publishedDate());
        bookMaster.setDescription(request.description());
        bookMaster.setThumbnailUrl(bookCoverService.resolveThumbnailUrl(isbn13, request.thumbnailUrl()));
        bookMaster.setSourcePrimary(SourceName.MANUAL);
        bookMaster.setSourceLastFetchedAt(OffsetDateTime.now());
        return bookMasterRepository.save(bookMaster);
    }

    private BookMaster createBookMasterFromMetadata(BookMetadata metadata) {
        BookMaster bookMaster = new BookMaster();
        bookMaster.setIsbn13(metadata.isbn13());
        bookMaster.setIsbn10(metadata.isbn10());
        bookMaster.setTitle(metadata.title());
        bookMaster.setSubtitle(metadata.subtitle());
        bookMaster.setAuthorsJson(metadata.authors());
        bookMaster.setPublisher(metadata.publisher());
        bookMaster.setPublishedDate(metadata.publishedDate());
        bookMaster.setDescription(metadata.description());
        bookMaster.setThumbnailUrl(metadata.thumbnailUrl());
        bookMaster.setSourcePrimary(metadata.sourceName());
        bookMaster.setSourceLastFetchedAt(OffsetDateTime.now());
        return bookMasterRepository.save(bookMaster);
    }

    private Specification<UserBook> byUser(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    private Specification<UserBook> activeOnly() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    private Specification<UserBook> byStatus(BookStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    private Specification<UserBook> byFavorite(Boolean favorite) {
        return (root, query, cb) -> favorite == null ? cb.conjunction() : cb.equal(root.get("favoriteFlag"), favorite);
    }

    private Specification<UserBook> byCategory(Long categoryId, Boolean uncategorized) {
        return (root, query, cb) -> {
            if (Boolean.TRUE.equals(uncategorized)) {
                return cb.isNull(root.get("category"));
            }
            if (categoryId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("category").get("id"), categoryId);
        };
    }

    private Specification<UserBook> byKeyword(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            // タイトル・出版社・ISBNをまとめてLIKE検索します。
            // cb はCriteriaBuilderで、SQLのwhere条件をJavaで組み立てるための道具です。
            query.distinct(true);
            String like = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            Join<UserBook, BookMaster> book = root.join("bookMaster", JoinType.INNER);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(book.get("title")), like));
            predicates.add(cb.like(cb.lower(cb.coalesce(book.get("publisher").as(String.class), "")), like));
            predicates.add(cb.like(cb.lower(cb.coalesce(book.get("isbn13").as(String.class), "")), like));
            predicates.add(cb.like(cb.lower(cb.coalesce(book.get("isbn10").as(String.class), "")), like));
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort resolveSort(String sort) {
        // フロントから受け取った並び順の文字列を、DB検索用のSortに変換します。
        if (!StringUtils.hasText(sort)) {
            return Sort.by(Sort.Order.desc("updatedAt"));
        }
        return switch (sort) {
            case "createdAtDesc" -> Sort.by(Sort.Order.desc("createdAt"));
            case "titleAsc" -> JpaSort.unsafe(Sort.Direction.ASC, "bookMaster.title")
                    .and(Sort.by(Sort.Order.desc("updatedAt")));
            case "ratingDesc" -> Sort.by(Sort.Order.desc("rating"), Sort.Order.desc("updatedAt"));
            case "publishedDateDesc" -> JpaSort.unsafe(Sort.Direction.DESC, "bookMaster.publishedDate")
                    .and(Sort.by(Sort.Order.desc("updatedAt")));
            case "updatedAtDesc" -> Sort.by(Sort.Order.desc("updatedAt"));
            default -> throw new ValidationException("VALIDATION_ERROR", "Invalid sort parameter");
        };
    }

    private String resolveIsbn13(String isbn13, String isbn10) {
        if (StringUtils.hasText(isbn13)) {
            return isbnNormalizer.normalizeToIsbn13(isbn13)
                    .orElseThrow(() -> new ValidationException("ISBN-400", "Invalid ISBN-13"));
        }
        if (StringUtils.hasText(isbn10)) {
            return isbnNormalizer.normalizeToIsbn13(isbn10)
                    .orElseThrow(() -> new ValidationException("ISBN-400", "Invalid ISBN-10"));
        }
        return null;
    }

    private void validateRatingStep(BigDecimal rating) {
        // 評価は 0.5 から 5.0 まで、0.5刻みだけ許可します。
        if (rating == null) {
            return;
        }
        if (rating.compareTo(new BigDecimal("0.5")) < 0 || rating.compareTo(new BigDecimal("5.0")) > 0) {
            throw new ValidationException("VALIDATION_ERROR", "Rating must be between 0.5 and 5.0");
        }
        BigDecimal doubled = rating.multiply(new BigDecimal("2"));
        if (doubled.stripTrailingZeros().scale() > 0) {
            throw new ValidationException("VALIDATION_ERROR", "Rating must be in 0.5 increments");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate finishDate) {
        if (startDate != null && finishDate != null && finishDate.isBefore(startDate)) {
            throw new ValidationException("VALIDATION_ERROR", "finish_date must be greater than or equal to start_date");
        }
    }

    private UserBookDetailResponse toDetail(UserBook userBook) {
        // EntityをそのままJSONにせず、画面に必要な形のDTOへ変換します。
        // LaravelのAPI Resourceに近い役割です。
        return new UserBookDetailResponse(
                userBook.getId(),
                userBook.getStatus(),
                userBook.getRating(),
                userBook.isFavoriteFlag(),
                userBook.getPurchaseDate(),
                userBook.getStartDate(),
                userBook.getFinishDate(),
                userBook.getUpdatedAt(),
                categoryService.toResponse(userBook.getCategory()),
                toBookMaster(userBook.getBookMaster()),
                userBook.getMemo(),
                userBook.getLocationNote(),
                userBook.getCreatedAt(),
                userBook.getDeletedAt()
        );
    }

    private BookListItemResponse toListItem(UserBook userBook) {
        // 一覧画面用の軽めのDTOに変換します。
        return new BookListItemResponse(
                userBook.getId(),
                userBook.getStatus(),
                userBook.getRating(),
                userBook.isFavoriteFlag(),
                userBook.getPurchaseDate(),
                userBook.getStartDate(),
                userBook.getFinishDate(),
                userBook.getUpdatedAt(),
                categoryService.toResponse(userBook.getCategory()),
                toBookMaster(userBook.getBookMaster())
        );
    }

    private BookMasterSummaryResponse toBookMaster(BookMaster bookMaster) {
        // BookMasterの中から、画面表示に必要な本の基本情報だけ返します。
        return new BookMasterSummaryResponse(
                bookMaster.getId(),
                bookMaster.getIsbn13(),
                bookMaster.getIsbn10(),
                bookMaster.getTitle(),
                bookMaster.getSubtitle(),
                bookMaster.getAuthorsJson() == null ? List.of() : bookMaster.getAuthorsJson(),
                bookMaster.getPublisher(),
                bookMaster.getPublishedDate(),
                bookMaster.getThumbnailUrl(),
                bookMaster.getSourcePrimary()
        );
    }

}
