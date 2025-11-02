"""
Benchmark service for retrieving and comparing industry benchmark data.
"""

from datetime import date, timedelta
from typing import List, Dict, Optional
from dateutil.relativedelta import relativedelta

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


class BenchmarkService:
    """Service for managing benchmark data retrieval and comparisons."""
    
    def __init__(self, use_cache: bool = True):
        """
        Initialize benchmark service.
        
        Args:
            use_cache: Whether to cache benchmark data
        """
        self.use_cache = use_cache
        self._cache: Dict[str, BenchmarkSeries] = {}
        self.synthetic_generator = SyntheticBenchmarkGenerator()
    
    def get_benchmark_data(
        self,
        config: BenchmarkConfig,
        use_synthetic: bool = True
    ) -> List[BenchmarkSeries]:
        """
        Retrieve benchmark data based on configuration.
        
        Args:
            config: Benchmark configuration specifying industry, size, region, metrics
            use_synthetic: Whether to use synthetic data (True) or attempt real API calls (False)
        
        Returns:
            List of BenchmarkSeries objects for requested metrics
        """
        # Check cache first
        cache_key = self._generate_cache_key(config)
        if self.use_cache and cache_key in self._cache:
            cached_data = self._cache[cache_key]
            # Return cached data if it matches all requested metrics
            if isinstance(cached_data, list):
                return cached_data
        
        # Determine date range
        if config.start_date is None:
            # Default to last 12 months
            config.start_date = date.today() - relativedelta(months=12)
        if config.end_date is None:
            config.end_date = date.today()
        
        # For now, use synthetic data generator
        # TODO: Add BLS API integration in Phase 2
        if use_synthetic:
            series_list = self.synthetic_generator.generate_industry_data(
                industry=config.industry,
                company_size=config.company_size,
                region=config.region,
                start_date=config.start_date,
                end_date=config.end_date,
                metrics=config.metrics if config.metrics else None
            )
            
            # Cache results
            if self.use_cache:
                self._cache[cache_key] = series_list
            
            return series_list
        else:
            # Placeholder for real API integration
            raise NotImplementedError("Real API data fetching not yet implemented. Use use_synthetic=True.")
    
    def compare_to_benchmark(
        self,
        user_value: float,
        metric_name: str,
        config: BenchmarkConfig,
        period: Optional[date] = None
    ) -> BenchmarkComparison:
        """
        Compare user's value to industry benchmark.
        
        Args:
            user_value: User's actual metric value
            metric_name: Name of the metric
            config: Benchmark configuration
            period: Date period for comparison (None = most recent)
        
        Returns:
            BenchmarkComparison object with detailed comparison
        """
        # Get benchmark data for this metric
        config.metrics = [metric_name]
        series_list = self.get_benchmark_data(config)
        
        if not series_list:
            raise ValueError(f"No benchmark data available for metric: {metric_name}")
        
        series = series_list[0]
        
        # Get benchmark value for the period
        if period:
            benchmark_point = self._find_data_point_for_period(series, period)
        else:
            # Use most recent data point
            benchmark_point = max(series.data_points, key=lambda dp: dp.period)
        
        if not benchmark_point:
            raise ValueError(f"No benchmark data found for period: {period}")
        
        # Calculate differences
        benchmark_value = benchmark_point.value
        difference = user_value - benchmark_value
        percentage_difference = (difference / benchmark_value * 100) if benchmark_value != 0 else 0
        
        # Estimate percentile rank
        percentile_rank = self._estimate_percentile_rank(
            user_value, benchmark_point
        )
        
        # Determine interpretation
        interpretation = self._determine_interpretation(
            user_value, benchmark_point
        )
        
        return BenchmarkComparison(
            metric_name=metric_name,
            user_value=user_value,
            benchmark_value=benchmark_value,
            difference=round(difference, 2),
            percentage_difference=round(percentage_difference, 2),
            percentile_rank=percentile_rank,
            interpretation=interpretation,
            percentile_25=benchmark_point.percentile_25,
            percentile_75=benchmark_point.percentile_75,
            industry=config.industry,
            company_size=config.company_size,
            region=config.region,
            period=benchmark_point.period
        )
    
    def compare_multiple_metrics(
        self,
        user_values: Dict[str, float],
        config: BenchmarkConfig,
        period: Optional[date] = None
    ) -> List[BenchmarkComparison]:
        """
        Compare multiple user metrics to benchmarks.
        
        Args:
            user_values: Dictionary of metric_name -> value
            config: Benchmark configuration
            period: Date period for comparison (None = most recent)
        
        Returns:
            List of BenchmarkComparison objects
        """
        comparisons = []
        for metric_name, user_value in user_values.items():
            try:
                comparison = self.compare_to_benchmark(
                    user_value=user_value,
                    metric_name=metric_name,
                    config=config,
                    period=period
                )
                comparisons.append(comparison)
            except (ValueError, KeyError) as e:
                # Skip metrics that don't have benchmark data
                print(f"Warning: Could not compare {metric_name}: {e}")
                continue
        
        return comparisons
    
    def get_available_industries(self) -> List[str]:
        """Get list of available industries."""
        return self.synthetic_generator.get_available_industries()
    
    def get_available_metrics(self, industry: str) -> List[str]:
        """Get list of available metrics for an industry."""
        return self.synthetic_generator.get_available_metrics(industry)
    
    def get_industry_info(self, industry: str) -> Dict[str, any]:
        """
        Get information about an industry.
        
        Args:
            industry: Industry category
        
        Returns:
            Dictionary with industry information
        """
        metrics = self.get_available_metrics(industry)
        return {
            "industry": industry,
            "available_metrics": metrics,
            "metric_count": len(metrics),
            "supported_sizes": [size.value for size in CompanySize],
            "supported_regions": [region.value for region in Region]
        }
    
    def _generate_cache_key(self, config: BenchmarkConfig) -> str:
        """Generate cache key from config."""
        metrics_str = ",".join(sorted(config.metrics)) if config.metrics else "all"
        return f"{config.industry}_{config.company_size.value}_{config.region.value}_{metrics_str}"
    
    def _find_data_point_for_period(
        self, series: BenchmarkSeries, period: date
    ) -> Optional[BenchmarkDataPoint]:
        """Find data point closest to the requested period."""
        if not series.data_points:
            return None
        
        # Find exact match first
        for dp in series.data_points:
            if dp.period == period:
                return dp
        
        # Find closest match
        closest = min(
            series.data_points,
            key=lambda dp: abs((dp.period - period).days)
        )
        return closest
    
    def _estimate_percentile_rank(
        self, user_value: float, benchmark_point: BenchmarkDataPoint
    ) -> Optional[int]:
        """
        Estimate user's percentile rank based on benchmark distribution.
        
        Args:
            user_value: User's value
            benchmark_point: Benchmark data point with percentiles
        
        Returns:
            Estimated percentile (0-100) or None if insufficient data
        """
        if not benchmark_point.percentile_25 or not benchmark_point.percentile_75:
            return None
        
        # Simple linear interpolation between known percentiles
        if user_value <= benchmark_point.percentile_10:
            return min(10, max(0, int(user_value / benchmark_point.percentile_10 * 10)))
        elif user_value <= benchmark_point.percentile_25:
            # Between 10th and 25th
            ratio = (user_value - benchmark_point.percentile_10) / \
                   (benchmark_point.percentile_25 - benchmark_point.percentile_10)
            return int(10 + ratio * 15)
        elif user_value <= benchmark_point.percentile_50:
            # Between 25th and 50th
            ratio = (user_value - benchmark_point.percentile_25) / \
                   (benchmark_point.percentile_50 - benchmark_point.percentile_25)
            return int(25 + ratio * 25)
        elif user_value <= benchmark_point.percentile_75:
            # Between 50th and 75th
            ratio = (user_value - benchmark_point.percentile_50) / \
                   (benchmark_point.percentile_75 - benchmark_point.percentile_50)
            return int(50 + ratio * 25)
        elif user_value <= benchmark_point.percentile_90:
            # Between 75th and 90th
            ratio = (user_value - benchmark_point.percentile_75) / \
                   (benchmark_point.percentile_90 - benchmark_point.percentile_75)
            return int(75 + ratio * 15)
        else:
            # Above 90th percentile
            return min(99, int(90 + (user_value / benchmark_point.percentile_90 - 1) * 10))
    
    def _determine_interpretation(
        self, user_value: float, benchmark_point: BenchmarkDataPoint
    ) -> BenchmarkInterpretation:
        """
        Determine performance interpretation.
        
        Args:
            user_value: User's value
            benchmark_point: Benchmark data point
        
        Returns:
            BenchmarkInterpretation enum value
        """
        if not benchmark_point.percentile_10 or not benchmark_point.percentile_90:
            # Fallback to simple comparison
            if user_value > benchmark_point.value * 1.15:
                return BenchmarkInterpretation.ABOVE_AVERAGE
            elif user_value < benchmark_point.value * 0.85:
                return BenchmarkInterpretation.BELOW_AVERAGE
            else:
                return BenchmarkInterpretation.AVERAGE
        
        # Use percentile-based interpretation
        if user_value >= benchmark_point.percentile_90:
            return BenchmarkInterpretation.SIGNIFICANTLY_ABOVE
        elif user_value >= benchmark_point.percentile_75:
            return BenchmarkInterpretation.ABOVE_AVERAGE
        elif user_value >= benchmark_point.percentile_25:
            return BenchmarkInterpretation.AVERAGE
        elif user_value >= benchmark_point.percentile_10:
            return BenchmarkInterpretation.BELOW_AVERAGE
        else:
            return BenchmarkInterpretation.SIGNIFICANTLY_BELOW
    
    def clear_cache(self):
        """Clear the benchmark data cache."""
        self._cache.clear()
