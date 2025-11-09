package com.sme.analytics.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for sending a message in a conversation
 */
public class SendMessageRequest {

    @NotBlank(message = "Message content is required")
    private String message;

    public SendMessageRequest() {}

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
