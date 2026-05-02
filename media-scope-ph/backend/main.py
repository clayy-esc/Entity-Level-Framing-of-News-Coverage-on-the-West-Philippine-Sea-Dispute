from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import engine, Base
from routes import analyze, analyses

app = FastAPI()

# Startup event (better than running globally)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# CORS (env-based)
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173")
]

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
    return {"status": "ok"}

# Routes with prefix
app.include_router(analyze.router, prefix="/api")
app.include_router(analyses.router, prefix="/api")