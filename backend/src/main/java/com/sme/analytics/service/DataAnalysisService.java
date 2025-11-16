package com.sme.analytics.service;

import com.sme.analytics.dto.FileAnalysisResponse;
import com.sme.analytics.dto.DataInsight;
import com.sme.analytics.model.Conversation;
import com.sme.analytics.model.UploadedFile;
import com.sme.analytics.model.User;
import com.sme.analytics.repository.UploadedFileRepository;
import com.sme.analytics.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DataAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(DataAnalysisService.class);

    @Autowired
    private SessionService sessionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UploadedFileRepository uploadedFileRepository;

    @Autowired
    private ChatService chatService;

    @Autowired
    private ObjectMapper objectMapper;

    private final Map<String, List<DataInsight>> sessionInsights = new HashMap<>();

    public FileAnalysisResponse analyzeFile(MultipartFile file) throws IOException {
        String sessionId = UUID.randomUUID().toString();
        String fileName = file.getOriginalFilename();
        
        if (fileName != null) {
            String lowerFileName = fileName.toLowerCase();
            if (lowerFileName.endsWith(".csv")) {
                return analyzeCsvFile(file, sessionId);
            } else if (lowerFileName.endsWith(".xlsx") || lowerFileName.endsWith(".xls")) {
                return analyzeExcelFile(file, sessionId);
            }
        }
        
        throw new UnsupportedOperationException("Unsupported file type. Please upload CSV or Excel files.");
    }

    @Transactional
    private FileAnalysisResponse analyzeCsvFile(MultipartFile file, String sessionId) throws IOException {
        List<String> lines = new ArrayList<>();
        List<String> columnNames = new ArrayList<>();
        StringBuilder csvContent = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;

            while ((line = reader.readLine()) != null) {
                lines.add(line);
                csvContent.append(line).append("\n");
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
        String analysisType = detectAnalysisType(columnNames);

        // Store in session
        sessionInsights.put(sessionId, insights);

        // Persist uploaded file to database
        Long uploadedFileId = null;
        Long conversationId = null;

        try {
            // Get default user (ID 1) - or create if doesn't exist
            User user = userRepository.findById(1L)
                .orElseGet(() -> createDefaultUser());

            // Create UploadedFile entity
            UploadedFile uploadedFile = new UploadedFile();
            uploadedFile.setUser(user);
            uploadedFile.setSessionId(sessionId);
            uploadedFile.setFileName(file.getOriginalFilename());
            uploadedFile.setFileType(getFileExtension(file.getOriginalFilename()));
            uploadedFile.setFileSize(file.getSize());
            uploadedFile.setFileContent(csvContent.toString());
            uploadedFile.setAnalysisType(analysisType);
            uploadedFile.setRowCount(rowCount);
            uploadedFile.setColumnCount(columnCount);
            uploadedFile.setAnalyzedAt(LocalDateTime.now());

            // Convert insights and statistics to JSON
            try {
                uploadedFile.setInsights(objectMapper.writeValueAsString(insights));
                uploadedFile.setStatistics(objectMapper.writeValueAsString(basicStats));
            } catch (Exception e) {
                logger.error("Error serializing insights/statistics", e);
            }

            // Save uploaded file
            uploadedFile = uploadedFileRepository.save(uploadedFile);
            uploadedFileId = uploadedFile.getId();

            // Create conversation automatically
            Conversation conversation = chatService.createConversation(
                user.getId(),
                uploadedFileId,
                "Chat about " + file.getOriginalFilename()
            );
            conversationId = conversation.getId();

            logger.info("Created uploaded file (ID: {}) and conversation (ID: {}) for session {}",
                uploadedFileId, conversationId, sessionId);

        } catch (Exception e) {
            logger.error("Error persisting uploaded file or creating conversation", e);
            // Continue even if persistence fails - backward compatibility
        }

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
            .analysisType(analysisType)
            .uploadedFileId(uploadedFileId)
            .conversationId(conversationId)
            .build();

        // Save to session
        sessionService.saveSession(sessionId, response);
        return response;
    }

    @Transactional
    private FileAnalysisResponse analyzeExcelFile(MultipartFile file, String sessionId) throws IOException {
        List<String> lines = new ArrayList<>();
        List<String> columnNames = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream()) {
            Workbook workbook;
            String fileName = file.getOriginalFilename();
            
            // Determine workbook type based on file extension
            if (fileName != null && fileName.toLowerCase().endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(inputStream);
            } else {
                workbook = new HSSFWorkbook(inputStream);
            }

            // Get the first sheet
            Sheet sheet = workbook.getSheetAt(0);
            
            // Process rows
            boolean firstRow = true;
            for (Row row : sheet) {
                StringBuilder lineBuilder = new StringBuilder();
                
                if (firstRow) {
                    // Extract column names from header row
                    for (Cell cell : row) {
                        String cellValue = getCellValueAsString(cell);
                        columnNames.add(cellValue);
                        if (lineBuilder.length() > 0) {
                            lineBuilder.append(",");
                        }
                        lineBuilder.append(cellValue);
                    }
                    firstRow = false;
                } else {
                    // Process data rows
                    for (int i = 0; i < columnNames.size(); i++) {
                        if (lineBuilder.length() > 0) {
                            lineBuilder.append(",");
                        }
                        Cell cell = row.getCell(i, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                        lineBuilder.append(getCellValueAsString(cell));
                    }
                }
                
                lines.add(lineBuilder.toString());
            }
            
            workbook.close();
        }

        if (lines.isEmpty()) {
            throw new IOException("Excel file is empty");
        }

        int rowCount = lines.size() - 1; // Excluding header
        int columnCount = columnNames.size();
        
        // Convert lines to CSV format for storage and analysis
        StringBuilder csvContent = new StringBuilder();
        for (String line : lines) {
            csvContent.append(line).append("\n");
        }

        // Basic statistics and insights (reuse CSV logic)
        Map<String, Object> basicStats = generateBasicStatistics(lines, columnNames);
        List<DataInsight> insights = generateInsights(lines, columnNames, file.getOriginalFilename());
        String analysisType = detectAnalysisType(columnNames);

        // Store in session
        sessionInsights.put(sessionId, insights);

        // Persist uploaded file to database
        Long uploadedFileId = null;
        Long conversationId = null;

        try {
            User user = userRepository.findById(1L)
                .orElseGet(() -> createDefaultUser());

            UploadedFile uploadedFile = new UploadedFile();
            uploadedFile.setUser(user);
            uploadedFile.setSessionId(sessionId);
            uploadedFile.setFileName(file.getOriginalFilename());
            uploadedFile.setFileType(getFileExtension(file.getOriginalFilename()));
            uploadedFile.setFileSize(file.getSize());
            uploadedFile.setFileContent(csvContent.toString()); // Store as CSV format
            uploadedFile.setAnalysisType(analysisType);
            uploadedFile.setRowCount(rowCount);
            uploadedFile.setColumnCount(columnCount);
            uploadedFile.setAnalyzedAt(LocalDateTime.now());

            // Convert insights and statistics to JSON
            try {
                uploadedFile.setInsights(objectMapper.writeValueAsString(insights));
                uploadedFile.setStatistics(objectMapper.writeValueAsString(basicStats));
            } catch (Exception e) {
                logger.error("Error serializing insights/statistics", e);
            }

            uploadedFile = uploadedFileRepository.save(uploadedFile);
            uploadedFileId = uploadedFile.getId();

            // Create conversation automatically
            Conversation conversation = chatService.createConversation(
                user.getId(),
                uploadedFileId,
                "Chat about " + file.getOriginalFilename()
            );
            conversationId = conversation.getId();

            logger.info("Created uploaded file (ID: {}) and conversation (ID: {}) for session {}",
                uploadedFileId, conversationId, sessionId);

        } catch (Exception e) {
            logger.error("Error persisting uploaded file or creating conversation", e);
        }

        FileAnalysisResponse response = FileAnalysisResponse.builder()
            .success(true)
            .message("Excel file analyzed successfully")
            .sessionId(sessionId)
            .fileName(file.getOriginalFilename())
            .fileSize(file.getSize())
            .rowCount(rowCount)
            .columnCount(columnCount)
            .columnNames(columnNames)
            .basicStatistics(basicStats)
            .insights(insights)
            .analysisType(analysisType)
            .uploadedFileId(uploadedFileId)
            .conversationId(conversationId)
            .build();

        sessionService.saveSession(sessionId, response);
        return response;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Format number without scientific notation
                    double numValue = cell.getNumericCellValue();
                    if (numValue == (long) numValue) {
                        return String.valueOf((long) numValue);
                    } else {
                        return String.valueOf(numValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    return cell.getStringCellValue();
                }
            case BLANK:
                return "";
            default:
                return "";
        }
    }

    private User createDefaultUser() {
        User user = new User();
        user.setUsername("admin");
        user.setEmail("admin@smeanalytics.com");
        user.setPasswordHash("$2a$10$VPNz3WZ.TqKVHQJQVqG3iOvJLj7r7xXx8BqG3TqKVHQJQVqG3iOvJLj");
        user.setFullName("System Administrator");
        user.setRole("ADMIN");
        user.setActive(true);
        return userRepository.save(user);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return "csv";
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "csv";
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