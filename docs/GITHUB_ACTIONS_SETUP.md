# GitHub Actions CI/CD Setup Guide

This guide walks you through setting up automated CI/CD for your SME Predictive Analytics Platform using GitHub Actions.

## Overview

The CI/CD pipeline automatically:
1. **Builds and tests** all three services (Backend, ML Services, Frontend)
2. **Creates Docker images** for each service
3. **Pushes images** to Azure Container Registry
4. **Deploys** to Azure Container Apps
5. **Verifies** health of all services

## Prerequisites

- ✅ Azure subscription with deployed infrastructure
- ✅ GitHub repository with code
- ✅ Azure Container Registry (ACR) created
- ✅ Azure Container Apps deployed

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. AZURE_CREDENTIALS

This is a service principal for authenticating to Azure.

**Create the service principal**:

```bash
az ad sp create-for-rbac \
  --name "github-actions-sme-analytics" \
  --role contributor \
  --scopes /subscriptions/8da562ab-c08a-4469-ac2c-bc6416a9545b/resourceGroups/rg-sme-analytics-prod \
  --sdk-auth
```

**Output** (copy the entire JSON):
```json
{
  "clientId": "<CLIENT_ID>",
  "clientSecret": "<CLIENT_SECRET>",
  "subscriptionId": "8da562ab-c08a-4469-ac2c-bc6416a9545b",
  "tenantId": "<TENANT_ID>",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**Add to GitHub**:
- Go to: Settings → Secrets and variables → Actions → New repository secret
- Name: `AZURE_CREDENTIALS`
- Value: Paste the entire JSON output

### 2. AZURE_ACR_USERNAME

The username for Azure Container Registry.

**Get the ACR username**:

```bash
az acr credential show --name acrk2mc444oapoak --query username -o tsv
```

**Add to GitHub**:
- Name: `AZURE_ACR_USERNAME`
- Value: The username from the command above

### 3. AZURE_ACR_PASSWORD

The password for Azure Container Registry.

**Get the ACR password**:

```bash
az acr credential show --name acrk2mc444oapoak --query passwords[0].value -o tsv
```

**Add to GitHub**:
- Name: `AZURE_ACR_PASSWORD`
- Value: The password from the command above

## Alternative: Use Managed Identity (Recommended for Production)

For enhanced security, you can use Managed Identity instead of ACR credentials:

### Enable ACR Admin User

```bash
az acr update --name acrk2mc444oapoak --admin-enabled true
```

### Grant Service Principal Access to ACR

```bash
# Get the service principal ID
SP_ID=$(az ad sp list --display-name "github-actions-sme-analytics" --query "[0].id" -o tsv)

# Get the ACR resource ID
ACR_ID=$(az acr show --name acrk2mc444oapoak --query id -o tsv)

# Assign AcrPush role
az role assignment create \
  --assignee $SP_ID \
  --role AcrPush \
  --scope $ACR_ID
```

Then update the workflow to use Azure CLI for ACR login instead of credentials.

## Quick Setup Script

Run this script to set up all secrets automatically:

```bash
#!/bin/bash

echo "🔧 Setting up GitHub Actions secrets for Azure deployment"
echo ""

# Create service principal
echo "Creating service principal..."
AZURE_CREDS=$(az ad sp create-for-rbac \
  --name "github-actions-sme-analytics" \
  --role contributor \
  --scopes /subscriptions/8da562ab-c08a-4469-ac2c-bc6416a9545b/resourceGroups/rg-sme-analytics-prod \
  --sdk-auth)

echo "✅ Service principal created"
echo ""

# Get ACR credentials
echo "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name acrk2mc444oapoak --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name acrk2mc444oapoak --query passwords[0].value -o tsv)

echo "✅ ACR credentials retrieved"
echo ""

# Display secrets to add to GitHub
echo "📋 Add these secrets to GitHub:"
echo ""
echo "1. AZURE_CREDENTIALS:"
echo "$AZURE_CREDS"
echo ""
echo "2. AZURE_ACR_USERNAME:"
echo "$ACR_USERNAME"
echo ""
echo "3. AZURE_ACR_PASSWORD:"
echo "$ACR_PASSWORD"
echo ""

# Optional: Use GitHub CLI to set secrets automatically
if command -v gh &> /dev/null; then
  echo "🤖 GitHub CLI detected. Would you like to automatically add secrets? (y/n)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "$AZURE_CREDS" | gh secret set AZURE_CREDENTIALS
    echo "$ACR_USERNAME" | gh secret set AZURE_ACR_USERNAME
    echo "$ACR_PASSWORD" | gh secret set AZURE_ACR_PASSWORD
    echo "✅ Secrets added to GitHub!"
  fi
else
  echo "💡 Tip: Install GitHub CLI (gh) to automatically set secrets"
  echo "   brew install gh   # macOS"
  echo "   Then run: gh auth login"
fi

echo ""
echo "🎉 Setup complete!"
```

Save this as `scripts/setup-github-secrets.sh` and run:

```bash
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

## Manual Secret Configuration

If you prefer to add secrets manually:

### Step 1: Go to GitHub Repository Settings
1. Navigate to your repository: https://github.com/samirazein20/sme-predictive-analytics
2. Click **Settings**
3. Click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret
1. Click **New repository secret**
2. Enter the secret name and value
3. Click **Add secret**

Repeat for all three secrets:
- `AZURE_CREDENTIALS`
- `AZURE_ACR_USERNAME`
- `AZURE_ACR_PASSWORD`

## Workflow Features

The GitHub Actions workflow includes:

### 🧪 Testing
- **Backend**: Maven tests with Spring Boot
- **ML Services**: Python pytest for ML models
- **Frontend**: Jest tests with coverage

### 🐳 Docker Build
- Multi-stage builds for optimized images
- Layer caching for faster builds
- Tagged with both `latest` and commit SHA

### 🚀 Deployment
- Automated deployment to Azure Container Apps
- Rolling updates with zero downtime
- Health checks after deployment

### ✅ Verification
- HTTP health checks for each service
- Automatic rollback on failure
- Deployment summary with URLs

## Triggering the Workflow

### Automatic Trigger
The workflow runs automatically on every push to the `main` branch:

```bash
git add .
git commit -m "Deploy new features"
git push origin main
```

### Manual Trigger
You can also trigger the workflow manually:

1. Go to **Actions** tab in GitHub
2. Select **Azure CI/CD - Build and Deploy**
3. Click **Run workflow**
4. Select the `main` branch
5. Click **Run workflow**

## Monitoring Deployments

### View Workflow Status
1. Go to **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. Monitor each job's progress

### View Logs
- Click on any job to see detailed logs
- Expand steps to see command output
- Download logs for troubleshooting

### Check Deployment Status in Azure

```bash
# Check container app status
az containerapp show -n backend -g rg-sme-analytics-prod --query "properties.{status:runningStatus,provisioning:provisioningState}"

# View recent revisions
az containerapp revision list -n backend -g rg-sme-analytics-prod -o table

# Stream logs
az containerapp logs show -n backend -g rg-sme-analytics-prod --follow
```

## Troubleshooting

### Build Failures

**Issue**: Tests fail during build
```
Solution: Run tests locally first
cd backend && ./mvnw test
cd ml-models && pytest tests/
cd frontend && npm test
```

**Issue**: Docker build fails
```
Solution: Test Docker build locally
docker build -t test-image -f backend/Dockerfile backend/
```

### Deployment Failures

**Issue**: Authentication failed
```
Solution: Verify AZURE_CREDENTIALS secret is correct
- Check service principal hasn't expired
- Verify subscription ID matches
```

**Issue**: ACR login failed
```
Solution: Verify ACR credentials
az acr credential show --name acrk2mc444oapoak
- Update AZURE_ACR_USERNAME and AZURE_ACR_PASSWORD
```

**Issue**: Container app update failed
```
Solution: Check resource exists and service principal has permissions
az containerapp show -n backend -g rg-sme-analytics-prod
```

### Health Check Failures

**Issue**: Service fails health check after deployment
```
Solution: Check application logs
az containerapp logs show -n backend -g rg-sme-analytics-prod --tail 100
```

## Advanced Configuration

### Environment-Specific Deployments

To deploy to multiple environments (dev, staging, prod):

1. Create additional workflow files:
   - `.github/workflows/azure-deploy-dev.yml`
   - `.github/workflows/azure-deploy-staging.yml`

2. Use different resource groups and secrets per environment

3. Set up branch-based triggers:
   ```yaml
   on:
     push:
       branches: [ develop ]  # For dev environment
   ```

### Rollback Strategy

To rollback to a previous version:

```bash
# List revisions
az containerapp revision list -n backend -g rg-sme-analytics-prod -o table

# Activate previous revision
az containerapp revision activate \
  -n backend \
  -g rg-sme-analytics-prod \
  --revision backend--<revision-name>
```

### Blue-Green Deployment

For zero-downtime deployments with instant rollback:

```yaml
- name: Deploy with traffic split
  run: |
    # Deploy new revision with 0% traffic
    az containerapp update \
      --name backend \
      --resource-group rg-sme-analytics-prod \
      --image ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/backend:${{ github.sha }}
    
    # Gradually shift traffic
    az containerapp ingress traffic set \
      --name backend \
      --resource-group rg-sme-analytics-prod \
      --revision-weight latest=100
```

## Performance Optimization

### Reduce Build Time

1. **Use caching**:
   - Maven dependencies cached automatically
   - npm dependencies cached with `cache: 'npm'`
   - Docker layer caching enabled

2. **Parallel builds**:
   - All three services build in parallel
   - Reduces total pipeline time by ~60%

3. **Optimize Docker images**:
   - Multi-stage builds reduce image size
   - .dockerignore excludes unnecessary files

### Reduce Deployment Time

1. **Use specific image tags**:
   - Deploying with SHA tags prevents unnecessary pulls
   - Azure caches images for faster deployments

2. **Health check optimization**:
   - Reduce wait times based on app startup time
   - Configure readiness probes in container apps

## Security Best Practices

### Secrets Management
- ✅ Never commit secrets to git
- ✅ Rotate service principal credentials regularly
- ✅ Use Managed Identity when possible
- ✅ Enable ACR admin user only when needed

### Image Security
- ✅ Scan images for vulnerabilities
- ✅ Use specific base image versions
- ✅ Keep dependencies updated
- ✅ Sign images with Docker Content Trust

### Access Control
- ✅ Use least-privilege service principals
- ✅ Limit scope to specific resource groups
- ✅ Enable branch protection on `main`
- ✅ Require PR reviews before merging

## Next Steps

1. **Set up secrets** using the script or manual process above
2. **Test the workflow** by pushing a commit to `main`
3. **Monitor deployment** in GitHub Actions tab
4. **Verify services** are running correctly

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Container Apps CI/CD](https://learn.microsoft.com/en-us/azure/container-apps/github-actions)
- [Azure Service Principal](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure)
- [Docker Build Push Action](https://github.com/docker/build-push-action)

## Support

If you encounter issues:
1. Check workflow logs in GitHub Actions
2. Review Azure Container Apps logs
3. Verify all secrets are configured correctly
4. Test commands locally before running in CI/CD

---

**Status**: 🚀 Ready to deploy automatically on every push to `main`!
