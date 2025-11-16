package com.sme.analytics.dto;

import java.time.LocalDateTime;

/**
 * DTO for Conversation entity
 */
public class ConversationDTO {

    private Long id;
    private Long userId;
    private Long uploadedFileId;
    private String title;
    private String fileName;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private int messageCount;

    public ConversationDTO() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(int messageCount) {
        this.messageCount = messageCount;
    }
}
