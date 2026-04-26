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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tags")
public class TagController {

    private final TagService tagService;

    @GetMapping
    public TagListResponse listTags() {
        return tagService.listTags();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(@Valid @RequestBody CreateTagRequest request) {
        return tagService.createTag(request);
    }

    @PatchMapping("/{tagId}")
    public TagResponse updateTag(
            @PathVariable Long tagId,
            @Valid @RequestBody UpdateTagRequest request
    ) {
        return tagService.updateTag(tagId, request);
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long tagId) {
        tagService.deleteTag(tagId);
        return ResponseEntity.noContent().build();
    }
}
