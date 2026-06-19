"""
AI Agent — the main orchestrator (Module 4).

Ties together the Planner, Tool Executor, and Formatter into a single
POST /ask endpoint. Also exposes /health and /conversation endpoints.
"""

import time
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .planner import create_plan
from .tool_executor import execute_tool_plan
from .formatter import format_response

app = FastAPI(
    title="Fleet AI Agent",
    description="Natural language Q&A agent for fleet management. Plans tool calls against the MCP Data Server and formats results.",
    version="1.0.0",
)

# CORS — allow frontend on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory conversation store (sufficient for demo)
conversations: dict[str, list[dict[str, Any]]] = {}


# --- Request/Response Models ---


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    conversation_id: str | None = None


class ToolCall(BaseModel):
    tool: str
    params: dict[str, Any]
    result: Any | None = None
    error: str | None = None
    execution_time_ms: int = 0


class PlanExecuted(BaseModel):
    tools_called: list[ToolCall]
    execution_time_ms: int


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    confidence: str
    query_type: str
    plan_executed: PlanExecuted
    conversation_id: str


class FeedbackRequest(BaseModel):
    conversation_id: str
    rating: str = Field(..., pattern="^(up|down)$")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# --- Endpoints ---


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service="fleet-ai-agent", version="1.0.0")


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Main endpoint: accept a natural language question, plan tool calls,
    execute them against the MCP Data Server, and format the answer.
    """
    overall_start = time.perf_counter()

    conversation_id = request.conversation_id or str(uuid.uuid4())

    # Step 1: Plan — LLM generates tool-call plan
    try:
        plan = create_plan(request.question)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Planner error: {str(e)}")

    if not plan:
        return AskResponse(
            answer="I couldn't determine what data to look up for your question. Could you rephrase it?",
            sources=[],
            confidence="LOW",
            query_type="STRUCTURED",
            plan_executed=PlanExecuted(tools_called=[], execution_time_ms=0),
            conversation_id=conversation_id,
        )

    # Step 2: Execute — parallel tool calls against MCP Data Server
    tool_results = await execute_tool_plan(plan)

    # If a resolve_entity was in the plan, inject the resolved ID into subsequent calls
    resolved_ids = {}
    for result in tool_results:
        if result["tool"] == "resolve_entity" and "result" in result:
            r = result["result"]
            if "canonical_id" in r:
                resolved_ids[result["params"].get("mention", "")] = r["canonical_id"]

    # Re-execute dependent tools if entity resolution produced IDs
    # that weren't available at plan time (planner may have guessed)
    needs_rerun = []
    for i, call in enumerate(plan):
        if call["tool"] != "resolve_entity" and resolved_ids:
            # Check if any param looks like a placeholder
            params = call.get("params", {})
            for key in ["truck_id", "entity_id"]:
                if key in params and params[key] in ["RESOLVED", None, ""]:
                    # Inject the first resolved ID
                    first_id = next(iter(resolved_ids.values()))
                    params[key] = first_id
                    needs_rerun.append({"tool": call["tool"], "params": params})

    if needs_rerun:
        rerun_results = await execute_tool_plan(needs_rerun)
        # Replace the original results for re-run tools
        rerun_map = {r["tool"]: r for r in rerun_results}
        for i, r in enumerate(tool_results):
            if r["tool"] in rerun_map and r["tool"] != "resolve_entity":
                tool_results[i] = rerun_map[r["tool"]]

    # Step 3: Format — LLM produces natural language answer
    formatted = format_response(request.question, tool_results)

    overall_ms = int((time.perf_counter() - overall_start) * 1000)

    # Build response
    tools_called = [
        ToolCall(
            tool=r["tool"],
            params=r.get("params", {}),
            result=r.get("result"),
            error=r.get("error"),
            execution_time_ms=r.get("execution_time_ms", 0),
        )
        for r in tool_results
    ]

    response = AskResponse(
        answer=formatted["answer"],
        sources=formatted["sources"],
        confidence=formatted["confidence"],
        query_type=formatted["query_type"],
        plan_executed=PlanExecuted(
            tools_called=tools_called, execution_time_ms=overall_ms
        ),
        conversation_id=conversation_id,
    )

    # Store in conversation history
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    conversations[conversation_id].append(
        {"question": request.question, "response": response.model_dump()}
    )

    return response


@app.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Retrieve conversation history with tool call logs."""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation_id": conversation_id, "turns": conversations[conversation_id]}


@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """Record user feedback (thumbs up/down) for a conversation."""
    if request.conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # In production, this would go to a database/analytics
    return {"status": "recorded", "conversation_id": request.conversation_id, "rating": request.rating}
