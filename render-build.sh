#!/bin/bash

# Print commands before executing and exit on first error
set -ex

# Install dependencies in the backend
cd backend
rm -rf node_modules
npm install express
npm install
npm ls express

# Go back to root
cd ..

# Install and build frontend
cd frontend
npm ci
npm run build

# Return to the project root
cd ..

echo "Build completed successfully!" 