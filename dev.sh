#!/bin/bash

# This script runs both the Firebase emulators and the Next.js development server

echo "Loading environment variables from .env.local..."
if [ ! -f .env.local ]; then
  echo "Error: .env.local file not found! Please create it first."
  exit 1
fi

# Extract values directly from .env.local file
# Using grep and sed to extract values without sourcing the file to avoid export issues
GEMINI_API_KEY=$(grep -E "^GEMINI_API_KEY=" .env.local | sed -E 's/^GEMINI_API_KEY=(.*)/\1/')
GCS_BUCKET_NAME=$(grep -E "^GCS_BUCKET_NAME=" .env.local | sed -E 's/^GCS_BUCKET_NAME=(.*)/\1/')
FIREBASE_DATABASE_URL=$(grep -E "^FIREBASE_DATABASE_URL=" .env.local | sed -E 's/^FIREBASE_DATABASE_URL=(.*)/\1/')
PROJECT_ID=$(grep -E "^GOOGLE_APPLICATION_CREDENTIALS=" .env.local | grep -o '"project_id":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(grep -E "^FIREBASE_PROJECT_ID=" .env.local | sed -E 's/^FIREBASE_PROJECT_ID=(.*)/\1/')
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Could not extract project ID from credentials. Using default."
  PROJECT_ID="mpch-458204" # Fallback project ID
else
  echo "Using project ID from credentials: $PROJECT_ID"
fi

# Create a demo project ID for the emulators to avoid production calls
EMULATOR_PROJECT_ID="demo-${PROJECT_ID}"
echo "Using emulator project ID: $EMULATOR_PROJECT_ID"

# Create default storage rules file if it doesn't exist
if [ ! -f "storage.rules" ]; then
  echo "Creating default storage.rules file..."
  cat > storage.rules << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
EOF
fi

# Create a temporary credentials file from the env var
echo "Setting up temporary credentials file..."
TEMP_CREDS_FILE="./.tmp-gcp-creds.json"

# Extract the JSON content directly from the file to avoid shell parsing issues
CREDS_JSON=$(grep -E "^GOOGLE_APPLICATION_CREDENTIALS=" .env.local | cut -d= -f2-)

# Remove any triple quotes
CREDS_JSON=$(echo "$CREDS_JSON" | sed -e "s/^'''//" -e "s/'''$//" -e 's/^"//' -e 's/"$//')

# Write the credentials to a temporary file
echo "$CREDS_JSON" > "$TEMP_CREDS_FILE"

# Export for the current session
export GOOGLE_APPLICATION_CREDENTIALS="$TEMP_CREDS_FILE"
export GEMINI_API_KEY="$GEMINI_API_KEY"
export GCS_BUCKET_NAME="$GCS_BUCKET_NAME"
export FIREBASE_DATABASE_URL="$FIREBASE_DATABASE_URL"

# Build functions if needed
if [ ! -f "functions/lib/index.js" ]; then
  echo "Building Cloud Functions..."
  (cd functions && npm run build)
fi

# Start Firebase emulators in the background with the demo project ID
echo "Starting Firebase emulators..."
firebase emulators:start --project="$EMULATOR_PROJECT_ID" &
FIREBASE_PID=$!

# Wait for Firebase emulators to start up
echo "Waiting for emulators to start..."
sleep 10

# Export environment variables to point to emulated Firebase services
# Still use the real project ID for the endpoints as that's what the code expects
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