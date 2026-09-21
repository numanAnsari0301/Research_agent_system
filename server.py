"""
FastAPI wrapper that streams your research pipeline to the React UI.

Each agent step is sent to the browser as a Server-Sent Event the moment it
starts and finishes, so the UI can show live progress.

Run (from the multi_agent_system folder, with your venv active):
    uvicorn server:app --reload --port 8000
"""
import json
import os
import traceback
from typing import Iterator

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agent import build_reader_agent, build_search_agent, writer_chain, critic_chain

app = FastAPI(title="Research Desk API")

# Comma-separated list of allowed frontend URLs. Set ALLOWED_ORIGINS on your host, e.g.
#   ALLOWED_ORIGINS=https://research-desk.vercel.app
ALLOWED_ORIGINS = [
    o.strip().rstrip("/")
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def to_text(value) -> str:
    """Turn anything LangChain returns (str, dict, AIMessage, list of blocks) into plain text."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("text", "output", "content"):
            if key in value:
                return to_text(value[key])
        return json.dumps(value, ensure_ascii=False, default=str)
    if isinstance(value, list):
        parts = []
        for block in value:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "\n".join(p for p in parts if p)
    if hasattr(value, "content"):
        return to_text(value.content)
    return str(value)


def sse(payload: dict) -> str:
    """Format one Server-Sent Event."""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def research_events(topic: str) -> Iterator[str]:
    """Run the pipeline step by step and yield an event at every boundary."""
    current = "search"
    try:
        # Step 1: search agent
        current = "search"
        yield sse({"type": "step_start", "step": current})
        search_agent = build_search_agent()
        search_result = search_agent.invoke({
            "messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]
        })
        search_results = to_text(search_result["messages"][-1].content)
        yield sse({"type": "step_done", "step": current, "output": search_results})

        # Step 2: reader agent
        current = "reader"
        yield sse({"type": "step_start", "step": current})
        reader_agent = build_reader_agent()
        reader_result = reader_agent.invoke({
            "messages": [(
                "user",
                f"""Based on the following search results about '{topic}',
pick the most relevant URL and scrape it for deeper content.

Search Results:
{search_results[:2000]}""",
            )]
        })
        scraped = to_text(reader_result["messages"][-1].content)
        yield sse({"type": "step_done", "step": current, "output": scraped})

        # Step 3: writer chain
        current = "writer"
        yield sse({"type": "step_start", "step": current})
        research_combined = (
            f"SEARCH RESULTS:\n{search_results}\n\n"
            f"DETAILED SCRAPED RESULTS:\n{scraped}\n\n"
        )
        report = to_text(writer_chain.invoke({"topic": topic, "research": research_combined}))
        yield sse({"type": "step_done", "step": current, "output": report})

        # Step 4: critic chain
        current = "critic"
        yield sse({"type": "step_start", "step": current})
        feedback = to_text(critic_chain.invoke({"report": report}))
        yield sse({"type": "step_done", "step": current, "output": feedback})

        yield sse({"type": "done"})

    except Exception as exc:  # noqa: BLE001 - surface every failure to the UI
        traceback.print_exc()  # full traceback stays in this terminal
        message = f"{type(exc).__name__}: {exc}"
        yield sse({"type": "error", "step": current, "message": message[:600]})


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/research/stream")
def research_stream(topic: str = Query(..., min_length=2, max_length=500)):
    return StreamingResponse(
        research_events(topic.strip()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
