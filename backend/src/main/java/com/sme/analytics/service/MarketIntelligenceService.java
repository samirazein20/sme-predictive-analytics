package com.sme.analytics.service;

import com.sme.analytics.dto.CompetitorDTO;
import com.sme.analytics.dto.MarketNewsDTO;
import com.sme.analytics.dto.MarketIntelligenceResponse;
import com.sme.analytics.model.Competitor;
import com.sme.analytics.model.MarketNews;
import com.sme.analytics.repository.CompetitorRepository;
import com.sme.analytics.repository.MarketNewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing competitive intelligence and market monitoring
 */
@Service
public class MarketIntelligenceService {

    @Autowired
    private CompetitorRepository competitorRepository;

    @Autowired
    private MarketNewsRepository marketNewsRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ml.service.url:http://localhost:8001}")
    private String mlServiceUrl;

    /**
     * Get comprehensive market intelligence dashboard
     */
    @Transactional(readOnly = true)
    public MarketIntelligenceResponse getDashboard() {
        MarketIntelligenceResponse response = new MarketIntelligenceResponse();

        // Get active competitors
        List<Competitor> competitors = competitorRepository.findByActiveTrue();
        response.setCompetitors(competitors.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));

        // Get recent news (last 50)
        Pageable pageable = PageRequest.of(0, 50);
        Page<MarketNews> newsPage = marketNewsRepository.findAllByOrderByPublishedAtDesc(pageable);
        response.setRecentNews(newsPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));

        // Calculate statistics
        response.setUnreadNewsCount(marketNewsRepository.countByIsReadFalse().intValue());
        response.setHighImpactNewsCount(
            marketNewsRepository.findByImpactLevelOrderByPublishedAtDesc("HIGH").size()
        );

        // Calculate news by category
        Map<String, Integer> newsByCategory = new HashMap<>();
        newsPage.getContent().forEach(news -> {
            String category = news.getCategory();
            newsByCategory.put(category, newsByCategory.getOrDefault(category, 0) + 1);
        });
        response.setNewsByCategory(newsByCategory);

        // Calculate sentiment trends
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<Object[]> sentimentData = marketNewsRepository.getAverageSentimentByCategory(weekAgo);
        Map<String, Double> sentimentTrends = new HashMap<>();
        sentimentData.forEach(row -> {
            sentimentTrends.put((String) row[0], (Double) row[1]);
        });
        response.setSentimentTrends(sentimentTrends);

        // Calculate overall market sentiment
        List<MarketNews> recentNews = marketNewsRepository.findByDateRange(weekAgo, LocalDateTime.now());
        double avgSentiment = recentNews.stream()
            .filter(n -> n.getSentimentScore() != null)
            .mapToDouble(MarketNews::getSentimentScore)
            .average()
            .orElse(0.0);
        response.setAverageSentiment(avgSentiment);
        response.setMarketSentiment(avgSentiment > 0.2 ? "BULLISH" : avgSentiment < -0.2 ? "BEARISH" : "NEUTRAL");

        // Extract top keywords
        List<String> topKeywords = extractTopKeywords(recentNews);
        response.setTopKeywords(topKeywords);

        return response;
    }

    /**
     * Create a new competitor to track
     */
    @Transactional
    public CompetitorDTO createCompetitor(CompetitorDTO dto) {
        Competitor competitor = new Competitor();
        competitor.setName(dto.getName());
        competitor.setDescription(dto.getDescription());
        competitor.setWebsite(dto.getWebsite());
        competitor.setIndustry(dto.getIndustry());
        competitor.setLocation(dto.getLocation());
        competitor.setMonitoringKeywords(dto.getMonitoringKeywords());
        competitor.setPriceMonitoringUrl(dto.getPriceMonitoringUrl());
        competitor.setActive(true);

        competitor = competitorRepository.save(competitor);
        return convertToDTO(competitor);
    }

    /**
     * Get all competitors
     */
    @Transactional(readOnly = true)
    public List<CompetitorDTO> getAllCompetitors() {
        return competitorRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get competitor by ID
     */
    @Transactional(readOnly = true)
    public CompetitorDTO getCompetitor(Long id) {
        return competitorRepository.findById(id)
            .map(this::convertToDTO)
            .orElse(null);
    }

    /**
     * Update competitor
     */
    @Transactional
    public CompetitorDTO updateCompetitor(Long id, CompetitorDTO dto) {
        Competitor competitor = competitorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Competitor not found"));

        competitor.setName(dto.getName());
        competitor.setDescription(dto.getDescription());
        competitor.setWebsite(dto.getWebsite());
        competitor.setIndustry(dto.getIndustry());
        competitor.setLocation(dto.getLocation());
        competitor.setMonitoringKeywords(dto.getMonitoringKeywords());
        competitor.setPriceMonitoringUrl(dto.getPriceMonitoringUrl());
        competitor.setActive(dto.getActive());

        competitor = competitorRepository.save(competitor);
        return convertToDTO(competitor);
    }

    /**
     * Delete competitor
     */
    @Transactional
    public void deleteCompetitor(Long id) {
        competitorRepository.deleteById(id);
    }

    /**
     * Get news feed with filtering
     */
    @Transactional(readOnly = true)
    public List<MarketNewsDTO> getNewsFeed(String category, String industry, Integer limit) {
        Pageable pageable = PageRequest.of(0, limit != null ? limit : 20);
        Page<MarketNews> newsPage;

        if (category != null) {
            newsPage = marketNewsRepository.findByCategoryOrderByPublishedAtDesc(category, pageable);
        } else if (industry != null) {
            newsPage = marketNewsRepository.findByIndustryOrderByPublishedAtDesc(industry, pageable);
        } else {
            newsPage = marketNewsRepository.findAllByOrderByPublishedAtDesc(pageable);
        }

        return newsPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Mark news as read
     */
    @Transactional
    public void markNewsAsRead(Long newsId) {
        MarketNews news = marketNewsRepository.findById(newsId)
            .orElseThrow(() -> new RuntimeException("News not found"));
        news.setIsRead(true);
        marketNewsRepository.save(news);
    }

    /**
     * Bookmark news
     */
    @Transactional
    public void bookmarkNews(Long newsId, boolean bookmark) {
        MarketNews news = marketNewsRepository.findById(newsId)
            .orElseThrow(() -> new RuntimeException("News not found"));
        news.setIsBookmarked(bookmark);
        marketNewsRepository.save(news);
    }

    /**
     * Fetch latest news for tracked competitors and industry
     * This would integrate with external news APIs
     */
    @Transactional
    public void fetchLatestNews(String industry, String location) {
        // TODO: Integrate with external news API (NewsAPI, GDELT, etc.)
        // For now, creating sample data to demonstrate functionality
        createSampleNews(industry, location);
    }

    /**
     * Convert Competitor entity to DTO
     */
    private CompetitorDTO convertToDTO(Competitor competitor) {
        CompetitorDTO dto = new CompetitorDTO();
        dto.setId(competitor.getId());
        dto.setName(competitor.getName());
        dto.setDescription(competitor.getDescription());
        dto.setWebsite(competitor.getWebsite());
        dto.setIndustry(competitor.getIndustry());
        dto.setLocation(competitor.getLocation());
        dto.setActive(competitor.getActive());
        dto.setCreatedAt(competitor.getCreatedAt());
        dto.setLastMonitoredAt(competitor.getLastMonitoredAt());
        dto.setMonitoringKeywords(competitor.getMonitoringKeywords());
        dto.setPriceMonitoringUrl(competitor.getPriceMonitoringUrl());
        dto.setLastKnownPrice(competitor.getLastKnownPrice());
        dto.setPriceLastUpdated(competitor.getPriceLastUpdated());
        return dto;
    }

    /**
     * Convert MarketNews entity to DTO
     */
    private MarketNewsDTO convertToDTO(MarketNews news) {
        MarketNewsDTO dto = new MarketNewsDTO();
        dto.setId(news.getId());
        dto.setTitle(news.getTitle());
        dto.setSummary(news.getSummary());
        dto.setUrl(news.getUrl());
        dto.setSource(news.getSource());
        dto.setCategory(news.getCategory());
        dto.setIndustry(news.getIndustry());
        dto.setLocation(news.getLocation());
        if (news.getRelatedCompetitor() != null) {
            dto.setRelatedCompetitorId(news.getRelatedCompetitor().getId());
            dto.setRelatedCompetitorName(news.getRelatedCompetitor().getName());
        }
        dto.setPublishedAt(news.getPublishedAt());
        dto.setFetchedAt(news.getFetchedAt());
        dto.setSentimentScore(news.getSentimentScore());
        dto.setSentimentLabel(news.getSentimentLabel());
        dto.setKeywords(news.getKeywords());
        dto.setImpactLevel(news.getImpactLevel());
        dto.setIsRead(news.getIsRead());
        dto.setIsBookmarked(news.getIsBookmarked());
        return dto;
    }

    /**
     * Extract top keywords from news
     */
    private List<String> extractTopKeywords(List<MarketNews> newsList) {
        Map<String, Integer> keywordFreq = new HashMap<>();

        newsList.forEach(news -> {
            if (news.getKeywords() != null) {
                Arrays.stream(news.getKeywords().split(","))
                    .map(String::trim)
                    .forEach(keyword -> keywordFreq.put(keyword, keywordFreq.getOrDefault(keyword, 0) + 1));
            }
        });

        return keywordFreq.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(10)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }

    /**
     * Create sample news data for demonstration
     */
    private void createSampleNews(String industry, String location) {
        // Sample news items to demonstrate functionality
        MarketNews news1 = new MarketNews();
        news1.setTitle("Industry Growth Report: " + industry + " Sector Shows 15% Increase");
        news1.setSummary("Latest market analysis shows strong growth in the " + industry + " sector with significant opportunities ahead.");
        news1.setUrl("https://example.com/news/industry-growth");
        news1.setSource("Market Intelligence Daily");
        news1.setCategory("INDUSTRY");
        news1.setIndustry(industry);
        news1.setLocation(location);
        news1.setPublishedAt(LocalDateTime.now().minusHours(2));
        news1.setSentimentScore(0.7);
        news1.setSentimentLabel("POSITIVE");
        news1.setKeywords("growth, market expansion, opportunity");
        news1.setImpactLevel("HIGH");
        marketNewsRepository.save(news1);
    }
}
