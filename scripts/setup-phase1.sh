#!/bin/bash

# Phase 1 Setup Script
# Sets up the Diagnostic Risk Analyzer MVP for free tier deployment

set -e

echo "🚀 Setting up Phase 1 - Diagnostic Risk Analyzer MVP"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
if [ -f "package-phase1.json" ]; then
    cp package-phase1.json package.json
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "❌ package-phase1.json not found"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ -f "package.json" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
    cd ..
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Create environment file
echo "⚙️  Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
else
    echo "✅ .env file already exists"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo "✅ TypeScript build completed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp
echo "✅ Directories created"

echo ""
echo "🎉 Phase 1 setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   - SUPABASE_URL and keys"
echo "   - CLOUDINARY credentials"
echo "   - HUGGINGFACE_API_KEY (optional)"
echo "   - OPENAI_API_KEY (optional)"
echo ""
echo "2. Set up your services:"
echo "   - Create Supabase project: https://supabase.com"
echo "   - Create Cloudinary account: https://cloudinary.com"
echo "   - Get Hugging Face API key: https://huggingface.co"
echo "   - Get OpenAI API key: https://openai.com"
echo ""
echo "3. Deploy to free hosting:"
echo "   - Backend: Railway (railway.app)"
echo "   - Frontend: Vercel (vercel.com)"
echo ""
echo "4. Start development:"
echo "   - Backend: npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "📖 See deployment-guide.md for detailed instructions"