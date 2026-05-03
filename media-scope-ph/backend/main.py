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

# CORS (support multiple origins)
origins = [
    "http://localhost:5173",
    "https://entity-level-framing-of-news.vercel.app"
]

# Remove None values (important)
origins = [origin for origin in origins if origin]

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