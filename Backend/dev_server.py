#!/usr/bin/env python3
"""Start the FastAPI app for local development (auth + RBAC only)."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

uvicorn_proc: subprocess.Popen | None = None


def _shutdown(*_: object) -> None:
    global uvicorn_proc
    if uvicorn_proc is not None and uvicorn_proc.poll() is None:
        uvicorn_proc.terminate()
        try:
            uvicorn_proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            uvicorn_proc.kill()
    sys.exit(0)


def main() -> None:
    global uvicorn_proc

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    print("[SignalWorkflow] Starting API (uvicorn)…")
    uvicorn_proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--reload",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ],
        cwd=ROOT,
    )

    exit_code = uvicorn_proc.wait()
    _shutdown()
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
