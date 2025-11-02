"""
Synthetic benchmark data generator for testing and demonstration.
Generates realistic industry benchmark data with seasonal variations and trends.
"""

import random
from datetime import date, timedelta
from typing import List, Dict, Tuple
from dateutil.relativedelta import relativedelta

from ..models.benchmark_models import (
    BenchmarkDataPoint,
    BenchmarkSeries,
    CompanySize,
    Region,
    DataSource
)


class SyntheticBenchmarkGenerator:
    """Generate realistic synthetic benchmark data for various industries and metrics."""
    
    # Industry templates with typical metric ranges (mean, std_dev, growth_rate)
    INDUSTRY_TEMPLATES = {
        "retail": {
            "revenue_per_employee": (150000, 30000, 0.03),  # $150k ±$30k, 3% annual growth
            "profit_margin": (0.08, 0.02, 0.005),  # 8% ±2%, 0.5% annual improvement
            "inventory_turnover": (8.0, 1.5, 0.10),  # 8x ±1.5x, 10% annual improvement
            "customer_acquisition_cost": (50, 15, -0.02),  # $50 ±$15, 2% annual reduction
            "customer_retention_rate": (0.70, 0.10, 0.02),  # 70% ±10%, 2% annual improvement
        },
        "restaurant": {
            "revenue_per_employee": (80000, 15000, 0.02),  # $80k ±$15k, 2% annual growth
            "profit_margin": (0.06, 0.03, 0.003),  # 6% ±3%, 0.3% annual improvement
            "inventory_turnover": (15.0, 3.0, 0.05),  # 15x ±3x, 5% annual improvement
            "customer_acquisition_cost": (30, 10, -0.01),  # $30 ±$10, 1% annual reduction
            "labor_cost_percentage": (0.30, 0.05, -0.01),  # 30% ±5%, 1% annual reduction
        },
        "professional_services": {
            "revenue_per_employee": (200000, 50000, 0.04),  # $200k ±$50k, 4% annual growth
            "profit_margin": (0.15, 0.05, 0.007),  # 15% ±5%, 0.7% annual improvement
            "billable_hours_percentage": (0.65, 0.10, 0.01),  # 65% ±10%, 1% annual improvement
            "client_acquisition_cost": (2000, 500, -0.03),  # $2000 ±$500, 3% annual reduction
            "client_retention_rate": (0.85, 0.08, 0.02),  # 85% ±8%, 2% annual improvement
        },
        "manufacturing": {
            "revenue_per_employee": (250000, 60000, 0.03),  # $250k ±$60k, 3% annual growth
            "profit_margin": (0.12, 0.04, 0.005),  # 12% ±4%, 0.5% annual improvement
            "inventory_turnover": (5.0, 1.0, 0.08),  # 5x ±1x, 8% annual improvement
            "production_efficiency": (0.75, 0.10, 0.02),  # 75% ±10%, 2% annual improvement
            "defect_rate": (0.02, 0.01, -0.05),  # 2% ±1%, 5% annual reduction
        },
        "healthcare": {
            "revenue_per_employee": (180000, 40000, 0.03),  # $180k ±$40k, 3% annual growth
            "profit_margin": (0.10, 0.03, 0.004),  # 10% ±3%, 0.4% annual improvement
            "patient_satisfaction": (0.82, 0.08, 0.01),  # 82% ±8%, 1% annual improvement
            "appointment_no_show_rate": (0.15, 0.05, -0.02),  # 15% ±5%, 2% annual reduction
            "patient_retention_rate": (0.80, 0.10, 0.02),  # 80% ±10%, 2% annual improvement
        },
        "technology": {
            "revenue_per_employee": (300000, 80000, 0.08),  # $300k ±$80k, 8% annual growth
            "profit_margin": (0.20, 0.08, 0.01),  # 20% ±8%, 1% annual improvement
            "customer_acquisition_cost": (500, 150, -0.04),  # $500 ±$150, 4% annual reduction
            "customer_retention_rate": (0.90, 0.05, 0.02),  # 90% ±5%, 2% annual improvement
            "monthly_recurring_revenue": (50000, 15000, 0.10),  # $50k ±$15k, 10% annual growth
        },
        "hospitality": {
            "revenue_per_employee": (100000, 25000, 0.02),  # $100k ±$25k, 2% annual growth
            "profit_margin": (0.08, 0.03, 0.003),  # 8% ±3%, 0.3% annual improvement
            "occupancy_rate": (0.70, 0.12, 0.02),  # 70% ±12%, 2% annual improvement
            "guest_satisfaction": (0.85, 0.08, 0.01),  # 85% ±8%, 1% annual improvement
            "revenue_per_available_room": (120, 30, 0.03),  # $120 ±$30, 3% annual growth
        },
        "construction": {
            "revenue_per_employee": (220000, 50000, 0.03),  # $220k ±$50k, 3% annual growth
            "profit_margin": (0.10, 0.04, 0.005),  # 10% ±4%, 0.5% annual improvement
            "project_completion_rate": (0.85, 0.10, 0.02),  # 85% ±10%, 2% annual improvement
            "safety_incident_rate": (0.03, 0.01, -0.10),  # 3% ±1%, 10% annual reduction
            "customer_satisfaction": (0.80, 0.10, 0.02),  # 80% ±10%, 2% annual improvement
        },
        "education": {
            "revenue_per_employee": (120000, 30000, 0.02),  # $120k ±$30k, 2% annual growth
            "profit_margin": (0.05, 0.02, 0.002),  # 5% ±2%, 0.2% annual improvement
            "student_retention_rate": (0.85, 0.08, 0.01),  # 85% ±8%, 1% annual improvement
            "student_satisfaction": (0.80, 0.10, 0.01),  # 80% ±10%, 1% annual improvement
            "course_completion_rate": (0.75, 0.12, 0.02),  # 75% ±12%, 2% annual improvement
        },
        "real_estate": {
            "revenue_per_employee": (180000, 45000, 0.04),  # $180k ±$45k, 4% annual growth
            "profit_margin": (0.12, 0.04, 0.006),  # 12% ±4%, 0.6% annual improvement
            "occupancy_rate": (0.92, 0.05, 0.01),  # 92% ±5%, 1% annual improvement
            "tenant_retention_rate": (0.80, 0.10, 0.02),  # 80% ±10%, 2% annual improvement
            "rent_collection_rate": (0.95, 0.03, 0.01),  # 95% ±3%, 1% annual improvement
        }
    }
    
    # Company size multipliers (small -> medium -> large)
    SIZE_MULTIPLIERS = {
        CompanySize.SMALL: 0.85,  # Small companies typically 15% below average
        CompanySize.MEDIUM: 1.0,  # Medium is baseline
        CompanySize.LARGE: 1.15,  # Large companies typically 15% above average
    }
    
    # Regional multipliers for cost/revenue variations
    REGION_MULTIPLIERS = {
        Region.NATIONAL: 1.0,
        Region.NORTHEAST: 1.12,  # Higher costs/revenues
        Region.WEST: 1.10,
        Region.MIDWEST: 0.95,
        Region.SOUTHEAST: 0.93,
        Region.SOUTHWEST: 0.97,
    }
    
    def __init__(self, seed: int = 42):
        """
        Initialize generator with optional random seed.
        
        Args:
            seed: Random seed for reproducibility
        """
        self.seed = seed
        random.seed(seed)
    
    def generate_benchmark_series(
        self,
        metric_name: str,
        industry: str,
        company_size: CompanySize,
        region: Region,
        start_date: date,
        end_date: date,
        frequency: str = "monthly"
    ) -> BenchmarkSeries:
        """
        Generate a time series of benchmark data.
        
        Args:
            metric_name: Name of the metric
            industry: Industry category
            company_size: Company size classification
            region: Geographic region
            start_date: Start date for series
            end_date: End date for series
            frequency: Data frequency ('monthly' or 'quarterly')
        
        Returns:
            BenchmarkSeries with generated data points
        """
        # Get industry template
        if industry not in self.INDUSTRY_TEMPLATES:
            raise ValueError(f"Unsupported industry: {industry}")
        
        if metric_name not in self.INDUSTRY_TEMPLATES[industry]:
            raise ValueError(f"Metric {metric_name} not available for industry {industry}")
        
        base_mean, base_std, growth_rate = self.INDUSTRY_TEMPLATES[industry][metric_name]
        
        # Apply size and region multipliers
        size_mult = self.SIZE_MULTIPLIERS[company_size]
        region_mult = self.REGION_MULTIPLIERS[region]
        adjusted_mean = base_mean * size_mult * region_mult
        adjusted_std = base_std * size_mult
        
        # Generate data points
        data_points = []
        current_date = start_date
        period_index = 0
        
        while current_date <= end_date:
            # Calculate trend (years from start)
            years_elapsed = (current_date - start_date).days / 365.25
            trend_factor = (1 + growth_rate) ** years_elapsed
            
            # Calculate seasonal variation (if applicable)
            seasonal_factor = self._calculate_seasonal_factor(
                current_date, metric_name, industry
            )
            
            # Generate mean value with trend and seasonality
            mean_value = adjusted_mean * trend_factor * seasonal_factor
            
            # Add random variation
            value = max(0, random.gauss(mean_value, adjusted_std))
            
            # Generate percentile values
            percentile_25 = max(0, random.gauss(mean_value * 0.85, adjusted_std * 0.5))
            percentile_50 = mean_value
            percentile_75 = max(0, random.gauss(mean_value * 1.15, adjusted_std * 0.5))
            percentile_10 = max(0, random.gauss(mean_value * 0.70, adjusted_std * 0.3))
            percentile_90 = max(0, random.gauss(mean_value * 1.30, adjusted_std * 0.3))
            
            # Generate sample size (realistic number of companies in benchmark)
            sample_size = random.randint(50, 500) if company_size == CompanySize.SMALL else \
                         random.randint(30, 200) if company_size == CompanySize.MEDIUM else \
                         random.randint(20, 100)
            
            data_point = BenchmarkDataPoint(
                metric_name=metric_name,
                value=round(value, 2),
                industry=industry,
                company_size=company_size,
                region=region,
                period=current_date,
                source=DataSource.SYNTHETIC,
                percentile_25=round(percentile_25, 2),
                percentile_50=round(percentile_50, 2),
                percentile_75=round(percentile_75, 2),
                percentile_10=round(percentile_10, 2),
                percentile_90=round(percentile_90, 2),
                sample_size=sample_size,
                metadata={
                    "trend_factor": round(trend_factor, 3),
                    "seasonal_factor": round(seasonal_factor, 3)
                }
            )
            data_points.append(data_point)
            
            # Move to next period
            if frequency == "monthly":
                current_date = current_date + relativedelta(months=1)
            else:  # quarterly
                current_date = current_date + relativedelta(months=3)
            period_index += 1
        
        return BenchmarkSeries(
            metric_name=metric_name,
            industry=industry,
            company_size=company_size,
            region=region,
            data_points=data_points,
            metadata={
                "frequency": frequency,
                "base_mean": base_mean,
                "growth_rate": growth_rate,
                "generated_at": date.today().isoformat()
            }
        )
    
    def _calculate_seasonal_factor(
        self, current_date: date, metric_name: str, industry: str
    ) -> float:
        """
        Calculate seasonal variation factor for a given date.
        
        Args:
            current_date: Date to calculate factor for
            metric_name: Name of the metric
            industry: Industry category
        
        Returns:
            Seasonal factor (multiplier around 1.0)
        """
        month = current_date.month
        
        # Retail has strong Q4 seasonality
        if industry == "retail":
            if month in [11, 12]:  # November-December
                return 1.4
            elif month in [1, 2]:  # January-February (post-holiday slump)
                return 0.8
            return 1.0
        
        # Restaurant has summer and holiday peaks
        elif industry == "restaurant":
            if month in [6, 7, 8]:  # Summer
                return 1.2
            elif month in [11, 12]:  # Holidays
                return 1.3
            return 1.0
        
        # Hospitality has strong seasonality
        elif industry == "hospitality":
            if month in [6, 7, 8]:  # Summer peak
                return 1.3
            elif month in [1, 2]:  # Winter low
                return 0.7
            return 1.0
        
        # Construction slows in winter
        elif industry == "construction":
            if month in [12, 1, 2]:  # Winter
                return 0.7
            elif month in [6, 7, 8]:  # Summer peak
                return 1.2
            return 1.0
        
        # Education has academic year seasonality
        elif industry == "education":
            if month in [9, 10, 11]:  # Fall semester
                return 1.2
            elif month in [6, 7]:  # Summer break
                return 0.6
            return 1.0
        
        # Other industries have minimal seasonality
        return 1.0
    
    def generate_industry_data(
        self,
        industry: str,
        company_size: CompanySize,
        region: Region,
        start_date: date,
        end_date: date,
        metrics: List[str] = None
    ) -> List[BenchmarkSeries]:
        """
        Generate benchmark data for multiple metrics in an industry.
        
        Args:
            industry: Industry category
            company_size: Company size classification
            region: Geographic region
            start_date: Start date for series
            end_date: End date for series
            metrics: List of metric names (None = all available metrics)
        
        Returns:
            List of BenchmarkSeries objects
        """
        if industry not in self.INDUSTRY_TEMPLATES:
            raise ValueError(f"Unsupported industry: {industry}")
        
        # Use all metrics if none specified
        if metrics is None:
            metrics = list(self.INDUSTRY_TEMPLATES[industry].keys())
        
        # Generate series for each metric
        series_list = []
        for metric in metrics:
            if metric in self.INDUSTRY_TEMPLATES[industry]:
                series = self.generate_benchmark_series(
                    metric_name=metric,
                    industry=industry,
                    company_size=company_size,
                    region=region,
                    start_date=start_date,
                    end_date=end_date
                )
                series_list.append(series)
        
        return series_list
    
    @classmethod
    def get_available_industries(cls) -> List[str]:
        """Get list of available industries."""
        return list(cls.INDUSTRY_TEMPLATES.keys())
    
    @classmethod
    def get_available_metrics(cls, industry: str) -> List[str]:
        """Get list of available metrics for an industry."""
        if industry not in cls.INDUSTRY_TEMPLATES:
            return []
        return list(cls.INDUSTRY_TEMPLATES[industry].keys())
