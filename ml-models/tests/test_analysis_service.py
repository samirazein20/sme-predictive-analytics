"""
Unit and integration tests for ML Analysis Service
Tests API endpoints and basic functionality
"""

import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api.main import app

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


class TestFastAPIEndpoints:
    """Test FastAPI endpoint functionality"""

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == 200
        assert "SME Analytics ML Services" in response.json()["message"]

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
            json={"data": csv_data}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "insights" in result
        assert "predictions" in result
        assert "trends" in result
        assert "charts_data" in result
        assert "summary_stats" in result

    def test_analyze_endpoint_invalid_data(self):
        """Test analyze endpoint with invalid data"""
        response = client.post(
            "/analyze",
            json={"data": ""}
        )
        
        assert response.status_code == 400 or response.status_code == 422

    def test_analyze_endpoint_missing_fields(self):
        """Test analyze endpoint with missing required fields"""
        response = client.post(
            "/analyze",
            json={}  # Missing required 'data' field
        )
        
        assert response.status_code == 422

    def test_analyze_endpoint_malformed_csv(self):
        """Test analyze endpoint with malformed CSV"""
        csv_data = "Column1\nvalue1\nvalue2"
        
        response = client.post(
            "/analyze",
            json={"data": csv_data}
        )
        
        # Should handle simple CSV gracefully
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
            json={"data": csv_data}
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 5.0, f"Response time {response_time}s exceeds 5s threshold"

    def test_large_dataset_handling(self):
        """Test handling of larger datasets"""
        csv_data = "Date,Revenue,Expenses\n" + "\n".join([
            f"2024-01-01,{10000 + i},{5000 + i}"
            for i in range(1000)  # 1000 rows
        ])
        
        response = client.post(
            "/analyze",
            json={"data": csv_data}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "insights" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
