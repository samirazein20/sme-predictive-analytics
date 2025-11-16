package com.sme.analytics.repository;

import com.sme.analytics.model.ComparisonSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for ComparisonSchedule entities
 */
@Repository
public interface ComparisonScheduleRepository extends JpaRepository<ComparisonSchedule, Long> {
    
    /**
     * Find all active schedules
     */
    List<ComparisonSchedule> findByActiveTrue();
    
    /**
     * Find schedules that are due to run
     */
    @Query("SELECT s FROM ComparisonSchedule s WHERE s.active = true AND s.nextRunAt <= :now")
    List<ComparisonSchedule> findDueSchedules(LocalDateTime now);
    
    /**
     * Find schedules by recipient email
     */
    List<ComparisonSchedule> findByRecipientEmail(String email);
}
