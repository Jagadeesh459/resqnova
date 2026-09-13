#!/usr/bin/env bash
# ==============================================================================
# Native Build Script for Render (if not using Docker)
# Build Command: ./render-build.sh
# Start Command: npm start
# ==============================================================================

set -o errexit

echo "==> [1/3] Installing Python 3 Dynamic Routing Dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

echo "==> [2/3] Installing Node.js Packages..."
npm ci

echo "==> [3/3] Compiling Vite Frontend & Express Server..."
npm run build

echo "==> [ResQNova] Dynamic Routing Build completed successfully!"
