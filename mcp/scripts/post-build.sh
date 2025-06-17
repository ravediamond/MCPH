#!/bin/bash

# Script to fix any remaining import issues in the dist directory

# Add .js extension to all imports
find ./dist -name "*.js" -exec sed -i 's|from "\([^"]*\)"|from "\1.js"|g' {} \;

# Fix any double .js extensions
find ./dist -name "*.js" -exec sed -i 's|\.js\.js"|\.js"|g' {} \;

echo "Post-build fixes applied!"
