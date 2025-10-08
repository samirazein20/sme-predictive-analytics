#!/bin/bash

# GitHub Repository Setup Script for SME Predictive Analytics Platform
# Run this script after creating the repository on GitHub

echo "🚀 Setting up SME Predictive Analytics Platform repository..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Get repository URL from user
echo -e "${BLUE}Please enter your GitHub repository URL:${NC}"
echo -e "${YELLOW}Example: https://github.com/yourusername/sme-predictive-analytics.git${NC}"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: Repository URL cannot be empty.${NC}"
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${BLUE}Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${YELLOW}Git repository already exists${NC}"
fi

# Set up git configuration (if not already set)
if [ -z "$(git config --global user.name)" ]; then
    echo -e "${BLUE}Setting up Git configuration...${NC}"
    read -p "Enter your Git username: " GIT_USERNAME
    read -p "Enter your Git email: " GIT_EMAIL
    git config --global user.name "$GIT_USERNAME"
    git config --global user.email "$GIT_EMAIL"
    echo -e "${GREEN}✅ Git configuration set${NC}"
fi

# Add remote origin
echo -e "${BLUE}Adding remote origin...${NC}"
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
echo -e "${GREEN}✅ Remote origin added${NC}"

# Create main branch and switch to it
echo -e "${BLUE}Setting up main branch...${NC}"
git branch -M main
echo -e "${GREEN}✅ Main branch configured${NC}"

# Add all files to staging
echo -e "${BLUE}Adding files to staging...${NC}"
git add .
echo -e "${GREEN}✅ Files added to staging${NC}"

# Create initial commit
echo -e "${BLUE}Creating initial commit...${NC}"
git commit -m "Initial commit: SME Predictive Analytics Platform

- Complete development environment setup
- Docker Compose configuration for local development
- Comprehensive README with quick start guide
- Requirements and dependencies for ML models
- Project structure for Spring AI backend, React frontend, and Python ML services
- Development workflow and contribution guidelines
- Academic capstone project foundation"

echo -e "${GREEN}✅ Initial commit created${NC}"

# Push to GitHub
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Repository successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}Repository URL: $REPO_URL${NC}"
else
    echo -e "${RED}❌ Error pushing to GitHub. Please check your credentials and repository URL.${NC}"
    echo -e "${YELLOW}You may need to authenticate with GitHub using a personal access token.${NC}"
    exit 1
fi

# Create develop branch
echo -e "${BLUE}Creating develop branch...${NC}"
git checkout -b develop
git push -u origin develop
git checkout main
echo -e "${GREEN}✅ Develop branch created and pushed${NC}"

# Display next steps
echo -e "\n${GREEN}🎊 Setup Complete! Next Steps:${NC}"
echo -e "${BLUE}1.${NC} Clone the repository on other machines: ${YELLOW}git clone $REPO_URL${NC}"
echo -e "${BLUE}2.${NC} Set up development environment: ${YELLOW}./setup-dev-env.sh${NC}"
echo -e "${BLUE}3.${NC} Start development with: ${YELLOW}docker-compose -f docker-compose.dev.yml up -d${NC}"
echo -e "${BLUE}4.${NC} Create feature branches: ${YELLOW}git checkout -b feature/your-feature-name${NC}"
echo -e "${BLUE}5.${NC} View your repository: ${YELLOW}$REPO_URL${NC}"

echo -e "\n${GREEN}Happy coding! 🚀${NC}"