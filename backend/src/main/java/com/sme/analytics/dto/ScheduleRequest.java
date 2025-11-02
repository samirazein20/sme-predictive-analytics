package com.sme.analytics.dto;

import com.sme.analytics.model.ComparisonSchedule.ScheduleFrequency;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for creating/updating comparison schedules
 */
public class ScheduleRequest {
    
    @NotBlank(message = "Schedule name is required")
    private String name;
    
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Email must be valid")
    private String recipientEmail;
    
    @NotNull(message = "Frequency is required")
    private ScheduleFrequency frequency;
    
    private String dataSourceConfig;
    
    private String reportTemplate;
    
    private Boolean active = true;
    
    // Constructors
    public ScheduleRequest() {}
    
    public ScheduleRequest(String name, String recipientEmail, ScheduleFrequency frequency) {
        this.name = name;
        this.recipientEmail = recipientEmail;
        this.frequency = frequency;
    }
    
    // Getters and Setters
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
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
    
    @Override
    public String toString() {
        return String.format("ScheduleRequest{name='%s', email='%s', frequency=%s}", 
            name, recipientEmail, frequency);
    }
}
