package com.sme.analytics.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a new conversation
 */
public class CreateConversationRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Uploaded file ID is required")
    private Long uploadedFileId;

    private String title;

    public CreateConversationRequest() {}

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUploadedFileId() {
        return uploadedFileId;
    }

    public void setUploadedFileId(Long uploadedFileId) {
        this.uploadedFileId = uploadedFileId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
