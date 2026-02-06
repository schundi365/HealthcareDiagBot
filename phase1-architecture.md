# Phase 1: Free MVP Architecture

## Overview
This document outlines the free-tier architecture for the Diagnostic Risk Analyzer MVP, designed to run at zero cost until client approval.

## Architecture Stack

### Frontend
- **Platform**: Vercel (Free Tier)
- **Framework**: Next.js 14
- **Features**: 
  - 100GB bandwidth/month
  - Custom domains
  - Automatic deployments
  - Edge functions

### Backend API
- **Platform**: Railway (Free Tier)
- **Runtime**: Node.js/Express
- **Features**:
  - 500 hours/month runtime
  - 1GB RAM
  - Automatic deployments from Git

### Database
- **Platform**: Supabase (Free Tier)
- **Type**: PostgreSQL
- **Features**:
  - 500MB storage
  - 2 concurrent connections
  - Real-time subscriptions
  - Built-in authentication

### AI Services
- **Primary**: Hugging Face Inference API (Free Tier)
- **Fallback**: OpenAI API (Pay-per-use, ~$20/month for testing)
- **Models**: 
  - Medical image analysis models
  - Text analysis for reports

### File Storage
- **Platform**: Cloudinary (Free Tier)
- **Features**:
  - 25GB storage
  - 25GB bandwidth/month
  - Image processing and optimization

### Monitoring
- **Platform**: Vercel Analytics (Free)
- **Features**:
  - Performance monitoring
  - Error tracking
  - Usage analytics

## Cost Breakdown
- **Total Monthly Cost**: $0 - $25
  - Vercel: $0
  - Railway: $0
  - Supabase: $0
  - Cloudinary: $0
  - Hugging Face: $0
  - OpenAI API: $0-25 (usage-based)

## Limitations (Free Tier)
- **Database**: 500MB storage limit
- **API**: 500 hours/month runtime
- **Storage**: 25GB file storage
- **AI**: Limited API calls per month
- **Concurrent Users**: ~100-500 depending on usage

## Migration Path to Phase 2
Once client approves, we'll migrate to:
- Google Cloud Platform
- Vertex AI with MedGemma 1.5
- Cloud SQL and Cloud Storage
- Kubernetes for scaling

## Deployment Strategy
1. **Frontend**: Deploy to Vercel via GitHub integration
2. **Backend**: Deploy to Railway via GitHub integration
3. **Database**: Set up Supabase project
4. **AI Services**: Configure Hugging Face and OpenAI APIs
5. **Storage**: Set up Cloudinary account

## Environment Variables
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Services
HUGGINGFACE_API_KEY=your_hf_api_key
OPENAI_API_KEY=your_openai_api_key

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```