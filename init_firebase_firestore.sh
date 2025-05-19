#!/bin/bash

# Script to initialize Firebase Firestore collections

echo "Firebase Firestore Initialization Script"
echo "---------------------------------------"
echo "This script will initialize the basic collections in your Firebase Firestore database."
echo "It uses environment variables from .env.local for configuration."
echo ""

# Source environment variables if .env.local exists
if [ -f ".env.local" ]; then
    echo "Loading environment variables from .env.local..."
    set -o allexport
    source .env.local
    set +o allexport
else
    echo "Warning: .env.local file not found. Relying on pre-existing environment variables."
fi

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is required but not installed. Please install and configure it first."
    exit 1
fi

# Check for required Firebase Project ID
if [ -z "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then
    echo "Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set."
    echo "Please define it in your .env.local file or export it."
    exit 1
fi
echo "Using Firebase Project ID: $NEXT_PUBLIC_FIREBASE_PROJECT_ID"

ACCESS_TOKEN=""

# Attempt to get access token
if [ -n "$GCP_SERVICE_ACCOUNT" ]; then
    echo "Using GCP_SERVICE_ACCOUNT environment variable for authentication..."
    # Write the JSON key to a temporary file
    TEMP_CRED_FILE="temp_gcp_creds.json"
    echo "$GCP_SERVICE_ACCOUNT" > "$TEMP_CRED_FILE"
    
    # Check if the temp file was created successfully and is not empty
    if [ ! -s "$TEMP_CRED_FILE" ]; then
        echo "Error: Failed to write GCP_SERVICE_ACCOUNT to temporary file or variable is empty."
        rm -f "$TEMP_CRED_FILE" # Clean up empty/failed temp file
        # Fall-through to try ADC without service account file
    else
        # Set environment variable for gcloud to use the key file
        export GOOGLE_APPLICATION_CREDENTIALS="$TEMP_CRED_FILE" # Corrected variable name
        
        ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
        
        # Unset and remove temporary credentials
        unset GOOGLE_APPLICATION_CREDENTIALS # Corrected variable name
        rm "$TEMP_CRED_FILE"
        
        if [ -n "$ACCESS_TOKEN" ]; then
            echo "Access token obtained using GCP_SERVICE_ACCOUNT."
        else
            echo "Warning: Failed to obtain access token using GCP_SERVICE_ACCOUNT. Trying other methods..."
        fi
    fi
fi

# If access token not obtained yet, try with ambient gcloud ADC
if [ -z "$ACCESS_TOKEN" ]; then
    echo "Attempting to use ambient gcloud Application Default Credentials..."
    ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
    if [ -n "$ACCESS_TOKEN" ]; then
        echo "Access token obtained using ambient gcloud ADC."
    fi
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: Failed to get access token."
    echo "Please ensure gcloud is configured correctly (e.g., run 'gcloud auth application-default login')"
    echo "or provide a valid GCP_SERVICE_ACCOUNT in .env.local."
    exit 1
fi

echo "Access token obtained successfully."
echo ""

# Firestore base URL for REST API
FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents" # Corrected variable
echo "Using Firestore URL: ${FIRESTORE_URL}"
echo ""

# Function to check if a collection exists and create a document if it doesn't
# $1: Collection name
# $2: Document ID
# $3: Document data in JSON format
create_document() {
    local collection="$1"
    local doc_id="$2"
    local data="$3"
    local full_url="${FIRESTORE_URL}/${collection}/${doc_id}"
    
    echo "Creating document in collection: ${collection}"
    
    # Firestore REST API expects a specific JSON format
    local firestore_data="{
        \"fields\": ${data}
    }"
    
    # Use -w "%{http_code}" to get only the HTTP status code for checking
    response_code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${firestore_data}" "${full_url}")

    if [ "$response_code" -eq 200 ]; then
        echo "Successfully created document in ${collection} (HTTP ${response_code})"
    else
        echo "Error creating document in ${collection}. HTTP Status Code: ${response_code}"
        echo "Full URL used: ${full_url}"
        echo "Attempting to show error response from Firestore:"
        # Run curl again without -s -o /dev/null to see the actual error output
        curl -X PATCH \
            -H "Authorization: Bearer ${ACCESS_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "${firestore_data}" "${full_url}"
        echo "" # Newline after error output
    fi
    echo ""
}

# 1. Initialize files collection with a placeholder document
echo "--- Initializing 'files' collection ---"
FILES_DATA='{
    "id": {"stringValue": "placeholder"},
    "originalName": {"stringValue": "placeholder.txt"},
    "mimeType": {"stringValue": "text/plain"},
    "size": {"integerValue": "0"},
    "uploadedAt": {"timestampValue": "2025-05-10T00:00:00Z"},
    "expiresAt": {"timestampValue": "2025-05-11T00:00:00Z"},
    "downloadCount": {"integerValue": "0"}
}'
create_document "files" "placeholder" "${FILES_DATA}"

# 2. Initialize metrics collection with counters document
echo "--- Initializing 'metrics' collection ---"
METRICS_DATA='{
    "uploads": {"integerValue": "0"},
    "downloads": {"integerValue": "0"},
    "lastUpdated": {"timestampValue": "2025-05-10T00:00:00Z"}
}'
create_document "metrics" "counters" "${METRICS_DATA}"

# 3. Initialize events collection with a placeholder
echo "--- Initializing 'events' collection ---"
EVENTS_DATA='{
    "type": {"stringValue": "initialization"},
    "timestamp": {"timestampValue": "2025-05-10T00:00:00Z"},
    "message": {"stringValue": "Firestore collections initialized"}
}'
create_document "events" "initialization" "${EVENTS_DATA}"

# 4. Deploy Firestore indexes
echo "--- Deploying Firestore indexes ---"
if [ -f "firestore.indexes.json" ]; then
    echo "Found firestore.indexes.json."
    # First, check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo "Error: Firebase CLI is not installed. This is recommended for deploying Firestore indexes."
        echo "Please install it by following the instructions at: https://firebase.google.com/docs/cli#setup_update_cli"
        echo "After installation, run 'firebase login' and then 'firebase use ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}' to select your project."
        echo "Then, you can manually deploy indexes using: firebase deploy --only firestore:indexes --project ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
        echo "Skipping automatic index deployment."
    else
        echo "Firebase CLI found. Attempting to deploy indexes..."
        # Ensure Firebase project is set (firebase use might be needed interactively if not already set)
        # We will try to pass the project ID directly to the deploy command.
        DEPLOY_OUTPUT=$(firebase deploy --only firestore:indexes --project "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" --non-interactive --debug 2>&1)
        DEPLOY_EXIT_CODE=$?
        if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
            echo "Firestore indexes deployment initiated successfully using Firebase CLI."
            echo "Note: Index creation can take some time. Check the Firebase console for status."
        else
            if echo "$DEPLOY_OUTPUT" | grep -q 'HTTP Error: 409, index already exists'; then
                echo "Some indexes already exist (409 conflict). This is not a fatal error. Skipping those indexes."
            else
                echo "Error deploying Firestore indexes using Firebase CLI."
                echo "Please ensure you are logged into Firebase CLI ('firebase login') and have selected your project ('firebase use ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}')."
                echo "You can try deploying manually: firebase deploy --only firestore:indexes --project ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
                echo "Alternatively, try updating gcloud components ('gcloud components update') and using gcloud:"
                echo "  gcloud beta firestore indexes replace firestore.indexes.json --project=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
                echo "or create the index via the Firebase console."
            fi
        fi
    fi
else
    echo "Warning: firestore.indexes.json not found. Skipping index deployment."
fi
echo ""

# 5. Create composite index for apiKeys (userId + createdAt)
echo "--- Creating composite index for apiKeys (userId + createdAt) ---"
gcloud firestore indexes composite create \
  --collection-group="apiKeys" \
  --field-config field-path="userId",order="ASCENDING" \
  --field-config field-path="createdAt",order="DESCENDING"
echo "Composite index for apiKeys created (if not already present)."

echo "--- Creating vector index for files.embedding ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="files" \
  --query-scope=COLLECTION \
  --field-config=vector-config='{"dimension":"768","flat": "{}"}',field-path=embedding

# 6. Initialize artifacts collection with a placeholder document including embedding
# Example embedding: 1536 zeros (adjust size to match your embedding model)
echo "--- Initializing 'artifacts' collection with embedding field ---"
ARTIFACTS_EMBEDDING=$(python3 -c 'import json; print(json.dumps({"arrayValue": {"values": [{"doubleValue": 0.0} for _ in range(1536)]}}))')
ARTIFACTS_DATA='{
    "id": {"stringValue": "placeholder"},
    "description": {"stringValue": "A sample artifact for vector search"},
    "metadata": {"mapValue": {"fields": {"type": {"stringValue": "example"}, "author": {"stringValue": "system"}}}},
    "embedding": '"${ARTIFACTS_EMBEDDING}"'
}'
create_document "artifacts" "placeholder" "${ARTIFACTS_DATA}"

echo "---------------------------------------"
echo "Firebase Firestore initialization script finished."
echo "Review the output above for any errors."
echo ""
echo "Your Firestore database should now have these collections initialized:"
echo "- files: For storing file metadata"
echo "- metrics: For tracking usage statistics"
echo "- events: For application event logs"
echo "- artifacts: For storing artifacts with embeddings for vector search"
echo ""
echo "These collections align with how your application is using Firestore in your functions code."

