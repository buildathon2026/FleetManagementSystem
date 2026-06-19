FROM node:20-bullseye AS base

WORKDIR /app

# Install system dependencies and Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3.9 \
    python3-pip \
    python3-venv \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3.9 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python base dependencies
RUN pip install --no-cache-dir -q fastapi uvicorn pydantic httpx python-multipart chromadb

# Copy Python requirements and install
COPY DocumentIngestionPipeline/requirements.txt ./ingest_requirements.txt
COPY ai-agent/requirements.txt ./agent_requirements.txt
COPY entity-resolution/requirements.txt ./entity_requirements.txt

RUN pip install --no-cache-dir -q -r ingest_requirements.txt && \
    pip install --no-cache-dir -q -r agent_requirements.txt && \
    pip install --no-cache-dir -q -r entity_requirements.txt || true

# Copy Node.js package files and install
COPY FleetDataService/package*.json ./fleet/
RUN cd fleet && npm ci --prefer-offline --no-audit

# Copy all service source code
COPY DocumentIngestionPipeline/src ./ingest_src/
COPY ai-agent/src ./agent_src/
COPY entity-resolution/src ./entity_src/
COPY FleetDataService/src ./fleet/src/
COPY FleetDataService/tsconfig.json ./fleet/tsconfig.json

# Build FleetDataService TypeScript
RUN cd fleet && npm run build

# Copy shared data
COPY DocumentIngestionPipeline/fleet.db ./fleet.db 2>/dev/null || echo ""
COPY DocumentIngestionPipeline/chromadb ./chromadb 2>/dev/null || echo ""
COPY FleetDataService/fleet.db ./fleet/fleet.db 2>/dev/null || echo ""

# Copy startup script
COPY start.py .

# Expose all service ports
EXPOSE 8001 8002 8003 8004 8000

# Health check (check primary health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python3.9 -c "import requests; requests.get('http://localhost:8001/health')" || exit 1

CMD ["python", "start.py"]
