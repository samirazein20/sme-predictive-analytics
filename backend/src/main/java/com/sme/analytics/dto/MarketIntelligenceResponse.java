package com.sme.analytics.dto;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for Market Intelligence dashboard
 */
public class MarketIntelligenceResponse {
    private List<CompetitorDTO> competitors;
    private List<MarketNewsDTO> recentNews;
    private Map<String, Integer> newsByCategory;
    private Map<String, Double> sentimentTrends;
    private List<String> topKeywords;
    private Integer unreadNewsCount;
    private Integer highImpactNewsCount;
    private String marketSentiment; // BULLISH, BEARISH, NEUTRAL
    private Double averageSentiment;

    public MarketIntelligenceResponse() {}

    // Getters and Setters
    public List<CompetitorDTO> getCompetitors() {
        return competitors;
    }

    public void setCompetitors(List<CompetitorDTO> competitors) {
        this.competitors = competitors;
    }

    public List<MarketNewsDTO> getRecentNews() {
        return recentNews;
    }

    public void setRecentNews(List<MarketNewsDTO> recentNews) {
        this.recentNews = recentNews;
    }

    public Map<String, Integer> getNewsByCategory() {
        return newsByCategory;
    }

    public void setNewsByCategory(Map<String, Integer> newsByCategory) {
        this.newsByCategory = newsByCategory;
    }

    public Map<String, Double> getSentimentTrends() {
        return sentimentTrends;
    }

    public void setSentimentTrends(Map<String, Double> sentimentTrends) {
        this.sentimentTrends = sentimentTrends;
    }

    public List<String> getTopKeywords() {
        return topKeywords;
    }

    public void setTopKeywords(List<String> topKeywords) {
        this.topKeywords = topKeywords;
    }

    public Integer getUnreadNewsCount() {
        return unreadNewsCount;
    }

    public void setUnreadNewsCount(Integer unreadNewsCount) {
        this.unreadNewsCount = unreadNewsCount;
    }

    public Integer getHighImpactNewsCount() {
        return highImpactNewsCount;
    }

    public void setHighImpactNewsCount(Integer highImpactNewsCount) {
        this.highImpactNewsCount = highImpactNewsCount;
    }

    public String getMarketSentiment() {
        return marketSentiment;
    }

    public void setMarketSentiment(String marketSentiment) {
        this.marketSentiment = marketSentiment;
    }

    public Double getAverageSentiment() {
        return averageSentiment;
    }

    public void setAverageSentiment(Double averageSentiment) {
        this.averageSentiment = averageSentiment;
    }
}
