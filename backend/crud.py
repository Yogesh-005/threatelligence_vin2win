# backend/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from models import Feed, Article, IOC, IOCEnrichment, ArticleIOC, ThreatSummary, IOCType
from schemas import FeedCreate, ArticleCreate, IOCCreate, IOCEnrichmentCreate, ThreatSummaryCreate
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

# Existing Feed operations
def get_feeds(db: Session) -> List[Feed]:
    return db.query(Feed).filter(Feed.active == True).all()

def get_feed_by_name(db: Session, name: str) -> Optional[Feed]:
    return db.query(Feed).filter(Feed.name == name).first()

def create_feed(db: Session, feed: FeedCreate) -> Feed:
    db_feed = Feed(**feed.dict())
    db.add(db_feed)
    db.commit()
    db.refresh(db_feed)
    return db_feed

def delete_feed(db: Session, feed_id: int) -> bool:
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if feed:
        feed.active = False
        db.commit()
        return True
    return False

# Enhanced Article operations
def get_articles(db: Session, skip: int = 0, limit: int = 20) -> List[Article]:
    return db.query(Article).order_by(desc(Article.created_at)).offset(skip).limit(limit).all()

def get_article_by_id(db: Session, article_id: int) -> Optional[Article]:
    return db.query(Article).filter(Article.id == article_id).first()

def get_article_by_link(db: Session, link: str) -> Optional[Article]:
    return db.query(Article).filter(Article.link == link).first()

def create_article(db: Session, article: ArticleCreate) -> Article:
    db_article = Article(**article.dict())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def get_articles_count(db: Session) -> int:
    return db.query(Article).count()

def get_recent_articles(db: Session, hours: int = 24) -> List[Article]:
    since = datetime.now() - timedelta(hours=hours)
    return db.query(Article).filter(Article.created_at >= since).order_by(desc(Article.created_at)).all()

# IOC operations
def create_or_get_ioc(db: Session, ioc: IOCCreate) -> IOC:
    """Create new IOC or return existing one"""
    existing = db.query(IOC).filter(
        and_(IOC.type == ioc.type, IOC.value == ioc.value)
    ).first()
    
    if existing:
        return existing
    
    db_ioc = IOC(**ioc.dict())
    db.add(db_ioc)
    db.commit()
    db.refresh(db_ioc)
    return db_ioc

def get_iocs(db: Session, skip: int = 0, limit: int = 20, 
            ioc_type: Optional[str] = None, min_risk_score: Optional[float] = None) -> List[IOC]:
    query = db.query(IOC)
    
    if ioc_type:
        query = query.filter(IOC.type == ioc_type)
    
    if min_risk_score is not None:
        query = query.join(IOCEnrichment).filter(IOCEnrichment.risk_score >= min_risk_score)
    
    return query.order_by(desc(IOC.created_at)).offset(skip).limit(limit).all()

def get_ioc_by_id(db: Session, ioc_id: int) -> Optional[IOC]:
    return db.query(IOC).filter(IOC.id == ioc_id).first()

def get_high_risk_iocs(db: Session, risk_threshold: float = 50.0, limit: int = 20) -> List[IOC]:
    return (db.query(IOC)
            .join(IOCEnrichment)
            .filter(IOCEnrichment.risk_score >= risk_threshold)
            .order_by(desc(IOCEnrichment.risk_score))
            .limit(limit)
            .all())

def get_article_iocs(db: Session, article_id: int) -> List[IOC]:
    return (db.query(IOC)
            .join(ArticleIOC)
            .filter(ArticleIOC.article_id == article_id)
            .all())

# IOC Enrichment operations
def create_ioc_enrichment(db: Session, enrichment: IOCEnrichmentCreate) -> IOCEnrichment:
    db_enrichment = IOCEnrichment(**enrichment.dict())
    db.add(db_enrichment)
    db.commit()
    db.refresh(db_enrichment)
    return db_enrichment

def update_ioc_enrichment(db: Session, ioc_id: int, updates: Dict[str, Any]) -> Optional[IOCEnrichment]:
    enrichment = db.query(IOCEnrichment).filter(IOCEnrichment.ioc_id == ioc_id).first()
    if enrichment:
        for key, value in updates.items():
            setattr(enrichment, key, value)
        enrichment.updated_at = datetime.now()
        db.commit()
        db.refresh(enrichment)
    return enrichment

def link_article_ioc(db: Session, article_id: int, ioc_id: int) -> bool:
    """Link article to IOC"""
    existing = db.query(ArticleIOC).filter(
        and_(ArticleIOC.article_id == article_id, ArticleIOC.ioc_id == ioc_id)
    ).first()
    
    if not existing:
        link = ArticleIOC(article_id=article_id, ioc_id=ioc_id)
        db.add(link)
        db.commit()
    return True

# Threat Summary operations
def create_threat_summary(db: Session, summary: ThreatSummaryCreate) -> ThreatSummary:
    db_summary = ThreatSummary(**summary.dict())
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return db_summary

def get_article_summaries(db: Session, article_id: int) -> List[ThreatSummary]:
    return db.query(ThreatSummary).filter(ThreatSummary.article_id == article_id).all()

def get_threat_summary(db: Session, article_id: int, mode: str) -> Optional[ThreatSummary]:
    return db.query(ThreatSummary).filter(
        and_(ThreatSummary.article_id == article_id, ThreatSummary.mode == mode)
    ).first()

# Dashboard statistics
def get_ioc_stats(db: Session) -> Dict[str, Any]:
    total_iocs = db.query(IOC).count()
    
    # IOCs by type
    type_stats = {}
    for ioc_type in IOCType:
        count = db.query(IOC).filter(IOC.type == ioc_type).count()
        type_stats[ioc_type.value] = count
    
    # Risk distribution
    risk_stats = {
        "low": db.query(IOCEnrichment).filter(IOCEnrichment.risk_score < 25).count(),
        "medium": db.query(IOCEnrichment).filter(
            and_(IOCEnrichment.risk_score >= 25, IOCEnrichment.risk_score < 50)
        ).count(),
        "high": db.query(IOCEnrichment).filter(
            and_(IOCEnrichment.risk_score >= 50, IOCEnrichment.risk_score < 75)
        ).count(),
        "critical": db.query(IOCEnrichment).filter(IOCEnrichment.risk_score >= 75).count(),
    }
    
    # Recent IOCs (last 24 hours)
    since = datetime.now() - timedelta(hours=24)
    recent_iocs = db.query(IOC).filter(IOC.created_at >= since).count()
    
    return {
        "total_count": total_iocs,
        "by_type": type_stats,
        "by_risk_level": risk_stats,
        "recent_count": recent_iocs
    }

def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    total_articles = get_articles_count(db)
    total_iocs = db.query(IOC).count()
    high_risk_iocs = db.query(IOCEnrichment).filter(IOCEnrichment.risk_score >= 50).count()
    recent_articles = len(get_recent_articles(db, 24))
    
    return {
        "total_articles": total_articles,
        "total_iocs": total_iocs,
        "high_risk_iocs": high_risk_iocs,
        "recent_articles": recent_articles,
        "ioc_types": get_ioc_stats(db)["by_type"],
        "risk_distribution": get_ioc_stats(db)["by_risk_level"]
    }