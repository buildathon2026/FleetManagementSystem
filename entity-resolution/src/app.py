from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from .entity_graph import EntityGraph
from .resolver import EntityResolver, normalize_exact, normalize_unit
from .seed import seed


app = FastAPI(title="Entity Resolution Engine", version="0.1.0")

# Add response middleware to inject CORS headers into every response
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

# Handle OPTIONS requests
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )

# Lazy initialization of graph and resolver
_graph = None
_resolver = None

def get_graph() -> EntityGraph:
    """Lazy initialize entity graph on first use."""
    global _graph
    if _graph is None:
        try:
            _graph = EntityGraph()
            if _graph.is_empty():
                try:
                    seed(_graph)
                except Exception as e:
                    print(f"Warning: Failed to seed graph: {e}", flush=True)
        except Exception as e:
            print(f"Error: Failed to initialize entity graph: {e}", flush=True)
            raise
    return _graph

def get_resolver() -> EntityResolver:
    """Lazy initialize resolver on first use."""
    global _resolver
    if _resolver is None:
        graph = get_graph()
        _resolver = EntityResolver(graph)
    return _resolver


class AliasRegisterRequest(BaseModel):
    entity_id: str = Field(..., examples=["T-084"])
    alias_text: str = Field(..., examples=["truck eighty four"])
    source_doc: Optional[str] = Field(None, examples=["fuel_receipt_001.txt"])
    confidence: float = Field(0.85, ge=0, le=1)
    method: str = Field("manual_alias", examples=["manual_alias"])


def alias_key_for(method: str, alias_text: str) -> str:
    if method == "unit_normalized":
        return normalize_unit(alias_text)
    if method == "vin_exact":
        return f"VIN:{normalize_exact(alias_text)}"
    if method == "cdl_exact":
        return f"CDL:{normalize_exact(alias_text)}"
    if method == "plate_exact":
        return f"PLATE:{normalize_exact(alias_text)}"
    return f"ALIAS:{normalize_exact(alias_text)}"


def decode_metadata(metadata_json: str) -> dict[str, Any]:
    try:
        return json.loads(metadata_json or "{}")
    except json.JSONDecodeError:
        return {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "entity-resolution"}


@app.get("/resolve")
def resolve(mention: str) -> dict[str, Any]:
    resolver = get_resolver()
    return asdict(resolver.resolve(mention))


@app.get("/entity/{entity_id}")
def get_entity(entity_id: str) -> dict[str, Any]:
    graph = get_graph()
    entity = graph.get_entity(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    aliases = [dict(row) for row in graph.get_aliases(entity_id)]
    metadata = decode_metadata(entity["metadata_json"])
    return {
        "id": entity["id"],
        "type": entity["type"],
        "canonical_name": entity["canonical_name"],
        "lat": entity["lat"],
        "lng": entity["lng"],
        "description": entity["description"],
        "metadata": metadata,
        "aliases": aliases,
        "linked_docs": sorted({alias["source_doc"] for alias in aliases if alias["source_doc"]}),
        "driver": metadata.get("driver"),
    }


@app.get("/entities")
def list_entities() -> list[dict[str, Any]]:
    graph = get_graph()
    return [dict(row) for row in graph.list_entities()]


@app.post("/entity/register-alias", status_code=201)
def register_alias(request: AliasRegisterRequest) -> dict[str, Any]:
    graph = get_graph()
    if not graph.get_entity(request.entity_id):
        raise HTTPException(status_code=404, detail="Entity not found")

    alias = graph.add_alias(
        entity_id=request.entity_id,
        alias_text=request.alias_text,
        alias_key=alias_key_for(request.method, request.alias_text),
        source_doc=request.source_doc,
        confidence=request.confidence,
        method=request.method,
    )
    return asdict(alias)
