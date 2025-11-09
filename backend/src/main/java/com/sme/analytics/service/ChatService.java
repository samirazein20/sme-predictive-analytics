package com.sme.analytics.service;

import com.sme.analytics.model.Conversation;
import com.sme.analytics.model.Message;
import com.sme.analytics.model.UploadedFile;
import com.sme.analytics.model.User;
import com.sme.analytics.repository.ConversationRepository;
import com.sme.analytics.repository.MessageRepository;
import com.sme.analytics.repository.UploadedFileRepository;
import com.sme.analytics.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for handling chat conversations about uploaded documents
 */
@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UploadedFileRepository uploadedFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ml.service.url:http://localhost:8001}")
    private String mlServiceUrl;

    /**
     * Create a new conversation for a user and uploaded file
     */
    @Transactional
    public Conversation createConversation(Long userId, Long uploadedFileId, String title) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UploadedFile uploadedFile = uploadedFileRepository.findById(uploadedFileId)
            .orElseThrow(() -> new RuntimeException("Uploaded file not found with id: " + uploadedFileId));

        // Check if conversation already exists
        Optional<Conversation> existing = conversationRepository.findByUserAndUploadedFile(user, uploadedFile);
        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation conversation = new Conversation();
        conversation.setUser(user);
        conversation.setUploadedFile(uploadedFile);
        conversation.setTitle(title != null ? title : "Chat about " + uploadedFile.getFileName());

        return conversationRepository.save(conversation);
    }

    /**
     * Get all conversations for a user
     */
    public List<Conversation> getUserConversations(Long userId) {
        return conversationRepository.findByUserIdOrderByLastMessageAtDesc(userId);
    }

    /**
     * Get a conversation by ID
     */
    public Conversation getConversation(Long conversationId) {
        return conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found with id: " + conversationId));
    }

    /**
     * Get all messages in a conversation
     */
    public List<Message> getConversationMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    /**
     * Send a message and get AI response
     */
    @Transactional
    public Map<String, Object> sendMessage(Long conversationId, String userMessage) {
        Conversation conversation = getConversation(conversationId);

        // Save user message
        Message userMsg = new Message();
        userMsg.setConversation(conversation);
        userMsg.setSenderType("USER");
        userMsg.setContent(userMessage);
        userMsg = messageRepository.save(userMsg);

        // Get conversation history
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Get AI response from ML service
        String aiResponse;
        Map<String, Object> metadata = new HashMap<>();

        try {
            Map<String, Object> mlResponse = callMlServiceForAnswer(
                userMessage,
                conversation.getUploadedFile(),
                history
            );

            aiResponse = (String) mlResponse.get("answer");
            metadata.put("confidence", mlResponse.get("confidence"));
            metadata.put("referenced_data", mlResponse.get("referenced_data"));
            metadata.put("suggestions", mlResponse.get("suggestions"));

        } catch (Exception e) {
            logger.error("Error calling ML service for chat response", e);
            aiResponse = "I apologize, but I'm having trouble processing your question right now. Please try again later.";
            metadata.put("error", e.getMessage());
        }

        // Save AI response
        Message aiMsg = new Message();
        aiMsg.setConversation(conversation);
        aiMsg.setSenderType("AI");
        aiMsg.setContent(aiResponse);
        try {
            aiMsg.setMetadata(objectMapper.writeValueAsString(metadata));
        } catch (Exception e) {
            logger.error("Error serializing metadata", e);
        }
        aiMsg = messageRepository.save(aiMsg);

        // Update conversation last message time
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("userMessage", convertMessageToMap(userMsg));
        response.put("aiMessage", convertMessageToMap(aiMsg));
        response.put("suggestions", metadata.get("suggestions"));

        return response;
    }

    /**
     * Call ML service to get an answer to the user's question
     */
    private Map<String, Object> callMlServiceForAnswer(
        String question,
        UploadedFile uploadedFile,
        List<Message> conversationHistory
    ) {
        try {
            // Build document context
            Map<String, Object> documentContext = buildDocumentContext(uploadedFile);

            // Build conversation history
            List<Map<String, String>> historyMaps = conversationHistory.stream()
                .map(msg -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("sender_type", msg.getSenderType());
                    map.put("content", msg.getContent());
                    return map;
                })
                .collect(Collectors.toList());

            // Build request
            Map<String, Object> request = new HashMap<>();
            request.put("question", question);
            request.put("document_context", documentContext);
            request.put("conversation_history", historyMaps);

            // Call ML service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                mlServiceUrl + "/api/chat/ask",
                HttpMethod.POST,
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("ML service returned non-OK status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Error calling ML service", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("answer", "I'm sorry, I'm having trouble answering that question right now.");
            fallback.put("confidence", "low");
            fallback.put("referenced_data", new HashMap<>());
            fallback.put("suggestions", new ArrayList<>());
            return fallback;
        }
    }

    /**
     * Build document context from uploaded file
     */
    private Map<String, Object> buildDocumentContext(UploadedFile uploadedFile) {
        Map<String, Object> context = new HashMap<>();
        context.put("file_name", uploadedFile.getFileName());
        context.put("session_id", uploadedFile.getSessionId());
        context.put("row_count", uploadedFile.getRowCount());
        context.put("column_count", uploadedFile.getColumnCount());
        context.put("analysis_type", uploadedFile.getAnalysisType());

        // Parse JSON fields if available
        try {
            if (uploadedFile.getInsights() != null) {
                List<Object> insights = objectMapper.readValue(
                    uploadedFile.getInsights(),
                    new TypeReference<List<Object>>() {}
                );
                context.put("insights", insights);
            }

            if (uploadedFile.getStatistics() != null) {
                Map<String, Object> stats = objectMapper.readValue(
                    uploadedFile.getStatistics(),
                    new TypeReference<Map<String, Object>>() {}
                );
                context.put("statistics", stats);
            }
        } catch (Exception e) {
            logger.error("Error parsing JSON fields", e);
        }

        return context;
    }

    /**
     * Convert Message entity to Map for response
     */
    private Map<String, Object> convertMessageToMap(Message message) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", message.getId());
        map.put("senderType", message.getSenderType());
        map.put("content", message.getContent());
        map.put("createdAt", message.getCreatedAt().toString());

        // Parse metadata if available
        if (message.getMetadata() != null) {
            try {
                Map<String, Object> metadata = objectMapper.readValue(
                    message.getMetadata(),
                    new TypeReference<Map<String, Object>>() {}
                );
                map.put("metadata", metadata);
            } catch (Exception e) {
                logger.error("Error parsing metadata", e);
            }
        }

        return map;
    }

    /**
     * Delete a conversation and all its messages
     */
    @Transactional
    public void deleteConversation(Long conversationId) {
        Conversation conversation = getConversation(conversationId);
        conversationRepository.delete(conversation);
    }
}
