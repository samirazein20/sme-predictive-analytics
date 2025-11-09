package com.sme.analytics.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for Competitor
 */
public class CompetitorDTO {
    private Long id;
    private String name;
    private String description;
    private String website;
    private String industry;
    private String location;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastMonitoredAt;
    private List<String> monitoringKeywords;
    private String priceMonitoringUrl;
    private Double lastKnownPrice;
    private LocalDateTime priceLastUpdated;

    public CompetitorDTO() {}

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public LocalDateTime getLastMonitoredAt() {
        return lastMonitoredAt;
    }

    public void setLastMonitoredAt(LocalDateTime lastMonitoredAt) {
        this.lastMonitoredAt = lastMonitoredAt;
    }

    public List<String> getMonitoringKeywords() {
        return monitoringKeywords;
    }

    public void setMonitoringKeywords(List<String> monitoringKeywords) {
        this.monitoringKeywords = monitoringKeywords;
    }

    public String getPriceMonitoringUrl() {
        return priceMonitoringUrl;
    }

    public void setPriceMonitoringUrl(String priceMonitoringUrl) {
        this.priceMonitoringUrl = priceMonitoringUrl;
    }

    public Double getLastKnownPrice() {
        return lastKnownPrice;
    }

    public void setLastKnownPrice(Double lastKnownPrice) {
        this.lastKnownPrice = lastKnownPrice;
    }

    public LocalDateTime getPriceLastUpdated() {
        return priceLastUpdated;
    }

    public void setPriceLastUpdated(LocalDateTime priceLastUpdated) {
        this.priceLastUpdated = priceLastUpdated;
    }
}
