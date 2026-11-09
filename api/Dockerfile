# Stage 1: Builder
FROM python:3.13-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:3.13-slim AS production
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MALLOC_ARENA_MAX=2

# ffmpeg + nodejs + deno (JS runtimes for yt-dlp) en producción
RUN apt-get update && apt-get install -y ffmpeg nodejs curl unzip && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/lib/python3.13/site-packages \
                    /usr/local/lib/python3.13/site-packages

RUN ln -s /usr/bin/nodejs /usr/local/bin/node || true
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

# Non-root user
RUN useradd -m -u 1001 appuser && mkdir -p /tmp/ayevideo_downloads
RUN chown -R appuser:appuser /tmp/ayevideo_downloads

COPY --chown=appuser:appuser . .
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
