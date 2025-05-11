#!/bin/bash

# Local deployment script for MCPHub
# This script deploys Firebase functions and hosting similar to the CI/CD workflow

# Exit on error
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    echo -e "${GREEN}Loading environment variables from .env.local${NC}"
    # Instead of using export directly, we'll load only simple environment variables
    # Complex variables like service accounts will need to be handled separately
    
    # Process each line in .env.local and export simple variables only
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        [[ $line =~ ^#.*$ || -z $line ]] && continue
        
        # Extract variable name before the first = sign
        var_name=$(echo "$line" | cut -d '=' -f 1)
        
        # Check if it's a simple variable (not containing newlines or complex JSON)
        if [[ ! $line =~ (-----BEGIN|-----END|client_email|private_key|service_account) ]]; then
            # It's a simple variable, safe to export
            export "$line"
            echo -e "  - Loaded ${YELLOW}${var_name}${NC}"
        else
            echo -e "  - Skipped complex variable ${YELLOW}${var_name}${NC} (will be loaded directly by Firebase)"
        fi
    done < .env.local
else
    echo -e "${YELLOW}Warning: .env.local not found. Make sure all necessary environment variables are set.${NC}"
fi

# Print header
echo -e "\n${GREEN}===== MCPHub Firebase Deployment =====${NC}"
echo -e "Project ID: ${YELLOW}mpch-458204${NC}\n"

# Step 1: Build Next.js application
echo -e "${GREEN}Step 1: Building Next.js application...${NC}"
npm run build

# Step 2: Setup and build Cloud Functions
echo -e "\n${GREEN}Step 2: Setting up and building Cloud Functions...${NC}"
cd functions
npm ci
npm run build
cd ..

# Step 3: Check if user is logged in to Firebase
echo -e "\n${GREEN}Step 3: Checking Firebase authentication...${NC}"
FIREBASE_AUTH_STATUS=$(firebase login:list)
if [[ $FIREBASE_AUTH_STATUS == *"No authorized accounts"* ]]; then
    echo -e "${YELLOW}You need to log in to Firebase first.${NC}"
    firebase login
fi

# Step 4: Deploy to Firebase
echo -e "\n${GREEN}Step 4: Deploying to Firebase...${NC}"
echo -e "Deploying functions and hosting for project: ${YELLOW}mpch-458204${NC}"

# Create a temporary .env file for Firebase functions with complex variables
# This is a workaround for the complex service account credential
echo -e "${GREEN}Setting up environment for Firebase Functions...${NC}"
firebase functions:config:get > /dev/null 2>&1 || echo "No existing function config"

# Deploy with environment variables loaded from .env.local instead of exporting them
firebase deploy --only functions,hosting --project mpch-458204 --non-interactive

# Deployment complete
echo -e "\n${GREEN}===== Deployment Complete! =====${NC}"
echo -e "Your application has been deployed to Firebase."
echo -e "Visit your app at: ${YELLOW}https://mpch-458204.web.app${NC}\n"