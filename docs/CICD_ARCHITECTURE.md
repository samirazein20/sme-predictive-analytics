# GitHub Actions CI/CD Pipeline Architecture

## Visual Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    Developer makes changes locally
              ↓
    git add . && git commit -m "..." && git push origin main
              ↓
    ┌─────────────────────────────────────────┐
    │  GitHub Repository (main branch)         │
    └─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS WORKFLOW TRIGGERED                    │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: BUILD & TEST (Parallel Execution)                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │  Backend Build   │  │ ML Services Build│  │  Frontend Build  │        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤        │
│  │ 1. Checkout code │  │ 1. Checkout code │  │ 1. Checkout code │        │
│  │ 2. Setup JDK 17  │  │ 2. Setup Python  │  │ 2. Setup Node.js │        │
│  │ 3. Run Maven test│  │ 3. Run pytest    │  │ 3. Run Jest tests│        │
│  │ 4. Build JAR     │  │ 4. Install deps  │  │ 4. npm ci        │        │
│  │ 5. Docker build  │  │ 5. Docker build  │  │ 5. Docker build  │        │
│  │ 6. Push to ACR   │  │ 6. Push to ACR   │  │ 6. Push to ACR   │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│          ↓                     ↓                      ↓                   │
│  backend:latest & SHA  ml-services:latest  frontend:latest & SHA          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: PUSH TO AZURE CONTAINER REGISTRY                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Azure Container Registry (acrk2mc444oapoak.azurecr.io)                   │
│  ├─ backend:latest                                                         │
│  ├─ backend:<git-sha>                                                      │
│  ├─ ml-services:latest                                                     │
│  ├─ ml-services:<git-sha>                                                  │
│  ├─ frontend:latest                                                        │
│  └─ frontend:<git-sha>                                                     │
│                                                                            │
│  With Docker layer caching for fast rebuilds                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: DEPLOY TO AZURE CONTAINER APPS                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Azure Login (using AZURE_CREDENTIALS secret)                    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                            ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Update Container Apps (Sequential)                              │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  1. Backend Container App                                        │    │
│  │     az containerapp update --image backend:<git-sha>             │    │
│  │                                                                   │    │
│  │  2. ML Services Container App                                    │    │
│  │     az containerapp update --image ml-services:<git-sha>         │    │
│  │                                                                   │    │
│  │  3. Frontend Container App                                       │    │
│  │     az containerapp update --image frontend:<git-sha>            │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: HEALTH VERIFICATION                                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Wait 30s for services to start                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                            ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  curl backend.../api/v1/data/health → ✅ 200 OK                  │    │
│  │  curl ml-services.../health → ✅ 200 OK                          │    │
│  │  curl frontend.../ → ✅ 200 OK                                   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                            ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Display Deployment Summary                                       │    │
│  │  - Image tags deployed                                            │    │
│  │  - Application URLs                                               │    │
│  │  - Health check results                                           │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         ✅ DEPLOYMENT COMPLETE                          │
│                                                                         │
│  🌐 Production URLs:                                                    │
│  - Frontend:     https://frontend.prouddesert-fa0ab96d.eastus...       │
│  - Backend:      https://backend.prouddesert-fa0ab96d.eastus...        │
│  - ML Services:  https://ml-services.prouddesert-fa0ab96d.eastus...    │
└─────────────────────────────────────────────────────────────────────────┘
```

## GitHub Actions Configuration

### Workflow File
`.github/workflows/azure-deploy.yml`

### Trigger Events
```yaml
on:
  push:
    branches: [ main ]        # Auto-trigger on push to main
  workflow_dispatch:          # Manual trigger option
```

### Jobs

#### Job 1: build-backend
```yaml
runs-on: ubuntu-latest
Duration: ~2-3 minutes

Steps:
  ✓ Checkout code
  ✓ Setup JDK 17 with Maven cache
  ✓ Run Maven tests
  ✓ Build JAR package
  ✓ Setup Docker Buildx
  ✓ Login to ACR
  ✓ Build & push Docker image with caching
```

#### Job 2: build-ml-services
```yaml
runs-on: ubuntu-latest
Duration: ~3-4 minutes

Steps:
  ✓ Checkout code
  ✓ Setup Python 3.11 with pip cache
  ✓ Install dependencies
  ✓ Run pytest
  ✓ Setup Docker Buildx
  ✓ Login to ACR
  ✓ Build & push Docker image with caching
```

#### Job 3: build-frontend
```yaml
runs-on: ubuntu-latest
Duration: ~2-3 minutes

Steps:
  ✓ Checkout code
  ✓ Setup Node.js 18 with npm cache
  ✓ Install dependencies (npm ci)
  ✓ Run Jest tests with coverage
  ✓ Setup Docker Buildx
  ✓ Login to ACR
  ✓ Build & push Docker image with caching
```

#### Job 4: deploy-to-azure
```yaml
runs-on: ubuntu-latest
needs: [build-backend, build-ml-services, build-frontend]
Duration: ~3-5 minutes

Steps:
  ✓ Checkout code
  ✓ Azure login with service principal
  ✓ Update backend container app
  ✓ Update ML services container app
  ✓ Update frontend container app
  ✓ Verify backend health
  ✓ Verify ML services health
  ✓ Verify frontend health
  ✓ Display deployment summary
  ✓ Azure logout
```

## Secrets Required

### 1. AZURE_CREDENTIALS
```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "8da562ab-c08a-4469-ac2c-bc6416a9545b",
  "tenantId": "xxx",
  ...
}
```
**Purpose**: Authenticate GitHub Actions to Azure
**Created by**: Service Principal with Contributor role on resource group

### 2. AZURE_ACR_USERNAME
**Purpose**: Login to Azure Container Registry to push images
**Retrieved from**: ACR credential show command

### 3. AZURE_ACR_PASSWORD
**Purpose**: Password for ACR authentication
**Retrieved from**: ACR credential show command

## Environment Variables

Set in workflow file:
```yaml
env:
  AZURE_RESOURCE_GROUP: rg-sme-analytics-prod
  AZURE_CONTAINER_REGISTRY: acrk2mc444oapoak
  AZURE_LOCATION: eastus
  BACKEND_APP: backend
  ML_SERVICES_APP: ml-services
  FRONTEND_APP: frontend
  BACKEND_IMAGE: backend
  ML_SERVICES_IMAGE: ml-services
  FRONTEND_IMAGE: frontend
```

## Docker Image Tagging Strategy

Each image is tagged with **two tags**:

1. **`latest`** - Always points to the most recent build
2. **`<git-sha>`** - Specific commit SHA for traceability

Example:
```
acrk2mc444oapoak.azurecr.io/backend:latest
acrk2mc444oapoak.azurecr.io/backend:abc123def456
```

**Benefits**:
- ✅ Easy rollback to specific commits
- ✅ Traceability from deployed code to source
- ✅ `latest` for development/testing
- ✅ SHA tags for production deployments

## Caching Strategy

### Maven Dependencies
```yaml
uses: actions/setup-java@v4
with:
  cache: 'maven'
```

### Python Dependencies
```yaml
uses: actions/setup-python@v5
with:
  cache: 'pip'
```

### NPM Dependencies
```yaml
uses: actions/setup-node@v4
with:
  cache: 'npm'
```

### Docker Layers
```yaml
cache-from: type=registry,ref=acrk2mc444oapoak.azurecr.io/backend:buildcache
cache-to: type=registry,ref=acrk2mc444oapoak.azurecr.io/backend:buildcache,mode=max
```

## Performance Metrics

### Build Phase (Parallel)
- Backend build: 2-3 min
- ML Services build: 3-4 min
- Frontend build: 2-3 min
- **Total (parallel)**: 4-5 min

### Deployment Phase (Sequential)
- Azure login: 10-20 sec
- Backend deploy: 1-2 min
- ML Services deploy: 1-2 min
- Frontend deploy: 1-2 min
- Health checks: 30 sec
- **Total**: 3-5 min

### Complete Pipeline
- **With cache**: 6-8 minutes
- **Without cache**: 10-12 minutes

## Rollback Procedure

If deployment fails or issues are detected:

```bash
# List all revisions
az containerapp revision list -n backend -g rg-sme-analytics-prod -o table

# Activate previous revision
az containerapp revision activate \
  -n backend \
  -g rg-sme-analytics-prod \
  --revision backend--<previous-revision-name>

# Or deploy specific git SHA
az containerapp update \
  --name backend \
  --resource-group rg-sme-analytics-prod \
  --image acrk2mc444oapoak.azurecr.io/backend:<previous-git-sha>
```

## Monitoring & Alerts

### GitHub Actions Notifications
- Email on workflow failure
- GitHub notification on workflow completion
- PR status checks

### Azure Monitoring
- Application Insights for runtime telemetry
- Container Apps logs for debugging
- Azure Monitor alerts for health failures

## Security Features

### Secrets Management
- ✅ All credentials stored as GitHub Secrets
- ✅ Never exposed in logs or output
- ✅ Scoped to repository only

### Service Principal
- ✅ Least privilege access (Contributor on resource group only)
- ✅ No global admin rights
- ✅ Specific to CI/CD tasks

### Container Registry
- ✅ Admin user only for CI/CD
- ✅ Managed Identity for production apps
- ✅ Image scanning enabled

### Deployment
- ✅ HTTPS-only endpoints
- ✅ Managed identities for inter-service auth
- ✅ Secrets in Azure Key Vault

## Troubleshooting Guide

### Build Failures

| Issue | Solution |
|-------|----------|
| Tests fail | Run tests locally first: `mvn test`, `pytest`, `npm test` |
| Docker build fails | Test locally: `docker build -f Dockerfile .` |
| Out of disk space | Clean Docker cache: `docker system prune -a` |

### Deployment Failures

| Issue | Solution |
|-------|----------|
| Auth failed | Verify `AZURE_CREDENTIALS` secret is correct |
| ACR login failed | Check `AZURE_ACR_USERNAME` and `AZURE_ACR_PASSWORD` |
| App update failed | Verify container app exists and is accessible |

### Health Check Failures

| Issue | Solution |
|-------|----------|
| 500 error | Check application logs with `az containerapp logs` |
| Timeout | Increase wait time or check app startup time |
| Connection refused | Verify ingress is enabled on container app |

## Best Practices

1. **Test Locally First**
   - Always run tests before pushing
   - Build Docker images locally to catch issues early

2. **Small, Frequent Commits**
   - Easier to identify issues
   - Faster rollback if needed

3. **Monitor Deployments**
   - Watch GitHub Actions progress
   - Check health endpoints after deployment

4. **Maintain Secrets**
   - Rotate credentials every 90 days
   - Use Azure Key Vault for production secrets

5. **Review Logs**
   - Check workflow logs for warnings
   - Monitor Azure logs for runtime issues

---

**Setup Time**: ~15 minutes (one-time)  
**Deployment Time**: ~8-10 minutes per push  
**Maintenance**: Minimal (automated)  

**Status**: 🚀 Production-ready CI/CD pipeline
