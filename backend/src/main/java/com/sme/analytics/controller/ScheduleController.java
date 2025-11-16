package com.sme.analytics.controller;

import com.sme.analytics.dto.ScheduleRequest;
import com.sme.analytics.model.ComparisonSchedule;
import com.sme.analytics.service.ScheduleService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for comparison schedules
 */
@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class ScheduleController {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduleController.class);
    
    private final ScheduleService scheduleService;
    
    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }
    
    /**
     * Get all schedules
     * GET /api/schedules
     */
    @GetMapping
    public ResponseEntity<List<ComparisonSchedule>> getAllSchedules(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        
        logger.info("Fetching schedules (activeOnly={})", activeOnly);
        
        List<ComparisonSchedule> schedules = activeOnly 
            ? scheduleService.getActiveSchedules() 
            : scheduleService.getAllSchedules();
        
        return ResponseEntity.ok(schedules);
    }
    
    /**
     * Get schedule by ID
     * GET /api/schedules/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ComparisonSchedule> getScheduleById(@PathVariable Long id) {
        logger.info("Fetching schedule: {}", id);
        
        return scheduleService.getScheduleById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new schedule
     * POST /api/schedules
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSchedule(@Valid @RequestBody ScheduleRequest request) {
        logger.info("Creating new schedule: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            ComparisonSchedule schedule = new ComparisonSchedule();
            schedule.setName(request.getName());
            schedule.setRecipientEmail(request.getRecipientEmail());
            schedule.setFrequency(request.getFrequency());
            schedule.setActive(request.getActive());
            schedule.setDataSourceConfig(request.getDataSourceConfig());
            schedule.setReportTemplate(request.getReportTemplate());
            
            ComparisonSchedule created = scheduleService.createSchedule(schedule);
            
            response.put("success", true);
            response.put("message", "Schedule created successfully");
            response.put("schedule", created);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            logger.error("Failed to create schedule: {}", e.getMessage(), e);
            
            response.put("success", false);
            response.put("message", "Failed to create schedule: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Update schedule
     * PUT /api/schedules/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleRequest request) {
        
        logger.info("Updating schedule: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            ComparisonSchedule schedule = new ComparisonSchedule();
            schedule.setName(request.getName());
            schedule.setRecipientEmail(request.getRecipientEmail());
            schedule.setFrequency(request.getFrequency());
            schedule.setActive(request.getActive());
            schedule.setDataSourceConfig(request.getDataSourceConfig());
            schedule.setReportTemplate(request.getReportTemplate());
            
            ComparisonSchedule updated = scheduleService.updateSchedule(id, schedule);
            
            response.put("success", true);
            response.put("message", "Schedule updated successfully");
            response.put("schedule", updated);
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            logger.error("Failed to update schedule {}: {}", id, e.getMessage(), e);
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    /**
     * Delete schedule
     * DELETE /api/schedules/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSchedule(@PathVariable Long id) {
        logger.info("Deleting schedule: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            scheduleService.deleteSchedule(id);
            
            response.put("success", true);
            response.put("message", "Schedule deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to delete schedule {}: {}", id, e.getMessage(), e);
            
            response.put("success", false);
            response.put("message", "Failed to delete schedule");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Toggle schedule active status
     * POST /api/schedules/{id}/toggle
     */
    @PostMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggleSchedule(@PathVariable Long id) {
        logger.info("Toggling schedule: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            ComparisonSchedule schedule = scheduleService.toggleSchedule(id);
            
            response.put("success", true);
            response.put("message", schedule.getActive() ? "Schedule activated" : "Schedule paused");
            response.put("schedule", schedule);
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            logger.error("Failed to toggle schedule {}: {}", id, e.getMessage(), e);
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    /**
     * Execute a schedule immediately (for testing)
     * POST /api/schedules/{id}/execute
     */
    @PostMapping("/{id}/execute")
    public ResponseEntity<Map<String, Object>> executeSchedule(@PathVariable Long id) {
        logger.info("Manually executing schedule: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            ComparisonSchedule schedule = scheduleService.getScheduleById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
            
            scheduleService.executeSchedule(schedule);
            
            response.put("success", true);
            response.put("message", "Schedule executed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to execute schedule {}: {}", id, e.getMessage(), e);
            
            response.put("success", false);
            response.put("message", "Failed to execute schedule: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
