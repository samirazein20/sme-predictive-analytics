#!/bin/bash

# GitHub Actions Secrets Setup Script
# This script creates Azure service principal and retrieves ACR credentials
# for use with GitHub Actions CI/CD pipeline

set -e  # Exit on error

echo "🔧 GitHub Actions Secrets Setup for Azure Deployment"
echo "===================================================="
echo ""

# Configuration
SUBSCRIPTION_ID="8da562ab-c08a-4469-ac2c-bc6416a9545b"
RESOURCE_GROUP="rg-sme-analytics-prod"
ACR_NAME="acrk2mc444oapoak"
SP_NAME="github-actions-sme-analytics"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    echo "Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show &> /dev/null || {
    echo -e "${YELLOW}⚠️  Not logged in to Azure${NC}"
    echo "Logging in..."
    az login
}

# Set subscription
echo "Setting subscription to: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

echo -e "${GREEN}✅ Azure authentication verified${NC}"
echo ""

# Create or update service principal
echo "📝 Creating service principal: $SP_NAME"
echo ""

# Check if service principal already exists
SP_EXISTS=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$SP_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Service principal already exists: $SP_NAME${NC}"
    echo "Do you want to:"
    echo "  1. Use existing service principal"
    echo "  2. Delete and recreate (will reset credentials)"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" == "2" ]; then
        echo "Deleting existing service principal..."
        az ad sp delete --id "$SP_EXISTS"
        echo -e "${GREEN}✅ Service principal deleted${NC}"
        SP_EXISTS=""
    fi
fi

if [ -z "$SP_EXISTS" ]; then
    echo "Creating new service principal..."
    AZURE_CREDS=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role contributor \
        --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
        --sdk-auth)
    
    echo -e "${GREEN}✅ Service principal created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Using existing service principal${NC}"
    echo -e "${YELLOW}⚠️  Note: You'll need to manually retrieve the credentials${NC}"
    AZURE_CREDS=$(az ad sp list --display-name "$SP_NAME" --query "[0]" -o json)
fi

echo ""

# Get ACR credentials
echo "🔑 Retrieving Azure Container Registry credentials..."

# Enable admin user on ACR if not already enabled
echo "Enabling ACR admin user..."
az acr update --name "$ACR_NAME" --admin-enabled true --query "adminUserEnabled" -o tsv > /dev/null

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query passwords[0].value -o tsv)

if [ -z "$ACR_USERNAME" ] || [ -z "$ACR_PASSWORD" ]; then
    echo -e "${RED}❌ Failed to retrieve ACR credentials${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ACR credentials retrieved${NC}"
echo ""

# Grant service principal access to ACR
echo "🔐 Granting service principal access to ACR..."

SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv)
ACR_ID=$(az acr show --name "$ACR_NAME" --query id -o tsv)

# Check if role assignment already exists
ROLE_EXISTS=$(az role assignment list --assignee "$SP_APP_ID" --scope "$ACR_ID" --query "[?roleDefinitionName=='AcrPush'].id" -o tsv)

if [ -z "$ROLE_EXISTS" ]; then
    az role assignment create \
        --assignee "$SP_APP_ID" \
        --role AcrPush \
        --scope "$ACR_ID" > /dev/null
    echo -e "${GREEN}✅ AcrPush role assigned to service principal${NC}"
else
    echo -e "${GREEN}✅ Service principal already has AcrPush role${NC}"
fi

echo ""

# Display secrets
echo "=========================================="
echo "📋 GitHub Secrets Configuration"
echo "=========================================="
echo ""
echo -e "${YELLOW}Add these secrets to your GitHub repository:${NC}"
echo ""
echo "Go to: https://github.com/samirazein20/sme-predictive-analytics/settings/secrets/actions"
echo ""

echo -e "${GREEN}1. AZURE_CREDENTIALS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -n "$SP_EXISTS" ] && [ "$choice" != "2" ]; then
    echo -e "${YELLOW}⚠️  Using existing service principal - credentials not available${NC}"
    echo -e "${YELLOW}⚠️  You may need to recreate the service principal to get new credentials${NC}"
else
    echo "$AZURE_CREDS"
fi
echo ""

echo -e "${GREEN}2. AZURE_ACR_USERNAME${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$ACR_USERNAME"
echo ""

echo -e "${GREEN}3. AZURE_ACR_PASSWORD${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$ACR_PASSWORD"
echo ""

# Save to file
SECRETS_FILE="github-secrets-$(date +%Y%m%d-%H%M%S).txt"
cat > "$SECRETS_FILE" << EOF
GitHub Actions Secrets for SME Predictive Analytics
Generated: $(date)

1. AZURE_CREDENTIALS:
$AZURE_CREDS

2. AZURE_ACR_USERNAME:
$ACR_USERNAME

3. AZURE_ACR_PASSWORD:
$ACR_PASSWORD

========================================
Configuration Details:
========================================
Subscription: $SUBSCRIPTION_ID
Resource Group: $RESOURCE_GROUP
ACR Name: $ACR_NAME
Service Principal: $SP_NAME
Service Principal App ID: $SP_APP_ID

========================================
Instructions:
========================================
1. Go to: https://github.com/samirazein20/sme-predictive-analytics/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret with the name and value above
4. Verify all three secrets are added

⚠️  IMPORTANT: Keep this file secure and delete after adding secrets to GitHub!
EOF

echo -e "${GREEN}✅ Secrets saved to: $SECRETS_FILE${NC}"
echo -e "${YELLOW}⚠️  Remember to delete this file after adding secrets to GitHub!${NC}"
echo ""

# Optional: Use GitHub CLI to set secrets automatically
if command -v gh &> /dev/null; then
    echo "=========================================="
    echo "🤖 Automatic Secret Configuration"
    echo "=========================================="
    echo ""
    echo "GitHub CLI detected! Would you like to automatically add secrets to GitHub?"
    echo -e "${YELLOW}Note: This requires GitHub CLI authentication (gh auth login)${NC}"
    echo ""
    read -p "Add secrets automatically? (y/n): " auto_setup
    
    if [[ "$auto_setup" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Setting up secrets..."
        
        # Check if authenticated
        if gh auth status &> /dev/null; then
            if [ -n "$SP_EXISTS" ] && [ "$choice" != "2" ]; then
                echo -e "${YELLOW}⚠️  Skipping AZURE_CREDENTIALS (using existing SP)${NC}"
            else
                echo "$AZURE_CREDS" | gh secret set AZURE_CREDENTIALS
                echo -e "${GREEN}✅ AZURE_CREDENTIALS added${NC}"
            fi
            
            echo "$ACR_USERNAME" | gh secret set AZURE_ACR_USERNAME
            echo -e "${GREEN}✅ AZURE_ACR_USERNAME added${NC}"
            
            echo "$ACR_PASSWORD" | gh secret set AZURE_ACR_PASSWORD
            echo -e "${GREEN}✅ AZURE_ACR_PASSWORD added${NC}"
            
            echo ""
            echo -e "${GREEN}🎉 All secrets added to GitHub successfully!${NC}"
        else
            echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
            echo "Run: gh auth login"
            echo "Then run this script again for automatic setup"
        fi
    fi
else
    echo "=========================================="
    echo "💡 Tip: Install GitHub CLI for Automatic Setup"
    echo "=========================================="
    echo ""
    echo "Install GitHub CLI to automatically add secrets:"
    echo ""
    echo "macOS:   brew install gh"
    echo "Linux:   See https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "Windows: See https://github.com/cli/cli/releases"
    echo ""
    echo "After installation:"
    echo "  1. Run: gh auth login"
    echo "  2. Run this script again"
    echo ""
fi

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Add the three secrets to GitHub (manually or via GitHub CLI)"
echo "  2. Push code to the 'main' branch to trigger deployment"
echo "  3. Monitor deployment in GitHub Actions tab"
echo ""
echo "Verify secrets are configured:"
echo "  gh secret list"
echo ""
echo "Test workflow manually:"
echo "  Go to: https://github.com/samirazein20/sme-predictive-analytics/actions"
echo "  Click: Azure CI/CD - Build and Deploy"
echo "  Click: Run workflow"
echo ""
echo -e "${GREEN}🚀 Your CI/CD pipeline is ready!${NC}"
echo ""
