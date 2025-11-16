package com.sme.analytics.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for email report request
 */
public class EmailReportRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be valid")
    private String email;

    @NotBlank(message = "Report data is required")
    private String reportData;

    @NotNull(message = "Report type is required")
    private String reportType;

    // Constructors
    public EmailReportRequest() {}

    public EmailReportRequest(String email, String reportData, String reportType) {
        this.email = email;
        this.reportData = reportData;
        this.reportType = reportType;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getReportData() {
        return reportData;
    }

    public void setReportData(String reportData) {
        this.reportData = reportData;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    @Override
    public String toString() {
        return String.format("EmailReportRequest{email='%s', reportType='%s'}",
            email, reportType);
    }
}
