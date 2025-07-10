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

# Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set
if [ -z "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then
    echo "Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set."
    exit 1
fi
echo "Using Firebase Project ID: $NEXT_PUBLIC_FIREBASE_PROJECT_ID"

# === NEW: Force gcloud to use the right project ===
gcloud config set project "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is required but not installed. Please install and configure it first."
    exit 1
fi

ACCESS_TOKEN=""

# Attempt to get access token
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "Using GOOGLE_APPLICATION_CREDENTIALS environment variable for authentication..."
    
    # Check if GOOGLE_APPLICATION_CREDENTIALS is a path to a file or the content itself
    if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        # It's a path to a file
        echo "GOOGLE_APPLICATION_CREDENTIALS is a path to a credentials file"
        CRED_FILE="$GOOGLE_APPLICATION_CREDENTIALS"
        
        # === Activate this service account for gcloud ===
        gcloud auth activate-service-account --key-file="$CRED_FILE"
        
        ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
        
        if [ -n "$ACCESS_TOKEN" ]; then
            echo "Access token obtained using GOOGLE_APPLICATION_CREDENTIALS file."
        else
            echo "Warning: Failed to obtain access token using GOOGLE_APPLICATION_CREDENTIALS file."
        fi
    else
        # It might be the content of the credentials
        TEMP_CRED_FILE="temp_gcp_creds.json"
        echo "$GOOGLE_APPLICATION_CREDENTIALS" > "$TEMP_CRED_FILE"
        
        if [ ! -s "$TEMP_CRED_FILE" ] || ! jq empty "$TEMP_CRED_FILE" 2>/dev/null; then
            echo "Error: GOOGLE_APPLICATION_CREDENTIALS does not contain valid JSON credentials."
            rm -f "$TEMP_CRED_FILE"
        else
            # === Activate this service account for gcloud ===
            gcloud auth activate-service-account --key-file="$TEMP_CRED_FILE"
            
            ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
            
            rm -f "$TEMP_CRED_FILE"
            
            if [ -n "$ACCESS_TOKEN" ]; then
                echo "Access token obtained using GOOGLE_APPLICATION_CREDENTIALS content."
            else
                echo "Warning: Failed to obtain access token using GOOGLE_APPLICATION_CREDENTIALS content."
            fi
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
    exit 1
fi

echo "Access token obtained successfully."
echo ""

# Firestore base URL for REST API
FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents"
echo "Using Firestore URL: ${FIRESTORE_URL}"
echo ""

# Function to create a document via REST API
create_document() {
    local collection="$1"
    local doc_id="$2"
    local data="$3"
    local full_url="${FIRESTORE_URL}/${collection}/${doc_id}"

    echo "Creating document in collection: ${collection}"
    local firestore_data="{\"fields\": ${data}}"

    response_code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${firestore_data}" "${full_url}")

    if [ "$response_code" -eq 200 ]; then
        echo "Successfully created document in ${collection} (HTTP ${response_code})"
    else
        echo "Error creating document in ${collection}. HTTP Status Code: ${response_code}"
        echo "Full URL used: ${full_url}"
        curl -X PATCH \
            -H "Authorization: Bearer ${ACCESS_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "${firestore_data}" "${full_url}"
        echo ""
    fi
    echo ""
}

# 4. Deploy Firestore indexes
echo "--- Deploying Firestore indexes ---"
if [ -f "firestore.indexes.json" ]; then
    echo "Found firestore.indexes.json."
    if ! command -v firebase &> /dev/null; then
        echo "Error: Firebase CLI is not installed."
        echo "Skipping automatic index deployment."
    else
        echo "Attempting to deploy indexes with Firebase CLI..."
        firebase deploy --only firestore:indexes \
            --project "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
            --non-interactive --debug || {
            echo "Retrying with gcloud..."
            gcloud beta firestore indexes replace firestore.indexes.json \
                --project "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
        }
    fi
else
    echo "Warning: firestore.indexes.json not found. Skipping index deployment."
fi
echo ""

# 5. Create composite indexes explicitly specifying project
echo "--- Creating composite index for apiKeys (userId + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="apiKeys" \
  --field-config="field-path=userId,order=ASCENDING" \
  --field-config="field-path=createdAt,order=DESCENDING"

echo "--- Creating composite index for crates (ownerId + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=ownerId,order=ASCENDING" \
  --field-config="field-path=createdAt,order=DESCENDING"

# Add indexes for expired crates cleanup
echo "--- Creating composite index for expired private crates (isPublic=false + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=isPublic,order=ASCENDING" \
  --field-config="field-path=createdAt,order=ASCENDING"

echo "--- Creating composite index for expired public crates (isPublic=true + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=isPublic,order=DESCENDING" \
  --field-config="field-path=createdAt,order=ASCENDING"

# Add index for crates search (ownerId + searchField + __name__)
echo "--- Creating composite index for crates search (ownerId + searchField + __name__) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=ownerId,order=ASCENDING" \
  --field-config="field-path=searchField,order=ASCENDING" \
  --field-config="field-path=__name__,order=ASCENDING"

# Add index for crates search with tags (tags + ownerId + searchField + __name__)
echo "--- Creating composite index for crates search with tags (tags + ownerId + searchField + __name__) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=tags,array-config=CONTAINS" \
  --field-config="field-path=ownerId,order=ASCENDING" \
  --field-config="field-path=searchField,order=ASCENDING" \
  --field-config="field-path=__name__,order=ASCENDING"

echo "--- Creating vector index for crates.embedding ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --query-scope=COLLECTION \
  --field-config="vector-config={\"dimension\":\"768\",\"flat\":{}}",field-path=embedding

echo "--- Creating composite index for feedback (status + timestamp) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="feedback" \
  --field-config="field-path=status,order=ASCENDING" \
  --field-config="field-path=timestamp,order=DESCENDING"

echo "--- Creating composite index for waitingList (createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="waitingList" \
  --field-config="field-path=createdAt,order=DESCENDING"

# Add feedback template indexes
echo "--- Creating composite index for feedbackTemplates (ownerId + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="feedbackTemplates" \
  --field-config="field-path=ownerId,order=ASCENDING" \
  --field-config="field-path=createdAt,order=DESCENDING"

echo "--- Creating composite index for feedbackTemplates (isPublic + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="feedbackTemplates" \
  --field-config="field-path=isPublic,order=ASCENDING" \
  --field-config="field-path=createdAt,order=DESCENDING"

echo "--- Creating composite index for feedbackResponses (templateId + submittedAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="feedbackResponses" \
  --field-config="field-path=templateId,order=ASCENDING" \
  --field-config="field-path=submittedAt,order=DESCENDING"

# Add indexes for discoverable gallery feature
echo "--- Creating composite index for discoverable gallery (isDiscoverable + public + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=shared.isDiscoverable,order=ASCENDING" \
  --field-config="field-path=shared.public,order=ASCENDING" \
  --field-config="field-path=createdAt,order=DESCENDING"

echo "--- Creating composite index for discoverable gallery with category (isDiscoverable + public + category + createdAt) ---"
gcloud firestore indexes composite create \
  --project="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --collection-group="crates" \
  --field-config="field-path=shared.isDiscoverable,order=ASCENDING" \
  --field-config="field-path=shared.public,order=ASCENDING" \
  --field-config="field-path=category,order=ASCENDING" \
  --field-config="field-path=createdAt,order=DESCENDING"

echo "---------------------------------------"
echo "Firebase Firestore initialization script finished."
echo "Review the output above for any errors."
echo ""
echo "Your Firestore database should now have these collections initialized:"
echo "- crates: For storing crates with embeddings for vector search"
echo "- metrics: For tracking usage statistics"
echo "- events: For application event logs"
echo "- apiKeys: For API key management"
echo "- feedback: For storing user feedback submissions"
echo "- waitingList: For Pro version waiting list subscribers"
echo "- feedbackTemplates: For storing feedback form templates"
echo "- feedbackResponses: For storing feedback responses"
echo ""
