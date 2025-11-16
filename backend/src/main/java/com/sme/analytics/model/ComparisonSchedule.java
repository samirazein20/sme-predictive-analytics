package com.sme.analytics.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Entity representing a scheduled comparison report
 */
@Entity
@Table(name = "comparison_schedules")
public class ComparisonSchedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Schedule name is required")
    @Column(nullable = false)
    private String name;
    
    @NotBlank(message = "Email recipient is required")
    @Email(message = "Email must be valid")
    @Column(nullable = false)
    private String recipientEmail;
    
    @NotNull(message = "Frequency is required")
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ScheduleFrequency frequency;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime lastRunAt;
    
    @Column
    private LocalDateTime nextRunAt;
    
    @Column(length = 1000)
    private String dataSourceConfig; // JSON config for data sources
    
    @Column
    private String reportTemplate; // Which sections to include
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        calculateNextRun();
    }
    
    public void calculateNextRun() {
        LocalDateTime now = LocalDateTime.now();
        
        switch (frequency) {
            case DAILY:
                nextRunAt = now.plusDays(1).withHour(9).withMinute(0).withSecond(0);
                break;
            case WEEKLY:
                nextRunAt = now.plusWeeks(1).withHour(9).withMinute(0).withSecond(0);
                break;
            case MONTHLY:
                nextRunAt = now.plusMonths(1).withDayOfMonth(1).withHour(9).withMinute(0).withSecond(0);
                break;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getRecipientEmail() {
        return recipientEmail;
    }
    
    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
    
    public ScheduleFrequency getFrequency() {
        return frequency;
    }
    
    public void setFrequency(ScheduleFrequency frequency) {
        this.frequency = frequency;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getLastRunAt() {
        return lastRunAt;
    }
    
    public void setLastRunAt(LocalDateTime lastRunAt) {
        this.lastRunAt = lastRunAt;
    }
    
    public LocalDateTime getNextRunAt() {
        return nextRunAt;
    }
    
    public void setNextRunAt(LocalDateTime nextRunAt) {
        this.nextRunAt = nextRunAt;
    }
    
    public String getDataSourceConfig() {
        return dataSourceConfig;
    }
    
    public void setDataSourceConfig(String dataSourceConfig) {
        this.dataSourceConfig = dataSourceConfig;
    }
    
    public String getReportTemplate() {
        return reportTemplate;
    }
    
    public void setReportTemplate(String reportTemplate) {
        this.reportTemplate = reportTemplate;
    }
    
    public enum ScheduleFrequency {
        DAILY,
        WEEKLY,
        MONTHLY
    }
    
    @Override
    public String toString() {
        return String.format("ComparisonSchedule{id=%d, name='%s', frequency=%s, active=%s}", 
            id, name, frequency, active);
    }
}
