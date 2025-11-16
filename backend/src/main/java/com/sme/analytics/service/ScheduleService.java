package com.sme.analytics.service;

import com.sme.analytics.model.ComparisonSchedule;
import com.sme.analytics.repository.ComparisonScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing and executing comparison schedules
 */
@Service
public class ScheduleService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduleService.class);
    
    private final ComparisonScheduleRepository scheduleRepository;
    private final EmailService emailService;
    
    public ScheduleService(ComparisonScheduleRepository scheduleRepository, EmailService emailService) {
        this.scheduleRepository = scheduleRepository;
        this.emailService = emailService;
    }
    
    /**
     * Create a new schedule
     */
    @Transactional
    public ComparisonSchedule createSchedule(ComparisonSchedule schedule) {
        logger.info("Creating new schedule: {}", schedule);
        return scheduleRepository.save(schedule);
    }
    
    /**
     * Get all schedules
     */
    public List<ComparisonSchedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }
    
    /**
     * Get active schedules
     */
    public List<ComparisonSchedule> getActiveSchedules() {
        return scheduleRepository.findByActiveTrue();
    }
    
    /**
     * Get schedule by ID
     */
    public Optional<ComparisonSchedule> getScheduleById(Long id) {
        return scheduleRepository.findById(id);
    }
    
    /**
     * Update schedule
     */
    @Transactional
    public ComparisonSchedule updateSchedule(Long id, ComparisonSchedule updatedSchedule) {
        return scheduleRepository.findById(id)
            .map(schedule -> {
                schedule.setName(updatedSchedule.getName());
                schedule.setRecipientEmail(updatedSchedule.getRecipientEmail());
                schedule.setFrequency(updatedSchedule.getFrequency());
                schedule.setActive(updatedSchedule.getActive());
                schedule.setDataSourceConfig(updatedSchedule.getDataSourceConfig());
                schedule.setReportTemplate(updatedSchedule.getReportTemplate());
                schedule.calculateNextRun();
                return scheduleRepository.save(schedule);
            })
            .orElseThrow(() -> new RuntimeException("Schedule not found: " + id));
    }
    
    /**
     * Delete schedule
     */
    @Transactional
    public void deleteSchedule(Long id) {
        logger.info("Deleting schedule: {}", id);
        scheduleRepository.deleteById(id);
    }
    
    /**
     * Toggle schedule active status
     */
    @Transactional
    public ComparisonSchedule toggleSchedule(Long id) {
        return scheduleRepository.findById(id)
            .map(schedule -> {
                schedule.setActive(!schedule.getActive());
                if (schedule.getActive()) {
                    schedule.calculateNextRun();
                }
                return scheduleRepository.save(schedule);
            })
            .orElseThrow(() -> new RuntimeException("Schedule not found: " + id));
    }
    
    /**
     * Execute due schedules (runs every hour)
     * Cron: 0 0 * * * * = At the start of every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void executeDueSchedules() {
        logger.info("Checking for due schedules...");
        
        LocalDateTime now = LocalDateTime.now();
        List<ComparisonSchedule> dueSchedules = scheduleRepository.findDueSchedules(now);
        
        if (dueSchedules.isEmpty()) {
            logger.debug("No schedules due at {}", now);
            return;
        }
        
        logger.info("Found {} due schedule(s)", dueSchedules.size());
        
        for (ComparisonSchedule schedule : dueSchedules) {
            try {
                executeSchedule(schedule);
            } catch (Exception e) {
                logger.error("Failed to execute schedule {}: {}", schedule.getId(), e.getMessage(), e);
            }
        }
    }
    
    /**
     * Execute a single schedule
     */
    @Transactional
    public void executeSchedule(ComparisonSchedule schedule) {
        logger.info("Executing schedule: {} ({})", schedule.getName(), schedule.getId());
        
        try {
            // Generate sample report data (in production, this would analyze actual data)
            String reportData = generateComparisonReport(schedule);
            
            // Send email with report
            String reportType = String.format("%s Comparison", schedule.getFrequency());
            emailService.sendReport(schedule.getRecipientEmail(), reportData, reportType);
            
            // Update schedule
            schedule.setLastRunAt(LocalDateTime.now());
            schedule.calculateNextRun();
            scheduleRepository.save(schedule);
            
            logger.info("Successfully executed schedule: {}", schedule.getId());
            
        } catch (Exception e) {
            logger.error("Failed to execute schedule {}: {}", schedule.getId(), e.getMessage(), e);
            throw new RuntimeException("Schedule execution failed", e);
        }
    }
    
    /**
     * Generate comparison report (placeholder - would integrate with DataAnalysisService)
     */
    private String generateComparisonReport(ComparisonSchedule schedule) {
        StringBuilder csv = new StringBuilder();
        csv.append("Scheduled Comparison Report\n\n");
        csv.append("Schedule: ").append(schedule.getName()).append("\n");
        csv.append("Frequency: ").append(schedule.getFrequency()).append("\n");
        csv.append("Generated: ").append(LocalDateTime.now()).append("\n\n");
        
        csv.append("COMPARISON SUMMARY\n");
        csv.append("Period A,Period B,Change\n");
        csv.append("Current Period,Previous Period,+12.5%\n\n");
        
        csv.append("KEY METRICS\n");
        csv.append("Metric,Current,Previous,Delta\n");
        csv.append("Revenue,$45000,$40000,+12.5%\n");
        csv.append("Customers,850,780,+9.0%\n");
        csv.append("Avg Order,$52.94,$51.28,+3.2%\n\n");
        
        csv.append("INSIGHTS\n");
        csv.append("• Revenue trending upward\n");
        csv.append("• Customer acquisition improving\n");
        csv.append("• Order value showing steady growth\n\n");
        
        csv.append("Note: This is an automated report. Log in to view full details.\n");
        
        return csv.toString();
    }
}
