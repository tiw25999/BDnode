# E-Tech Store Backend - Deployment Guide

## Render Deployment

### Prerequisites
1. GitHub repository with the code
2. Supabase project set up
3. Render account

### Environment Variables
Set these in Render dashboard:

```
NODE_ENV=production
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
```

### Deployment Steps

1. **Connect to GitHub**
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: etech-store-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

3. **Set Environment Variables**
   - Add all required environment variables
   - Make sure JWT_SECRET is secure

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Health Check
- **Health Endpoint**: `https://your-app.onrender.com/health`
- **API Base**: `https://your-app.onrender.com/api`

### Database Setup
1. Run the SQL schema in your Supabase project
2. Update environment variables with your Supabase credentials

### Monitoring
- Check Render logs for any issues
- Monitor health endpoint for uptime
- Set up alerts if needed

### Troubleshooting
- Check build logs if deployment fails
- Verify environment variables are set correctly
- Ensure Supabase connection is working
- Check health endpoint responds with 200 status
