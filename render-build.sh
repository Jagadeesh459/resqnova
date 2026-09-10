#!/usr/bin/env bash
# ==============================================================================
# Optional Native Build Script for Render (if not using Docker)
# Build Command: ./render-build.sh
# Start Command: npm start
# ==============================================================================

set -o errexit

echo "==> [1/4] Installing Python 3 and Qiskit Dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

echo "==> [2/4] Installing Node.js Packages..."
npm ci

echo "==> [3/4] Compiling Vite Frontend & Express Server..."
npm run build

echo "==> [4/4] Verifying Qiskit Quantum Engine..."
python3 quantum_service.py --test

echo "==> [ResQNova] Build completed successfully!"

