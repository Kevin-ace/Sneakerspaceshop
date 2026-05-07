#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit

echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "🗄️ Running database migrations..."
export FLASK_APP=run.py
flask db upgrade

echo "👤 Creating admin user (if not exists)..."
flask init-db

echo "✅ Build complete!"
