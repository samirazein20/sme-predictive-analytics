package com.sme.analytics.repository;

import com.sme.analytics.model.Conversation;
import com.sme.analytics.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Message entities
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Find all messages in a conversation ordered by creation time
     */
    List<Message> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    /**
     * Find all messages in a conversation by conversation ID
     */
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    /**
     * Find messages by sender type in a conversation
     */
    List<Message> findByConversationAndSenderTypeOrderByCreatedAtAsc(Conversation conversation, String senderType);

    /**
     * Count messages in a conversation
     */
    long countByConversation(Conversation conversation);

    /**
     * Count messages in a conversation by ID
     */
    long countByConversationId(Long conversationId);
}
