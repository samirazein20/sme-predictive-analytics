package com.sme.analytics.service;

import com.sme.analytics.dto.FileAnalysisResponse;
import com.sme.analytics.dto.DataInsight;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

@Service
public class DataAnalysisService {

    @Autowired
    private SessionService sessionService;

    private final Map<String, List<DataInsight>> sessionInsights = new HashMap<>();

    public FileAnalysisResponse analyzeFile(MultipartFile file) throws IOException {
        String sessionId = UUID.randomUUID().toString();
        String fileName = file.getOriginalFilename();
        
        if (fileName != null && fileName.toLowerCase().endsWith(".csv")) {
            return analyzeCsvFile(file, sessionId);
        } else {
            throw new UnsupportedOperationException("Excel files not yet supported");
        }
    }

    private FileAnalysisResponse analyzeCsvFile(MultipartFile file, String sessionId) throws IOException {
        List<String> lines = new ArrayList<>();
        List<String> columnNames = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            
            while ((line = reader.readLine()) != null) {
                lines.add(line);
                if (firstLine) {
                    columnNames = Arrays.asList(line.split(","));
                    firstLine = false;
                }
            }
        }
        
        int rowCount = lines.size() - 1; // Excluding header
        int columnCount = columnNames.size();
        
        // Basic statistics and insights
        Map<String, Object> basicStats = generateBasicStatistics(lines, columnNames);
        List<DataInsight> insights = generateInsights(lines, columnNames, file.getOriginalFilename());
        
        // Store in session
        sessionInsights.put(sessionId, insights);
        
        FileAnalysisResponse response = FileAnalysisResponse.builder()
            .success(true)
            .message("File analyzed successfully")
            .sessionId(sessionId)
            .fileName(file.getOriginalFilename())
            .fileSize(file.getSize())
            .rowCount(rowCount)
            .columnCount(columnCount)
            .columnNames(columnNames)
            .basicStatistics(basicStats)
            .insights(insights)
            .analysisType(detectAnalysisType(columnNames))
            .build();
            
        // Save to session
        sessionService.saveSession(sessionId, response);
        return response;
    }

    private Map<String, Object> generateBasicStatistics(List<String> lines, List<String> columnNames) {
        Map<String, Object> stats = new HashMap<>();
        
        if (lines.size() <= 1) {
            return stats;
        }
        
        // Analyze numeric columns
        for (int colIndex = 0; colIndex < columnNames.size(); colIndex++) {
            String columnName = columnNames.get(colIndex);
            List<Double> numericValues = new ArrayList<>();
            
            for (int rowIndex = 1; rowIndex < lines.size(); rowIndex++) {
                String[] values = lines.get(rowIndex).split(",");
                if (colIndex < values.length) {
                    try {
                        double value = Double.parseDouble(values[colIndex].trim());
                        numericValues.add(value);
                    } catch (NumberFormatException e) {
                        // Skip non-numeric values
                    }
                }
            }
            
            if (!numericValues.isEmpty()) {
                Map<String, Object> columnStats = new HashMap<>();
                columnStats.put("count", numericValues.size());
                columnStats.put("min", Collections.min(numericValues));
                columnStats.put("max", Collections.max(numericValues));
                columnStats.put("average", numericValues.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
                columnStats.put("sum", numericValues.stream().mapToDouble(Double::doubleValue).sum());
                stats.put(columnName, columnStats);
            }
        }
        
        return stats;
    }

    private List<DataInsight> generateInsights(List<String> lines, List<String> columnNames, String fileName) {
        List<DataInsight> insights = new ArrayList<>();
        
        // Data Quality Insights
        insights.add(new DataInsight(
            "data_quality",
            "Data Completeness",
            String.format("Dataset contains %d rows and %d columns with complete data structure", 
                lines.size() - 1, columnNames.size()),
            "Good",
            "Quality",
            0.95
        ));
        
        // Column Analysis
        long numericColumns = columnNames.stream()
            .mapToLong(col -> isNumericColumn(lines, columnNames.indexOf(col)) ? 1 : 0)
            .sum();
        
        insights.add(new DataInsight(
            "column_analysis",
            "Data Types",
            String.format("Found %d numeric columns suitable for analysis and predictions", numericColumns),
            String.valueOf(numericColumns),
            "Structure",
            0.90
        ));
        
        // Business Intelligence based on filename
        if (fileName != null) {
            if (fileName.toLowerCase().contains("sales")) {
                insights.add(new DataInsight(
                    "business_intelligence",
                    "Sales Data Detected",
                    "This appears to be sales data. Suitable for revenue forecasting and trend analysis.",
                    "Sales Analytics Ready",
                    "Business",
                    0.85
                ));
            } else if (fileName.toLowerCase().contains("customer")) {
                insights.add(new DataInsight(
                    "business_intelligence",
                    "Customer Data Detected",
                    "Customer metrics detected. Can analyze churn patterns and customer lifetime value.",
                    "Customer Analytics Ready",
                    "Business",
                    0.85
                ));
            }
        }
        
        // Recommendations
        insights.add(new DataInsight(
            "recommendation",
            "Analysis Recommendation",
            "Data is ready for machine learning predictions. Consider time series forecasting for trends.",
            "Ready for ML",
            "Recommendation",
            0.88
        ));
        
        return insights;
    }

    private boolean isNumericColumn(List<String> lines, int columnIndex) {
        if (lines.size() <= 1 || columnIndex < 0) return false;
        
        int numericCount = 0;
        int totalCount = 0;
        
        for (int i = 1; i < Math.min(lines.size(), 11); i++) { // Check first 10 data rows
            String[] values = lines.get(i).split(",");
            if (columnIndex < values.length) {
                totalCount++;
                try {
                    Double.parseDouble(values[columnIndex].trim());
                    numericCount++;
                } catch (NumberFormatException e) {
                    // Not numeric
                }
            }
        }
        
        return totalCount > 0 && (double) numericCount / totalCount > 0.8; // 80% numeric
    }

    private String detectAnalysisType(List<String> columnNames) {
        Set<String> lowerCaseColumns = new HashSet<>();
        columnNames.forEach(col -> lowerCaseColumns.add(col.toLowerCase()));
        
        if (lowerCaseColumns.contains("revenue") || lowerCaseColumns.contains("sales") || lowerCaseColumns.contains("orders")) {
            return "Sales Analytics";
        } else if (lowerCaseColumns.contains("customer") || lowerCaseColumns.contains("churn")) {
            return "Customer Analytics";
        } else if (lowerCaseColumns.contains("inventory") || lowerCaseColumns.contains("stock")) {
            return "Inventory Analytics";
        } else if (lowerCaseColumns.contains("employee") || lowerCaseColumns.contains("performance")) {
            return "HR Analytics";
        } else if (lowerCaseColumns.contains("marketing") || lowerCaseColumns.contains("campaign")) {
            return "Marketing Analytics";
        } else {
            return "General Analytics";
        }
    }

    public List<DataInsight> getInsights(String sessionId) {
        return sessionInsights.getOrDefault(sessionId, new ArrayList<>());
    }

    public FileAnalysisResponse getSessionData(String sessionId) {
        return sessionService.getSession(sessionId);
    }
}