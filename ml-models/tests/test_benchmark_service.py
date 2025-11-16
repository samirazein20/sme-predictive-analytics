"""
Unit tests for benchmark models, services, and API.
"""

import pytest
import sys
from pathlib import Path
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.models.benchmark_models import (
    BenchmarkDataPoint,
    BenchmarkSeries,
    BenchmarkComparison,
    BenchmarkConfig,
    BenchmarkInterpretation,
    CompanySize,
    Region,
    DataSource
)
from src.services.synthetic_benchmark_generator import SyntheticBenchmarkGenerator
from src.services.benchmark_service import BenchmarkService


class TestBenchmarkModels:
    """Test benchmark data models."""
    
    def test_benchmark_data_point_creation(self):
        """Test creating a BenchmarkDataPoint."""
        dp = BenchmarkDataPoint(
            metric_name="revenue_per_employee",
            value=150000.0,
            industry="retail",
            company_size=CompanySize.SMALL,
            region=Region.NATIONAL,
            period=date(2024, 1, 1),
            source=DataSource.SYNTHETIC,
            percentile_25=130000.0,
            percentile_50=150000.0,
            percentile_75=170000.0,
            sample_size=100
        )
        
        assert dp.metric_name == "revenue_per_employee"
        assert dp.value == 150000.0
        assert dp.industry == "retail"
        assert dp.company_size == CompanySize.SMALL
        assert dp.region == Region.NATIONAL
        assert dp.sample_size == 100
    
    def test_benchmark_data_point_to_dict(self):
        """Test BenchmarkDataPoint serialization."""
        dp = BenchmarkDataPoint(
            metric_name="revenue_per_employee",
            value=150000.0,
            industry="retail",
            company_size=CompanySize.SMALL,
            region=Region.NATIONAL,
            period=date(2024, 1, 1),
            source=DataSource.SYNTHETIC
        )
        
        result = dp.to_dict()
        
        assert result["metric_name"] == "revenue_per_employee"
        assert result["value"] == 150000.0
        assert result["company_size"] == "small"
        assert result["region"] == "national"
        assert result["period"] == "2024-01-01"
    
    def test_benchmark_series_creation(self):
        """Test creating a BenchmarkSeries."""
        series = BenchmarkSeries(
            metric_name="revenue_per_employee",
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.WEST
        )
        
        assert series.metric_name == "revenue_per_employee"
        assert series.industry == "retail"
        assert len(series.data_points) == 0
    
    def test_benchmark_series_get_latest_value(self):
        """Test getting latest value from series."""
        series = BenchmarkSeries(
            metric_name="revenue_per_employee",
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.WEST
        )
        
        # Add some data points
        series.data_points = [
            BenchmarkDataPoint(
                metric_name="revenue_per_employee",
                value=150000.0,
                industry="retail",
                company_size=CompanySize.MEDIUM,
                region=Region.WEST,
                period=date(2024, 1, 1),
                source=DataSource.SYNTHETIC
            ),
            BenchmarkDataPoint(
                metric_name="revenue_per_employee",
                value=160000.0,
                industry="retail",
                company_size=CompanySize.MEDIUM,
                region=Region.WEST,
                period=date(2024, 2, 1),
                source=DataSource.SYNTHETIC
            )
        ]
        
        assert series.get_latest_value() == 160000.0
    
    def test_benchmark_comparison_interpretation_text(self):
        """Test benchmark comparison interpretation text generation."""
        comp = BenchmarkComparison(
            metric_name="revenue_per_employee",
            user_value=180000.0,
            benchmark_value=150000.0,
            difference=30000.0,
            percentage_difference=20.0,
            interpretation=BenchmarkInterpretation.ABOVE_AVERAGE
        )
        
        text = comp.get_interpretation_text()
        assert "above industry average" in text.lower()
        assert "20.0%" in text


class TestSyntheticBenchmarkGenerator:
    """Test synthetic benchmark data generator."""
    
    def test_generator_initialization(self):
        """Test generator initialization with seed."""
        gen = SyntheticBenchmarkGenerator(seed=42)
        assert gen.seed == 42
    
    def test_get_available_industries(self):
        """Test getting list of available industries."""
        industries = SyntheticBenchmarkGenerator.get_available_industries()
        
        assert len(industries) > 0
        assert "retail" in industries
        assert "restaurant" in industries
        assert "technology" in industries
    
    def test_get_available_metrics(self):
        """Test getting metrics for an industry."""
        metrics = SyntheticBenchmarkGenerator.get_available_metrics("retail")
        
        assert len(metrics) > 0
        assert "revenue_per_employee" in metrics
        assert "profit_margin" in metrics
    
    def test_generate_benchmark_series(self):
        """Test generating a benchmark series."""
        gen = SyntheticBenchmarkGenerator(seed=42)
        
        start_date = date(2023, 1, 1)
        end_date = date(2023, 12, 31)
        
        series = gen.generate_benchmark_series(
            metric_name="revenue_per_employee",
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            start_date=start_date,
            end_date=end_date,
            frequency="monthly"
        )
        
        assert series.metric_name == "revenue_per_employee"
        assert series.industry == "retail"
        assert len(series.data_points) == 12  # 12 months
        
        # Check all data points have required fields
        for dp in series.data_points:
            assert dp.value > 0
            assert dp.percentile_25 is not None
            assert dp.percentile_50 is not None
            assert dp.percentile_75 is not None
            assert dp.sample_size > 0
    
    def test_generate_series_with_growth_trend(self):
        """Test that generated series shows growth trend."""
        gen = SyntheticBenchmarkGenerator(seed=42)
        
        start_date = date(2020, 1, 1)
        end_date = date(2023, 12, 31)
        
        series = gen.generate_benchmark_series(
            metric_name="revenue_per_employee",
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            start_date=start_date,
            end_date=end_date,
            frequency="quarterly"
        )
        
        # Get first and last values
        first_value = series.data_points[0].value
        last_value = series.data_points[-1].value
        
        # Should show growth (retail has 3% annual growth)
        assert last_value > first_value
    
    def test_seasonal_factor_retail(self):
        """Test seasonal variation for retail industry."""
        gen = SyntheticBenchmarkGenerator(seed=42)
        
        # November should have higher factor (holiday season)
        nov_factor = gen._calculate_seasonal_factor(
            date(2024, 11, 1), "revenue_per_employee", "retail"
        )
        
        # March should have normal factor
        mar_factor = gen._calculate_seasonal_factor(
            date(2024, 3, 1), "revenue_per_employee", "retail"
        )
        
        assert nov_factor > mar_factor
    
    def test_company_size_multipliers(self):
        """Test that company size affects values."""
        gen = SyntheticBenchmarkGenerator(seed=42)
        
        start_date = date(2024, 1, 1)
        end_date = date(2024, 12, 31)
        
        # Generate for different sizes over full year
        small_series = gen.generate_benchmark_series(
            metric_name="revenue_per_employee",
            industry="retail",
            company_size=CompanySize.SMALL,
            region=Region.NATIONAL,
            start_date=start_date,
            end_date=end_date
        )
        
        large_series = gen.generate_benchmark_series(
            metric_name="revenue_per_employee",
            industry="retail",
            company_size=CompanySize.LARGE,
            region=Region.NATIONAL,
            start_date=start_date,
            end_date=end_date
        )
        
        # Large companies should have higher median values (more robust than single point)
        small_avg = sum(dp.percentile_50 for dp in small_series.data_points) / len(small_series.data_points)
        large_avg = sum(dp.percentile_50 for dp in large_series.data_points) / len(large_series.data_points)
        
        assert large_avg > small_avg
    
    def test_generate_industry_data(self):
        """Test generating data for multiple metrics."""
        gen = SyntheticBenchmarkGenerator(seed=42)
        
        start_date = date(2024, 1, 1)
        end_date = date(2024, 3, 1)
        
        series_list = gen.generate_industry_data(
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            start_date=start_date,
            end_date=end_date,
            metrics=["revenue_per_employee", "profit_margin"]
        )
        
        assert len(series_list) == 2
        assert series_list[0].metric_name == "revenue_per_employee"
        assert series_list[1].metric_name == "profit_margin"


class TestBenchmarkService:
    """Test benchmark service."""
    
    def test_service_initialization(self):
        """Test service initialization."""
        service = BenchmarkService()
        assert service.use_cache is True
        assert isinstance(service.synthetic_generator, SyntheticBenchmarkGenerator)
    
    def test_get_available_industries(self):
        """Test getting available industries."""
        service = BenchmarkService()
        industries = service.get_available_industries()
        
        assert len(industries) > 0
        assert "retail" in industries
    
    def test_get_available_metrics(self):
        """Test getting metrics for industry."""
        service = BenchmarkService()
        metrics = service.get_available_metrics("retail")
        
        assert len(metrics) > 0
        assert "revenue_per_employee" in metrics
    
    def test_get_industry_info(self):
        """Test getting industry information."""
        service = BenchmarkService()
        info = service.get_industry_info("retail")
        
        assert info["industry"] == "retail"
        assert len(info["available_metrics"]) > 0
        assert "small" in info["supported_sizes"]
    
    def test_get_benchmark_data(self):
        """Test retrieving benchmark data."""
        service = BenchmarkService()
        
        config = BenchmarkConfig(
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            metrics=["revenue_per_employee"],
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 1)
        )
        
        series_list = service.get_benchmark_data(config)
        
        assert len(series_list) == 1
        assert series_list[0].metric_name == "revenue_per_employee"
        assert len(series_list[0].data_points) > 0
    
    def test_benchmark_data_caching(self):
        """Test that benchmark data is cached."""
        service = BenchmarkService()
        
        config = BenchmarkConfig(
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            metrics=["revenue_per_employee"],
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1)
        )
        
        # First call
        series_list_1 = service.get_benchmark_data(config)
        
        # Second call should use cache
        series_list_2 = service.get_benchmark_data(config)
        
        # Should be the same object
        assert series_list_1 is series_list_2
    
    def test_compare_to_benchmark(self):
        """Test comparing user value to benchmark."""
        service = BenchmarkService()
        
        config = BenchmarkConfig(
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1)
        )
        
        # Compare a value significantly above average
        comparison = service.compare_to_benchmark(
            user_value=200000.0,
            metric_name="revenue_per_employee",
            config=config
        )
        
        assert comparison.metric_name == "revenue_per_employee"
        assert comparison.user_value == 200000.0
        assert comparison.benchmark_value > 0
        assert comparison.difference != 0
        assert comparison.percentile_rank is not None
    
    def test_compare_multiple_metrics(self):
        """Test comparing multiple metrics."""
        service = BenchmarkService()
        
        config = BenchmarkConfig(
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1)
        )
        
        user_values = {
            "revenue_per_employee": 180000.0,
            "profit_margin": 0.10
        }
        
        comparisons = service.compare_multiple_metrics(user_values, config)
        
        assert len(comparisons) == 2
        assert comparisons[0].metric_name in user_values
        assert comparisons[1].metric_name in user_values
    
    def test_percentile_rank_estimation(self):
        """Test percentile rank estimation."""
        service = BenchmarkService()
        
        benchmark_point = BenchmarkDataPoint(
            metric_name="revenue_per_employee",
            value=150000.0,
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            period=date(2024, 1, 1),
            source=DataSource.SYNTHETIC,
            percentile_10=100000.0,
            percentile_25=130000.0,
            percentile_50=150000.0,
            percentile_75=170000.0,
            percentile_90=200000.0
        )
        
        # Test value at median
        rank_50 = service._estimate_percentile_rank(150000.0, benchmark_point)
        assert 45 <= rank_50 <= 55  # Should be around 50th percentile
        
        # Test value at 75th percentile
        rank_75 = service._estimate_percentile_rank(170000.0, benchmark_point)
        assert 70 <= rank_75 <= 80  # Should be around 75th percentile
        
        # Test value above 90th percentile
        rank_90plus = service._estimate_percentile_rank(220000.0, benchmark_point)
        assert rank_90plus >= 90  # Should be above 90th percentile
    
    def test_interpretation_determination(self):
        """Test interpretation determination."""
        service = BenchmarkService()
        
        benchmark_point = BenchmarkDataPoint(
            metric_name="revenue_per_employee",
            value=150000.0,
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            period=date(2024, 1, 1),
            source=DataSource.SYNTHETIC,
            percentile_10=100000.0,
            percentile_25=130000.0,
            percentile_50=150000.0,
            percentile_75=170000.0,
            percentile_90=200000.0
        )
        
        # Test significantly above
        interp_high = service._determine_interpretation(220000.0, benchmark_point)
        assert interp_high == BenchmarkInterpretation.SIGNIFICANTLY_ABOVE
        
        # Test average
        interp_avg = service._determine_interpretation(150000.0, benchmark_point)
        assert interp_avg == BenchmarkInterpretation.AVERAGE
        
        # Test significantly below
        interp_low = service._determine_interpretation(80000.0, benchmark_point)
        assert interp_low == BenchmarkInterpretation.SIGNIFICANTLY_BELOW
    
    def test_clear_cache(self):
        """Test cache clearing."""
        service = BenchmarkService()
        
        config = BenchmarkConfig(
            industry="retail",
            company_size=CompanySize.MEDIUM,
            region=Region.NATIONAL,
            metrics=["revenue_per_employee"],
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1)
        )
        
        # Load data to populate cache
        service.get_benchmark_data(config)
        assert len(service._cache) > 0
        
        # Clear cache
        service.clear_cache()
        assert len(service._cache) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
