#!/bin/bash
set -o errexit
echo "Current directory: $(pwd)"
echo "Listing files in backend/: $(ls -la)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Installing dependencies..."
npm install
echo "Building the application..."
npm run build
echo "Listing dist/ files: $(ls -la dist)"
if [ -f "dist/server.js" ]; then
  echo "dist/server.js found!"
else
  echo "ERROR: dist/server.js not found!"
  exit 1
fi
echo "Build completed successfully!"
exit 0