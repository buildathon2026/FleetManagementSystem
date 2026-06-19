#!/usr/bin/env python3
"""
Multi-service launcher for Render deployment.
Starts Python (FastAPI/Uvicorn) and Node.js (Express) services in parallel.
"""

import subprocess
import time
import sys
import signal
import os
from pathlib import Path

# Service configurations: (name, type, command, port, description)
# type: "python" for Uvicorn, "node" for Node.js
SERVICES = [
    ("Document Ingestion", "python", ["python", "-m", "uvicorn", "ingest_src.app:app"], 8004, "Classifies & ingests documents"),
    ("Entity Resolution", "python", ["python", "-m", "uvicorn", "entity_src.app:app"], 8003, "Maps truck references to IDs"),
    ("MCP Data Server", "node", ["node", "fleet/dist/index.js"], 8002, "Secure API for fleet data"),
    ("AI Agent", "python", ["python", "-m", "uvicorn", "agent_src.agent:app"], 8001, "Natural language Q&A"),
]

processes = []
started_services = []


def log(msg: str, level: str = "INFO"):
    """Print timestamped log message."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level:8} {msg}", flush=True)


def cleanup(signum=None, frame=None):
    """Graceful shutdown of all services."""
    log("Shutdown signal received, cleaning up...", "WARN")
    for i, (name, _, _, _, _) in enumerate(started_services):
        if i < len(processes):
            log(f"Terminating {name}...", "INFO")
            try:
                processes[i].terminate()
                processes[i].wait(timeout=5)
            except subprocess.TimeoutExpired:
                log(f"Force killing {name}", "WARN")
                processes[i].kill()
    log("All services stopped", "INFO")
    sys.exit(0)


def start_service(name: str, svc_type: str, cmd: list, port: int, description: str) -> subprocess.Popen:
    """Start a service (Python Uvicorn or Node.js)."""
    full_cmd = cmd + ["--host", "0.0.0.0", "--port", str(port)] if svc_type == "python" else cmd + ["--port", str(port)]

    # Set environment for service
    env = os.environ.copy()
    env["PORT"] = str(port)

    log(f"Starting {name} on port {port}... ({description})", "INFO")

    try:
        process = subprocess.Popen(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=env,
        )
        started_services.append((name, svc_type, cmd, port, description))
        log(f"✓ {name} launched (PID: {process.pid})", "OK")
        return process
    except Exception as e:
        log(f"✗ Failed to start {name}: {e}", "ERROR")
        raise


def monitor_services():
    """Monitor services and log their status."""
    log(f"All {len(processes)} services started. Monitoring...", "INFO")
    log("=" * 80, "INFO")
    for name, svc_type, _, port, _ in started_services:
        log(f"  {name:25} ({svc_type:6}) → http://0.0.0.0:{port}", "INFO")
    log("=" * 80, "INFO")

    # Wait for any process to fail
    while True:
        time.sleep(10)
        for i, process in enumerate(processes):
            if process.poll() is not None:
                name = started_services[i][0]
                log(f"✗ {name} exited with code {process.returncode}", "ERROR")
                return False
    return True


def main():
    """Main entry point."""
    log("Fleet Management System - Multi-Service Launcher", "INFO")
    log(f"Starting {len(SERVICES)} services...", "INFO")

    # Register signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        # Start all services with staggered timing
        for i, (name, svc_type, cmd, port, desc) in enumerate(SERVICES):
            process = start_service(name, svc_type, cmd, port, desc)
            processes.append(process)
            time.sleep(2)  # Stagger startup to avoid resource contention

        # Monitor services
        monitor_services()

    except Exception as e:
        log(f"Fatal error: {e}", "ERROR")
        cleanup()
        sys.exit(1)


if __name__ == "__main__":
    main()
