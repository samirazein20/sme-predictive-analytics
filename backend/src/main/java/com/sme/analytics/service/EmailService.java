package com.sme.analytics.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for sending email reports
 */
@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.from:noreply@sme-analytics.com}")
    private String fromEmail;
    
    @Value("${app.name:SME Analytics Platform}")
    private String appName;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    /**
     * Send analytics report via email
     * 
     * @param toEmail Recipient email address
     * @param reportData Report data in CSV format
     * @param reportType Type of report (e.g., "Full Analysis", "Trends Only")
     * @throws MessagingException if email sending fails
     */
    public void sendReport(String toEmail, String reportData, String reportType) throws MessagingException {
        logger.info("Preparing to send {} report to {}", reportType, toEmail);
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(String.format("%s - %s Report", appName, reportType));
        
        String htmlContent = buildEmailTemplate(reportType, reportData);
        helper.setText(htmlContent, true);
        
        // Attach CSV file
        String fileName = String.format("sme-analytics-report-%s.csv", 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));
        helper.addAttachment(fileName, () -> new ByteArrayInputStream(reportData.getBytes()), "text/csv");
        
        mailSender.send(message);
        logger.info("Successfully sent report to {}", toEmail);
    }
    
    /**
     * Build HTML email template
     */
    private String buildEmailTemplate(String reportType, String reportData) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' HH:mm"));
        
        // Extract summary statistics from CSV
        String[] lines = reportData.split("\n");
        int metricsCount = 0;
        int predictionsCount = 0;
        int insightsCount = 0;
        int recommendationsCount = 0;
        
        for (String line : lines) {
            if (line.startsWith("TRENDS")) metricsCount++;
            if (line.startsWith("PREDICTIONS")) predictionsCount++;
            if (line.startsWith("INSIGHTS")) insightsCount++;
            if (line.startsWith("RECOMMENDATIONS")) recommendationsCount++;
        }
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background-color: white;
                        border-radius: 8px;
                        padding: 30px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .header {
                        border-bottom: 3px solid #1976d2;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    h1 {
                        color: #1976d2;
                        margin: 0 0 10px 0;
                        font-size: 24px;
                    }
                    .subtitle {
                        color: #666;
                        font-size: 14px;
                    }
                    .summary-card {
                        background-color: #f8f9fa;
                        border-left: 4px solid #1976d2;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .summary-card h3 {
                        margin: 0 0 10px 0;
                        color: #1976d2;
                        font-size: 16px;
                    }
                    .stats {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .stat-box {
                        flex: 1;
                        min-width: 120px;
                        background-color: #e3f2fd;
                        padding: 15px;
                        border-radius: 6px;
                        text-align: center;
                    }
                    .stat-number {
                        font-size: 28px;
                        font-weight: bold;
                        color: #1976d2;
                        margin: 0;
                    }
                    .stat-label {
                        font-size: 12px;
                        color: #666;
                        text-transform: uppercase;
                        margin-top: 5px;
                    }
                    .cta-button {
                        display: inline-block;
                        background-color: #1976d2;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 500;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    }
                    .icon {
                        display: inline-block;
                        margin-right: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 %s</h1>
                        <p class="subtitle">%s Report • Generated on %s</p>
                    </div>
                    
                    <div class="summary-card">
                        <h3>📈 Report Summary</h3>
                        <p>Your analytics report has been generated and is attached to this email as a CSV file.</p>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-box">
                            <div class="stat-number">%d</div>
                            <div class="stat-label">Trends</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">%d</div>
                            <div class="stat-label">Predictions</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">%d</div>
                            <div class="stat-label">Insights</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">%d</div>
                            <div class="stat-label">Recommendations</div>
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <h3>📎 Attachment</h3>
                        <p>The complete report is available in the attached CSV file. You can open it with Excel, Google Sheets, or any spreadsheet application.</p>
                    </div>
                    
                    <div class="footer">
                        <p>
                            <strong>%s</strong><br>
                            Predictive Analytics for Small and Medium Enterprises<br>
                            <br>
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appName,
            reportType,
            timestamp,
            metricsCount,
            predictionsCount,
            insightsCount,
            recommendationsCount,
            appName
        );
    }
}
