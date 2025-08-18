#!/bin/bash

echo "🚀 Setting up AI Mock Interview System..."

# Check if api-keys.js exists
if [ ! -f "api-keys.js" ]; then
    echo "📝 Creating api-keys.js from template..."
    cp api-keys.example.js api-keys.js
    echo "⚠️  Please edit api-keys.js and add your API keys:"
    echo "   - Gemini API: https://makersuite.google.com/app/apikey"
    echo "   - JDoodle API: https://www.jdoodle.com/compiler-api"
else
    echo "✅ api-keys.js already exists"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys"
else
    echo "✅ .env already exists"
fi

echo ""
echo "🔧 Setup complete! Next steps:"
echo "1. Edit api-keys.js with your API keys"
echo "2. Run: ./start.sh"
echo ""