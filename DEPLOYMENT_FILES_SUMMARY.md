# Deployment Files Summary

This document describes all the files created for Render deployment.

## 📦 Files Created

### 1. **Dockerfile** (Main deployment container)

**Location**: `/Dockerfile`

**Purpose**: Creates a multi-runtime Docker image that runs:
- Node.js services (FleetDataService/MCP Data Server)
- Python services (FastAPI Uvicorn instances)

**What it does**:
- Installs Node.js 20 + Python 3.9 + system dependencies
- Installs all Python package requirements from each service
- Builds FleetDataService TypeScript code
- Copies database files (fleet.db, chromadb/) into image
- Exposes ports 8001-8004 (backend APIs)
- Sets up health check for `localhost:8001/health`

**When to modify**:
- Adding new service dependencies
- Changing database paths
- Adding environment-specific configurations

---

### 2. **start.py** (Service orchestrator)

**Location**: `/start.py`

**Purpose**: Launches all 4 backend services in parallel within the Docker container

**Services it starts**:
1. **Document Ingestion** (port 8004) — Python/Uvicorn
2. **Entity Resolution** (port 8003) — Python/Uvicorn
3. **MCP Data Server** (port 8002) — Node.js/Express
4. **AI Agent** (port 8001) — Python/Uvicorn

**Features**:
- Staggered startup (2s delay between services) to avoid resource contention
- Real-time logging with timestamps
- Graceful shutdown (Ctrl+C cleanup)
- Process monitoring (detects and reports service crashes)
- Cross-platform compatible (Windows/Mac/Linux)

**When to modify**:
- Adding/removing services
- Changing port assignments
- Adjusting startup delays

---

### 3. **render.yaml** (Render infrastructure config)

**Location**: `/render.yaml`

**Purpose**: Declarative configuration for Render services and databases

**Defines**:
- **fleet-frontend** web service (Node.js, Vite build)
- **fleet-api** web service (Docker, our multi-service container)
- Environment variables and secrets

**Why YAML instead of clicking**:
- Infrastructure as code (repeatable, versionable)
- Can be extended (add PostgreSQL, volumes, etc.)
- Auto-deploys when file changes

**When to modify**:
- Adding database service
- Changing environment variables
- Adding persistent disk volumes
- Configuring custom domains

---

### 4. **.dockerignore** (Docker build optimization)

**Location**: `/.dockerignore`

**Purpose**: Excludes unnecessary files from Docker build context (speeds up build, reduces image size)

**Excludes**:
- Git metadata (.git, .gitignore)
- Node modules + venv (rebuilt in image)
- Cache files (.pytest_cache, vite output)
- Test data (large PDFs, CSVs)
- Documentation (not needed in runtime)

**When to modify**:
- If new file types should be excluded
- If you need files in the container that are currently ignored

---

### 5. **.env.example** (Environment configuration template)

**Location**: `/.env.example`

**Purpose**: Documents all environment variables needed for deployment

**Shows**:
- API URLs
- LLM API keys
- Database connection strings
- Application settings

**How to use**:
- Copy to `.env` locally for development
- Reference when setting Render secrets
- Never commit actual keys to git

---

### 6. **RENDER_DEPLOYMENT.md** (Comprehensive guide)

**Location**: `/RENDER_DEPLOYMENT.md`

**Purpose**: Complete deployment documentation with:
- Step-by-step Render setup instructions
- Cost breakdown (free vs. paid)
- Limitation explanations + workarounds
- Troubleshooting guide
- Manual deployment procedures

**When to read**:
- Before first deployment
- When debugging issues
- When planning upgrades

---

### 7. **RENDER_QUICK_START.md** (Fast 5-minute guide)

**Location**: `/RENDER_QUICK_START.md`

**Purpose**: Quick reference for deploying in ~5 minutes

**Covers**:
- Pre-deployment checklist
- 5-step deployment process
- Testing verification
- Free tier limitations
- Troubleshooting quick fixes

**When to use**:
- First-time deployment
- Sharing deployment steps with team
- Quick reference during deployment

---

## 🔄 How Files Work Together

```
┌─────────────────────────────────────────────────────┐
│ You: git push to GitHub                             │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ Render detects changes → reads render.yaml          │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│ Frontend Build │   │ API Build       │
├────────────────┤   ├─────────────────┤
│ Read:          │   │ Read:           │
│ • frontend/    │   │ • Dockerfile    │
│ • vite config  │   │ • .dockerignore │
│                │   │                 │
│ Run:           │   │ Run:            │
│ npm install    │   │ docker build    │
│ npm run build  │   │ (runs start.py) │
└────────┬───────┘   └────────┬────────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────▼─────────┐
         │  Both services   │
         │  running on web  │
         │  with URLs:      │
         │                  │
         │ frontend:...     │
         │ api:...          │
         └──────────────────┘
```

---

## 🎯 Deployment Checklist

Before pushing to Render:

- [ ] All files created in repo root:
  - [ ] `Dockerfile`
  - [ ] `start.py`
  - [ ] `render.yaml`
  - [ ] `.dockerignore`
  - [ ] `.env.example`
  - [ ] `RENDER_DEPLOYMENT.md`
  - [ ] `RENDER_QUICK_START.md`

- [ ] Code is on GitHub (main branch)
  
- [ ] Files are committed:
  ```bash
  git add Dockerfile render.yaml start.py .dockerignore
  git add .env.example RENDER_DEPLOYMENT.md RENDER_QUICK_START.md
  git commit -m "Add Render deployment configuration"
  git push origin main
  ```

- [ ] Render account created

- [ ] Services created in order:
  1. [ ] fleet-frontend
  2. [ ] fleet-api

- [ ] Environment variables set:
  - [ ] Frontend: `VITE_API_URL`
  - [ ] Backend: `PORT`, `PYTHONUNBUFFERED`, `PYTHONDONTWRITEBYTECODE`

- [ ] Secrets added (if using LLM APIs):
  - [ ] `openai_api_key`
  - [ ] `anthropic_api_key`

---

## 📊 File Sizes & Build Impact

| File | Size | Impact | Build Time |
|------|------|--------|-----------|
| Dockerfile | ~2 KB | Defines image | - |
| start.py | ~4 KB | Orchestrates services | <1s |
| render.yaml | ~1 KB | Infrastructure as code | - |
| .dockerignore | ~1 KB | Speeds up build | ~30% faster |
| .env.example | <1 KB | Documentation | - |
| RENDER_DEPLOYMENT.md | ~15 KB | Documentation | - |
| RENDER_QUICK_START.md | ~8 KB | Documentation | - |
| **Total non-code** | ~32 KB | | Frontend: 2-3 min, Backend: 5-7 min |

---

## 🔐 Secrets Management

**Never commit these to git:**
- API keys (OpenAI, Anthropic, etc.)
- Database passwords
- Session tokens

**How to add to Render**:
1. Dashboard → Service → Environment
2. Add Secret File
3. Paste actual key (not in code)

**In code, reference as environment variable**:
```python
import os
api_key = os.getenv("OPENAI_API_KEY")  # Read from Render secret
```

---

## 🚀 Next Steps After Deployment

1. **Monitor**: Watch logs in Render dashboard
2. **Test**: Visit frontend URL, test API endpoints
3. **Scale**: When needed, upgrade instance types
4. **Customize**: Add domains, CDN, additional services

---

**Questions?** See:
- [RENDER_QUICK_START.md](RENDER_QUICK_START.md) — Fast deployment
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) — Detailed guide
- [Render Docs](https://render.com/docs) — Official reference
