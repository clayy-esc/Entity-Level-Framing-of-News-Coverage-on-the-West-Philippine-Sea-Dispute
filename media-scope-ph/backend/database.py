from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

ENV = os.getenv("ENV", "development")

if ENV != "production":
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check your environment variables.")

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"} if ENV == "production" else {},
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=2
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()