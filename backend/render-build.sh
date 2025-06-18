#!/bin/bash
# Exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

echo "Build completed successfully!"

exit 0
