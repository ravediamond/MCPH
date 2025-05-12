#!/bin/bash

# Script to create a GCS bucket and apply a CORS configuration to it.
#
# This script now sources its configuration from the .env.local file in the project root.
# Ensure the following variables are set in .env.local:
# - GCP_PROJECT_ID: Your Google Cloud Project ID.
# - GCS_DEFAULT_BUCKET_LOCATION: (Optional) Default GCS bucket location (e.g., US-CENTRAL1).
# - GCS_ALLOWED_ORIGINS_JSON: (Optional) JSON array string of allowed origins (e.g., '"http://localhost:3000","http://127.0.0.1:3000"').
# - GCS_ALLOWED_METHODS_JSON: (Optional) JSON array string of allowed HTTP methods (e.g., '"GET","PUT"').
# - GCS_ALLOWED_RESPONSE_HEADERS_JSON: (Optional) JSON array string of allowed response headers.
# - GCS_CORS_MAX_AGE_SECONDS: (Optional) Max age for CORS preflight requests in seconds.
#
# Usage: ./scripts/setup_gcs_bucket.sh
#

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Load Environment Variables ---
ENV_FILE="./.env.local"

if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE..."
  # Source the .env.local file. Handle potential issues with export and comments.
  # This approach reads lines, removes comments, trims whitespace, and exports.
  # It's a bit more robust than a simple `source` for .env files that might not be purely bash-compatible.
  set -o allexport
  eval $(grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -v '^[[:space:]]*$' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  set +o allexport
  echo "Environment variables loaded."
else
  echo "Error: Environment file $ENV_FILE not found."
  echo "Please ensure $ENV_FILE exists in the project root and contains the required GCS configuration variables."
  exit 1
fi

# --- Configuration (with fallbacks if not set in .env.local) ---
PROJECT_ID="${GCP_PROJECT_ID}"
DEFAULT_BUCKET_LOCATION_FROM_ENV="${GCS_DEFAULT_BUCKET_LOCATION:-US-CENTRAL1}"
ALLOWED_ORIGINS_JSON_FROM_ENV="${GCS_ALLOWED_ORIGINS_JSON:-'\"http://localhost:3000\", \"http://127.0.0.1:3000\"'}" # Escaped for default
ALLOWED_METHODS_JSON_FROM_ENV="${GCS_ALLOWED_METHODS_JSON:-'\"GET\", \"HEAD\", \"PUT\", \"POST\", \"DELETE\", \"OPTIONS\"'}" # Escaped for default
ALLOWED_RESPONSE_HEADERS_JSON_FROM_ENV="${GCS_ALLOWED_RESPONSE_HEADERS_JSON:-'\"Content-Type\", \"ETag\", \"Content-Length\", \"X-Goog-Upload-Status\", \"X-GUploader-UploadID\"'}" # Escaped for default
CORS_MAX_AGE_SECONDS_FROM_ENV="${GCS_CORS_MAX_AGE_SECONDS:-3600}"

# --- Log Effective Configuration ---
echo ""
echo "--- Effective Configuration --- "
echo "GCP_PROJECT_ID (from env): ${GCP_PROJECT_ID}"
echo "PROJECT_ID (used): ${PROJECT_ID}"
echo "GCS_DEFAULT_BUCKET_LOCATION (from env, or default 'US-CENTRAL1'): ${GCS_DEFAULT_BUCKET_LOCATION}"
BUCKET_LOCATION="${DEFAULT_BUCKET_LOCATION_FROM_ENV}"
echo "BUCKET_LOCATION (used): ${BUCKET_LOCATION}"

BUCKET_NAME="${PROJECT_ID}-storage"
echo "BUCKET_NAME (derived): ${BUCKET_NAME}"

echo "GCS_ALLOWED_ORIGINS_JSON (from env, or default): ${GCS_ALLOWED_ORIGINS_JSON}"
echo "ALLOWED_ORIGINS_JSON_FROM_ENV (used): [${ALLOWED_ORIGINS_JSON_FROM_ENV}]"
echo "GCS_ALLOWED_METHODS_JSON (from env, or default): ${GCS_ALLOWED_METHODS_JSON}"
echo "ALLOWED_METHODS_JSON_FROM_ENV (used): [${ALLOWED_METHODS_JSON_FROM_ENV}]"
echo "GCS_ALLOWED_RESPONSE_HEADERS_JSON (from env, or default): ${GCS_ALLOWED_RESPONSE_HEADERS_JSON}"
echo "ALLOWED_RESPONSE_HEADERS_JSON_FROM_ENV (used): [${ALLOWED_RESPONSE_HEADERS_JSON_FROM_ENV}]"
echo "GCS_CORS_MAX_AGE_SECONDS (from env, or default 3600): ${GCS_CORS_MAX_AGE_SECONDS}"
echo "CORS_MAX_AGE_SECONDS_FROM_ENV (used): ${CORS_MAX_AGE_SECONDS_FROM_ENV}"
echo "-----------------------------"
echo ""

# Check if GCP_PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
  echo "Error: GCP_PROJECT_ID is not set in $ENV_FILE."
  echo "Please define GCP_PROJECT_ID in $ENV_FILE."
  exit 1
fi

CORS_CONFIG_FILE="cors-config-temp-$$.json" # Temporary unique filename
echo "Temporary CORS config file will be: ${CORS_CONFIG_FILE}"

# Create the CORS configuration JSON file
# Note: Using the variables directly as they are expected to be JSON-formatted strings from .env.local
cat > "$CORS_CONFIG_FILE" <<EOF
[
  {
    "origin": [${ALLOWED_ORIGINS_JSON_FROM_ENV}],
    "method": [${ALLOWED_METHODS_JSON_FROM_ENV}],
    "responseHeader": [${ALLOWED_RESPONSE_HEADERS_JSON_FROM_ENV}],
    "maxAgeSeconds": ${CORS_MAX_AGE_SECONDS_FROM_ENV}
  }
]
EOF

echo "Generated CORS configuration for bucket gs://${BUCKET_NAME}:"
cat "$CORS_CONFIG_FILE"
echo ""

echo "Checking if gsutil is installed..."
if ! command -v gsutil &> /dev/null; then
    echo "Error: gsutil command not found. Please install the Google Cloud SDK and ensure gsutil is in your PATH."
    echo "Installation guide: https://cloud.google.com/sdk/docs/install"
    rm "$CORS_CONFIG_FILE"
    exit 1
fi
echo "gsutil found."
echo ""

echo "Attempting to create/update GCS bucket: gs://${BUCKET_NAME}"
echo "Project: ${PROJECT_ID}"
echo "Location: ${BUCKET_LOCATION}"
echo "Storage Class: Standard (default)"
echo "Access Control: Uniform Bucket-Level Access (recommended)"
echo ""

# Check if bucket already exists
if gsutil ls "gs://${BUCKET_NAME}" >/dev/null 2>&1; then
  echo "Bucket gs://${BUCKET_NAME} already exists. Skipping creation, will apply CORS."
else
  echo "Creating bucket gs://${BUCKET_NAME}..."
  GSUTIL_MB_COMMAND="gsutil mb -p \"${PROJECT_ID}\" -c standard -l \"${BUCKET_LOCATION}\" --uniform_bucket_level_access \"gs://${BUCKET_NAME}\""
  echo "Executing: ${GSUTIL_MB_COMMAND}"
  eval "${GSUTIL_MB_COMMAND}"
  echo "Bucket gs://${BUCKET_NAME} created successfully."
fi
echo ""

echo "Applying CORS configuration to gs://${BUCKET_NAME}..."
GSUTIL_CORS_SET_COMMAND="gsutil cors set \"${CORS_CONFIG_FILE}\" \"gs://${BUCKET_NAME}\""
echo "Executing: ${GSUTIL_CORS_SET_COMMAND}"
eval "${GSUTIL_CORS_SET_COMMAND}"
echo "CORS configuration applied successfully."
echo ""

echo "Verifying applied CORS configuration for gs://${BUCKET_NAME}..."
gsutil cors get "gs://${BUCKET_NAME}"
echo ""

echo "Cleaning up temporary CORS configuration file: ${CORS_CONFIG_FILE}..."
rm "${CORS_CONFIG_FILE}"
echo "Cleanup complete."
echo ""

echo "---------------------------------------------------------------------"
echo " GCS Bucket Setup Complete for: gs://${BUCKET_NAME}"
echo "---------------------------------------------------------------------"
echo "Summary (from .env.local or defaults):"
echo " - Project ID: ${PROJECT_ID}"
echo " - Bucket Name: gs://${BUCKET_NAME}"
echo " - Location: ${BUCKET_LOCATION}"
echo " - CORS Origins: [${ALLOWED_ORIGINS_JSON_FROM_ENV}]"
echo " - CORS Methods: [${ALLOWED_METHODS_JSON_FROM_ENV}]"
echo " - CORS Max Age: ${CORS_MAX_AGE_SECONDS_FROM_ENV}s"
echo ""
echo "---------------------------------------------------------------------"

exit 0
