# SME Predictive Analytics Platform

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
git clone https://github.com/deniskisina/sme-predictive-analytics.git
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