#!/bin/bash

# Development Environment Setup Script
# This script creates the complete project structure for the SME Predictive Analytics Platform

echo "🏗️  Setting up SME Predictive Analytics Platform project structure..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create project directory structure
echo -e "${BLUE}Creating project directory structure...${NC}"

# Backend directories
mkdir -p backend/src/main/java/com/sme/analytics/{config,controller,service,repository,model,dto,exception,security}
mkdir -p backend/src/main/resources/{db/migration,static,templates}
mkdir -p backend/src/test/java/com/sme/analytics/{controller,service,repository,integration}
mkdir -p backend/src/test/resources

# Frontend directories
mkdir -p frontend/src/{components,pages,hooks,services,utils,types,styles,assets}
mkdir -p frontend/src/components/{common,charts,forms,layout}
mkdir -p frontend/public
mkdir -p frontend/tests/{unit,integration,e2e}

# ML Models directories
mkdir -p ml-models/src/{models,services,utils,api}
mkdir -p ml-models/src/models/{forecasting,reasoning,preprocessing}
mkdir -p ml-models/tests/{unit,integration}
mkdir -p ml-models/notebooks
mkdir -p ml-models/data/{raw,processed,models}

# Infrastructure directories
mkdir -p infrastructure/{terraform,kubernetes,docker}
mkdir -p infrastructure/terraform/{modules,environments}
mkdir -p infrastructure/kubernetes/{deployments,services,ingress,configmaps}

# Documentation directories
mkdir -p docs/{api,user-guides,architecture,development}

# Tests directories
mkdir -p tests/{unit,integration,e2e,performance}

# GitHub directories
mkdir -p .github/{workflows,ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE}

# Configuration directories
mkdir -p config/{development,staging,production}

# Scripts directory
mkdir -p scripts/{deployment,testing,maintenance}

# Monitoring configuration
mkdir -p monitoring/{prometheus,grafana/{dashboards,datasources}}

echo -e "${GREEN}✅ Directory structure created${NC}"

# Create essential files
echo -e "${BLUE}Creating essential configuration files...${NC}"

# Backend pom.xml
cat > backend/pom.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.sme</groupId>
    <artifactId>analytics-platform</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>SME Analytics Platform</name>
    <description>Predictive Analytics Platform for SMEs with Reasoning Models</description>
    
    <properties>
        <java.version>17</java.version>
        <spring-ai.version>0.8.0</spring-ai.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <!-- Spring AI -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-core</artifactId>
            <version>${spring-ai.version}</version>
        </dependency>
        
        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
EOF

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "sme-analytics-frontend",
  "version": "1.0.0",
  "description": "Frontend for SME Predictive Analytics Platform",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^5.1.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@mui/material": "^5.13.0",
    "@mui/icons-material": "^5.13.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.4.0",
    "react-router-dom": "^6.11.0",
    "react-query": "^3.39.0",
    "chart.js": "^4.3.0",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/user-event": "^14.4.0",
    "@types/jest": "^29.5.0",
    "eslint": "^8.43.0",
    "prettier": "^2.8.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css,md}"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# ML Models setup.py
cat > ml-models/setup.py << 'EOF'
from setuptools import setup, find_packages

setup(
    name="sme-analytics-ml",
    version="1.0.0",
    description="Machine Learning models for SME Predictive Analytics Platform",
    author="SME Analytics Team",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=[
        "torch>=2.0.0",
        "transformers>=4.30.0",
        "huggingface-hub>=0.15.0",
        "scikit-learn>=1.3.0",
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "fastapi>=0.100.0",
        "uvicorn[standard]>=0.22.0",
        "pydantic>=2.0.0",
        "sqlalchemy>=2.0.0",
        "psycopg2-binary>=2.9.0",
        "redis>=4.5.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.4.0",
        ],
    },
)
EOF

# GitHub workflow for CI
cat > .github/workflows/ci.yml << 'EOF'
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  PYTHON_VERSION: '3.9'
  NODE_VERSION: '18'
  JAVA_VERSION: '17'

jobs:
  python-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    - name: Run tests
      run: |
        cd ml-models
        python -m pytest tests/ -v

  java-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up JDK
      uses: actions/setup-java@v3
      with:
        java-version: ${{ env.JAVA_VERSION }}
        distribution: 'temurin'
    - name: Run tests
      run: |
        cd backend
        ./mvnw clean test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
EOF

echo -e "${GREEN}✅ Essential configuration files created${NC}"

# Create Docker files
echo -e "${BLUE}Creating Docker configuration files...${NC}"

# Backend Dockerfile
cat > backend/Dockerfile.dev << 'EOF'
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Expose port
EXPOSE 8080 8081

# Run the application
CMD ["./mvnw", "spring-boot:run", "-Dspring-boot.run.profiles=development"]
EOF

# Frontend Dockerfile
cat > frontend/Dockerfile.dev << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
EOF

# ML Models Dockerfile
cat > ml-models/Dockerfile.dev << 'EOF'
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Install the package in development mode
RUN pip install -e .

# Expose port
EXPOSE 8001

# Start the ML services
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
EOF

echo -e "${GREEN}✅ Docker configuration files created${NC}"

# Create initial source files
echo -e "${BLUE}Creating initial source code files...${NC}"

# Backend main application class
cat > backend/src/main/java/com/sme/analytics/AnalyticsPlatformApplication.java << 'EOF'
package com.sme.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AnalyticsPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalyticsPlatformApplication.class, args);
    }
}
EOF

# Frontend main App component
cat > frontend/src/App.tsx << 'EOF'
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
EOF

# ML Models main API
cat > ml-models/src/api/main.py << 'EOF'
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
EOF

echo -e "${GREEN}✅ Initial source code files created${NC}"

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

echo -e "${GREEN}🎉 Project structure setup complete!${NC}"
echo -e "\n${BLUE}Project Structure Overview:${NC}"
echo -e "${YELLOW}📁 backend/${NC}          - Spring AI Framework backend"
echo -e "${YELLOW}📁 frontend/${NC}         - React TypeScript frontend"
echo -e "${YELLOW}📁 ml-models/${NC}        - Python ML models and services"
echo -e "${YELLOW}📁 infrastructure/${NC}   - Docker, Terraform, Kubernetes configs"
echo -e "${YELLOW}📁 docs/${NC}             - Project documentation"
echo -e "${YELLOW}📁 tests/${NC}            - Test suites"
echo -e "${YELLOW}📁 .github/${NC}          - CI/CD workflows"

echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "${BLUE}1.${NC} Run the GitHub setup script: ${YELLOW}./setup-github-repo.sh${NC}"
echo -e "${BLUE}2.${NC} Copy .env.example to .env and configure: ${YELLOW}cp .env.example .env${NC}"
echo -e "${BLUE}3.${NC} Start development environment: ${YELLOW}docker-compose -f docker-compose.dev.yml up -d${NC}"
echo -e "${BLUE}4.${NC} Begin development following the 16-week project plan"