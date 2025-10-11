package com.sme.analytics.dto;

public class DataInsight {
    private String type;
    private String title;
    private String description;
    private String value;
    private String category;
    private double confidence;
    
    public DataInsight() {}
    
    public DataInsight(String type, String title, String description, String value, String category, double confidence) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.value = value;
        this.category = category;
        this.confidence = confidence;
    }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
}