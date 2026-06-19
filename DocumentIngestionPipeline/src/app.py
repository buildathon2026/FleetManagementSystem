"""FastAPI application for the Document Ingestion Pipeline."""

import asyncio
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from .ingestion import DocumentIngestionPipeline
from .database import DocumentDB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Ingestion Pipeline",
    description="Module 3: Ingests, classifies, and processes fleet documents",
    version="1.0.0",
)

# Initialize pipeline
pipeline = DocumentIngestionPipeline()


# Request/Response Models
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


class DocumentStatus(BaseModel):
    doc_id: str
    status: str
    doc_type: Optional[str] = None
    entity_id: Optional[str] = None
    confidence: Optional[float] = None
    ingested_at: Optional[str] = None


class StatsResponse(BaseModel):
    total_ingested: int
    doc_types: int
    by_type: List[dict]
    last_ingested_at: Optional[str] = None
    vector_store_total: int


# Endpoints
@app.post("/ingest", response_model=IngestResponse)
async def ingest_document(request: IngestRequest):
    """
    Ingest a single document through the pipeline.

    **Stages:**
    1. Classification - Determine document type
    2. Extraction - Extract fields from document
    3. Entity Resolution - Link to fleet entities
    4. Database Storage - Store in SQLite
    5. Vector Embedding - Create embeddings for RAG
    """
    logger.info(f"Ingesting document: {request.filename}")

    try:
        result = await pipeline.ingest_document(request.filename, request.content)
        return IngestResponse(**result)
    except Exception as e:
        logger.error(f"Error ingesting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/batch")
async def ingest_batch(documents: List[IngestRequest]):
    """
    Ingest multiple documents concurrently.

    **Performance:** Uses asyncio for concurrent processing
    """
    logger.info(f"Ingesting batch of {len(documents)} documents")

    try:
        doc_tuples = [(doc.filename, doc.content) for doc in documents]
        results = await pipeline.ingest_batch(doc_tuples)
        return {"total": len(results), "results": results}
    except Exception as e:
        logger.error(f"Error ingesting batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/from-files")
async def ingest_files(files: List[UploadFile] = File(...)):
    """
    Ingest documents from uploaded files.

    Supports text files (.txt), JSON, and PDF text extracts.
    """
    logger.info(f"Ingesting {len(files)} files")

    results = []
    try:
        for file in files:
            content = await file.read()
            try:
                # Try to decode as text
                text_content = content.decode("utf-8")
            except UnicodeDecodeError:
                logger.warning(f"File {file.filename} is not valid UTF-8, skipping")
                results.append(
                    {
                        "filename": file.filename,
                        "status": "failed",
                        "error": "Invalid UTF-8 encoding",
                    }
                )
                continue

            result = await pipeline.ingest_document(file.filename, text_content)
            results.append(result)

        return {"total_files": len(files), "results": results}

    except Exception as e:
        logger.error(f"Error ingesting files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ingest/status/{doc_id}", response_model=DocumentStatus)
async def get_document_status(doc_id: str):
    """
    Get ingestion status for a specific document.

    Returns classification results, entity resolution, and processing stages.
    """
    status = pipeline.get_document_status(doc_id)

    if status.get("status") == "not_found":
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

    return DocumentStatus(**status)


@app.get("/ingest/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get pipeline statistics.

    Includes total documents processed, breakdown by type, and vector store stats.
    """
    db_stats = pipeline.db.get_stats()
    vector_stats = pipeline.vector_store.get_collection_stats()

    return StatsResponse(
        total_ingested=db_stats.get("total_ingested", 0),
        doc_types=db_stats.get("doc_types", 0),
        by_type=db_stats.get("by_type", []),
        last_ingested_at=db_stats.get("last_ingested_at"),
        vector_store_total=vector_stats.get("total_documents", 0),
    )


@app.get("/search")
async def search_documents(
    query: str,
    entity_id: Optional[str] = None,
    doc_type: Optional[str] = None,
    n_results: int = 5,
):
    """
    Search documents by semantic similarity.

    **Parameters:**
    - query: Search query text
    - entity_id: Filter by fleet entity (truck ID)
    - doc_type: Filter by document type
    - n_results: Number of results to return

    **Returns:**
    List of matching documents with similarity scores
    """
    logger.info(f"Searching: {query}")

    try:
        results = pipeline.vector_store.search(
            query=query,
            n_results=n_results,
            entity_id=entity_id,
            doc_type=doc_type,
        )
        return {"query": query, "results": results}
    except Exception as e:
        logger.error(f"Error searching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/{entity_id}")
async def get_entity_documents(
    entity_id: str,
    doc_type: Optional[str] = None,
):
    """
    Get all documents for a specific entity (truck).

    **Parameters:**
    - entity_id: Fleet entity ID (e.g., T-084)
    - doc_type: Optional filter by document type

    **Returns:**
    List of documents linked to the entity
    """
    logger.info(f"Getting documents for entity: {entity_id}")

    try:
        # Get from vector store
        docs = pipeline.vector_store.get_documents_by_entity(
            entity_id=entity_id,
            doc_type=doc_type,
        )
        return {"entity_id": entity_id, "count": len(docs), "documents": docs}
    except Exception as e:
        logger.error(f"Error retrieving entity documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/document/{doc_id}/archive")
async def archive_document(doc_id: str):
    """
    Mark a document as archived (inactive).

    Archived documents are excluded from search results and queries.
    """
    logger.info(f"Archiving document: {doc_id}")

    try:
        success = pipeline.vector_store.archive_document(doc_id)
        if success:
            return {"doc_id": doc_id, "status": "archived"}
        else:
            raise HTTPException(status_code=500, detail="Failed to archive document")
    except Exception as e:
        logger.error(f"Error archiving document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/document/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete a document from the pipeline.

    Removes from both database and vector store.
    """
    logger.info(f"Deleting document: {doc_id}")

    try:
        # Mark as inactive in database
        doc = pipeline.db.get_document(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

        # Archive in vector store
        pipeline.vector_store.archive_document(doc_id)
        return {"doc_id": doc_id, "status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        stats = pipeline.get_stats()
        return {
            "status": "healthy",
            "pipeline": "Document Ingestion Pipeline v1.0",
            "database": "connected",
            "vector_store": "connected",
            "documents_processed": stats["total_processed"],
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}, 503


@app.get("/")
async def root():
    """Root endpoint with API documentation."""
    return {
        "name": "Document Ingestion Pipeline",
        "version": "1.0.0",
        "module": "Module 3",
        "description": "Ingests, classifies, and processes fleet documents",
        "endpoints": {
            "POST /ingest": "Ingest a single document",
            "POST /ingest/batch": "Ingest multiple documents",
            "POST /ingest/from-files": "Ingest from uploaded files",
            "GET /ingest/status/{doc_id}": "Get document ingestion status",
            "GET /ingest/stats": "Get pipeline statistics",
            "GET /search": "Search documents by semantic similarity",
            "GET /documents/{entity_id}": "Get documents for entity",
            "POST /document/{doc_id}/archive": "Archive a document",
            "DELETE /document/{doc_id}": "Delete a document",
            "GET /health": "Health check",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8004)
