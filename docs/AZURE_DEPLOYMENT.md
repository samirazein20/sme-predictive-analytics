# Azure Deployment Guide for SME Predictive Analytics

This guide walks you through deploying the SME Predictive Analytics application to Azure using Azure Container Apps.

## Architecture Overview

The application is deployed with the following Azure resources:

- **Azure Container Apps**: Hosts backend (Spring Boot), ML services (FastAPI), and frontend (React)
- **Azure Container Registry**: Stores Docker images
- **Azure Database for PostgreSQL Flexible Server**: Managed database
- **Azure Cache for Redis**: Managed Redis cache
- **Azure Key Vault**: Secure secrets storage
- **Application Insights**: Application monitoring and logging
- **Log Analytics Workspace**: Centralized logging

## Prerequisites

1. **Azure CLI** - [Install](https://aka.ms/azure-cli)
   ```bash
   az --version
   ```

2. **Azure Developer CLI** - [Install](https://aka.ms/azure-dev/install)
   ```bash
   azd version
   ```

3. **Docker** - [Install](https://docs.docker.com/get-docker/)
   ```bash
   docker --version
   ```

4. **Azure Subscription** - Ensure you have an active subscription with appropriate permissions

## Deployment Steps

### 1. Authenticate with Azure

```bash
az login
azd auth login
```

### 2. Configure Environment

Create environment variables file:

```bash
cp .azure/.env.template .azure/.env
```

Edit `.azure/.env` and set:

```env
AZURE_ENV_NAME=sme-dev
AZURE_LOCATION=eastus
AZURE_SUBSCRIPTION_ID=your-subscription-id
POSTGRES_ADMIN_PASSWORD=your-secure-password
```

### 3. Initialize Azure Developer CLI

```bash
azd init
```

Select your subscription and location when prompted.

### 4. Preview Deployment

```bash
azd provision --preview
```

This shows what resources will be created without actually creating them.

### 5. Deploy Infrastructure and Application

```bash
azd up
```

This command will:
- Create a resource group
- Provision all Azure resources (ACR, Container Apps, PostgreSQL, Redis, Key Vault)
- Build Docker images locally
- Push images to Azure Container Registry
- Deploy containers to Azure Container Apps

**Note**: First deployment takes 10-15 minutes.

### 6. Verify Deployment

```bash
# Get environment values
azd env get-values

# Check application logs
azd monitor --logs

# Test endpoints
curl $(azd env get-value BACKEND_URL)/actuator/health
curl $(azd env get-value ML_SERVICES_URL)/health
```

### 7. Access Application

Get the frontend URL:

```bash
azd env get-value FRONTEND_URL
```

Open the URL in your browser to access the application.

## Configuration

### Environment Variables

Backend (Spring Boot):
- `SPRING_PROFILES_ACTIVE=production`
- `DATABASE_URL` - PostgreSQL connection (from Key Vault)
- `SPRING_REDIS_HOST` - Redis hostname
- `SPRING_REDIS_PORT` - Redis SSL port
- `SPRING_REDIS_PASSWORD` - Redis password (from Key Vault)
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - App Insights connection

ML Services (FastAPI):
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - App Insights connection

Frontend (React):
- `REACT_APP_BACKEND_URL` - Backend API URL
- `REACT_APP_ML_URL` - ML services URL

### Update Configuration

To update environment variables:

1. Edit `infra/main.bicep`
2. Run `azd deploy` to apply changes

## Monitoring

### View Logs

```bash
# All services
azd monitor --logs

# Specific service
azd monitor --logs --service backend
```

### Application Insights

Access Application Insights in Azure Portal:
1. Navigate to your resource group
2. Open Application Insights resource
3. View metrics, logs, and traces

### Log Analytics

Query logs using KQL:
```kusto
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "backend"
| order by TimeGenerated desc
| take 100
```

## Scaling

### Manual Scaling

Edit `infra/main.bicep` and update scale settings:

```bicep
scale: {
  minReplicas: 2
  maxReplicas: 10
}
```

Then deploy:
```bash
azd deploy
```

### Auto-scaling Rules

Container Apps automatically scale based on:
- HTTP request rate
- CPU usage
- Memory usage

Configure custom rules in `infra/main.bicep`.

## Cost Management

### Estimated Monthly Costs

- Container Apps Environment: ~$0
- Container Apps (3 apps): ~$50-100
- PostgreSQL Flexible Server (Burstable): ~$15-25
- Redis Basic C0: ~$16
- Container Registry Basic: ~$5
- Key Vault: ~$0-5
- Application Insights: Pay-as-you-go

**Total**: ~$85-150/month for dev environment

### Cost Optimization

1. **Stop non-production environments**:
   ```bash
   azd down
   ```

2. **Scale down to 0 replicas** during off-hours (edit main.bicep)

3. **Use Burstable SKU** for PostgreSQL (already configured)

4. **Monitor usage** in Azure Cost Management

## Troubleshooting

### Build Failures

```bash
# Build images locally first
docker build -t backend:test ./backend
docker build -t ml-services:test ./ml-models
docker build -t frontend:test ./frontend
```

### Deployment Errors

```bash
# View detailed deployment logs
azd provision --debug

# Check Azure Portal for error details
```

### Connection Issues

```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group rg-sme-dev \
  --name $(azd env get-value POSTGRES_SERVER_NAME)

# Test Redis connection
az redis show \
  --resource-group rg-sme-dev \
  --name $(azd env get-value REDIS_HOST)
```

### Container App Issues

```bash
# View container logs
az containerapp logs show \
  --name backend \
  --resource-group rg-sme-dev \
  --follow

# Restart container
az containerapp revision restart \
  --name backend \
  --resource-group rg-sme-dev
```

## CI/CD with GitHub Actions

### Setup

1. Create GitHub secrets:
   ```bash
   # Get Azure credentials
   az ad sp create-for-rbac --name "sme-analytics-gh" --sdk-auth
   ```

2. Add secrets to GitHub:
   - `AZURE_CREDENTIALS` - Output from above command
   - `AZURE_ENV_NAME` - Environment name
   - `POSTGRES_ADMIN_PASSWORD` - Database password

3. Create workflow file (`.github/workflows/azure-deploy.yml`):

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Install azd
        uses: Azure/setup-azd@v0.1.0
      
      - name: Deploy
        run: azd deploy --no-prompt
        env:
          AZURE_ENV_NAME: ${{ secrets.AZURE_ENV_NAME }}
          POSTGRES_ADMIN_PASSWORD: ${{ secrets.POSTGRES_ADMIN_PASSWORD }}
```

## Cleanup

To delete all Azure resources:

```bash
azd down --force --purge
```

This removes:
- All deployed resources
- Resource group
- Key Vault (with purge protection)

## Support

For issues:
1. Check [Azure Container Apps documentation](https://learn.microsoft.com/azure/container-apps/)
2. Review logs: `azd monitor --logs`
3. Check Azure Portal for resource health
4. Open issue in repository

## Next Steps

- [ ] Configure custom domain and SSL certificate
- [ ] Set up Azure Front Door for global distribution
- [ ] Enable Azure AD authentication
- [ ] Configure backup and disaster recovery
- [ ] Set up cost alerts and budgets
- [ ] Implement staging environment
