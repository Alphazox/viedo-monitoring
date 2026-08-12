FROM python:3.11-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 libglib2.0-0 ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    # ultralytics/deep-sort-realtime pull in opencv-python (GUI build), which
    # needs libGL and would silently shadow opencv-python-headless in this
    # slim, no-X11 image. Force headless back in as a separate, later install
    # so its files are the ones left on disk regardless of resolver order.
    && pip install --no-cache-dir --force-reinstall opencv-python-headless==4.10.0.84

FROM deps AS runtime
COPY app ./app
COPY scripts ./scripts
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
