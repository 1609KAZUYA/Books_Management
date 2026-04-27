package com.bookmanagement.service.book;

import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.domain.entity.BookMaster;
import com.bookmanagement.domain.entity.Tag;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.domain.entity.UserBook;
import com.bookmanagement.domain.entity.UserBookTag;
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
import com.bookmanagement.dto.tag.TagResponse;
import com.bookmanagement.repository.BookMasterRepository;
import com.bookmanagement.repository.TagRepository;
import com.bookmanagement.repository.UserBookRepository;
import com.bookmanagement.repository.UserBookTagRepository;
import com.bookmanagement.service.isbn.BookMetadata;
import com.bookmanagement.service.isbn.IsbnLookupService;
import com.bookmanagement.service.isbn.IsbnNormalizer;
import com.bookmanagement.service.tag.TagService;
import com.bookmanagement.service.user.UserContextService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
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
public class BookService {

    private final UserBookRepository userBookRepository;
    private final BookMasterRepository bookMasterRepository;
    private final TagRepository tagRepository;
    private final UserBookTagRepository userBookTagRepository;
    private final UserContextService userContextService;
    private final TagService tagService;
    private final IsbnLookupService isbnLookupService;
    private final IsbnNormalizer isbnNormalizer;
    private final BookCoverService bookCoverService;

    @Transactional(readOnly = true)
    public BookListResponse searchBooks(
            String keyword,
            BookStatus status,
            Long tagId,
            Boolean favorite,
            String sort,
            int page,
            int size
    ) {
        User user = userContextService.requireCurrentUser();
        Pageable pageable = PageRequest.of(page - 1, size, resolveSort(sort));

        Specification<UserBook> spec = byUser(user.getId())
                .and(activeOnly())
                .and(byStatus(status))
                .and(byFavorite(favorite))
                .and(byTagId(tagId))
                .and(byKeyword(keyword));

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
        User user = userContextService.requireCurrentUser();
        validateRatingStep(request.rating());

        String isbn13 = resolveIsbn13(request.isbn13(), request.isbn10());
        Optional<UserBook> repairableUserBook = findRepairableUserBook(user.getId(), request, isbn13);
        if (repairableUserBook.isPresent()) {
            return repairUserBookMaster(repairableUserBook.get(), request, isbn13);
        }

        BookMaster bookMaster = resolveOrCreateManualBookMaster(request, isbn13);
        Optional<UserBook> existingUserBook = userBookRepository
                .findByUser_IdAndBookMaster_IdAndDeletedAtIsNull(user.getId(), bookMaster.getId());
        if (existingUserBook.isPresent()) {
            return toDetail(existingUserBook.get());
        }

        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBookMaster(bookMaster);
        userBook.setStatus(request.status());
        userBook.setRating(request.rating());
        userBook.setFavoriteFlag(Boolean.TRUE.equals(request.favoriteFlag()));
        userBook.setMemo(request.memo());
        validateDateRange(userBook.getStartDate(), userBook.getFinishDate());

        UserBook saved = userBookRepository.save(userBook);
        replaceTags(saved, user.getId(), request.tagIds());
        return toDetail(userBookRepository.findByIdAndUser_IdAndDeletedAtIsNull(saved.getId(), user.getId())
                .orElseThrow(() -> new NotFoundException("BOOK-404", "Created book not found")));
    }

    private Optional<UserBook> findRepairableUserBook(Long userId, CreateBookRequest request, String isbn13) {
        if (!StringUtils.hasText(isbn13) || !StringUtils.hasText(request.title())) {
            return Optional.empty();
        }
        return userBookRepository.findRepairableUserBooks(userId, request.title().trim()).stream().findFirst();
    }

    private UserBookDetailResponse repairUserBookMaster(UserBook userBook, CreateBookRequest request, String isbn13) {
        BookMaster repairedMaster = bookMasterRepository.findByIsbn13(isbn13)
                .map(existing -> updateMissingBookMasterFields(existing, request, isbn13))
                .orElseGet(() -> updateMissingBookMasterFields(userBook.getBookMaster(), request, isbn13));
        userBook.setBookMaster(repairedMaster);
        return toDetail(userBookRepository.save(userBook));
    }

    @Transactional
    public UserBookDetailResponse importByIsbn(ImportByIsbnRequest request) {
        User user = userContextService.requireCurrentUser();
        BookMetadata metadata = isbnLookupService.lookupFirstForImport(request.isbn());
        BookMaster bookMaster = bookMasterRepository.findByIsbn13(metadata.isbn13())
                .orElseGet(() -> createBookMasterFromMetadata(metadata));

        Optional<UserBook> existingUserBook = userBookRepository
                .findByUser_IdAndBookMaster_IdAndDeletedAtIsNull(user.getId(), bookMaster.getId());
        if (existingUserBook.isPresent()) {
            return toDetail(existingUserBook.get());
        }

        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBookMaster(bookMaster);
        userBook.setStatus(request.status());
        userBook.setFavoriteFlag(false);
        userBook.setMemo(request.memo());
        UserBook saved = userBookRepository.save(userBook);
        replaceTags(saved, user.getId(), request.tagIds());
        return toDetail(userBookRepository.findByIdAndUser_IdAndDeletedAtIsNull(saved.getId(), user.getId())
                .orElseThrow(() -> new NotFoundException("BOOK-404", "Imported book not found")));
    }

    @Transactional(readOnly = true)
    public UserBookDetailResponse getBookDetail(Long userBookId) {
        User user = userContextService.requireCurrentUser();
        return toDetail(findUserBookOrThrow(user.getId(), userBookId));
    }

    @Transactional
    public UserBookDetailResponse updateBook(Long userBookId, UpdateBookRequest request) {
        User user = userContextService.requireCurrentUser();
        UserBook userBook = findUserBookOrThrow(user.getId(), userBookId);

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
        if (request.tagIds() != null) {
            replaceTags(saved, user.getId(), request.tagIds());
        }
        return toDetail(findUserBookOrThrow(user.getId(), saved.getId()));
    }

    @Transactional
    public void deleteBook(Long userBookId) {
        User user = userContextService.requireCurrentUser();
        UserBook userBook = findUserBookOrThrow(user.getId(), userBookId);
        userBook.setDeletedAt(OffsetDateTime.now());
        userBookRepository.save(userBook);
    }

    @Transactional
    public UserBookDetailResponse updateStatus(Long userBookId, UpdateStatusRequest request) {
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

    @Transactional
    public void addTag(Long userBookId, Long tagId) {
        User user = userContextService.requireCurrentUser();
        UserBook userBook = findUserBookOrThrow(user.getId(), userBookId);
        Tag tag = tagRepository.findByIdAndUser_Id(tagId, user.getId())
                .orElseThrow(() -> new NotFoundException("TAG-404", "Tag not found"));

        if (userBookTagRepository.existsByUserBook_IdAndTag_Id(userBook.getId(), tag.getId())) {
            return;
        }
        UserBookTag link = new UserBookTag();
        link.setUserBook(userBook);
        link.setTag(tag);
        userBookTagRepository.save(link);
    }

    @Transactional
    public void removeTag(Long userBookId, Long tagId) {
        User user = userContextService.requireCurrentUser();
        findUserBookOrThrow(user.getId(), userBookId);
        userBookTagRepository.findByUserBook_IdAndTag_Id(userBookId, tagId)
                .ifPresent(userBookTagRepository::delete);
    }

    private UserBook findUserBookOrThrow(Long userId, Long userBookId) {
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

    private void replaceTags(UserBook userBook, Long userId, List<Long> tagIds) {
        userBook.getTagLinks().clear();
        List<Tag> tags = tagService.resolveTags(userId, tagIds);
        for (Tag tag : tags) {
            UserBookTag link = new UserBookTag();
            link.setUserBook(userBook);
            link.setTag(tag);
            userBook.getTagLinks().add(link);
        }
        userBookRepository.save(userBook);
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

    private Specification<UserBook> byTagId(Long tagId) {
        return (root, query, cb) -> {
            if (tagId == null) {
                return cb.conjunction();
            }
            query.distinct(true);
            Join<UserBook, UserBookTag> tagLinks = root.join("tagLinks", JoinType.INNER);
            return cb.equal(tagLinks.get("tag").get("id"), tagId);
        };
    }

    private Specification<UserBook> byKeyword(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
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
        return new UserBookDetailResponse(
                userBook.getId(),
                userBook.getStatus(),
                userBook.getRating(),
                userBook.isFavoriteFlag(),
                userBook.getPurchaseDate(),
                userBook.getStartDate(),
                userBook.getFinishDate(),
                userBook.getUpdatedAt(),
                toTags(userBook),
                toBookMaster(userBook.getBookMaster()),
                userBook.getMemo(),
                userBook.getLocationNote(),
                userBook.getCreatedAt(),
                userBook.getDeletedAt()
        );
    }

    private BookListItemResponse toListItem(UserBook userBook) {
        return new BookListItemResponse(
                userBook.getId(),
                userBook.getStatus(),
                userBook.getRating(),
                userBook.isFavoriteFlag(),
                userBook.getPurchaseDate(),
                userBook.getStartDate(),
                userBook.getFinishDate(),
                userBook.getUpdatedAt(),
                toTags(userBook),
                toBookMaster(userBook.getBookMaster())
        );
    }

    private BookMasterSummaryResponse toBookMaster(BookMaster bookMaster) {
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

    private List<TagResponse> toTags(UserBook userBook) {
        return userBook.getTagLinks().stream()
                .map(UserBookTag::getTag)
                .sorted(Comparator.comparingInt(Tag::getSortOrder).thenComparing(Tag::getId))
                .map(tag -> new TagResponse(tag.getId(), tag.getName(), tag.getColorHex(), tag.getSortOrder()))
                .toList();
    }
}
