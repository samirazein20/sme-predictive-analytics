# Multi-stage build for ML services
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN useradd -m -u 1000 mluser

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Install package in production mode
RUN pip install --no-cache-dir -e .

# Change ownership
RUN chown -R mluser:mluser /app

# Switch to non-root user
USER mluser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
  CMD python -c "import requests; requests.get('http://localhost:8001/health', timeout=5)" || exit 1

# Start the application
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
