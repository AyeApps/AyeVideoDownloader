# Stage 1: Builder
FROM python:3.13-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp desde binario oficial
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:3.13-slim AS production
WORKDIR /app

# ffmpeg + nodejs + deno (JS runtimes for yt-dlp) en producción
RUN apt-get update && apt-get install -y ffmpeg nodejs curl unzip && rm -rf /var/lib/apt/lists/*
RUN ln -s /usr/bin/nodejs /usr/local/bin/node || true
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

COPY --from=builder /usr/local/bin/yt-dlp /usr/local/bin/yt-dlp
COPY --from=builder /usr/local/lib/python3.13/site-packages \
                    /usr/local/lib/python3.13/site-packages

# Non-root user
RUN useradd -m -u 1001 appuser && mkdir -p /tmp/ayevideo_downloads
RUN chown -R appuser:appuser /tmp/ayevideo_downloads

COPY --chown=appuser:appuser . .
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
