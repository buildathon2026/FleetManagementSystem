# Render Deployment — Quick Start (5 minutes)

## ✅ Pre-Deployment Checklist

Before deploying to Render, make sure:

- [ ] Code is pushed to GitHub
- [ ] You have a GitHub account
- [ ] You have a Render account (free at render.com)
- [ ] API keys ready:
  - [ ] OpenAI API key (if using GPT)
  - [ ] Anthropic API key (if using Claude)

## 🚀 Deploy in 5 Steps

### Step 1: Push Code to GitHub (1 min)

```bash
cd /Users/vamsidharreddy/GitHubProjects/FleetManagementSystem

git add Dockerfile render.yaml start.py .dockerignore .env.example RENDER_DEPLOYMENT.md
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Create Render Account (1 min)

- Go to https://render.com
- Click **Sign Up**
- Choose **Sign up with GitHub** (easier)
- Authorize Render to access your GitHub repos

### Step 3: Deploy Frontend (1 min)

1. **In Render Dashboard**, click **New +** → **Web Service**
2. **Search repo**: `FleetManagementSystem`
3. **Click Connect** (next to the repo)
4. **Configure**:
   - Name: `fleet-frontend`
   - Environment: `Node`
   - Build: `cd frontend && npm install && npm run build`
   - Start: `cd frontend && npm run preview`
   - Instance: `Free`
5. **Add Environment Variable**:
   - `VITE_API_URL` = `https://fleet-api.onrender.com`
6. **Create Web Service** (wait 2-3 min for build)

✅ **Frontend live at**: `https://fleet-frontend.onrender.com`

### Step 4: Deploy Backend API (2 min)

1. **In Render Dashboard**, click **New +** → **Web Service**
2. **Same repo**, click **Connect**
3. **Configure**:
   - Name: `fleet-api`
   - Environment: `Docker`
   - Instance: `Free`
4. **Add Environment Variables**:
   ```
   PORT=8001
   PYTHONUNBUFFERED=1
   PYTHONDONTWRITEBYTECODE=1
   ```
5. **Add Secrets** (if using LLM APIs):
   - Click **Add Secret File**
   - File: `openai_api_key` → Paste your key
   - File: `anthropic_api_key` → Paste your key
6. **Create Web Service** (wait 5-7 min, Docker takes longer)

✅ **API live at**: `https://fleet-api.onrender.com`

### Step 5: Test It (1 min)

```bash
# Check API is running
curl https://fleet-api.onrender.com/health

# Should return: {"status":"ok","service":"ai-agent"} (or similar)

# Visit frontend in browser
open https://fleet-frontend.onrender.com
```

## 🎯 You're Done!

Your Fleet Management System is now live on Render free tier:

| Component | URL |
|-----------|-----|
| **Chat & Dashboard** | https://fleet-frontend.onrender.com |
| **API Health Check** | https://fleet-api.onrender.com/health |
| **Render Dashboard** | https://dashboard.render.com |

## 📊 Monitor & Troubleshoot

### View Logs
1. Go to https://dashboard.render.com
2. Click **fleet-api** service
3. Go to **Logs** tab
4. Watch real-time output from all services

### API Not Responding?
- Wait 2 minutes (Docker build can be slow)
- Check **Logs** for errors
- Restart service: **Manual Deploy** button

### Frontend Showing Errors?
- Check browser **Console** (F12)
- Verify `VITE_API_URL` env var is set
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Services Running But No Response?
- Check `start.py` logs — all 4 services should start
- Verify port numbers (8001-8004)
- Ensure ChromaDB data is in container

## 💡 Free Tier Notes

✅ **What works**:
- All 5 services run on free tier
- No monthly cost
- Auto-deploys when you push to GitHub

⚠️ **Limitations**:
- Services spin down after 15 min inactivity (first request slower)
- 512 MB RAM shared across 4 backend services
- 100 GB monthly egress (usually not hit)

**When to upgrade** ($25-40/mo):
- Database cold starts too slow → Upgrade PostgreSQL
- Backend services OOM → Upgrade to paid instance
- Need persistent ChromaDB → Add persistent disk

## 🔗 Next Steps

1. **Test the chat**: Visit frontend → ask "How much did I spend on fuel?"
2. **Check integration**: Verify AI Agent → MCP Server → Data responses flow
3. **Add more docs**: Use `/ingest` endpoint to add custom documents
4. **Customize**: Update `VITE_API_URL` for custom domains

## 📚 Full Documentation

For detailed setup, troubleshooting, and architecture:
- **Deployment Details**: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- **System Architecture**: [README.md](README.md)
- **API Reference**: `DocumentIngestionPipeline/README.md`

---

**Need help?** Check Render docs: https://render.com/docs
