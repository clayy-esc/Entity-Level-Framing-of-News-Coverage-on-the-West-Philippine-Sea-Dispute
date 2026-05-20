"""

This module initializes the FastAPI backend application
for the MediaScope PH system.

The backend is responsible for:
- handling API requests
- coordinating entity-level framing analysis
- managing database interactions
- enabling frontend-backend communication
- exposing analysis endpoints

Core Features:
- FastAPI application setup
- PostgreSQL database initialization
- CORS middleware configuration
- Route registration
- Health monitoring endpoint

Deployment Environment:
- Local development
- Cloud deployment via Render

"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import engine, Base
from routes import analyses

# Initialize FastAPI application
app = FastAPI()


@app.on_event("startup")
def on_startup():
    """
    Application startup initialization.

    This event runs automatically when the
    FastAPI application starts.

    Responsibilities:
    - initialize database tables
    - ensure ORM schema synchronization

    The create_all() operation creates missing
    tables without overwriting existing data.
    """

    Base.metadata.create_all(bind=engine)

# Allowed frontend origins for CORS.
# Includes:
# - local frontend development server
# - deployed Vercel frontend application
origins = [
    "http://localhost:5173",
    "https://media-scope-ph.vercel.app"
]

# Remove invalid or empty origin values
# before middleware registration.
origins = [origin for origin in origins if origin]

# Configure Cross-Origin Resource Sharing (CORS).
# This enables secure communication between:
# - React frontend
# - FastAPI backend
# Required for frontend API requests
# during both local development and deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def health_check():
    """
    Health check endpoint.

    Used to verify that the backend
    application is operational.

    Returns:
        dict:
            Backend status response.
    """

    return {"status": "ok"}

# Register API route modules.
# All analysis-related endpoints are grouped
# under the "/api" prefix.
# Example:
# /api/analyze-batch
# /api/analyses
app.include_router(analyses.router, prefix="/api")