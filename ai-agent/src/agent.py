from __future__ import annotations

import time
import uuid
from dataclasses import asdict
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .formatter import Formatter
from .llm_formatter import LLMFormatter
from .llm_planner import LLMPlanner
from .models import AskRequest, AskResponse, FeedbackRequest
from .planner import Planner
from .storage import ConversationStore
from .tool_executor import ToolExecutor


app = FastAPI(
    title="Fleet AI Agent",
    version="0.1.0",
    description=(
        "Natural language Q&A agent for fleet management. "
        "Converts questions into tool-call plans, executes them against the MCP Data Server (Module 1), "
        "and formats results into human-readable answers with citations."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=[
        {"name": "Agent", "description": "Natural language question answering"},
        {"name": "Agent (LLM)", "description": "LLM-powered agent for comparison"},
        {"name": "Conversations", "description": "Conversation history and feedback"},
        {"name": "System", "description": "Health and status"},
    ],
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add a catch-all OPTIONS handler for preflight requests
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    return Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Lazy initialization of components
_planner = None
_llm_planner = None
_executor = None
_formatter = None
_llm_formatter = None
_store = None

def get_components():
    """Lazy initialize all agent components on first use."""
    global _planner, _llm_planner, _executor, _formatter, _llm_formatter, _store
    if _planner is None:
        _planner = Planner()
    if _llm_planner is None:
        _llm_planner = LLMPlanner()
    if _executor is None:
        _executor = ToolExecutor()
    if _formatter is None:
        _formatter = Formatter()
    if _llm_formatter is None:
        _llm_formatter = LLMFormatter()
    if _store is None:
        _store = ConversationStore()
    return _planner, _llm_planner, _executor, _formatter, _llm_formatter, _store


@app.get("/health", tags=["System"], summary="Health check")
def health() -> dict[str, str]:
    """Returns service health status."""
    return {"status": "ok", "service": "ai-agent"}


@app.post("/ask", response_model=AskResponse, tags=["Agent"], summary="Ask a question")
async def ask(request: AskRequest) -> AskResponse:
    """
    Submit a natural language question about fleet data.

    The agent will:
    1. Plan which MCP tools to call (expenses, revenue, documents, etc.)
    2. Execute those tool calls against the MCP Data Server
    3. Format the results into a human-readable answer with sources

    **Example questions:**
    - "How much did I spend on fuel last month?"
    - "What's truck 84's profit this quarter?"
    - "Show me documents for the white Cascadia"
    - "Any upcoming renewals?"
    """
    planner, _, executor, formatter, _, store = get_components()

    conversation_id = request.conversation_id or f"conv-{uuid.uuid4().hex[:12]}"
    started = time.perf_counter()

    plan = planner.plan(request.question)
    results = await executor.execute(plan)
    answer, sources, confidence = formatter.format(request.question, plan, results)
    execution_time_ms = int((time.perf_counter() - started) * 1000)

    plan_executed: dict[str, Any] = {
        "tools_called": [call.model_dump() for call in plan.tools],
        "tool_results": [result.model_dump() for result in results],
        "execution_time_ms": execution_time_ms,
        "rationale": plan.rationale,
    }

    response = AskResponse(
        conversation_id=conversation_id,
        answer=answer,
        sources=sources[:20],
        confidence=confidence,
        query_type=plan.query_type,
        plan_executed=plan_executed,
    )

    store.append_message(conversation_id, "user", request.question)
    store.append_message(conversation_id, "assistant", answer, response.model_dump())

    return response


@app.post("/ask/llm", response_model=AskResponse, tags=["Agent (LLM)"], summary="Ask a question (LLM-powered)")
async def ask_llm(request: AskRequest) -> AskResponse:
    """
    LLM-powered version of /ask for hackathon comparison.

    Uses a Featherless-hosted LLM (Meta-Llama-3.1-8B-Instruct) to:
    1. **Plan** — generate tool-call plans from natural language (vs rule-based)
    2. **Execute** — same MCP tool calls against Module 1
    3. **Format** — produce natural language answers with the LLM (vs templates)

    Compare responses from `/ask` (rule-based) vs `/ask/llm` (LLM-powered)
    to demonstrate the difference in flexibility and answer quality.

    Falls back to rule-based planner/formatter if the LLM API is unavailable.
    """
    _, llm_planner, executor, _, llm_formatter, store = get_components()

    conversation_id = request.conversation_id or f"conv-llm-{uuid.uuid4().hex[:12]}"
    started = time.perf_counter()

    # Step 1: LLM-based planning (no fallback — errors surface to caller)
    plan = llm_planner.plan(request.question)

    # Step 2: Execute tool calls
    results = await executor.execute(plan)

    # Step 3: LLM-based formatting (no fallback — errors surface to caller)
    answer, sources, confidence = llm_formatter.format(request.question, plan, results)

    execution_time_ms = int((time.perf_counter() - started) * 1000)

    plan_executed: dict[str, Any] = {
        "tools_called": [call.model_dump() for call in plan.tools],
        "tool_results": [result.model_dump() for result in results],
        "execution_time_ms": execution_time_ms,
        "rationale": plan.rationale,
        "mode": "llm",
    }

    response = AskResponse(
        conversation_id=conversation_id,
        answer=answer,
        sources=sources[:20],
        confidence=confidence,
        query_type=plan.query_type,
        plan_executed=plan_executed,
    )

    store.append_message(conversation_id, "user", request.question)
    store.append_message(conversation_id, "assistant", answer, response.model_dump())

    return response


@app.get("/conversation/{conversation_id}", tags=["Conversations"], summary="Get conversation history")
def conversation(conversation_id: str) -> dict[str, Any]:
    """Retrieve full conversation history including tool call logs for a given conversation."""
    _, _, _, _, _, store = get_components()
    history = store.get_conversation(conversation_id)
    if not history:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return history


@app.post("/feedback", tags=["Conversations"], summary="Submit feedback")
def feedback(request: FeedbackRequest) -> dict[str, str]:
    """Record thumbs up/down feedback for a conversation turn."""
    _, _, _, _, _, store = get_components()
    if not store.get_conversation(request.conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    store.save_feedback(request.conversation_id, request.rating, request.comment)
    return {"status": "ok"}
