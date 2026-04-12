package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.Tag;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByUser_IdOrderBySortOrderAscIdAsc(Long userId);

    Optional<Tag> findByIdAndUser_Id(Long tagId, Long userId);

    boolean existsByUser_IdAndNameIgnoreCase(Long userId, String name);

    List<Tag> findByUser_IdAndIdIn(Long userId, Collection<Long> ids);
}
