# Complete Frontend Deployment - Step by Step

## Current Status

✅ Infrastructure deployed  
✅ Frontend container app created  
✅ Frontend Dockerfile created and tested  
✅ ACR authentication configured  
⏳ **Pending**: Build and push frontend Docker image

## Prerequisites

- Stable internet connection (npm package installation is ~200MB)
- Docker Desktop running
- Sufficient disk space (~2GB for build)
- Azure CLI authenticated (already done)

## Option 1: Local Build (Recommended)

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Build Docker Image
This step takes 5-10 minutes due to npm package installation.

```bash
docker build -t sme-frontend:latest -f Dockerfile .
```

**Expected output**:
```
[+] Building 300.0s (17/17) DONE
 => [builder 1/6] FROM docker.io/library/node:18-alpine
 => [builder 2/6] WORKDIR /app
 => [builder 3/6] COPY package*.json ./
 => [builder 4/6] RUN npm ci --legacy-peer-deps
 => [builder 5/6] COPY . .
 => [builder 6/6] RUN npm run build
 => [stage-1 1/4] FROM docker.io/library/nginx:1.25-alpine
 => [stage-1 2/4] COPY frontend/nginx.conf /etc/nginx/nginx.conf
 => [stage-1 3/4] COPY --from=builder /app/build /usr/share/nginx/html
 => [stage-1 4/4] RUN chown -R nginx:nginx /usr/share/nginx/html
 => exporting to image
 => => naming to sme-frontend:latest
```

**If build fails**, troubleshoot:
- Check Docker Desktop has enough resources (Settings → Resources → set Memory to 4GB+)
- Ensure network connection is stable
- Clear Docker build cache: `docker builder prune`

### Step 3: Verify Image Built
```bash
docker images | grep sme-frontend
```

Expected output:
```
sme-frontend    latest    abc123def456    2 minutes ago    50MB
```

### Step 4: Tag for Azure Container Registry
```bash
docker tag sme-frontend:latest acrk2mc444oapoak.azurecr.io/frontend:latest
```

### Step 5: Login to ACR (if session expired)
```bash
az acr login --name acrk2mc444oapoak
```

Expected output:
```
Login Succeeded
```

### Step 6: Push to Azure Container Registry
```bash
docker push acrk2mc444oapoak.azurecr.io/frontend:latest
```

Expected output (takes 2-3 minutes):
```
The push refers to repository [acrk2mc444oapoak.azurecr.io/frontend]
abc123: Pushed
def456: Pushed
ghi789: Pushed
latest: digest: sha256:... size: 1234
```

### Step 7: Update Container App
```bash
az containerapp update \
  --name frontend \
  --resource-group rg-sme-analytics-prod \
  --image acrk2mc444oapoak.azurecr.io/frontend:latest
```

Expected output (takes 1-2 minutes):
```json
{
  "name": "frontend",
  "properties": {
    "provisioningState": "Succeeded",
    "runningStatus": "Running",
    "latestRevisionName": "frontend--0000002"
  }
}
```

### Step 8: Wait for Deployment (30-60 seconds)
```bash
# Check status
az containerapp show \
  --name frontend \
  --resource-group rg-sme-analytics-prod \
  --query "{status: properties.runningStatus, revision: properties.latestRevisionName}" \
  -o table
```

### Step 9: Test Frontend
```bash
# Check health
curl https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/health

# Or open in browser
open https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io
```

Expected: React application loads with SME Analytics UI

---

## Option 2: GitHub Actions Build

If local build keeps failing, use automated CI/CD.

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Log in to ACR
      run: az acr login --name acrk2mc444oapoak
    
    - name: Build Docker image
      run: |
        cd frontend
        docker build -t acrk2mc444oapoak.azurecr.io/frontend:${{ github.sha }} .
        docker tag acrk2mc444oapoak.azurecr.io/frontend:${{ github.sha }} acrk2mc444oapoak.azurecr.io/frontend:latest
    
    - name: Push to ACR
      run: |
        docker push acrk2mc444oapoak.azurecr.io/frontend:${{ github.sha }}
        docker push acrk2mc444oapoak.azurecr.io/frontend:latest
    
    - name: Update Container App
      run: |
        az containerapp update \
          --name frontend \
          --resource-group rg-sme-analytics-prod \
          --image acrk2mc444oapoak.azurecr.io/frontend:latest
```

### Step 2: Create Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "github-actions-sme-analytics" \
  --role contributor \
  --scopes /subscriptions/8da562ab-c08a-4469-ac2c-bc6416a9545b/resourceGroups/rg-sme-analytics-prod \
  --sdk-auth
```

Copy the JSON output.

### Step 3: Add GitHub Secret

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `AZURE_CREDENTIALS`
4. Value: Paste the JSON from step 2
5. Click "Add secret"

### Step 4: Trigger Workflow

```bash
# Commit and push
git add .github/workflows/deploy-frontend.yml
git commit -m "Add frontend deployment workflow"
git push origin main
```

The workflow will automatically build and deploy the frontend.

---

## Option 3: Azure Container Registry Build Tasks

Build directly in Azure (no local Docker required).

### Step 1: Build in ACR
```bash
cd frontend
az acr build \
  --registry acrk2mc444oapoak \
  --image frontend:latest \
  --file Dockerfile \
  .
```

This builds the image in Azure's servers (faster, more reliable).

### Step 2: Update Container App
```bash
az containerapp update \
  --name frontend \
  --resource-group rg-sme-analytics-prod \
  --image acrk2mc444oapoak.azurecr.io/frontend:latest
```

---

## Verification Checklist

After deployment, verify:

- [ ] Frontend URL loads: https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io
- [ ] Health endpoint responds: `/health` returns 200 OK
- [ ] React app renders without errors (check browser console)
- [ ] API connections work (backend and ML services)
- [ ] File upload functionality works
- [ ] Charts and visualizations display correctly
- [ ] No CORS errors in browser console

## Troubleshooting

### Build hangs during "npm run build"
**Cause**: Large npm package downloads or insufficient memory  
**Solution**: 
- Increase Docker Desktop memory to 6GB
- Use Option 3 (ACR build) to build in Azure

### "Cannot connect to Docker daemon"
**Cause**: Docker Desktop not running  
**Solution**: Start Docker Desktop, wait for it to fully start

### "unauthorized: authentication required"
**Cause**: ACR login expired  
**Solution**: Run `az acr login --name acrk2mc444oapoak` again

### Frontend loads but shows blank page
**Cause**: React build errors or missing environment variables  
**Solution**:
1. Check browser console for errors
2. Check container logs: `az containerapp logs show --name frontend --resource-group rg-sme-analytics-prod --follow`
3. Verify environment variables in container app configuration

### CORS errors when calling backend
**Cause**: Backend CORS not configured for frontend URL  
**Solution**: Update backend CORS configuration (see AZURE_DEPLOYMENT_COMPLETE.md)

---

## Success Criteria

✅ Docker image builds successfully  
✅ Image pushed to ACR  
✅ Container app shows "Running" status  
✅ Frontend URL loads React application  
✅ Health endpoint returns 200 OK  
✅ Can interact with backend API  

When all checkboxes are ticked, deployment is 100% complete! 🎉

---

## Quick Command Reference

```bash
# Complete flow (copy-paste all)
cd frontend
docker build -t sme-frontend:latest -f Dockerfile .
docker tag sme-frontend:latest acrk2mc444oapoak.azurecr.io/frontend:latest
az acr login --name acrk2mc444oapoak
docker push acrk2mc444oapoak.azurecr.io/frontend:latest
az containerapp update --name frontend --resource-group rg-sme-analytics-prod --image acrk2mc444oapoak.azurecr.io/frontend:latest

# Test
curl https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io/health
open https://frontend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io
```

**Estimated Time**: 10-15 minutes total
