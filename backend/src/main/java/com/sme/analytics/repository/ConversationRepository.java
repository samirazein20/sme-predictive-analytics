package com.sme.analytics.repository;

import com.sme.analytics.model.Conversation;
import com.sme.analytics.model.UploadedFile;
import com.sme.analytics.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Conversation entities
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Find all conversations for a user
     */
    List<Conversation> findByUserOrderByLastMessageAtDesc(User user);

    /**
     * Find all conversations for a user ID
     */
    List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId);

    /**
     * Find conversations by uploaded file
     */
    List<Conversation> findByUploadedFileOrderByCreatedAtDesc(UploadedFile uploadedFile);

    /**
     * Find conversations by uploaded file ID
     */
    List<Conversation> findByUploadedFileIdOrderByCreatedAtDesc(Long uploadedFileId);

    /**
     * Find conversation by user and uploaded file
     */
    Optional<Conversation> findByUserAndUploadedFile(User user, UploadedFile uploadedFile);
}
