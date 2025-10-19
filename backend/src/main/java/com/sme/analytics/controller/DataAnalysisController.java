package com.sme.analytics.controller;

import com.sme.analytics.dto.FileAnalysisResponse;
import com.sme.analytics.dto.DataInsight;
import com.sme.analytics.service.DataAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data")
public class DataAnalysisController {

    @Autowired
    private DataAnalysisService dataAnalysisService;

    @PostMapping("/upload")
    public ResponseEntity<FileAnalysisResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    FileAnalysisResponse.builder()
                        .success(false)
                        .message("File is empty")
                        .build()
                );
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || 
                (!originalFilename.toLowerCase().endsWith(".csv") && 
                 !originalFilename.toLowerCase().endsWith(".xlsx") && 
                 !originalFilename.toLowerCase().endsWith(".xls"))) {
                return ResponseEntity.badRequest().body(
                    FileAnalysisResponse.builder()
                        .success(false)
                        .message("Only CSV and Excel files are supported")
                        .build()
                );
            }

            FileAnalysisResponse response = dataAnalysisService.analyzeFile(file);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(
                FileAnalysisResponse.builder()
                    .success(false)
                    .message("Error processing file: " + e.getMessage())
                    .build()
            );
        }
    }

    @GetMapping("/insights/{sessionId}")
    public ResponseEntity<List<DataInsight>> getInsights(@PathVariable String sessionId) {
        List<DataInsight> insights = dataAnalysisService.getInsights(sessionId);
        return ResponseEntity.ok(insights);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<FileAnalysisResponse> getSession(@PathVariable String sessionId) {
        FileAnalysisResponse response = dataAnalysisService.getSessionData(sessionId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Data Analysis Service is healthy");
    }
}