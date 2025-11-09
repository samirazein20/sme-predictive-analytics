package com.sme.analytics.repository;

import com.sme.analytics.model.Competitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Competitor entities
 */
@Repository
public interface CompetitorRepository extends JpaRepository<Competitor, Long> {

    /**
     * Find all active competitors
     */
    List<Competitor> findByActiveTrue();

    /**
     * Find competitors by industry
     */
    List<Competitor> findByIndustryAndActiveTrue(String industry);

    /**
     * Find competitors by location
     */
    List<Competitor> findByLocationAndActiveTrue(String location);

    /**
     * Find competitor by name
     */
    Competitor findByNameIgnoreCase(String name);
}
