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

# Print header
echo -e "\n${GREEN}===== MCPHub Firebase Deployment =====${NC}"

# Extract project ID from credentials
echo -e "${GREEN}Extracting project information...${NC}"
PROJECT_ID=$(grep -E "^GOOGLE_APPLICATION_CREDENTIALS=" .env.local | grep -o '"project_id":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(grep -E "^FIREBASE_PROJECT_ID=" .env.local | sed -E 's/^FIREBASE_PROJECT_ID=(.*)/\1/')
fi

if [ -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}Could not extract project ID from credentials. Using default.${NC}"
  PROJECT_ID="mpch-458204" # Fallback project ID
else
  echo -e "Using project ID from credentials: ${YELLOW}${PROJECT_ID}${NC}"
fi

# Step 1: Build Next.js application
echo -e "\n${GREEN}Step 1: Building Next.js application...${NC}"
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

# Step 4: Set up environment variables for Cloud Functions
echo -e "\n${GREEN}Step 4: Setting up environment variables for Cloud Functions...${NC}"

# Extract environment variables from .env.local file
echo -e "Extracting environment variables from .env.local..."
if [ ! -f .env.local ]; then
  echo -e "${RED}Error: .env.local file not found! Please create it first.${NC}"
  exit 1
fi

# Extract key environment variables for Cloud Functions
GEMINI_API_KEY=$(grep -E "^GEMINI_API_KEY=" .env.local | sed -E 's/^GEMINI_API_KEY=(.*)/\1/')
GCS_BUCKET_NAME=$(grep -E "^GCS_BUCKET_NAME=" .env.local | sed -E 's/^GCS_BUCKET_NAME=(.*)/\1/')
FIREBASE_DATABASE_URL=$(grep -E "^FIREBASE_DATABASE_URL=" .env.local | sed -E 's/^FIREBASE_DATABASE_URL=(.*)/\1/')

# Create a temporary credentials file from the env var if needed
echo -e "${GREEN}Setting up temporary credentials file...${NC}"
TEMP_CREDS_FILE="./.tmp-gcp-creds.json"

# Extract the JSON content directly from the file to avoid shell parsing issues
CREDS_JSON=$(grep -E "^GOOGLE_APPLICATION_CREDENTIALS=" .env.local | cut -d= -f2-)

# Remove any triple quotes
CREDS_JSON=$(echo "$CREDS_JSON" | sed -e "s/^'''//" -e "s/'''$//" -e 's/^"//' -e 's/"$//')

# Write the credentials to a temporary file
echo "$CREDS_JSON" > "$TEMP_CREDS_FILE"

# Export for the current session
export GOOGLE_APPLICATION_CREDENTIALS="$TEMP_CREDS_FILE"

# Set Cloud Functions environment variables using Firebase CLI
echo -e "\n${GREEN}Setting environment variables for Cloud Functions...${NC}"

# Set environment variables for Cloud Functions v2
firebase functions:config:set \
  gemini.api_key="$GEMINI_API_KEY" \
  gcs.bucket_name="$GCS_BUCKET_NAME" \
  firebase.database_url="$FIREBASE_DATABASE_URL"

echo -e "${GREEN}Environment variables set successfully.${NC}"

# Step 5: Deploy to Firebase (with runtimeOptions for Cloud Functions v2)
echo -e "\n${GREEN}Step 5: Deploying to Firebase...${NC}"
echo -e "Deploying functions and hosting for project: ${YELLOW}${PROJECT_ID}${NC}"

firebase deploy --only functions,hosting --project "$PROJECT_ID"

# Clean up temporary credentials file
rm -f "$TEMP_CREDS_FILE"

# Deployment complete
echo -e "\n${GREEN}===== Deployment Complete! =====${NC}"
echo -e "Your application has been deployed to Firebase."
echo -e "Visit your app at: ${YELLOW}https://${PROJECT_ID}.web.app${NC}\n"