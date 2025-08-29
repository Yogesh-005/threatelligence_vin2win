from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./threat_intel.db")

def ensure_ssl_in_postgres_url(url: str) -> str:
    """Append sslmode=require to Postgres URLs if not specified.
    Keeps SQLite and other schemes untouched.
    """
    try:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("postgresql://") and "sslmode=" not in url:
            sep = "&" if "?" in url else "?"
            return f"{url}{sep}sslmode=require"
        return url
    except Exception:
        return url

# Handle SQLite vs PostgreSQL
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False},
        echo=os.getenv("DB_DEBUG", "false").lower() == "true"
    )
else:
    # PostgreSQL configuration
    DATABASE_URL = ensure_ssl_in_postgres_url(DATABASE_URL)
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("DB_DEBUG", "false").lower() == "true"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all tables (use with caution)"""
    Base.metadata.drop_all(bind=engine)