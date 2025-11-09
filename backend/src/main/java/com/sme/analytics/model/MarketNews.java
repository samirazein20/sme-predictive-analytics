package com.sme.analytics.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing market news and intelligence
 */
@Entity
@Table(name = "market_news")
public class MarketNews {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(length = 5000)
    private String summary;

    @Column(nullable = false, length = 2000)
    private String url;

    @Column
    private String source;

    @Column
    private String category; // COMPETITOR, INDUSTRY, MARKET, REGULATORY, ECONOMIC

    @Column
    private String industry;

    @Column
    private String location;

    @ManyToOne
    @JoinColumn(name = "competitor_id")
    private Competitor relatedCompetitor;

    @Column
    private LocalDateTime publishedAt;

    @Column
    private LocalDateTime fetchedAt;

    @Column
    private Double sentimentScore; // -1.0 to 1.0 (negative to positive)

    @Column
    private String sentimentLabel; // POSITIVE, NEGATIVE, NEUTRAL

    @Column(length = 2000)
    private String keywords;

    @Column
    private String impactLevel; // HIGH, MEDIUM, LOW

    @Column
    private Boolean isRead = false;

    @Column
    private Boolean isBookmarked = false;

    @PrePersist
    protected void onCreate() {
        fetchedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public Competitor getRelatedCompetitor() {
        return relatedCompetitor;
    }

    public void setRelatedCompetitor(Competitor relatedCompetitor) {
        this.relatedCompetitor = relatedCompetitor;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public LocalDateTime getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(LocalDateTime fetchedAt) {
        this.fetchedAt = fetchedAt;
    }

    public Double getSentimentScore() {
        return sentimentScore;
    }

    public void setSentimentScore(Double sentimentScore) {
        this.sentimentScore = sentimentScore;
    }

    public String getSentimentLabel() {
        return sentimentLabel;
    }

    public void setSentimentLabel(String sentimentLabel) {
        this.sentimentLabel = sentimentLabel;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public String getImpactLevel() {
        return impactLevel;
    }

    public void setImpactLevel(String impactLevel) {
        this.impactLevel = impactLevel;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public Boolean getIsBookmarked() {
        return isBookmarked;
    }

    public void setIsBookmarked(Boolean isBookmarked) {
        this.isBookmarked = isBookmarked;
    }

    @Override
    public String toString() {
        return String.format("MarketNews{id=%d, title='%s', category='%s', sentiment='%s'}",
            id, title, category, sentimentLabel);
    }
}
