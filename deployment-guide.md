# Phase 1 Deployment Guide

## Quick Start Deployment (Free Tier)

This guide will help you deploy the Diagnostic Risk Analyzer MVP using free tier services.

## Prerequisites

1. **GitHub Account** - For code repository
2. **Supabase Account** - Free PostgreSQL database
3. **Railway Account** - Free backend hosting
4. **Vercel Account** - Free frontend hosting
5. **Cloudinary Account** - Free image storage
6. **Hugging Face Account** - Free AI API (optional)
7. **OpenAI Account** - Pay-per-use AI API (optional)

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys
3. Run the following SQL in the Supabase SQL editor:

```sql
-- Create patients table
CREATE TABLE patients (
  "patientId" TEXT PRIMARY KEY,
  demographics JSONB,
  "medicalHistory" JSONB,
  "currentSymptoms" JSONB,
  medications JSONB,
  imaging JSONB,
  reports JSONB,
  "fhirData" JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create medical_images table
CREATE TABLE medical_images (
  "imageId" TEXT PRIMARY KEY,
  "patientId" TEXT REFERENCES patients("patientId"),
  "imageType" TEXT,
  "imageData" TEXT, -- Base64 encoded for Phase 1
  metadata JSONB,
  timestamp TIMESTAMP,
  "qualityScore" NUMERIC,
  "gcpStoragePath" TEXT,
  "dicomCompliant" BOOLEAN,
  "medGemmaCompatible" BOOLEAN,
  storage_url TEXT,
  cloudinary_public_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create analysis_results table
CREATE TABLE analysis_results (
  "analysisId" TEXT PRIMARY KEY,
  "patientId" TEXT REFERENCES patients("patientId"),
  timestamp TIMESTAMP,
  "analysisType" TEXT,
  findings JSONB,
  "riskAssessment" JSONB,
  "clinicalSuggestions" JSONB,
  "processingMetrics" JSONB,
  status TEXT,
  "vertexAIModelUsed" TEXT,
  "gcpProcessingRegion" TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - customize as needed)
CREATE POLICY "Users can view their own data" ON patients
  FOR SELECT USING (auth.uid()::text = "patientId" OR auth.jwt() ->> 'role' = 'doctor');

CREATE POLICY "Doctors can insert patient data" ON patients
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'doctor');
```

## Step 2: Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. Note down your Cloud Name, API Key, and API Secret
3. Configure upload presets if needed

## Step 3: Set Up AI Services (Optional)

### Hugging Face (Free Tier)
1. Go to [huggingface.co](https://huggingface.co) and create an account
2. Generate an API token in your settings
3. Note: Free tier has rate limits

### OpenAI (Pay-per-use)
1. Go to [openai.com](https://openai.com) and create an account
2. Add billing information (you'll only pay for what you use)
3. Generate an API key
4. Start with GPT-3.5-turbo for cost efficiency

## Step 4: Deploy Backend to Railway

1. Fork this repository to your GitHub account
2. Go to [railway.app](https://railway.app) and sign up
3. Create a new project and connect your GitHub repository
4. Set the following environment variables in Railway:

```env
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
HUGGINGFACE_API_KEY=your_hf_api_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_random_jwt_secret
```

5. Railway will automatically deploy your backend
6. Note down your Railway app URL

## Step 5: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your GitHub repository
3. Set the root directory to `frontend`
4. Set the following environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Deploy the frontend
6. Your app will be available at `https://your-app.vercel.app`

## Step 6: Test the Deployment

1. Visit your Vercel URL
2. Create a test account
3. Upload a sample medical image
4. Verify the analysis works

## Monitoring and Maintenance

### Check Usage Limits
- **Supabase**: Monitor database size (500MB limit)
- **Railway**: Monitor runtime hours (500 hours/month)
- **Vercel**: Monitor bandwidth (100GB/month)
- **Cloudinary**: Monitor storage and bandwidth (25GB each)

### Scaling Considerations
When you approach free tier limits:
1. **Database**: Upgrade Supabase plan or migrate to Phase 2
2. **Backend**: Upgrade Railway plan or migrate to GCP
3. **Frontend**: Vercel Pro plan or migrate to GCP
4. **Storage**: Cloudinary paid plan or migrate to GCP

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check Supabase URL and keys
   - Verify RLS policies allow access

2. **Image Upload Failures**
   - Check Cloudinary credentials
   - Verify file size limits

3. **AI Analysis Errors**
   - Check API keys for Hugging Face/OpenAI
   - Monitor rate limits and quotas

4. **CORS Errors**
   - Update CORS settings in backend
   - Check frontend/backend URL configuration

### Logs and Debugging
- **Railway**: Check deployment logs in Railway dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **Supabase**: Check database logs in Supabase dashboard

## Cost Monitoring

### Expected Monthly Costs (Phase 1)
- **Supabase**: $0 (free tier)
- **Railway**: $0 (free tier)
- **Vercel**: $0 (free tier)
- **Cloudinary**: $0 (free tier)
- **Hugging Face**: $0 (free tier)
- **OpenAI**: $10-50 (depending on usage)

**Total: $10-50/month** for a fully functional MVP

## Migration to Phase 2

When ready to scale:
1. Set up GCP project
2. Deploy to Cloud Run and GKE
3. Migrate database to Cloud SQL
4. Switch to Vertex AI and MedGemma
5. Update DNS to point to GCP

This phased approach allows you to validate the concept with minimal cost before investing in the full production infrastructure.