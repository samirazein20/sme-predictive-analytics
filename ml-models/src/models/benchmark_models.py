"""
Benchmark data models for industry comparison and performance evaluation.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum


class CompanySize(str, Enum):
    """Company size categories."""
    SMALL = "small"  # <50 employees
    MEDIUM = "medium"  # 50-250 employees
    LARGE = "large"  # >250 employees


class Region(str, Enum):
    """Geographic regions."""
    NATIONAL = "national"
    NORTHEAST = "northeast"
    SOUTHEAST = "southeast"
    MIDWEST = "midwest"
    WEST = "west"
    SOUTHWEST = "southwest"


class DataSource(str, Enum):
    """Data source types."""
    BLS = "bls"  # Bureau of Labor Statistics
    CENSUS = "census"  # US Census Bureau
    SYNTHETIC = "synthetic"  # Generated synthetic data
    USER_CONTRIBUTED = "user_contributed"  # Anonymized user data


class BenchmarkInterpretation(str, Enum):
    """Performance interpretation relative to benchmark."""
    ABOVE_AVERAGE = "above_average"  # >75th percentile
    AVERAGE = "average"  # 25th-75th percentile
    BELOW_AVERAGE = "below_average"  # <25th percentile
    SIGNIFICANTLY_ABOVE = "significantly_above"  # >90th percentile
    SIGNIFICANTLY_BELOW = "significantly_below"  # <10th percentile


@dataclass
class BenchmarkDataPoint:
    """
    Single data point for a benchmark metric.
    
    Attributes:
        metric_name: Name of the metric (e.g., 'revenue_per_employee')
        value: Mean/average value for this benchmark
        industry: Industry category
        company_size: Size classification
        region: Geographic region
        period: Date/period for this data point
        source: Data source identifier
        percentile_25: First quartile value (optional)
        percentile_50: Median value (optional)
        percentile_75: Third quartile value (optional)
        percentile_90: 90th percentile value (optional)
        percentile_10: 10th percentile value (optional)
        sample_size: Number of companies in benchmark (optional)
        metadata: Additional information about this data point
    """
    metric_name: str
    value: float
    industry: str
    company_size: CompanySize
    region: Region
    period: date
    source: DataSource
    percentile_25: Optional[float] = None
    percentile_50: Optional[float] = None
    percentile_75: Optional[float] = None
    percentile_90: Optional[float] = None
    percentile_10: Optional[float] = None
    sample_size: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "metric_name": self.metric_name,
            "value": self.value,
            "industry": self.industry,
            "company_size": self.company_size.value,
            "region": self.region.value,
            "period": self.period.isoformat(),
            "source": self.source.value,
            "percentile_25": self.percentile_25,
            "percentile_50": self.percentile_50,
            "percentile_75": self.percentile_75,
            "percentile_90": self.percentile_90,
            "percentile_10": self.percentile_10,
            "sample_size": self.sample_size,
            "metadata": self.metadata
        }


@dataclass
class BenchmarkSeries:
    """
    Time series of benchmark data for a specific metric.
    
    Attributes:
        metric_name: Name of the metric
        industry: Industry category
        company_size: Size classification
        region: Geographic region
        data_points: List of benchmark data points over time
        metadata: Additional series-level information
    """
    metric_name: str
    industry: str
    company_size: CompanySize
    region: Region
    data_points: List[BenchmarkDataPoint] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "metric_name": self.metric_name,
            "industry": self.industry,
            "company_size": self.company_size.value,
            "region": self.region.value,
            "data_points": [dp.to_dict() for dp in self.data_points],
            "metadata": self.metadata
        }
    
    def get_latest_value(self) -> Optional[float]:
        """Get the most recent benchmark value."""
        if not self.data_points:
            return None
        latest = max(self.data_points, key=lambda dp: dp.period)
        return latest.value
    
    def get_value_for_period(self, period: date) -> Optional[float]:
        """Get benchmark value for a specific period."""
        for dp in self.data_points:
            if dp.period == period:
                return dp.value
        return None


@dataclass
class BenchmarkComparison:
    """
    Comparison of user value against benchmark.
    
    Attributes:
        metric_name: Name of the metric being compared
        user_value: User's actual value
        benchmark_value: Industry benchmark value (mean)
        difference: Absolute difference (user - benchmark)
        percentage_difference: Percentage difference
        percentile_rank: User's estimated percentile (0-100)
        interpretation: Performance interpretation
        percentile_25: Benchmark 25th percentile
        percentile_75: Benchmark 75th percentile
        industry: Industry category
        company_size: Size classification
        region: Geographic region
        period: Date/period of comparison
    """
    metric_name: str
    user_value: float
    benchmark_value: float
    difference: float
    percentage_difference: float
    percentile_rank: Optional[int] = None
    interpretation: BenchmarkInterpretation = BenchmarkInterpretation.AVERAGE
    percentile_25: Optional[float] = None
    percentile_75: Optional[float] = None
    industry: str = ""
    company_size: CompanySize = CompanySize.SMALL
    region: Region = Region.NATIONAL
    period: Optional[date] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "metric_name": self.metric_name,
            "user_value": self.user_value,
            "benchmark_value": self.benchmark_value,
            "difference": self.difference,
            "percentage_difference": self.percentage_difference,
            "percentile_rank": self.percentile_rank,
            "interpretation": self.interpretation.value,
            "percentile_25": self.percentile_25,
            "percentile_75": self.percentile_75,
            "industry": self.industry,
            "company_size": self.company_size.value,
            "region": self.region.value,
            "period": self.period.isoformat() if self.period else None
        }
    
    def get_interpretation_text(self) -> str:
        """Get human-readable interpretation."""
        if self.interpretation == BenchmarkInterpretation.SIGNIFICANTLY_ABOVE:
            return f"Significantly above industry average (top 10%). Your {self.metric_name} is {abs(self.percentage_difference):.1f}% higher than the benchmark."
        elif self.interpretation == BenchmarkInterpretation.ABOVE_AVERAGE:
            return f"Above industry average. Your {self.metric_name} is {abs(self.percentage_difference):.1f}% higher than the benchmark."
        elif self.interpretation == BenchmarkInterpretation.AVERAGE:
            return f"Within industry average range. Your {self.metric_name} is close to the benchmark ({abs(self.percentage_difference):.1f}% difference)."
        elif self.interpretation == BenchmarkInterpretation.BELOW_AVERAGE:
            return f"Below industry average. Your {self.metric_name} is {abs(self.percentage_difference):.1f}% lower than the benchmark."
        elif self.interpretation == BenchmarkInterpretation.SIGNIFICANTLY_BELOW:
            return f"Significantly below industry average (bottom 10%). Your {self.metric_name} is {abs(self.percentage_difference):.1f}% lower than the benchmark."
        return "Unable to interpret benchmark comparison."


@dataclass
class BenchmarkConfig:
    """
    Configuration for benchmark data requests.
    
    Attributes:
        industry: Industry category
        company_size: Size classification
        region: Geographic region
        metrics: List of metric names to fetch
        start_date: Start date for time series (optional)
        end_date: End date for time series (optional)
    """
    industry: str
    company_size: CompanySize
    region: Region
    metrics: List[str] = field(default_factory=list)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "industry": self.industry,
            "company_size": self.company_size.value,
            "region": self.region.value,
            "metrics": self.metrics,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None
        }
