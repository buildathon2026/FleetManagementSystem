FROM node:20-bullseye

WORKDIR /app

# Install system dependencies and Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3.9 \
    python3-pip \
    python3-venv \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and activate Python virtual environment
RUN python3.9 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    VIRTUAL_ENV="/opt/venv"

# Install Python base dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir fastapi uvicorn pydantic httpx python-multipart chromadb

# Copy all Python requirements and install
COPY DocumentIngestionPipeline/requirements.txt ./ingest_requirements.txt
COPY ai-agent/requirements.txt ./agent_requirements.txt
COPY entity-resolution/requirements.txt ./entity_requirements.txt

RUN pip install --no-cache-dir -r ingest_requirements.txt && \
    pip install --no-cache-dir -r agent_requirements.txt && \
    pip install --no-cache-dir -r entity_requirements.txt

# Copy and build Node.js service
COPY FleetDataService/package*.json ./fleet/
COPY FleetDataService/src ./fleet/src/
COPY FleetDataService/tsconfig.json ./fleet/
WORKDIR /app/fleet
RUN npm ci --prefer-offline --no-audit && npm run build

# Back to app root and copy Python services
WORKDIR /app
COPY DocumentIngestionPipeline/src/ ./ingest_src/
COPY ai-agent/src/ ./agent_src/
COPY entity-resolution/src/ ./entity_src/

# Copy data files
COPY DocumentIngestionPipeline/fleet.db ./fleet.db
COPY DocumentIngestionPipeline/chromadb ./chromadb
COPY FleetDataService/fleet.db ./fleet/fleet.db

# Copy startup orchestrator
COPY start.py ./

# Make start.py executable
RUN chmod +x start.py

# Expose all service ports
EXPOSE 8001 8002 8003 8004

# Simple health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8001/health || curl -f http://localhost:8002/health || exit 1

CMD ["python", "start.py"]
