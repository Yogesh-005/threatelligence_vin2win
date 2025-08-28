# backend/routes.py
import subprocess
import sys
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, logger
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import (Feed, FeedCreate, Article, IOC, IOCEnrichment, ThreatSummary, 
                     DashboardStats, IOCStats, SummarizationRequest, SummarizationResponse)
from crud import (
    # Feed operations
    get_feeds, create_feed, delete_feed, get_feed_by_name,
    # Article operations
    get_articles, get_article_by_id, get_articles_count, get_recent_articles,
    # IOC operations
    get_iocs, get_ioc_by_id, get_article_iocs, get_high_risk_iocs, get_ioc_stats,
    # Summary operations
    get_article_summaries, get_threat_summary, create_threat_summary,
    # Dashboard operations
    get_dashboard_stats
)
from rss_fetcher import fetch_and_store_articles
from services.ai_summarizer import ThreatSummarizer
from services.ioc_processor import IOCProcessor
from datetime import datetime
import os

router = APIRouter()

@router.get("/feeds", response_model=List[Feed])
def list_feeds(db: Session = Depends(get_db)):
    """Get all active feeds"""
    return get_feeds(db)

@router.post("/feeds", response_model=Feed)
def add_feed(feed: FeedCreate, db: Session = Depends(get_db)):
    """Add a new RSS feed"""
    # Check if feed already exists
    existing = get_feed_by_name(db, feed.name)
    if existing:
        raise HTTPException(status_code=400, detail="Feed with this name already exists")
    
    return create_feed(db, feed)

@router.delete("/feeds/{feed_id}")
def remove_feed(feed_id: int, db: Session = Depends(get_db)):
    """Remove a feed (mark as inactive)"""
    success = delete_feed(db, feed_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feed not found")
    return {"message": "Feed removed successfully"}

@router.post("/feeds/refresh")
def refresh_feeds_manually(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Manually trigger RSS feed refresh with IOC processing"""
    try:
        background_tasks.add_task(fetch_and_store_articles)
        return {"message": "Enhanced RSS feed refresh started", "status": "running"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start RSS refresh: {str(e)}")

@router.get("/feeds/refresh/status")
def get_refresh_status():
    """Get status of RSS feed refresh"""
    return {"status": "available", "message": "Ready to refresh feeds with IOC processing"}

# ============================================================================
# ARTICLE ENDPOINTS
# ============================================================================

@router.get("/articles", response_model=List[Article])
def list_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get paginated list of articles with IOCs"""
    articles = get_articles(db, skip=skip, limit=limit)
    return articles

@router.get("/articles/count")
def get_article_count(db: Session = Depends(get_db)):
    """Get total count of articles"""
    return {"count": get_articles_count(db)}

@router.get("/articles/recent")
def get_recent_articles_endpoint(
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """Get recent articles from last N hours"""
    articles = get_recent_articles(db, hours)
    return {"articles": articles, "count": len(articles), "hours": hours}

@router.get("/articles/{article_id}", response_model=Article)
def get_article(article_id: int, db: Session = Depends(get_db)):
    """Get a specific article by ID with IOCs and summaries"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.get("/articles/{article_id}/iocs", response_model=List[IOC])
def get_article_iocs_endpoint(article_id: int, db: Session = Depends(get_db)):
    """Get IOCs associated with an article"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return get_article_iocs(db, article_id)

@router.get("/articles/{article_id}/summaries", response_model=List[ThreatSummary])
def get_article_summaries_endpoint(article_id: int, db: Session = Depends(get_db)):
    """Get AI summaries for an article"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return get_article_summaries(db, article_id)

@router.post("/articles/{article_id}/summarize", response_model=SummarizationResponse)
def summarize_article_threat(
    article_id: int,
    request: SummarizationRequest,
    db: Session = Depends(get_db)
):
    """Generate AI threat summary for article"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if summary already exists
    existing_summary = get_threat_summary(db, article_id, request.mode)
    if existing_summary:
        return SummarizationResponse(
            article_id=article_id,
            mode=request.mode,
            summary=existing_summary.content,
            ioc_count=existing_summary.ioc_count,
            risk_level=existing_summary.risk_level,
            generated_at=existing_summary.generated_at
        )
    
    # Get associated IOCs
    iocs = get_article_iocs(db, article_id)
    
    # Prepare content for summarization
    content = f"Title: {article.title}\n\nSummary: {article.summary}\n\n"
    ioc_data = []
    
    if iocs:
        for ioc in iocs:
            ioc_info = {
                'type': ioc.type.value,
                'value': ioc.value,
                'risk_score': ioc.enrichments[0].risk_score if ioc.enrichments else 0
            }
            ioc_data.append(ioc_info)
    
    try:
        summarizer = ThreatSummarizer()
        summary_content = summarizer.summarize(content, mode=request.mode, iocs=ioc_data)
        risk_level = summarizer.determine_risk_level(ioc_data)
        
        # Store the summary
        from schemas import ThreatSummaryCreate
        summary_data = ThreatSummaryCreate(
            article_id=article_id,
            mode=request.mode,
            content=summary_content,
            ioc_count=len(iocs),
            risk_level=risk_level
        )
        
        db_summary = create_threat_summary(db, summary_data)
        
        return SummarizationResponse(
            article_id=article_id,
            mode=request.mode,
            summary=summary_content,
            ioc_count=len(iocs),
            risk_level=risk_level,
            generated_at=db_summary.generated_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

# ============================================================================
# IOC ENDPOINTS
# ============================================================================

@router.get("/iocs", response_model=List[IOC])
def list_iocs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    ioc_type: Optional[str] = Query(None, description="Filter by IOC type (ip, domain, url, hash)"),
    min_risk_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum risk score"),
    db: Session = Depends(get_db)
):
    """Get IOCs with optional filtering"""
    return get_iocs(db, skip=skip, limit=limit, ioc_type=ioc_type, min_risk_score=min_risk_score)

@router.get("/iocs/{ioc_id}", response_model=IOC)
def get_ioc_details(ioc_id: int, db: Session = Depends(get_db)):
    """Get detailed IOC information with enrichment data"""
    ioc = get_ioc_by_id(db, ioc_id)
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
    return ioc

@router.get("/iocs/high-risk", response_model=List[IOC])
def get_high_risk_iocs_endpoint(
    risk_threshold: float = Query(50.0, ge=0, le=100, description="Risk score threshold"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get high-risk IOCs for dashboard"""
    return get_high_risk_iocs(db, risk_threshold, limit)

@router.get("/iocs/stats", response_model=IOCStats)
def get_ioc_stats_endpoint(db: Session = Depends(get_db)):
    """Get IOC statistics"""
    return get_ioc_stats(db)

@router.post("/iocs/reprocess/{article_id}")
def reprocess_article_iocs(
    article_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually reprocess IOCs for a specific article"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    def reprocess_task():
        processor = IOCProcessor(db)
        content = f"{article.title}\n\n{article.summary}"
        result = processor.process_article_iocs(article_id, content, article.feed_name)
        return result
    
    background_tasks.add_task(reprocess_task)
    
    return {
        "message": f"IOC reprocessing started for article {article_id}",
        "article_title": article.title
    }

# ============================================================================
# DASHBOARD ENDPOINTS
# ============================================================================

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats_endpoint(db: Session = Depends(get_db)):
    """Get comprehensive dashboard statistics"""
    return get_dashboard_stats(db)

@router.get("/dashboard/threat-overview")
def get_threat_overview(
    hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    db: Session = Depends(get_db)
):
    """Get threat overview for specified time window"""
    recent_articles = get_recent_articles(db, hours)
    
    total_articles = len(recent_articles)
    articles_with_iocs = 0
    total_iocs = 0
    high_risk_count = 0
    
    for article in recent_articles:
        article_iocs = get_article_iocs(db, article.id)
        if article_iocs:
            articles_with_iocs += 1
            total_iocs += len(article_iocs)
            
            for ioc in article_iocs:
                if ioc.enrichments and ioc.enrichments[0].risk_score >= 50:
                    high_risk_count += 1
    
    return {
        "time_window_hours": hours,
        "total_articles": total_articles,
        "articles_with_iocs": articles_with_iocs,
        "total_iocs": total_iocs,
        "high_risk_iocs": high_risk_count,
        "threat_detection_rate": (articles_with_iocs / total_articles * 100) if total_articles > 0 else 0
    }

@router.get("/dashboard/recent-threats")
def get_recent_threats(
    limit: int = Query(10, ge=1, le=50),
    min_risk_score: float = Query(25.0, ge=0, le=100),
    db: Session = Depends(get_db)
):
    """Get recent high-risk threats for dashboard"""
    high_risk_iocs = get_high_risk_iocs(db, min_risk_score, limit)
    
    threats = []
    for ioc in high_risk_iocs:
        threat_info = {
            "ioc_id": ioc.id,
            "type": ioc.type.value,
            "value": ioc.value,
            "risk_score": ioc.enrichments[0].risk_score if ioc.enrichments else 0,
            "first_seen": ioc.created_at,
            "articles_count": len(ioc.articles),
            "tags": ioc.enrichments[0].tags if ioc.enrichments else []
        }
        threats.append(threat_info)
    
    return {
        "threats": threats,
        "total_count": len(threats),
        "min_risk_score": min_risk_score
    }

# ============================================================================
# HEALTH AND STATUS ENDPOINTS
# ============================================================================

@router.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "features": {
            "ioc_extraction": True,
            "ai_summarization": bool(os.getenv("OPENROUTER_API_KEY")),
            "threat_intelligence": True
        }
    }

@router.get("/status/processing")
def get_processing_status(db: Session = Depends(get_db)):
    """Get current processing status"""
    total_articles = get_articles_count(db)
    recent_articles = len(get_recent_articles(db, 24))
    ioc_stats = get_ioc_stats(db)
    
    return {
        "total_articles": total_articles,
        "recent_articles_24h": recent_articles,
        "total_iocs": ioc_stats["total_count"],
        "recent_iocs_24h": ioc_stats["recent_count"],
        "processing_enabled": True,
        "last_check": datetime.now()
    }

@router.post("/articles/{article_id}/summarize", response_model=SummarizationResponse)
def summarize_article_threat(
    article_id: int,
    request: SummarizationRequest,
    db: Session = Depends(get_db)
):
    """Generate AI threat summary for article - Enhanced with better error handling"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if summary already exists
    existing_summary = get_threat_summary(db, article_id, request.mode)
    if existing_summary:
        return SummarizationResponse(
            article_id=article_id,
            mode=request.mode,
            summary=existing_summary.content,
            ioc_count=existing_summary.ioc_count,
            risk_level=existing_summary.risk_level,
            generated_at=existing_summary.generated_at
        )
    
    # Get associated IOCs
    iocs = get_article_iocs(db, article_id)
    
    # Prepare content for summarization
    content = f"Title: {article.title}\n\nSummary: {article.summary}\n\n"
    ioc_data = []
    
    if iocs:
        for ioc in iocs:
            ioc_info = {
                'type': ioc.type.value,
                'value': ioc.value,
                'risk_score': ioc.enrichments[0].risk_score if ioc.enrichments else 0
            }
            ioc_data.append(ioc_info)
    
    try:
        # Initialize the AI summarizer
        summarizer = ThreatSummarizer()
        
        # Generate summary with enhanced error handling
        summary_content = summarizer.summarize(content, mode=request.mode, iocs=ioc_data)
        risk_level = summarizer.determine_risk_level(ioc_data)
        
        # Store the summary in database
        from schemas import ThreatSummaryCreate
        summary_data = ThreatSummaryCreate(
            article_id=article_id,
            mode=request.mode,
            content=summary_content,
            ioc_count=len(iocs),
            risk_level=risk_level
        )
        
        db_summary = create_threat_summary(db, summary_data)
        
        logger.info(f"Generated {request.mode} summary for article {article_id}")
        
        return SummarizationResponse(
            article_id=article_id,
            mode=request.mode,
            summary=summary_content,
            ioc_count=len(iocs),
            risk_level=risk_level,
            generated_at=db_summary.generated_at
        )
        
    except Exception as e:
        logger.error(f"Summarization failed for article {article_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"AI summarization failed: {str(e)}"
        )

# Also add this new endpoint to check AI summarizer status
@router.get("/ai/status")
def get_ai_status():
    """Get AI summarizer status and configuration"""
    has_api_key = bool(os.getenv("OPENROUTER_API_KEY"))
    
    try:
        if has_api_key:
            # Test the AI service
            summarizer = ThreatSummarizer()
            test_summary = summarizer.summarize(
                "Test security content for API validation", 
                mode="soc", 
                iocs=[]
            )
            status = "operational"
            message = "AI summarizer is working with OpenRouter API"
        else:
            status = "basic_mode"
            message = "AI summarizer running in basic mode (no API key configured)"
    except Exception as e:
        status = "error"
        message = f"AI summarizer error: {str(e)}"
    
    return {
        "status": status,
        "message": message,
        "has_api_key": has_api_key,
        "supported_modes": ["soc", "researcher", "executive"],
        "features": {
            "ai_powered": has_api_key,
            "caching": True,
            "risk_assessment": True
        }
    }

# Add endpoint to regenerate summary (force refresh)
@router.post("/articles/{article_id}/summarize/refresh", response_model=SummarizationResponse)
def refresh_article_summary(
    article_id: int,
    request: SummarizationRequest,
    db: Session = Depends(get_db)
):
    """Force regenerate AI summary (bypass cache)"""
    article = get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Delete existing summary if it exists
    existing = get_threat_summary(db, article_id, request.mode)
    if existing:
        db.delete(existing)
        db.commit()
    
    # Generate new summary
    return summarize_article_threat(article_id, request, db)

# Add bulk summarization endpoint
@router.post("/articles/summarize/bulk")
def bulk_summarize_articles(
    background_tasks: BackgroundTasks,
    mode: str = "soc",
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Generate summaries for multiple articles in background"""
    
    if mode not in ["soc", "researcher", "executive"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    
    # Get recent articles without summaries
    recent_articles = get_recent_articles(db, 24)
    articles_to_process = []
    
    for article in recent_articles[:limit]:
        existing = get_threat_summary(db, article.id, mode)
        if not existing:
            articles_to_process.append(article.id)
    
    def process_bulk_summaries():
        """Background task to process multiple summaries"""
        processed = 0
        errors = 0
        
        for article_id in articles_to_process:
            try:
                summarize_article_threat(
                    article_id, 
                    SummarizationRequest(mode=mode), 
                    next(get_db())
                )
                processed += 1
                logger.info(f"Bulk summary generated for article {article_id}")
            except Exception as e:
                errors += 1
                logger.error(f"Bulk summary failed for article {article_id}: {str(e)}")
        
        logger.info(f"Bulk summarization complete: {processed} processed, {errors} errors")
    
    background_tasks.add_task(process_bulk_summaries)
    
    return {
        "message": f"Bulk summarization started for {len(articles_to_process)} articles",
        "mode": mode,
        "articles_queued": len(articles_to_process),
        "status": "processing"
    }
@router.post("/seed")
def run_seed_script(db: Session = Depends(get_db)):
    """Run the seed script to populate initial RSS feeds"""
    try:
        import os
        
        # Get the current directory (should be backend/)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Look for seed_feeds.py in the current directory
        seed_file = os.path.join(script_dir, "seed_feeds.py")
        
        if not os.path.exists(seed_file):
            # Try parent directory
            parent_dir = os.path.dirname(script_dir)
            seed_file = os.path.join(parent_dir, "seed_feeds.py")
        
        if not os.path.exists(seed_file):
            return {
                "status": "error",
                "message": "seed_feeds.py not found",
                "searched_paths": [
                    os.path.join(script_dir, "seed_feeds.py"),
                    os.path.join(parent_dir, "seed_feeds.py")
                ]
            }
        
        # Run the seed script
        result = subprocess.run(
            [sys.executable, "seed_feeds.py"], 
            cwd=os.path.dirname(seed_file),
            capture_output=True, 
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        if result.returncode == 0:
            # Count feeds after seeding
            feeds_count = len(get_feeds(db))
            
            return {
                "status": "success",
                "message": "Seed script executed successfully",
                "output": result.stdout,
                "feeds_created": feeds_count,
                "next_steps": [
                    "Use POST /api/feeds/refresh to fetch articles",
                    "Check GET /api/feeds to see available feeds",
                    "Visit dashboard to monitor progress"
                ]
            }
        else:
            return {
                "status": "error",
                "message": "Seed script failed",
                "error": result.stderr,
                "output": result.stdout,
                "return_code": result.returncode
            }
            
    except subprocess.TimeoutExpired:
        return {
            "status": "error", 
            "message": "Seed script timed out (exceeded 2 minutes)"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to run seed script: {str(e)}",
            "exception_type": type(e).__name__
        }

@router.get("/seed/status")
def get_seed_status(db: Session = Depends(get_db)):
    """Check if database has been seeded with initial feeds"""
    feeds = get_feeds(db)
    articles_count = get_articles_count(db)
    
    return {
        "feeds_count": len(feeds),
        "articles_count": articles_count,
        "is_seeded": len(feeds) > 0,
        "available_feeds": [{"name": feed.name, "url": feed.url, "active": feed.active} for feed in feeds],
        "recommendations": {
            "needs_seeding": len(feeds) == 0,
            "needs_articles": articles_count == 0,
            "actions": [
                "Run POST /api/seed if no feeds exist",
                "Run POST /api/feeds/refresh to fetch articles",
                "Check GET /api/dashboard/stats for overview"
            ]
        }
    }

@router.post("/initialize")
def initialize_system(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Complete system initialization: seed feeds + fetch articles"""
    try:
        # Check if already initialized
        feeds = get_feeds(db)
        if len(feeds) == 0:
            # Run seed script first
            seed_result = run_seed_script(db)
            if seed_result["status"] != "success":
                return {
                    "status": "error",
                    "message": "Failed to seed feeds",
                    "details": seed_result
                }
        
        # Start background article fetching
        background_tasks.add_task(fetch_and_store_articles)
        
        return {
            "status": "success",
            "message": "System initialization started",
            "feeds_count": len(get_feeds(db)),
            "actions_taken": [
                "Database seeded with initial feeds" if len(feeds) == 0 else "Feeds already exist",
                "Background article fetching started",
                "IOC processing will begin automatically"
            ],
            "next_steps": [
                "Monitor GET /api/status/processing for progress",
                "Check GET /api/articles for new articles",
                "Visit frontend dashboard for full overview"
            ]
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"System initialization failed: {str(e)}"
        }