# Render Deployment Guide — Free Tier

This guide walks you through deploying the Fleet Management System on Render's free tier.

## 📋 What's Included

- **Frontend**: React app on Render web service (free)
- **Backend API Cluster**: All 4 Python services merged into one Docker container (free)
- **Database**: PostgreSQL (free tier available)
- **Persistent Storage**: Optional paid add-on ($10/mo) for ChromaDB data

## 💰 Cost

| Component | Free Tier | Paid Option |
|-----------|-----------|-------------|
| Frontend web service | $0 | $7/mo |
| API cluster (Docker) | $0 | $7/mo |
| PostgreSQL database | $0 (pauses after 15 min) | $15/mo |
| Persistent disk | ❌ Not available | $10/mo |
| **Total** | **$0** | **$39/mo** |

## 🚀 Deployment Steps

### 1. **Create Render Account**

- Go to [render.com](https://render.com)
- Sign up with GitHub (recommended for auto-deploys)
- Authorize Anthropic/Vercel if prompted

### 2. **Push Code to GitHub** (if not already done)

```bash
cd /Users/vamsidharreddy/GitHubProjects/FleetManagementSystem
git add Dockerfile render.yaml start.py .dockerignore .env.example
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3. **Create First Service: Frontend**

In Render dashboard:

1. Click **New +** → **Web Service**
2. **Connect GitHub repo**
   - Search: `FleetManagementSystem`
   - Click **Connect**
3. **Configure service**
   - Name: `fleet-frontend`
   - Environment: `Node`
   - Build Command: `cd frontend && npm install && npm run build`
   - Start Command: `cd frontend && npm run preview`
   - **Instance Type**: Free
4. **Add Environment Variable**
   - Key: `VITE_API_URL`
   - Value: `https://fleet-api.onrender.com` (we'll create this next)
5. Click **Create Web Service** → Wait for build (~2-3 min)

✅ Your frontend is live at `https://fleet-frontend.onrender.com`

### 4. **Create Second Service: Backend API Cluster**

1. Click **New +** → **Web Service**
2. **Connect GitHub repo** (same as above)
3. **Configure service**
   - Name: `fleet-api`
   - Environment: `Docker`
   - Dockerfile Path: `./Dockerfile`
   - Instance Type: Free
4. **Add Environment Variables**
   ```
   PORT=8001
   PYTHONUNBUFFERED=1
   PYTHONDONTWRITEBYTECODE=1
   ```
5. Click **Create Web Service** → Wait for build (~5-7 min, Docker takes longer)

✅ Your API is live at `https://fleet-api.onrender.com`

Test it:
```bash
curl https://fleet-api.onrender.com/health
```

### 5. **Add Secrets (API Keys)**

Required if using OpenAI/Claude APIs:

1. Go to **Dashboard** → **fleet-api** service
2. Click **Environment**
3. Add secret files:
   - **openai_api_key**: Your OpenAI API key (if using GPT models)
   - **anthropic_api_key**: Your Anthropic API key

Then update `render.yaml` to load them (already done).

Redeploy:
```bash
git add render.yaml
git commit -m "Update Render config with secrets"
git push origin main
```

Render will auto-redeploy when it detects the push.

### 6. **Update Frontend to Use Production API**

Your frontend automatically uses:
- `http://localhost:8001` in dev mode
- `https://fleet-api.onrender.com` in production (from `VITE_API_URL` env var)

No code changes needed! ✅

## 📊 Service Status

After deployment, you can monitor:

1. **Frontend**: https://fleet-frontend.onrender.com
2. **API Health**: https://fleet-api.onrender.com/health
3. **Render Dashboard**: View logs, metrics, and auto-rollback options

## ⚠️ Free Tier Limitations & Solutions

### Problem: Database Cold Starts
**What**: PostgreSQL spins down after 15 minutes of inactivity → ~30s cold start
**Solution**: 
- Add a scheduled job to ping `/health` every 10 minutes
- Or upgrade PostgreSQL to paid ($15/mo)

### Problem: 512 MB RAM Limit
**What**: All 4 services share 512 MB in one container
**Solution**:
- This is already handled by merging services (done in `start.py`)
- If OOM errors occur, upgrade to paid tier ($7/mo)

### Problem: No Persistent Storage Free
**What**: ChromaDB embeddings lost on reboot
**Solution**:
- Load embeddings on startup from `chromadb/` folder (already in Dockerfile)
- Or add persistent disk for $10/mo

### Problem: Shared CPU (slow AI Agent)
**What**: LLM inference may be slow on free tier
**Solution**:
- Acceptable for demos/testing
- Upgrade to $7/mo instance for production

## 🔧 Manual Deployment / Redeploy

Changes push automatically to Render when you `git push`:

```bash
# Make changes locally
cd /Users/vamsidharreddy/GitHubProjects/FleetManagementSystem
nano frontend/src/App.tsx  # or any file

# Push to GitHub
git add .
git commit -m "Your change description"
git push origin main

# Render automatically redeploys both services
# Watch progress in Render Dashboard → Deployments tab
```

To force a redeploy without code changes:
1. Go to Render Dashboard → **fleet-api** service
2. Click **Manual Deploy** → **Deploy latest commit**

## 📝 Logs

View service logs:

1. **Frontend logs**:
   - Dashboard → **fleet-frontend** → **Logs** tab
   
2. **API logs**:
   - Dashboard → **fleet-api** → **Logs** tab
   - Shows output from `start.py` and all 4 services

## 🚨 Troubleshooting

### `Error: Connection refused on port 8001`
- API service hasn't started yet (takes 1-2 min on free tier)
- Wait 2 minutes, then refresh

### `Cannot GET /` on frontend
- Build failed; check **Logs** tab for errors
- Common: Missing `npm` in PATH (shouldn't happen on Render)

### `ENOSPC: no space left on device`
- Free tier disk is full
- Solution: Clean up ChromaDB cache or upgrade to persistent disk

### Services not communicating
- Ports may be misconfigured
- Check `start.py` — services use `localhost:PORT` within container
- Frontend uses external `VITE_API_URL` for cross-service calls

## 💳 Upgrading from Free

When you need more performance:

1. Go to service → **Instance Type**
2. Change from **Free** to **Standard** ($7/mo)
3. Add persistent disk for ChromaDB ($10/mo)

Total cost: ~$25/mo for recommended setup.

## 🎯 Next Steps

1. ✅ Push deployment files to GitHub
2. ✅ Create Render account
3. ✅ Deploy frontend service
4. ✅ Deploy API service
5. ✅ Test `/health` endpoint
6. ✅ Visit frontend URL and chat!

Questions? Check Render docs: https://render.com/docs
