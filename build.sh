#!/bin/bash

# Remove existing node_modules and package-lock.json
rm -rf frontend/node_modules
rm -f frontend/package-lock.json

# Install dependencies
cd frontend
npm install

# Build the frontend
npm run build

# Return to root directory
cd ..

# Install backend dependencies
npm install

# Start the server
npm start 