from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from contextlib import asynccontextmanager

from database import create_tables, engine
from routes import router
from rss_fetcher import schedule_rss_fetch
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Threat Intelligence RSS System...")
    
    # Create database tables
    create_tables()
    logger.info("Database tables created/verified")
    
    # Start background RSS fetching if enabled
    if os.getenv("AUTO_RSS_FETCH", "true").lower() == "true":
        asyncio.create_task(schedule_rss_fetch())
        logger.info("Background RSS fetching scheduled")
    
    # Check AI summarizer configuration
    if os.getenv("OPENROUTER_API_KEY"):
        logger.info("AI Summarizer enabled with OpenRouter API")
    else:
        logger.warning("AI Summarizer running in basic mode (no API key)")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Threat Intelligence RSS System...")

# Create FastAPI app
app = FastAPI(
    title="Threat Intelligence RSS System",
    description="RSS-based threat intelligence platform with IoC extraction and AI summarization",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": "Threat Intelligence RSS System",
        "version": "1.0.0",
        "features": {
            "rss_feeds": True,
            "ioc_extraction": True,
            "ai_summarization": bool(os.getenv("OPENROUTER_API_KEY")),
            "threat_intelligence": True
        },
        "endpoints": {
            "api_docs": "/docs",
            "api_root": "/api",
            "health": "/api/health"
        }
    }

@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "message": "Threat Intelligence API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )