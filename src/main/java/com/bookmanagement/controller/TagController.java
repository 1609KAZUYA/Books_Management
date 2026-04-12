package com.bookmanagement.controller;

import com.bookmanagement.dto.tag.CreateTagRequest;
import com.bookmanagement.dto.tag.TagListResponse;
import com.bookmanagement.dto.tag.TagResponse;
import com.bookmanagement.dto.tag.UpdateTagRequest;
import com.bookmanagement.service.tag.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tags")
public class TagController {

    private final TagService tagService;

    @GetMapping
    public TagListResponse listTags(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return tagService.listTags(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody CreateTagRequest request
    ) {
        return tagService.createTag(userId, request);
    }

    @PatchMapping("/{tagId}")
    public TagResponse updateTag(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long tagId,
            @Valid @RequestBody UpdateTagRequest request
    ) {
        return tagService.updateTag(userId, tagId, request);
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long tagId
    ) {
        tagService.deleteTag(userId, tagId);
        return ResponseEntity.noContent().build();
    }
}
