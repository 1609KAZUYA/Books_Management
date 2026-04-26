package com.bookmanagement.service.tag;

import com.bookmanagement.common.exception.DuplicateException;
import com.bookmanagement.common.exception.NotFoundException;
import com.bookmanagement.common.exception.ValidationException;
import com.bookmanagement.domain.entity.Tag;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.dto.tag.CreateTagRequest;
import com.bookmanagement.dto.tag.TagListResponse;
import com.bookmanagement.dto.tag.TagResponse;
import com.bookmanagement.dto.tag.UpdateTagRequest;
import com.bookmanagement.repository.TagRepository;
import com.bookmanagement.service.user.UserContextService;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final UserContextService userContextService;

    @Transactional(readOnly = true)
    public TagListResponse listTags() {
        User user = userContextService.requireCurrentUser();
        List<TagResponse> items = tagRepository.findByUser_IdOrderBySortOrderAscIdAsc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
        return new TagListResponse(items);
    }

    @Transactional
    public TagResponse createTag(CreateTagRequest request) {
        User user = userContextService.requireCurrentUser();
        String name = normalizeTagName(request.name());
        if (tagRepository.existsByUser_IdAndNameIgnoreCase(user.getId(), name)) {
            throw new DuplicateException("TAG-409", "Tag name already exists");
        }

        Tag tag = new Tag();
        tag.setUser(user);
        tag.setName(name);
        tag.setColorHex(request.colorHex());
        tag.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public TagResponse updateTag(Long tagId, UpdateTagRequest request) {
        User user = userContextService.requireCurrentUser();
        Tag tag = tagRepository.findByIdAndUser_Id(tagId, user.getId())
                .orElseThrow(() -> new NotFoundException("TAG-404", "Tag not found"));

        if (request.name() != null) {
            String normalizedName = normalizeTagName(request.name());
            boolean duplicated = tagRepository.existsByUser_IdAndNameIgnoreCase(user.getId(), normalizedName)
                    && !normalizedName.equalsIgnoreCase(tag.getName());
            if (duplicated) {
                throw new DuplicateException("TAG-409", "Tag name already exists");
            }
            tag.setName(normalizedName);
        }
        if (request.colorHex() != null) {
            tag.setColorHex(request.colorHex());
        }
        if (request.sortOrder() != null) {
            tag.setSortOrder(request.sortOrder());
        }
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public void deleteTag(Long tagId) {
        User user = userContextService.requireCurrentUser();
        Tag tag = tagRepository.findByIdAndUser_Id(tagId, user.getId())
                .orElseThrow(() -> new NotFoundException("TAG-404", "Tag not found"));
        tagRepository.delete(tag);
    }

    @Transactional(readOnly = true)
    public List<Tag> resolveTags(Long userId, List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return List.of();
        }
        Set<Long> uniqueIds = new LinkedHashSet<>(tagIds);
        List<Tag> tags = tagRepository.findByUser_IdAndIdIn(userId, uniqueIds);
        if (tags.size() != uniqueIds.size()) {
            throw new NotFoundException("TAG-404", "Some tag IDs were not found");
        }
        List<Tag> ordered = new ArrayList<>(tags);
        ordered.sort((a, b) -> {
            int bySort = Integer.compare(a.getSortOrder(), b.getSortOrder());
            return bySort != 0 ? bySort : Long.compare(a.getId(), b.getId());
        });
        return ordered;
    }

    private String normalizeTagName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ValidationException("VALIDATION_ERROR", "Tag name is required");
        }
        return name.trim();
    }

    private TagResponse toResponse(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getColorHex(), tag.getSortOrder());
    }
}
