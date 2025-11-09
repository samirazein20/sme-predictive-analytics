package com.sme.analytics.repository;

import com.sme.analytics.model.MarketNews;
import com.sme.analytics.model.Competitor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for MarketNews entities
 */
@Repository
public interface MarketNewsRepository extends JpaRepository<MarketNews, Long> {

    /**
     * Find recent news with pagination
     */
    Page<MarketNews> findAllByOrderByPublishedAtDesc(Pageable pageable);

    /**
     * Find unread news
     */
    List<MarketNews> findByIsReadFalseOrderByPublishedAtDesc();

    /**
     * Count unread news
     */
    Long countByIsReadFalse();

    /**
     * Find news by category
     */
    Page<MarketNews> findByCategoryOrderByPublishedAtDesc(String category, Pageable pageable);

    /**
     * Find news by industry
     */
    Page<MarketNews> findByIndustryOrderByPublishedAtDesc(String industry, Pageable pageable);

    /**
     * Find news by competitor
     */
    Page<MarketNews> findByRelatedCompetitorOrderByPublishedAtDesc(Competitor competitor, Pageable pageable);

    /**
     * Find high impact news
     */
    List<MarketNews> findByImpactLevelOrderByPublishedAtDesc(String impactLevel);

    /**
     * Find news within date range
     */
    @Query("SELECT n FROM MarketNews n WHERE n.publishedAt BETWEEN :startDate AND :endDate ORDER BY n.publishedAt DESC")
    List<MarketNews> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Get average sentiment by category
     */
    @Query("SELECT n.category, AVG(n.sentimentScore) FROM MarketNews n WHERE n.publishedAt >= :since GROUP BY n.category")
    List<Object[]> getAverageSentimentByCategory(@Param("since") LocalDateTime since);

    /**
     * Find bookmarked news
     */
    List<MarketNews> findByIsBookmarkedTrueOrderByPublishedAtDesc();
}
