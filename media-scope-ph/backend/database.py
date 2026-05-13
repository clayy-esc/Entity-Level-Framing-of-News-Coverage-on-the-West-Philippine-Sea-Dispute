"""

This module configures the SQLAlchemy database
connection used by the MediaScope PH backend.

The database layer is responsible for:
- establishing PostgreSQL connections
- managing database sessions
- handling ORM base models
- supporting dependency injection for FastAPI routes

The system uses environment-based configuration
to support both local development and cloud deployment.

Deployment Environment:
- Development:
    Local .env configuration

- Production:
    Cloud-hosted PostgreSQL database
    (Neon PostgreSQL)

"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Determine application environment.
# Default:
# - development
# Production values are typically provided
# through cloud deployment environment variables.
ENV = os.getenv("ENV", "development")

# Load local environment variables only
# during development.
# In production environments, variables are
# provided directly by the hosting platform.
if ENV != "production":
    load_dotenv()

# PostgreSQL database connection URL.
DATABASE_URL = os.getenv("DATABASE_URL")

# Prevent application startup if the
# database configuration is missing.
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check your environment variables.")

# Create SQLAlchemy engine.
# Production configuration:
# - enables SSL mode
# Connection pool settings:
# - pool_pre_ping:
#     automatically validates stale connections
# - pool_size:
#     number of persistent connections
# - max_overflow:
#     temporary extra connections during load spikes
engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"} if ENV == "production" else {},
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=2
)

# Session factory for database operations.
# Configuration:
# - autocommit disabled
# - autoflush disabled
# Transactions are explicitly controlled
# within backend route logic.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base ORM model class used by
# all SQLAlchemy database models.
Base = declarative_base()

def get_db():
    """
    FastAPI database session dependency.

    Creates a new database session for each request
    and ensures proper cleanup after request completion.

    This dependency is injected into API routes
    requiring database access.

    Yields:
        Session:
            Active SQLAlchemy database session.
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        # Ensure database connections are
        # properly closed after request completion.
        db.close()