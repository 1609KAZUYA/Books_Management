package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.UserBookTag;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBookTagRepository extends JpaRepository<UserBookTag, Long> {

    boolean existsByUserBook_IdAndTag_Id(Long userBookId, Long tagId);

    Optional<UserBookTag> findByUserBook_IdAndTag_Id(Long userBookId, Long tagId);
}
