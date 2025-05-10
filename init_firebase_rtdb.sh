#!/bin/bash

# Script to initialize Firebase Realtime Database structure

echo "Firebase Realtime Database Initialization Script"
echo "-----------------------------------------------"
echo "This script will initialize the basic paths (like tables) in your Firebase RTDB."
echo "It assumes you are running this in Google Cloud Shell or a gcloud authenticated environment."
echo ""

# Prompt for Firebase Project ID
read -p "Enter your Firebase Project ID: " FIREBASE_PROJECT_ID

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "Error: Firebase Project ID cannot be empty."
    exit 1
fi

# Construct Firebase Database URL
# Note: If your RTDB instance is not in the default region (us-central1),
# you might need to adjust the URL accordingly.
# For most users, <PROJECT_ID>-default-rtdb.firebaseio.com is correct.
DATABASE_URL="https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com"
echo "Using Database URL: ${DATABASE_URL}"
echo ""

# Get Access Token from gcloud
echo "Fetching access token from gcloud..."
ACCESS_TOKEN=$(gcloud auth print-access-token)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: Failed to retrieve access token. Make sure you are authenticated with gcloud."
    echo "Try running 'gcloud auth login' and 'gcloud auth application-default login'."
    exit 1
fi
echo "Access token fetched successfully."
echo ""

# Function to make a PUT request to Firebase
# $1: Path (e.g., "files")
# $2: JSON Data
put_data() {
    local path="$1"
    local data="$2"
    local full_url="${DATABASE_URL}/${path}.json?auth=${ACCESS_TOKEN}"

    echo "Initializing path: /${path}"
    # Use -w "%{http_code}" to get only the HTTP status code for checking
    # Use -s for silent mode and -o /dev/null to discard the body for the status check
    response_code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -d "${data}" "${full_url}")

    if [ "$response_code" -eq 200 ]; then
        echo "Successfully initialized /${path} (HTTP $response_code)"
    else
        echo "Error initializing /${path}. HTTP Status Code: $response_code"
        echo "Full URL used: ${DATABASE_URL}/${path}.json"
        echo "Attempting to show error response from Firebase:"
        # Run curl again without -s -o /dev/null to see the actual error output from Firebase
        curl -X PUT -d "${data}" "${full_url}"
        echo "" # Newline after error output
        echo "Please check your Firebase Project ID, database rules (ensure they allow writes with an auth token), and that the Realtime Database is enabled."
    fi
    echo ""
}

# 1. Initialize /files
# This path will store metadata for each uploaded file.
echo "--- Initializing /files ---"
FILES_DATA='{}' # Initialize as an empty object; your app will add file entries here.
put_data "files" "${FILES_DATA}"

# 2. Initialize /metrics
# This path will store aggregated counters and daily metrics.
echo "--- Initializing /metrics ---"
METRICS_DATA='{
  "uploads": 0,
  "downloads": 0,
  "events:upload": 0,
  "events:download": 0,
  "daily": {}
}'
put_data "metrics" "${METRICS_DATA}"

# 3. Initialize /event_logs
# This path will store logs of various application events.
echo "--- Initializing /event_logs ---"
EVENT_LOGS_DATA='{}' # Initialize as an empty object; your app will add event type sub-paths and log entries.
put_data "event_logs" "${EVENT_LOGS_DATA}"

echo "-----------------------------------------------"
echo "Firebase Realtime Database initialization script finished."
echo "Review the output above for any errors."
echo "Your database at ${DATABASE_URL} should now have the basic paths initialized if successful."
echo "Note: 'Tables' in Firebase RTDB are just paths. Data will be added by your application under these paths according to the schema discussed."
echo "Make sure your Firebase Realtime Database security rules allow these write operations for an authenticated user (which the access token represents)."

