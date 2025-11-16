package com.sme.analytics.dto;

import java.util.List;
import java.util.Map;

public class FileAnalysisResponse {
    private boolean success;
    private String message;
    private String sessionId;
    private String fileName;
    private long fileSize;
    private int rowCount;
    private int columnCount;
    private List<String> columnNames;
    private Map<String, Object> basicStatistics;
    private List<DataInsight> insights;
    private String analysisType;
    private Long conversationId;
    private Long uploadedFileId;

    public FileAnalysisResponse() {}
    
    public static FileAnalysisResponseBuilder builder() {
        return new FileAnalysisResponseBuilder();
    }
    
    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    
    public int getRowCount() { return rowCount; }
    public void setRowCount(int rowCount) { this.rowCount = rowCount; }
    
    public int getColumnCount() { return columnCount; }
    public void setColumnCount(int columnCount) { this.columnCount = columnCount; }
    
    public List<String> getColumnNames() { return columnNames; }
    public void setColumnNames(List<String> columnNames) { this.columnNames = columnNames; }
    
    public Map<String, Object> getBasicStatistics() { return basicStatistics; }
    public void setBasicStatistics(Map<String, Object> basicStatistics) { this.basicStatistics = basicStatistics; }
    
    public List<DataInsight> getInsights() { return insights; }
    public void setInsights(List<DataInsight> insights) { this.insights = insights; }
    
    public String getAnalysisType() { return analysisType; }
    public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public Long getUploadedFileId() { return uploadedFileId; }
    public void setUploadedFileId(Long uploadedFileId) { this.uploadedFileId = uploadedFileId; }

    // Builder class
    public static class FileAnalysisResponseBuilder {
        private final FileAnalysisResponse response = new FileAnalysisResponse();
        
        public FileAnalysisResponseBuilder success(boolean success) {
            response.setSuccess(success);
            return this;
        }
        
        public FileAnalysisResponseBuilder message(String message) {
            response.setMessage(message);
            return this;
        }
        
        public FileAnalysisResponseBuilder sessionId(String sessionId) {
            response.setSessionId(sessionId);
            return this;
        }
        
        public FileAnalysisResponseBuilder fileName(String fileName) {
            response.setFileName(fileName);
            return this;
        }
        
        public FileAnalysisResponseBuilder fileSize(long fileSize) {
            response.setFileSize(fileSize);
            return this;
        }
        
        public FileAnalysisResponseBuilder rowCount(int rowCount) {
            response.setRowCount(rowCount);
            return this;
        }
        
        public FileAnalysisResponseBuilder columnCount(int columnCount) {
            response.setColumnCount(columnCount);
            return this;
        }
        
        public FileAnalysisResponseBuilder columnNames(List<String> columnNames) {
            response.setColumnNames(columnNames);
            return this;
        }
        
        public FileAnalysisResponseBuilder basicStatistics(Map<String, Object> basicStatistics) {
            response.setBasicStatistics(basicStatistics);
            return this;
        }
        
        public FileAnalysisResponseBuilder insights(List<DataInsight> insights) {
            response.setInsights(insights);
            return this;
        }
        
        public FileAnalysisResponseBuilder analysisType(String analysisType) {
            response.setAnalysisType(analysisType);
            return this;
        }

        public FileAnalysisResponseBuilder conversationId(Long conversationId) {
            response.setConversationId(conversationId);
            return this;
        }

        public FileAnalysisResponseBuilder uploadedFileId(Long uploadedFileId) {
            response.setUploadedFileId(uploadedFileId);
            return this;
        }

        public FileAnalysisResponse build() {
            return response;
        }
    }
}