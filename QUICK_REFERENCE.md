# SME Analytics - Azure Deployment Quick Reference

## 🌐 Service URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend | https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io | ✅ Running |
| ML Services | https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io | ✅ Running |
| Frontend | https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io | ⏳ Hello-World Image |

## 🔑 Key Resources

| Resource | Name/Endpoint |
|----------|---------------|
| Resource Group | rg-sme-analytics-prod |
| Container Registry | acrk2mc444oapoak.azurecr.io |
| PostgreSQL Server | psqlk2mc444oapoak.postgres.database.azure.com:5432 |
| Redis Cache | rdsk2mc444oapoak.redis.cache.windows.net:6380 |
| Key Vault | kvk2mc444oapoak.vault.azure.net |
| Managed Identity Client ID | 3845c6a7-55f4-4588-b50b-15094a305843 |

## 💚 Health Checks

```bash
# Backend
curl https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/api/v1/data/health
# Response: Data Analysis Service is healthy

# ML Services
curl https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/health
# Response: {"status":"healthy","service":"ml-services"}
```

## 🏗️ Complete Frontend Deployment

```bash
# 1. Build frontend image
cd frontend
docker build -t sme-frontend:latest -f Dockerfile .

# 2. Tag for ACR
docker tag sme-frontend:latest acrk2mc444oapoak.azurecr.io/frontend:latest

# 3. Login to ACR (if not already logged in)
az acr login --name acrk2mc444oapoak

# 4. Push to ACR
docker push acrk2mc444oapoak.azurecr.io/frontend:latest

# 5. Update Container App
az containerapp update \
  --name frontend \
  --resource-group rg-sme-analytics-prod \
  --image acrk2mc444oapoak.azurecr.io/frontend:latest
```

## 📊 View Logs

```bash
# Backend
az containerapp logs show --name backend --resource-group rg-sme-analytics-prod --follow

# ML Services  
az containerapp logs show --name ml-services --resource-group rg-sme-analytics-prod --follow

# Frontend
az containerapp logs show --name frontend --resource-group rg-sme-analytics-prod --follow
```

## 🗑️ Cleanup (Delete All Resources)

```bash
az group delete --name rg-sme-analytics-prod --yes --no-wait
```

## 💰 Estimated Monthly Cost

~$90-170 USD/month

---

**Deployment Date**: 2025-10-19  
**Status**: Backend and ML Services Running ✅  
**Pending**: Frontend image deployment ⏳
