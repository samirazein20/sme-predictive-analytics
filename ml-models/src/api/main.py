from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import pandas as pd
import numpy as np
from io import StringIO
import json

app = FastAPI(
    title="SME Analytics ML Services",
    description="Machine Learning services for SME Predictive Analytics Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

class PredictionRequest(BaseModel):
    data: List[float]
    model_type: str = "patchtst"
    horizon: int = 7

class PredictionResponse(BaseModel):
    predictions: List[float]
    confidence: float
    model_used: str

class DataAnalysisRequest(BaseModel):
    data: str  # CSV data as string
    analysis_type: str = "auto"
    
class AnalysisResult(BaseModel):
    trends: Dict[str, Any]
    predictions: List[float]
    insights: List[Dict[str, Any]]
    charts_data: Dict[str, Any]
    summary_stats: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "SME Analytics ML Services", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-services"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Generate predictions using the specified model."""
    # Placeholder implementation
    # In production, this would call actual ML models
    predictions = [100.0 + i * 2.5 for i in range(request.horizon)]
    
    return PredictionResponse(
        predictions=predictions,
        confidence=0.85,
        model_used=request.model_type
    )

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_data(request: DataAnalysisRequest):
    """Perform comprehensive data analysis on uploaded CSV data."""
    try:
        # Parse CSV data
        df = pd.read_csv(StringIO(request.data))
        
        # Generate analysis results
        trends = analyze_trends(df)
        predictions = generate_sample_predictions(df)
        insights = generate_ml_insights(df, request.analysis_type)
        charts_data = prepare_charts_data(df)
        summary_stats = calculate_summary_statistics(df)
        
        return AnalysisResult(
            trends=trends,
            predictions=predictions,
            insights=insights,
            charts_data=charts_data,
            summary_stats=summary_stats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error analyzing data: {str(e)}")

def analyze_trends(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze trends in the data."""
    trends = {}
    
    # Find numeric columns
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    
    for col in numeric_columns[:5]:  # Limit to first 5 numeric columns
        if len(df[col]) > 1:
            values = df[col].values
            # Simple trend calculation
            trend_direction = "increasing" if values[-1] > values[0] else "decreasing"
            change_percent = ((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0
            
            trends[col] = {
                "direction": trend_direction,
                "change_percent": round(change_percent, 2),
                "volatility": round(np.std(values) / np.mean(values) * 100, 2) if np.mean(values) != 0 else 0
            }
    
    return trends

def generate_sample_predictions(df: pd.DataFrame) -> List[float]:
    """Generate sample predictions based on data patterns."""
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if not numeric_columns:
        return [0.0] * 7
    
    # Use the first numeric column for predictions
    main_column = numeric_columns[0]
    values = df[main_column].values
    
    if len(values) < 2:
        return [float(values[0])] * 7 if len(values) == 1 else [0.0] * 7
    
    # Simple trend-based prediction
    trend = (values[-1] - values[0]) / len(values)
    last_value = float(values[-1])
    
    predictions = []
    for i in range(1, 8):  # 7 future predictions
        predicted_value = last_value + (trend * i)
        # Add some realistic variation
        variation = np.random.normal(0, abs(trend) * 0.1)
        predictions.append(float(predicted_value + variation))
    
    return predictions

def generate_ml_insights(df: pd.DataFrame, analysis_type: str) -> List[Dict[str, Any]]:
    """Generate ML-powered insights from the data."""
    insights = []
    
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Data quality insight
    completeness = (df.count().sum() / (len(df) * len(df.columns))) * 100
    insights.append({
        "type": "data_quality",
        "title": "Data Completeness",
        "message": f"Dataset is {completeness:.1f}% complete with {len(df)} records",
        "score": completeness / 100,
        "category": "quality"
    })
    
    # Correlation insight
    if len(numeric_columns) > 1:
        corr_matrix = df[numeric_columns].corr()
        max_corr = corr_matrix.abs().unstack().sort_values(ascending=False)
        # Skip self-correlations (1.0)
        max_corr = max_corr[max_corr < 1.0]
        
        if len(max_corr) > 0:
            insights.append({
                "type": "correlation",
                "title": "Strong Correlations Found",
                "message": f"Highest correlation: {max_corr.iloc[0]:.2f} between variables",
                "score": float(max_corr.iloc[0]),
                "category": "relationship"
            })
    
    # Anomaly detection insight
    for col in numeric_columns[:3]:  # Check first 3 numeric columns
        if len(df[col]) > 10:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = df[(df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))]
            outlier_percentage = len(outliers) / len(df) * 100
            
            insights.append({
                "type": "anomaly",
                "title": f"{col} Outlier Analysis",
                "message": f"{outlier_percentage:.1f}% potential outliers detected in {col}",
                "score": max(0, 1 - outlier_percentage / 10),  # Good if < 10% outliers
                "category": "anomaly"
            })
    
    # Business-specific insights based on analysis type
    if "sales" in analysis_type.lower() or any("revenue" in col.lower() for col in df.columns):
        revenue_cols = [col for col in df.columns if "revenue" in col.lower() or "sales" in col.lower()]
        if revenue_cols:
            total_revenue = df[revenue_cols[0]].sum()
            insights.append({
                "type": "business",
                "title": "Revenue Analysis",
                "message": f"Total revenue: ${total_revenue:,.2f}",
                "score": 0.9,
                "category": "business"
            })
    
    return insights

def prepare_charts_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Prepare data for frontend charts."""
    charts_data = {}
    
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Time series data (if date column exists)
    date_columns = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    
    if date_columns and numeric_columns:
        date_col = date_columns[0]
        value_col = numeric_columns[0]
        
        # Prepare time series data
        chart_data = []
        for idx, row in df.iterrows():
            chart_data.append({
                "date": str(row[date_col]),
                "value": float(row[value_col])
            })
        
        charts_data["timeseries"] = {
            "data": chart_data,
            "x_label": date_col,
            "y_label": value_col
        }
    
    # Distribution data for first numeric column
    if numeric_columns:
        col = numeric_columns[0]
        values = df[col].dropna().values
        
        # Create histogram data
        hist, bins = np.histogram(values, bins=10)
        charts_data["distribution"] = {
            "data": [{"bin": f"{bins[i]:.1f}-{bins[i+1]:.1f}", "count": int(hist[i])} for i in range(len(hist))],
            "column": col
        }
    
    return charts_data

def calculate_summary_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate comprehensive summary statistics."""
    numeric_df = df.select_dtypes(include=[np.number])
    
    if numeric_df.empty:
        return {"message": "No numeric columns found for statistical analysis"}
    
    stats = {}
    for col in numeric_df.columns:
        col_stats = {
            "count": int(numeric_df[col].count()),
            "mean": float(numeric_df[col].mean()),
            "std": float(numeric_df[col].std()),
            "min": float(numeric_df[col].min()),
            "25%": float(numeric_df[col].quantile(0.25)),
            "50%": float(numeric_df[col].median()),
            "75%": float(numeric_df[col].quantile(0.75)),
            "max": float(numeric_df[col].max())
        }
        stats[col] = col_stats
    
    return stats

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
