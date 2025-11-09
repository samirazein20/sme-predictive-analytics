package com.sme.analytics.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a tracked competitor
 */
@Entity
@Table(name = "competitors")
public class Competitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Competitor name is required")
    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column
    private String website;

    @Column
    private String industry;

    @Column
    private String location;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastMonitoredAt;

    @ElementCollection
    @CollectionTable(name = "competitor_keywords", joinColumns = @JoinColumn(name = "competitor_id"))
    @Column(name = "keyword")
    private List<String> monitoringKeywords = new ArrayList<>();

    @Column
    private String priceMonitoringUrl;

    @Column
    private Double lastKnownPrice;

    @Column
    private LocalDateTime priceLastUpdated;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

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

    @Override
    public String toString() {
        return String.format("Competitor{id=%d, name='%s', industry='%s', active=%s}",
            id, name, industry, active);
    }
}
