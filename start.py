#!/usr/bin/env python3
"""
Multi-service launcher for Render deployment.
Starts all backend services (Python Uvicorn + Node.js) in parallel.
Services are launched from /app working directory.
"""

import subprocess
import time
import sys
import signal
import os

# Service definitions: (name, runtime, command, port, description)
SERVICES = [
    # ("Document Ingestion", "python", ["python", "-m", "uvicorn", "ingest_src.app:app", "--host", "0.0.0.0", "--port", "8004"], 8004, "Classifies & ingests documents"),
    ("Entity Resolution", "python", ["python", "-m", "uvicorn", "entity_src.app:app", "--host", "0.0.0.0", "--port", "8003"], 8003, "Maps truck references to IDs"),
    ("MCP Data Server", "node", ["node", "fleet/dist/index.js"], 8002, "Secure API for fleet data"),
    ("AI Agent", "python", ["python", "-m", "uvicorn", "agent_src.agent:app", "--host", "0.0.0.0", "--port", "8001"], 8001, "Natural language Q&A"),
]

processes = []
services_started = []


def log(msg: str, level: str = "INFO"):
    """Print timestamped log message."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level:8s} | {msg}", flush=True)


def cleanup(signum=None, frame=None):
    """Graceful shutdown of all services."""
    log("Shutdown signal received, cleaning up...", "WARN")
    for process in processes:
        if process.poll() is None:  # Still running
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    log("All services stopped", "INFO")
    sys.exit(0)


def start_service(name: str, runtime: str, cmd: list, port: int, description: str) -> subprocess.Popen:
    """Start a service and track it."""
    env = os.environ.copy()
    env["PORT"] = str(port)
    env["PYTHONUNBUFFERED"] = "1"

    log(f"Starting {name} on port {port} ({runtime})...", "INFO")

    try:
        process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            universal_newlines=True,
            bufsize=1,
        )
        services_started.append((name, runtime, port))
        log(f"  ✓ {name} launched (PID {process.pid})", "OK")

        # Read startup output for debugging (non-blocking)
        import select
        if hasattr(select, 'select'):
            start = time.time()
            while time.time() - start < 2:  # Read for 2 seconds
                ready, _, _ = select.select([process.stdout, process.stderr], [], [], 0.1)
                for stream in ready:
                    line = stream.readline()
                    if line:
                        log(f"  [{name}] {line.rstrip()}", "DEBUG")

        return process
    except Exception as e:
        log(f"  ✗ Failed to start {name}: {e}", "ERROR")
        sys.exit(1)


def main():
    """Main entry point."""
    log("=== Fleet Management System Multi-Service Launcher ===", "INFO")
    log(f"Starting {len(SERVICES)} services...", "INFO")

    # Register signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # Start all services
    for name, runtime, cmd, port, description in SERVICES:
        process = start_service(name, runtime, cmd, port, description)
        processes.append(process)
        time.sleep(1)  # Stagger startup

    # Log service endpoints
    log("=== Services Started ===", "INFO")
    for name, runtime, port in services_started:
        log(f"  {name:25s} → http://0.0.0.0:{port} ({runtime})", "INFO")
    log("=== Monitoring ===", "INFO")

    # Monitor services
    try:
        while True:
            time.sleep(5)
            for i, process in enumerate(processes):
                if process.poll() is not None:
                    name = services_started[i][0]
                    log(f"  ✗ {name} exited unexpectedly", "ERROR")
                    # Don't crash all services if one fails
                    # Just log and continue monitoring others
                    if name == "Document Ingestion":
                        log(f"  ⚠️  Document Ingestion failed but other services continue", "WARN")
                    else:
                        log(f"  Bringing down all services...", "WARN")
                        cleanup()
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
