# backend/schemas.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from models import IOCType

# Existing schemas
class FeedBase(BaseModel):
    name: str
    url: str
    active: bool = True

class FeedCreate(FeedBase):
    pass

class Feed(FeedBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# IOC Schemas
class IOCBase(BaseModel):
    type: IOCType
    value: str
    description: Optional[str] = None
    source: Optional[str] = None

class IOCCreate(IOCBase):
    pass

class IOCEnrichmentBase(BaseModel):
    base_score: Optional[float] = None
    risk_score: Optional[float] = None
    sightings: int = 1
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    source_confidence: Optional[float] = None
    enrichment: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class IOCEnrichmentCreate(IOCEnrichmentBase):
    ioc_id: int

class IOCEnrichment(IOCEnrichmentBase):
    id: int
    ioc_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IOC(IOCBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    enrichments: List[IOCEnrichment] = []

    class Config:
        from_attributes = True

# Threat Summary Schemas
class ThreatSummaryBase(BaseModel):
    mode: str = Field(..., pattern="^(soc|researcher|executive)$")

    content: str
    ioc_count: int = 0
    risk_level: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")

class ThreatSummaryCreate(ThreatSummaryBase):
    article_id: int

class ThreatSummary(ThreatSummaryBase):
    id: int
    article_id: int
    generated_at: datetime

    class Config:
        from_attributes = True

# Enhanced Article schemas
class ArticleBase(BaseModel):
    title: str
    link: str
    published: str
    summary: str
    feed_name: str

class ArticleCreate(ArticleBase):
    pass

class Article(ArticleBase):
    id: int
    created_at: datetime
    iocs: List[IOC] = []
    summaries: List[ThreatSummary] = []

    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardStats(BaseModel):
    total_articles: int
    total_iocs: int
    high_risk_iocs: int
    recent_articles: int
    ioc_types: Dict[str, int]
    risk_distribution: Dict[str, int]

class IOCStats(BaseModel):
    total_count: int
    by_type: Dict[str, int]
    by_risk_level: Dict[str, int]
    recent_count: int

class SummarizationRequest(BaseModel):
    mode: str = Field("soc", pattern="^(soc|researcher|executive)$")
    
class SummarizationResponse(BaseModel):
    article_id: int
    mode: str
    summary: str
    ioc_count: int
    risk_level: Optional[str] = None
    generated_at: datetime