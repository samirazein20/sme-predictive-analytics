# SME Predictive Analytics Platform

## 🚀 Azure Deployment Status

**✅ DEPLOYED TO AZURE!**

The application is now running on Azure Container Apps with automated CI/CD:

- **Frontend**: https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io ✅
- **Backend**: https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io ✅
- **ML Services**: https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io ✅

� **CI/CD Pipeline**: Automated deployment via GitHub Actions on push to `main`

�📖 **Deployment Documentation**:
- [Deployment Success Summary](./DEPLOYMENT_SUCCESS.md) - Complete deployment overview
- [GitHub Actions Setup](./docs/GITHUB_ACTIONS_SETUP.md) - CI/CD configuration guide
- [CI/CD Quick Reference](./docs/CICD_QUICK_REFERENCE.md) - Common commands and troubleshooting
- [Quick Reference](./QUICK_REFERENCE.md) - URLs and common commands
- [Complete Deployment Details](./AZURE_DEPLOYMENT_COMPLETE.md) - Full deployment summary

## Project Overview
This repository contains the complete implementation of the SME Predictive Analytics Platform with Reasoning Models, designed to provide small and medium enterprises with advanced forecasting capabilities using state-of-the-art transformer models and reasoning AI.

## Quick Start Guide

### Prerequisites
- Python 3.9+
- Java 17+
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 7+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/samirazein20/sme-predictive-analytics.git
cd sme-predictive-analytics
```

2. **Set up Python environment**
```bash
python -m venv sme-analytics-env
source sme-analytics-env/bin/activate  # On Windows: sme-analytics-env\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker Compose**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. **Initialize database**
```bash
cd backend
./mvnw flyway:migrate
```

6. **Start development servers**
```bash
# Backend (Terminal 1)
cd backend
./mvnw spring-boot:run

# Frontend (Terminal 2)
cd frontend
npm install
npm start

# ML Services (Terminal 3)
cd ml-models
python -m uvicorn main:app --reload --port 8001
```

## Architecture Overview

### System Components
- **Backend**: Spring AI Framework with REST APIs
- **Frontend**: React TypeScript with Material-UI
- **ML Models**: Python-based forecasting and reasoning models
- **Database**: PostgreSQL for data storage
- **Cache**: Redis for session and result caching
- **Message Queue**: Redis for async task processing

### Technology Stack
- **Forecasting Models**: PatchTST, Autoformer, Informer, TimesFM, Moirai-MoE
- **Reasoning Models**: Llama-3.1-8b-Chain-Of-Thought, GPT2-ChainOfThought
- **Explainability**: SHAP, LIME, attention visualization
- **Deployment**: Docker, Kubernetes, Cloud platforms

## Development Workflow

### Environment Configuration

The application uses environment-specific configuration for local development and production deployment:

**Local Development**:
- Frontend automatically uses `http://localhost:8080` for backend
- ML services at `http://localhost:8001`
- Configuration in `frontend/.env.development`

**Production Deployment**:
- Frontend uses Azure Container Apps URLs
- Backend: `https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io`
- ML Services: `https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io`
- Configuration in `frontend/.env.production`

For detailed environment setup, see [Environment Configuration Guide](docs/ENVIRONMENT_CONFIGURATION.md).

### Local Development

### CI/CD Pipeline

**Automated Deployment**:
Every push to `main` triggers an automated build and deployment pipeline:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions automatically:
# 1. Runs tests for all services
# 2. Builds Docker images
# 3. Pushes to Azure Container Registry
# 4. Deploys to Azure Container Apps
# 5. Verifies health endpoints
```

**Setup CI/CD** (one-time):
```bash
# Run automated setup script
./scripts/setup-github-secrets.sh

# Or follow manual setup guide
See: docs/GITHUB_ACTIONS_SETUP.md
```

**Monitor Deployments**:
- GitHub Actions: https://github.com/samirazein20/sme-predictive-analytics/actions
- Quick Reference: `docs/CICD_QUICK_REFERENCE.md`

### Branching Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Emergency fixes

### Code Quality
- Python: Black, Flake8, MyPy
- Java: Checkstyle, SpotBugs, PMD
- Frontend: ESLint, Prettier, TypeScript

### Testing
- Unit tests: pytest (Python), JUnit 5 (Java), Jest (Frontend)
- Integration tests: TestContainers, Docker Compose
- E2E tests: Playwright

## API Documentation
- REST API: Available at `/swagger-ui` when running locally
- GraphQL: Available at `/graphiql` for complex queries

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support and questions, please contact the development team or create an issue in the repository.

## Academic Context
This project is part of a Computer Science Engineering capstone program, focusing on democratizing AI-powered analytics for small and medium enterprises. The research contribution includes novel approaches to integrating transformer-based forecasting with reasoning models for explainable business intelligence.

## Acknowledgments
- SME Advisory Board for real-world insights and testing
- Academic advisor for guidance and support
- Open source community for foundational tools and libraries