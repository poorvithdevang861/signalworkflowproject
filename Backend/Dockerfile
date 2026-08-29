# ─────────────────────────────────────────────────────────────
# SignalMDM Backend — Dockerfile
# Python 3.12 + FastAPI + Celery Worker
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS backend

# System dependencies for psycopg2 and cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create storage directories
RUN mkdir -p storage/uploads

# Health check — hit the FastAPI /docs endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/docs || exit 1

EXPOSE 8000

# Start FastAPI (auth + RBAC)
CMD ["python", "dev_server.py"]
