FROM python:3.11.11-slim

# Sibling of /scripts (mounted separately) so scripts/seed.py's
# self-locating sys.path logic (`Path(__file__).parent.parent / "backend"`)
# resolves correctly inside the container.
WORKDIR /backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system app && useradd --system --gid app --no-create-home app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /backend/storage && chown -R app:app /backend

USER app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
