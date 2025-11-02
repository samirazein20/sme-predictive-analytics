#!/bin/bash

# Azure Deployment Script for SME Predictive Analytics
# This script provisions infrastructure and deploys the application to Azure

set -e

echo "🚀 SME Predictive Analytics - Azure Deployment"
echo "=============================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install: https://aka.ms/azure-cli"
    exit 1
fi

if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI not found. Please install: https://aka.ms/azure-dev/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ All prerequisites satisfied"

# Initialize azd if not already done
if [ ! -f ".azure/.env" ]; then
    echo ""
    echo "🔧 Initializing Azure Developer CLI..."
    azd init
fi

# Load environment variables
if [ -f ".azure/.env" ]; then
    export $(grep -v '^#' .azure/.env | xargs)
fi

# Prompt for required variables if not set
if [ -z "$AZURE_ENV_NAME" ]; then
    read -p "Enter environment name (e.g., sme-dev): " AZURE_ENV_NAME
    export AZURE_ENV_NAME
fi

if [ -z "$POSTGRES_ADMIN_PASSWORD" ]; then
    read -sp "Enter PostgreSQL admin password: " POSTGRES_ADMIN_PASSWORD
    echo
    export POSTGRES_ADMIN_PASSWORD
fi

echo ""
echo "🔍 Validating deployment with preview..."
azd provision --preview

echo ""
read -p "Do you want to proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🏗️  Provisioning infrastructure and deploying application..."
azd up

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment outputs:"
azd env get-values

echo ""
echo "🌐 Access your application:"
echo "   Frontend: $(azd env get-value FRONTEND_URL)"
echo "   Backend API: $(azd env get-value BACKEND_URL)"
echo "   ML Services: $(azd env get-value ML_SERVICES_URL)"
echo ""
echo "📝 View logs:"
echo "   azd monitor --logs"
echo ""
echo "🔧 Update environment:"
echo "   azd deploy"
