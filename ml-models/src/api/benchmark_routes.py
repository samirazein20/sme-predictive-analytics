"""
FastAPI routes for benchmark data API.
"""

from datetime import date
from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ...models.benchmark_models import (
    BenchmarkConfig,
    CompanySize,
    Region
)
from ...services.benchmark_service import BenchmarkService


# Request/Response models
class BenchmarkRequest(BaseModel):
    """Request model for benchmark data."""
    industry: str = Field(..., description="Industry category")
    company_size: str = Field(..., description="Company size (small, medium, large)")
    region: str = Field(..., description="Geographic region")
    metrics: Optional[List[str]] = Field(None, description="List of metric names (null = all)")
    start_date: Optional[date] = Field(None, description="Start date for time series")
    end_date: Optional[date] = Field(None, description="End date for time series")


class ComparisonRequest(BaseModel):
    """Request model for benchmark comparison."""
    user_values: Dict[str, float] = Field(..., description="Dictionary of metric_name -> value")
    industry: str = Field(..., description="Industry category")
    company_size: str = Field(..., description="Company size (small, medium, large)")
    region: str = Field(..., description="Geographic region")
    period: Optional[date] = Field(None, description="Period for comparison (null = most recent)")


class BenchmarkSeriesResponse(BaseModel):
    """Response model for benchmark series."""
    metric_name: str
    industry: str
    company_size: str
    region: str
    data_points: List[Dict]
    metadata: Dict


class BenchmarkComparisonResponse(BaseModel):
    """Response model for benchmark comparison."""
    metric_name: str
    user_value: float
    benchmark_value: float
    difference: float
    percentage_difference: float
    percentile_rank: Optional[int]
    interpretation: str
    percentile_25: Optional[float]
    percentile_75: Optional[float]
    industry: str
    company_size: str
    region: str
    period: Optional[date]
    interpretation_text: str


class IndustryInfoResponse(BaseModel):
    """Response model for industry information."""
    industry: str
    available_metrics: List[str]
    metric_count: int
    supported_sizes: List[str]
    supported_regions: List[str]


# Create router
router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])

# Initialize service
benchmark_service = BenchmarkService()


@router.get("/industries")
async def get_industries() -> Dict[str, List[str]]:
    """
    Get list of available industries.
    
    Returns:
        Dictionary with list of industry names
    """
    try:
        industries = benchmark_service.get_available_industries()
        return {
            "industries": industries,
            "count": len(industries)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/industries/{industry}")
async def get_industry_info(industry: str) -> IndustryInfoResponse:
    """
    Get detailed information about an industry.
    
    Args:
        industry: Industry category
    
    Returns:
        Industry information including available metrics
    """
    try:
        info = benchmark_service.get_industry_info(industry)
        return IndustryInfoResponse(**info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{industry}")
async def get_industry_metrics(industry: str) -> Dict[str, List[str]]:
    """
    Get list of available metrics for an industry.
    
    Args:
        industry: Industry category
    
    Returns:
        Dictionary with list of metric names
    """
    try:
        metrics = benchmark_service.get_available_metrics(industry)
        if not metrics:
            raise HTTPException(
                status_code=404,
                detail=f"Industry '{industry}' not found or has no metrics"
            )
        return {
            "industry": industry,
            "metrics": metrics,
            "count": len(metrics)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/data")
async def get_benchmark_data(request: BenchmarkRequest) -> List[BenchmarkSeriesResponse]:
    """
    Get benchmark data based on configuration.
    
    Args:
        request: Benchmark request configuration
    
    Returns:
        List of benchmark series with data points
    """
    try:
        # Parse company size and region enums
        try:
            company_size = CompanySize(request.company_size.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid company_size: {request.company_size}. Must be: small, medium, or large"
            )
        
        try:
            region = Region(request.region.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid region: {request.region}. Must be: national, northeast, southeast, midwest, west, or southwest"
            )
        
        # Create config
        config = BenchmarkConfig(
            industry=request.industry,
            company_size=company_size,
            region=region,
            metrics=request.metrics,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        # Get benchmark data
        series_list = benchmark_service.get_benchmark_data(config)
        
        # Convert to response format
        response = []
        for series in series_list:
            response.append(BenchmarkSeriesResponse(
                metric_name=series.metric_name,
                industry=series.industry,
                company_size=series.company_size.value,
                region=series.region.value,
                data_points=[dp.to_dict() for dp in series.data_points],
                metadata=series.metadata
            ))
        
        return response
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_to_benchmark(request: ComparisonRequest) -> List[BenchmarkComparisonResponse]:
    """
    Compare user values to industry benchmarks.
    
    Args:
        request: Comparison request with user values and configuration
    
    Returns:
        List of benchmark comparisons
    """
    try:
        # Parse company size and region enums
        try:
            company_size = CompanySize(request.company_size.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid company_size: {request.company_size}. Must be: small, medium, or large"
            )
        
        try:
            region = Region(request.region.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid region: {request.region}. Must be: national, northeast, southeast, midwest, west, or southwest"
            )
        
        # Create config
        config = BenchmarkConfig(
            industry=request.industry,
            company_size=company_size,
            region=region
        )
        
        # Compare metrics
        comparisons = benchmark_service.compare_multiple_metrics(
            user_values=request.user_values,
            config=config,
            period=request.period
        )
        
        # Convert to response format
        response = []
        for comp in comparisons:
            response.append(BenchmarkComparisonResponse(
                metric_name=comp.metric_name,
                user_value=comp.user_value,
                benchmark_value=comp.benchmark_value,
                difference=comp.difference,
                percentage_difference=comp.percentage_difference,
                percentile_rank=comp.percentile_rank,
                interpretation=comp.interpretation.value,
                percentile_25=comp.percentile_25,
                percentile_75=comp.percentile_75,
                industry=comp.industry,
                company_size=comp.company_size.value,
                region=comp.region.value,
                period=comp.period,
                interpretation_text=comp.get_interpretation_text()
            ))
        
        return response
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cache")
async def clear_cache() -> Dict[str, str]:
    """
    Clear the benchmark data cache.
    
    Returns:
        Success message
    """
    try:
        benchmark_service.clear_cache()
        return {"status": "success", "message": "Cache cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint.
    
    Returns:
        Service status
    """
    return {
        "status": "healthy",
        "service": "benchmark-api",
        "version": "1.0.0"
    }
