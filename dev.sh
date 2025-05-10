#!/bin/bash

# This script runs both the Firebase emulators and the Next.js development server

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local..."
  export $(grep -v '^#' .env.local | xargs)
fi

# Extract project ID from Google application credentials
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  # Remove the triple quotes and escape characters from the credentials string
  CLEAN_CREDS=$(echo "$GOOGLE_APPLICATION_CREDENTIALS" | sed "s/^'''//" | sed "s/'''$//" | sed 's/\\n/\\\\n/g')
  
  # Extract the project_id using grep and sed
  PROJECT_ID=$(echo "$CLEAN_CREDS" | grep -o '"project_id":"[^"]*' | sed 's/"project_id":"//')
  
  if [ -n "$PROJECT_ID" ]; then
    echo "Detected project ID: $PROJECT_ID"
  else
    echo "Could not extract project ID from credentials. Using default."
    PROJECT_ID="mpch-458204" # Fallback to what we saw in the credentials
  fi
else
  echo "GOOGLE_APPLICATION_CREDENTIALS not found. Using default project ID."
  PROJECT_ID="mpch-458204" # Fallback to what we saw in the credentials
fi

# Write the credentials to a temporary file for the emulators
echo "Setting up temporary credentials file..."
TEMP_CREDS_FILE="./.tmp-gcp-creds.json"
echo "$CLEAN_CREDS" > "$TEMP_CREDS_FILE"
export GOOGLE_APPLICATION_CREDENTIALS="$TEMP_CREDS_FILE"

# Start Firebase emulators in the background
echo "Starting Firebase emulators..."
firebase emulators:start --project="$PROJECT_ID" &
FIREBASE_PID=$!

# Wait for Firebase emulators to start up
echo "Waiting for emulators to start..."
sleep 10

# Export environment variables to point to emulated Firebase services
export NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL="http://localhost:5001/$PROJECT_ID/us-central1"
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199"
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"

# Start Next.js development server
echo "Starting Next.js development server..."
npm run dev

# When Next.js is killed, also kill Firebase emulators
kill $FIREBASE_PID

# Clean up temporary credentials file
rm -f "$TEMP_CREDS_FILE"
echo "Development environment shutdown. Temporary files cleaned up."