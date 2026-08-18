FROM python:3.11.11-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 libglib2.0-0 ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM deps AS runtime
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY config.py main.py ./
COPY rtsp ./rtsp
COPY buffering ./buffering
COPY streaming ./streaming
COPY snapshots ./snapshots
COPY clips ./clips
COPY processing ./processing
COPY ingestion ./ingestion
RUN mkdir -p /app/storage && chown -R app:app /app
USER app
EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
