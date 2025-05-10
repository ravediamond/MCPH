#!/bin/bash

# Script to initialize Firebase Firestore collections

echo "Firebase Firestore Initialization Script"
echo "---------------------------------------"
echo "This script will initialize the basic collections in your Firebase Firestore database."
echo "It uses the gcp-credentials.json file for authentication."
echo ""

# Set the correct Firebase project ID
FIREBASE_PROJECT_ID="mpch-458204"
echo "Using Firebase Project ID: $FIREBASE_PROJECT_ID"

# Use the gcp-credentials.json file directly
if [ -f "gcp-credentials.json" ]; then
    echo "Using credentials from gcp-credentials.json"
    
    # Try to get access token via gcloud
    if command -v gcloud &> /dev/null; then
        echo "Using gcloud for authentication..."
        gcloud config set project $FIREBASE_PROJECT_ID
        ACCESS_TOKEN=$(gcloud auth application-default print-access-token)
        
        if [ -z "$ACCESS_TOKEN" ]; then
            echo "Could not get access token from gcloud. Trying service account authentication..."
        else
            echo "Access token obtained from gcloud."
        fi
    fi

    # If that didn't work, try using the service account directly
    if [ -z "$ACCESS_TOKEN" ]; then
        echo "Using service account for authentication..."
        
        # Check if jq is available
        if ! command -v jq &> /dev/null; then
            echo "Error: jq is required but not installed. Please install jq first."
            echo "You can install it with: brew install jq"
            exit 1
        fi
        
        # Extract required fields from credentials
        CLIENT_EMAIL=$(jq -r .client_email gcp-credentials.json)
        PRIVATE_KEY=$(jq -r .private_key gcp-credentials.json)
        
        # Create JWT header
        JWT_HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '\n' | tr '/+' '_-' | tr -d '=')
        
        # Create JWT claim set
        NOW=$(date +%s)
        EXP=$((NOW + 3600))
        
        JWT_CLAIM_SET=$(echo -n '{"iss":"'$CLIENT_EMAIL'","scope":"https://www.googleapis.com/auth/cloud-platform","aud":"https://www.googleapis.com/oauth2/v4/token","exp":'$EXP',"iat":'$NOW'}' | openssl base64 -e | tr -d '\n' | tr '/+' '_-' | tr -d '=')
        
        # Create JWT signature
        JWT_UNSIGNED=$JWT_HEADER.$JWT_CLAIM_SET
        PRIVATE_KEY_FILE=temp_private_key.pem
        echo "$PRIVATE_KEY" > $PRIVATE_KEY_FILE
        
        JWT_SIGNATURE=$(echo -n $JWT_UNSIGNED | openssl dgst -sha256 -sign $PRIVATE_KEY_FILE | openssl base64 -e | tr -d '\n' | tr '/+' '_-' | tr -d '=')
        rm $PRIVATE_KEY_FILE
        
        JWT_TOKEN=$JWT_UNSIGNED.$JWT_SIGNATURE
        
        # Exchange JWT for access token
        ACCESS_TOKEN=$(curl -s -X POST https://www.googleapis.com/oauth2/v4/token \
          -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=$JWT_TOKEN" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          | jq -r '.access_token')
    fi
else
    echo "Error: gcp-credentials.json file not found in the current directory."
    exit 1
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: Failed to get access token. Please check your credentials."
    echo "Make sure you have either gcloud configured or valid service account credentials."
    exit 1
fi

echo "Access token obtained successfully."
echo ""

# Firestore base URL for REST API
FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents"
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

echo "---------------------------------------"
echo "Firebase Firestore initialization script finished."
echo "Review the output above for any errors."
echo ""
echo "Your Firestore database should now have these collections initialized:"
echo "- files: For storing file metadata"
echo "- metrics: For tracking usage statistics"
echo "- events: For application event logs"
echo ""
echo "These collections align with how your application is using Firestore in your functions code."

