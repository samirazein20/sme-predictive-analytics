# SME Forecasting Platform

A comprehensive predictive analytics platform designed for Small and Medium Enterprises (SMEs), providing advanced time-series forecasting capabilities powered by machine learning models.

## 🚀 Overview

This platform combines multiple cutting-edge forecasting models with a user-friendly interface to help SMEs make data-driven decisions. The architecture includes:

- **Modern ML Models**: Autoformer, Informer, PatchTST, and foundation models (Moirai, TimesGPT)
- **Microservices Architecture**: Scalable Java Spring Boot API with Python ML services
- **Multi-Tenant Support**: Secure tenant isolation and context management  
- **Cloud-Native Infrastructure**: Kubernetes deployment with Terraform automation
- **Interactive Frontend**: React/TypeScript dashboard for visualization and model management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Java API      │    │  Python Models  │
│  (React/TS)     │◄──►│ (Spring Boot)   │◄──►│   (FastAPI)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Dashboard     │    │ • REST API      │    │ • Autoformer    │
│ • Visualizations│    │ • Authentication│    │ • Informer      │
│ • Model Config  │    │ • Multi-tenancy │    │ • PatchTST      │
│ • Data Upload   │    │ • Data Pipeline │    │ • Foundation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Components

### Backend Services

#### Java API (`backend/api/`)
- **Framework**: Spring Boot with Spring AI integration
- **Features**: 
  - RESTful API endpoints for forecasting operations
  - Multi-tenant security and authentication
  - Data validation and preprocessing coordination
  - Model orchestration and ensemble management
- **Main Classes**:
  - `ApiApplication.java`: Main Spring Boot application
  - `ForecastController.java`: Core forecasting endpoints

#### Tenancy Service (`backend/tenancy/`)
- **Security Configuration**: JWT-based authentication
- **Tenant Context Management**: Isolated data and model access
- **Classes**:
  - `SecurityConfig.java`: Security setup and JWT handling
  - `TenantContext.java`: Tenant isolation logic

### ML Models (`models/`)

#### Core Forecasting Models (`models/python/forecasting/`)
- **Autoformer** (`autoformer.py`): Self-attention mechanism for long-term forecasting
- **Informer** (`informer.py`): Efficient transformer for time-series prediction  
- **PatchTST** (`patchtst.py`): Patch-based time-series transformer
- **Ensemble** (`ensemble.py`): Model combination strategies

#### Foundation Models (`models/python/foundation/`)
- **Moirai Client** (`moirai_client.py`): Salesforce's universal forecasting model
- **TimesGPT Client** (`timesfm_client.py`): Google's foundation model for time-series

#### Data Pipeline (`models/python/data/`)
- **Ingestion** (`ingestion.py`): Data loading and validation
- **Preprocessing** (`preprocess.py`): Feature engineering and normalization

#### Model Services (`models/python/service/`)
- **Inference Server** (`inference_server.py`): FastAPI service for model predictions
- **Cost Guard** (`cost_guard.py`): Resource monitoring and cost optimization

#### Validation (`models/python/validation/`)
- **Zero-shot Evaluation** (`eval_zero_shot.py`): Out-of-sample testing
- **Metrics** (`metrics.py`): Performance evaluation (MAPE, SMAPE, etc.)

### Frontend (`frontend/`)
- **Framework**: React 18 with TypeScript
- **Features**:
  - Interactive forecasting dashboard
  - Time-series data visualization
  - Model performance comparisons
  - Data upload and management interface
  - Real-time prediction monitoring

### Infrastructure (`infra/`)

#### Kubernetes (`infra/k8s/`)
- Production-ready deployment configurations
- Auto-scaling and load balancing
- Service mesh integration ready

#### Terraform (`infra/terraform/`)
- Infrastructure as Code for cloud deployment
- Multi-environment support (dev, staging, prod)
- Automated resource provisioning

#### Hugging Face Endpoints (`infra/hf_endpoints/`)
- Integration with Hugging Face Inference Endpoints
- Model serving optimization configurations

## 🛠️ Quick Start

### Prerequisites
- **Java**: JDK 17 or later
- **Python**: 3.9+ with pip
- **Node.js**: 16+ with npm
- **Docker**: For containerized deployment (optional)

### Local Development Setup

#### 1. Python ML Service
```bash
cd models/python
python -m venv .venv && source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn service.inference_server:app --reload --port 8001
```

#### 2. Java API Backend
```bash
cd backend/api
./gradlew bootRun
# API will be available at http://localhost:8080
```

#### 3. React Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend will be available at http://localhost:3000
```

### Docker Deployment

#### Build and Run ML Service
```bash
cd models
docker build -f docker/Dockerfile.models -t sme-forecasting-models .
docker run -p 8001:8001 sme-forecasting-models
```

#### Build and Run API Service  
```bash
cd backend
docker build -f docker/Dockerfile.api -t sme-forecasting-api .
docker run -p 8080:8080 sme-forecasting-api
```

## 📊 Supported Forecasting Models

| Model | Type | Best For | Key Features |
|-------|------|----------|--------------|
| **Autoformer** | Transformer | Long sequences | Auto-correlation mechanism |
| **Informer** | Transformer | Efficient long-term | ProbSparse attention |
| **PatchTST** | Transformer | Multivariate | Patch-based segmentation |
| **Moirai** | Foundation | Zero-shot | Universal time-series model |
| **TimesGPT** | Foundation | General purpose | Pre-trained on diverse data |
| **Ensemble** | Meta-model | Best accuracy | Combines multiple models |

## 🔧 Configuration

### Environment Variables

Create `.env` files in respective directories:

#### Backend API (`.env`)
```bash
SPRING_PROFILES_ACTIVE=dev
DATABASE_URL=jdbc:postgresql://localhost:5432/forecasting
JWT_SECRET=your-jwt-secret-key
MODEL_SERVICE_URL=http://localhost:8001
```

#### ML Service (`models/python/.env`)
```bash
HUGGINGFACE_API_KEY=your-hf-api-key
MOIRAI_API_ENDPOINT=https://api.salesforce.com/moirai
TIMESGPT_API_KEY=your-timesgpt-key
MODEL_CACHE_SIZE=1000
```

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## 🚀 Deployment

### Kubernetes (Recommended)
```bash
cd infra/k8s
kubectl apply -f deployment.yaml
```

### Terraform (Cloud Infrastructure)
```bash
cd infra/terraform  
terraform init
terraform plan
terraform apply
```

## 📖 API Documentation

- **Swagger UI**: Available at `http://localhost:8080/swagger-ui.html` when API is running
- **Detailed API Docs**: See [docs/api.md](docs/api.md)
- **Architecture Guide**: See [docs/architecture.md](docs/architecture.md)
- **Pilot Programs**: See [docs/pilots.md](docs/pilots.md)

## 🧪 Testing

### Run Backend Tests
```bash
cd backend/api
./gradlew test
```

### Run ML Model Tests
```bash
cd models/python
pytest validation/
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a Pull Request

### Development Guidelines
- Follow conventional commits for commit messages
- Ensure all tests pass before submitting PR
- Update documentation for new features
- Maintain code coverage above 80%

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and community support
- **Documentation**: Check the `docs/` directory for detailed guides

---

**Note**: This platform is designed for SME forecasting needs. For enterprise-scale deployments, additional configuration and scaling considerations may be required.
