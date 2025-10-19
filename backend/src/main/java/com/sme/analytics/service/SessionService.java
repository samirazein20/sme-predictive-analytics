package com.sme.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sme.analytics.dto.FileAnalysisResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {
    
    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);
    
    // In-memory storage for sessions (will be replaced with Redis later)
    private final Map<String, FileAnalysisResponse> sessionStore = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Store file analysis response in session
     */
    public void saveSession(String sessionId, FileAnalysisResponse response) {
        logger.info("Saving session: {}", sessionId);
        sessionStore.put(sessionId, response);
    }
    
    /**
     * Retrieve file analysis response from session
     */
    public FileAnalysisResponse getSession(String sessionId) {
        logger.info("Retrieving session: {}", sessionId);
        return sessionStore.get(sessionId);
    }
    
    /**
     * Check if session exists
     */
    public boolean sessionExists(String sessionId) {
        return sessionStore.containsKey(sessionId);
    }
    
    /**
     * Delete session
     */
    public void deleteSession(String sessionId) {
        logger.info("Deleting session: {}", sessionId);
        sessionStore.remove(sessionId);
    }
    
    /**
     * Get all sessions for a user (placeholder for future user authentication)
     */
    public Map<String, FileAnalysisResponse> getAllSessions() {
        return new ConcurrentHashMap<>(sessionStore);
    }
}
