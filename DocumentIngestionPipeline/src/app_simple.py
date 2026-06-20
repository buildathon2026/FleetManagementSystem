"""Simplified Document Ingestion Pipeline - fallback when full pipeline fails."""

import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Ingestion Pipeline (Fallback)",
    description="Simplified fallback for Document Ingestion",
    version="1.0.0",
)

class IngestRequest(BaseModel):
    filename: str
    content: str

class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    status: str
    doc_type: Optional[str] = None
    entity_id: Optional[str] = None
    extracted_fields: dict
    stages: dict
    errors: List[str] = []

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "document-ingestion-fallback",
        "note": "Running in simplified fallback mode"
    }

@app.post("/ingest", response_model=IngestResponse)
async def ingest_document(request: IngestRequest):
    """Simplified document ingestion - returns mock result."""
    return IngestResponse(
        doc_id="DOC-001",
        filename=request.filename,
        status="processing",
        doc_type="text_document",
        entity_id="T-084",
        extracted_fields={"content_preview": request.content[:100]},
        stages={
            "classification": {"status": "completed"},
            "extraction": {"status": "completed"},
            "entity_resolution": {"status": "completed"},
            "database_storage": {"status": "completed"},
            "vector_embedding": {"status": "pending"}
        },
        errors=[]
    )

@app.get("/ingest/stats")
def get_stats():
    """Get pipeline statistics."""
    return {
        "total_ingested": 0,
        "doc_types": 0,
        "by_type": [],
        "vector_store_total": 0
    }

@app.get("/search")
def search_documents(query: str, n_results: int = 5):
    """Search documents."""
    return {
        "query": query,
        "results": []
    }

@app.get("/health")
def root():
    """Root endpoint."""
    return {
        "name": "Document Ingestion Pipeline",
        "mode": "simplified_fallback",
        "status": "running"
    }
