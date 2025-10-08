from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="SME Analytics ML Services",
    description="Machine Learning services for SME Predictive Analytics Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    data: List[float]
    model_type: str = "patchtst"
    horizon: int = 7

class PredictionResponse(BaseModel):
    predictions: List[float]
    confidence: float
    model_used: str

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
