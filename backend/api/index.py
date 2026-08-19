"""Vercel's Python runtime looks for an ASGI `app` under api/ by convention
(FastAPI's own app lives at app/main.py, one level down from this project's
Vercel root) -- this just re-exports it so Vercel's function build finds it
without moving where the app actually lives.
"""
from app.main import app  # noqa: F401
