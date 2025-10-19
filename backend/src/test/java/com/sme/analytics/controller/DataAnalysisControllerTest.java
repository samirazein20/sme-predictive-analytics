package com.sme.analytics.controller;

import com.sme.analytics.dto.FileAnalysisResponse;
import com.sme.analytics.service.DataAnalysisService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DataAnalysisController.class)
class DataAnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DataAnalysisService dataAnalysisService;

    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        String csvContent = "Date,Revenue,Expenses\n2024-01-01,10000,5000\n2024-01-02,12000,6000";
        mockFile = new MockMultipartFile(
                "file",
                "test_data.csv",
                "text/csv",
                csvContent.getBytes()
        );
    }

    @Test
    void testUploadFile_Success() throws Exception {
        // Arrange
        String sessionId = "test-session-123";
        FileAnalysisResponse mockResponse = FileAnalysisResponse.builder()
                .success(true)
                .sessionId(sessionId)
                .message("File uploaded successfully")
                .fileName("test_data.csv")
                .rowCount(2)
                .columnCount(3)
                .build();

        when(dataAnalysisService.analyzeFile(any())).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/data/upload")
                        .file(mockFile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.fileName").value("test_data.csv"));
    }

    @Test
    void testUploadFile_EmptyFile() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.csv",
                "text/csv",
                new byte[0]
        );

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/data/upload")
                        .file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testGetSession_Success() throws Exception {
        // Arrange
        String sessionId = "test-session-123";
        FileAnalysisResponse sessionData = FileAnalysisResponse.builder()
                .success(true)
                .sessionId(sessionId)
                .fileName("test_data.csv")
                .rowCount(2)
                .columnCount(3)
                .build();

        when(dataAnalysisService.getSessionData(sessionId)).thenReturn(sessionData);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/data/session/{sessionId}", sessionId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testGetSession_SessionNotFound() throws Exception {
        // Arrange
        String sessionId = "non-existent-session";
        when(dataAnalysisService.getSessionData(sessionId)).thenReturn(null);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/data/session/{sessionId}", sessionId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCorsConfiguration() throws Exception {
        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.options("/api/v1/data/upload")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }
}
