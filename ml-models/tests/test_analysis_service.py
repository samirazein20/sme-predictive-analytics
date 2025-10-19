"""
Unit and integration tests for ML Analysis Service
Tests data preprocessing, analysis functions, and FastAPI endpoints
"""

import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api.main import app, calculate_trend, detect_outliers, generate_insights

client = TestClient(app)


class TestDataPreprocessing:
    """Test data preprocessing and cleaning functions"""

    def test_dataframe_creation(self):
        """Test creating DataFrame from CSV data"""
        data = {
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Revenue': [10000, 12000, 11000],
            'Expenses': [5000, 6000, 5500]
        }
        df = pd.DataFrame(data)
        
        assert len(df) == 3
        assert 'Revenue' in df.columns
        assert 'Expenses' in df.columns
        assert df['Revenue'].sum() == 33000

    def test_missing_data_handling(self):
        """Test handling of missing values"""
        data = {
            'Revenue': [10000, np.nan, 11000],
            'Expenses': [5000, 6000, np.nan]
        }
        df = pd.DataFrame(data)
        
        # Check for NaN values
        assert df['Revenue'].isna().sum() == 1
        assert df['Expenses'].isna().sum() == 1
        
        # Fill missing values
        df_filled = df.fillna(df.mean())
        assert df_filled['Revenue'].isna().sum() == 0

    def test_data_type_validation(self):
        """Test data type conversions"""
        data = {
            'Date': ['2024-01-01', '2024-01-02'],
            'Revenue': ['10000', '12000'],  # String values
        }
        df = pd.DataFrame(data)
        
        # Convert to numeric
        df['Revenue'] = pd.to_numeric(df['Revenue'])
        assert df['Revenue'].dtype == np.int64 or df['Revenue'].dtype == np.float64


class TestTrendAnalysis:
    """Test trend calculation functions"""

    def test_calculate_trend_positive(self):
        """Test trend calculation with increasing values"""
        values = [100, 110, 120, 130, 140]
        trend = calculate_trend(values)
        
        assert trend > 0, "Trend should be positive for increasing values"
        assert isinstance(trend, (int, float))

    def test_calculate_trend_negative(self):
        """Test trend calculation with decreasing values"""
        values = [140, 130, 120, 110, 100]
        trend = calculate_trend(values)
        
        assert trend < 0, "Trend should be negative for decreasing values"

    def test_calculate_trend_stable(self):
        """Test trend calculation with stable values"""
        values = [100, 100, 100, 100, 100]
        trend = calculate_trend(values)
        
        assert abs(trend) < 0.01, "Trend should be near zero for stable values"

    def test_calculate_trend_empty(self):
        """Test trend calculation with empty list"""
        values = []
        trend = calculate_trend(values)
        
        assert trend == 0, "Trend should be 0 for empty list"


class TestOutlierDetection:
    """Test outlier detection functions"""

    def test_detect_outliers_present(self):
        """Test outlier detection when outliers exist"""
        values = [100, 105, 110, 108, 500, 107, 109]  # 500 is outlier
        outliers = detect_outliers(values)
        
        assert len(outliers) > 0, "Should detect outliers"
        assert 500 in [val for idx, val in outliers]

    def test_detect_outliers_none(self):
        """Test outlier detection with no outliers"""
        values = [100, 105, 110, 108, 107, 109, 111]
        outliers = detect_outliers(values)
        
        assert len(outliers) == 0 or len(outliers) <= 1, "Should detect few or no outliers"

    def test_detect_outliers_empty(self):
        """Test outlier detection with empty list"""
        values = []
        outliers = detect_outliers(values)
        
        assert outliers == [], "Should return empty list for empty input"


class TestInsightGeneration:
    """Test insight generation functions"""

    def test_generate_insights_complete_data(self):
        """Test insight generation with complete dataset"""
        data = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Revenue': [10000, 12000, 11000],
            'Expenses': [5000, 6000, 5500]
        })
        
        insights = generate_insights(data)
        
        assert 'summary' in insights
        assert 'trends' in insights
        assert 'recommendations' in insights
        assert isinstance(insights['summary'], dict)

    def test_generate_insights_calculations(self):
        """Test statistical calculations in insights"""
        data = pd.DataFrame({
            'Revenue': [10000, 12000, 11000],
            'Expenses': [5000, 6000, 5500]
        })
        
        insights = generate_insights(data)
        
        # Verify calculations
        assert insights['summary']['total_revenue'] == 33000
        assert insights['summary']['total_expenses'] == 16500
        assert insights['summary']['net_profit'] == 16500


class TestFastAPIEndpoints:
    """Test FastAPI endpoint functionality"""

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == 200
        assert "ML Analysis Service" in response.json()["message"]

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_analyze_endpoint_valid_data(self):
        """Test analyze endpoint with valid CSV data"""
        csv_data = "Date,Revenue,Expenses\n2024-01-01,10000,5000\n2024-01-02,12000,6000\n2024-01-03,11000,5500"
        
        response = client.post(
            "/analyze",
            json={"data": csv_data, "session_id": "test-123"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "insights" in result
        assert "session_id" in result
        assert result["session_id"] == "test-123"

    def test_analyze_endpoint_invalid_data(self):
        """Test analyze endpoint with invalid data"""
        response = client.post(
            "/analyze",
            json={"data": "", "session_id": "test-123"}
        )
        
        assert response.status_code == 400 or response.status_code == 422

    def test_analyze_endpoint_missing_fields(self):
        """Test analyze endpoint with missing required fields"""
        response = client.post(
            "/analyze",
            json={"data": "some data"}  # Missing session_id
        )
        
        assert response.status_code == 422

    def test_analyze_endpoint_malformed_csv(self):
        """Test analyze endpoint with malformed CSV"""
        csv_data = "Invalid,CSV,Format\n,,"
        
        response = client.post(
            "/analyze",
            json={"data": csv_data, "session_id": "test-123"}
        )
        
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]


class TestPerformance:
    """Test performance metrics"""

    def test_analyze_response_time(self):
        """Test that analysis completes within acceptable time"""
        import time
        
        csv_data = "Date,Revenue,Expenses\n" + "\n".join([
            f"2024-01-{i:02d},{10000 + i * 100},{5000 + i * 50}"
            for i in range(1, 101)  # 100 rows
        ])
        
        start_time = time.time()
        response = client.post(
            "/analyze",
            json={"data": csv_data, "session_id": "perf-test"}
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 2.0, f"Response time {response_time}s exceeds 2s threshold"

    def test_large_dataset_handling(self):
        """Test handling of larger datasets"""
        csv_data = "Date,Revenue,Expenses\n" + "\n".join([
            f"2024-01-01,{10000 + i},{5000 + i}"
            for i in range(1000)  # 1000 rows
        ])
        
        response = client.post(
            "/analyze",
            json={"data": csv_data, "session_id": "large-test"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "insights" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
