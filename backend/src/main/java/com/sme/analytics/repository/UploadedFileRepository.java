package com.sme.analytics.repository;

import com.sme.analytics.model.UploadedFile;
import com.sme.analytics.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for UploadedFile entities
 */
@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    /**
     * Find uploaded file by session ID
     */
    Optional<UploadedFile> findBySessionId(String sessionId);

    /**
     * Find all files uploaded by a user
     */
    List<UploadedFile> findByUserOrderByUploadedAtDesc(User user);

    /**
     * Find all files uploaded by a user ID
     */
    List<UploadedFile> findByUserIdOrderByUploadedAtDesc(Long userId);

    /**
     * Find files by user and analysis type
     */
    List<UploadedFile> findByUserAndAnalysisTypeOrderByUploadedAtDesc(User user, String analysisType);

    /**
     * Check if session ID exists
     */
    boolean existsBySessionId(String sessionId);
}
