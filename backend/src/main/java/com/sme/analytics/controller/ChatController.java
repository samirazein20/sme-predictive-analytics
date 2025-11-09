package com.sme.analytics.controller;

import com.sme.analytics.dto.ConversationDTO;
import com.sme.analytics.dto.CreateConversationRequest;
import com.sme.analytics.dto.MessageDTO;
import com.sme.analytics.dto.SendMessageRequest;
import com.sme.analytics.model.Conversation;
import com.sme.analytics.model.Message;
import com.sme.analytics.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for chat functionality
 */
@RestController
@RequestMapping("/api/v1/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Create a new conversation
     */
    @PostMapping("/conversations")
    public ResponseEntity<Map<String, Object>> createConversation(
        @Valid @RequestBody CreateConversationRequest request
    ) {
        try {
            Conversation conversation = chatService.createConversation(
                request.getUserId(),
                request.getUploadedFileId(),
                request.getTitle()
            );

            ConversationDTO dto = convertToConversationDTO(conversation);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("conversation", dto);
            response.put("message", "Conversation created successfully");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Error creating conversation", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * Get all conversations for a user
     */
    @GetMapping("/conversations/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserConversations(
        @PathVariable Long userId
    ) {
        try {
            List<Conversation> conversations = chatService.getUserConversations(userId);
            List<ConversationDTO> dtos = conversations.stream()
                .map(this::convertToConversationDTO)
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("conversations", dtos);
            response.put("count", dtos.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting user conversations", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get a specific conversation
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(
        @PathVariable Long conversationId
    ) {
        try {
            Conversation conversation = chatService.getConversation(conversationId);
            ConversationDTO dto = convertToConversationDTO(conversation);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("conversation", dto);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Error getting conversation", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Get all messages in a conversation
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> getConversationMessages(
        @PathVariable Long conversationId
    ) {
        try {
            List<Message> messages = chatService.getConversationMessages(conversationId);
            List<MessageDTO> dtos = messages.stream()
                .map(this::convertToMessageDTO)
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("messages", dtos);
            response.put("count", dtos.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting conversation messages", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Send a message and get AI response
     */
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
        @PathVariable Long conversationId,
        @Valid @RequestBody SendMessageRequest request
    ) {
        try {
            Map<String, Object> result = chatService.sendMessage(
                conversationId,
                request.getMessage()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("userMessage", result.get("userMessage"));
            response.put("aiMessage", result.get("aiMessage"));
            response.put("suggestions", result.get("suggestions"));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Error sending message", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Delete a conversation
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> deleteConversation(
        @PathVariable Long conversationId
    ) {
        try {
            chatService.deleteConversation(conversationId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Conversation deleted successfully");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Error deleting conversation", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Convert Conversation entity to DTO
     */
    private ConversationDTO convertToConversationDTO(Conversation conversation) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setUserId(conversation.getUser().getId());
        dto.setUploadedFileId(conversation.getUploadedFile().getId());
        dto.setTitle(conversation.getTitle());
        dto.setFileName(conversation.getUploadedFile().getFileName());
        dto.setLastMessageAt(conversation.getLastMessageAt());
        dto.setCreatedAt(conversation.getCreatedAt());
        // You can add message count if needed
        return dto;
    }

    /**
     * Convert Message entity to DTO
     */
    private MessageDTO convertToMessageDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderType(message.getSenderType());
        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());

        // Parse metadata if available
        if (message.getMetadata() != null) {
            try {
                Map<String, Object> metadata = objectMapper.readValue(
                    message.getMetadata(),
                    new TypeReference<Map<String, Object>>() {}
                );
                dto.setMetadata(metadata);
            } catch (Exception e) {
                logger.error("Error parsing metadata", e);
            }
        }

        return dto;
    }
}
