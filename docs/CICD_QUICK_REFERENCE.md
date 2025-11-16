# CI/CD Quick Reference

## 🚀 Quick Start

### 1. Set Up Secrets (One-Time Setup)

```bash
# Run automated setup script
./scripts/setup-github-secrets.sh

# Or manually add these secrets to GitHub:
# https://github.com/samirazein20/sme-predictive-analytics/settings/secrets/actions
```

**Required Secrets**:
- `AZURE_CREDENTIALS` - Service principal JSON
- `AZURE_ACR_USERNAME` - Container registry username
- `AZURE_ACR_PASSWORD` - Container registry password

### 2. Deploy Code

```bash
# Automatic deployment on push to main
git add .
git commit -m "Your changes"
git push origin main

# Or trigger manually in GitHub Actions tab
```

## 📋 Workflow Overview

```
┌─────────────┐
│ Git Push    │
│ to main     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│  Build & Test (Parallel)         │
├──────────┬──────────┬────────────┤
│ Backend  │ ML Svc   │ Frontend   │
│ ├─Test   │ ├─Test   │ ├─Test     │
│ └─Build  │ └─Build  │ └─Build    │
└──────────┴──────────┴────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Push to ACR                     │
│  ├─ backend:latest & SHA         │
│  ├─ ml-services:latest & SHA     │
│  └─ frontend:latest & SHA        │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Deploy to Azure                 │
│  ├─ Update backend               │
│  ├─ Update ml-services           │
│  └─ Update frontend              │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Verify Health                   │
│  ├─ Backend /health ✓            │
│  ├─ ML Services /health ✓        │
│  └─ Frontend / ✓                 │
└──────────────────────────────────┘
       │
       ▼
    ✅ Done!
```

## 🔍 Monitoring Deployments

### GitHub Actions
```
Go to: https://github.com/samirazein20/sme-predictive-analytics/actions
```

### View Workflow Run
1. Click on latest workflow run
2. Monitor each job's progress
3. View detailed logs per step

### Azure Container Apps
```bash
# Check deployment status
az containerapp show -n backend -g rg-sme-analytics-prod \
  --query "properties.{status:runningStatus,provisioning:provisioningState}"

# List revisions
az containerapp revision list -n backend -g rg-sme-analytics-prod -o table

# View logs
az containerapp logs show -n backend -g rg-sme-analytics-prod --follow
```

## ⚡ Common Commands

### Manual Workflow Trigger
```bash
# Using GitHub CLI
gh workflow run azure-deploy.yml

# Or go to Actions tab and click "Run workflow"
```

### Check Secrets
```bash
# List configured secrets
gh secret list

# Set a secret
gh secret set AZURE_CREDENTIALS < azure-creds.json
```

### Rollback Deployment
```bash
# List revisions
az containerapp revision list -n backend -g rg-sme-analytics-prod -o table

# Activate previous revision
az containerapp revision activate \
  -n backend \
  -g rg-sme-analytics-prod \
  --revision backend--<previous-revision-name>
```

## 🐛 Troubleshooting

### Build Failed
```bash
# Test locally first
cd backend && ./mvnw clean test
cd ml-models && pytest tests/
cd frontend && npm test

# Test Docker build
docker build -t test -f backend/Dockerfile backend/
```

### Authentication Failed
```bash
# Verify Azure credentials
az account show

# Verify service principal
az ad sp show --id <app-id>

# Recreate service principal
./scripts/setup-github-secrets.sh
```

### Deployment Failed
```bash
# Check container app status
az containerapp show -n backend -g rg-sme-analytics-prod

# View recent logs
az containerapp logs show -n backend -g rg-sme-analytics-prod --tail 100

# Check revision status
az containerapp revision list -n backend -g rg-sme-analytics-prod -o table
```

### Health Check Failed
```bash
# Test health endpoints
curl https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/api/v1/data/health
curl https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/health
curl https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io

# View application logs
az containerapp logs show -n backend -g rg-sme-analytics-prod --follow
```

## 📊 Workflow Jobs

### Job 1: build-backend
- Set up JDK 17
- Run Maven tests
- Build JAR with Maven
- Build Docker image
- Push to ACR with tags: `latest` and `<SHA>`

### Job 2: build-ml-services
- Set up Python 3.11
- Run pytest
- Build Docker image
- Push to ACR with tags: `latest` and `<SHA>`

### Job 3: build-frontend
- Set up Node.js 18
- Run Jest tests
- Build React production bundle
- Build Docker image with nginx
- Push to ACR with tags: `latest` and `<SHA>`

### Job 4: deploy-to-azure
- Login to Azure
- Update backend container app
- Update ml-services container app
- Update frontend container app
- Verify all health endpoints
- Show deployment summary

## 🎯 Environment Variables

Set in workflow file (`.github/workflows/azure-deploy.yml`):

```yaml
env:
  AZURE_RESOURCE_GROUP: rg-sme-analytics-prod
  AZURE_CONTAINER_REGISTRY: acrk2mc444oapoak
  AZURE_LOCATION: eastus
  BACKEND_APP: backend
  ML_SERVICES_APP: ml-services
  FRONTEND_APP: frontend
```

## 📈 Performance

### Build Times (Typical)
- Backend: ~2-3 minutes
- ML Services: ~3-4 minutes
- Frontend: ~2-3 minutes
- **Total (parallel)**: ~4-5 minutes

### Deployment Times
- Container app update: ~1-2 minutes per service
- Health check verification: ~30 seconds
- **Total deployment**: ~3-5 minutes

### Overall Pipeline
- **Complete CI/CD**: ~8-10 minutes
- With caching enabled: ~6-8 minutes

## 🔐 Security Checklist

- [ ] Secrets configured in GitHub (not in code)
- [ ] Service principal has minimum required permissions
- [ ] ACR admin user enabled only for CI/CD
- [ ] Branch protection enabled on `main`
- [ ] Require PR reviews before merging
- [ ] Secrets rotated regularly (every 90 days)

## 📚 Resources

- **Workflow File**: `.github/workflows/azure-deploy.yml`
- **Setup Guide**: `docs/GITHUB_ACTIONS_SETUP.md`
- **Setup Script**: `scripts/setup-github-secrets.sh`
- **GitHub Actions**: https://github.com/samirazein20/sme-predictive-analytics/actions

## 🎉 Success Criteria

After deployment completes:

```bash
# All health checks pass
curl https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/api/v1/data/health
# Response: {"status":"UP"}

curl https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/health
# Response: {"status":"healthy"}

curl https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io
# Response: HTML with React app

# Container apps running
az containerapp list -g rg-sme-analytics-prod \
  --query "[].{name:name,status:properties.runningStatus}" -o table
# All show "Running"
```

---

**Status**: 🚀 CI/CD Pipeline Ready

**Next**: Push code to `main` branch to trigger automatic deployment!
