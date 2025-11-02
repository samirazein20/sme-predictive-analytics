package com.sme.analytics.controller;

import com.sme.analytics.dto.EmailReportRequest;
import com.sme.analytics.service.EmailService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for report operations
 */
@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
    
    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);
    
    private final EmailService emailService;
    
    public ReportController(EmailService emailService) {
        this.emailService = emailService;
    }
    
    /**
     * Send analytics report via email
     * 
     * POST /api/reports/email
     * 
     * Request Body:
     * {
     *   "email": "user@example.com",
     *   "reportData": "CSV content...",
     *   "reportType": "Full Analysis"
     * }
     * 
     * @param request Email report request
     * @return Response with success/failure status
     */
    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> sendReportEmail(@Valid @RequestBody EmailReportRequest request) {
        logger.info("Received request to email report to: {}", request.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            emailService.sendReport(
                request.getEmail(), 
                request.getReportData(), 
                request.getReportType()
            );
            
            response.put("success", true);
            response.put("message", "Report successfully sent to " + request.getEmail());
            
            logger.info("Successfully sent report to {}", request.getEmail());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to send report to {}: {}", request.getEmail(), e.getMessage(), e);
            
            response.put("success", false);
            response.put("message", "Failed to send email: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "ReportController");
        return ResponseEntity.ok(response);
    }
}
