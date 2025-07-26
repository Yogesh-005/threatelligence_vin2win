# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, Enum, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

class IOCType(enum.Enum):
    ip = "ip"
    domain = "domain" 
    url = "url"
    hash = "hash"

class Feed(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    url = Column(String, unique=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    link = Column(String, unique=True, index=True)
    published = Column(String)
    summary = Column(Text)
    feed_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    iocs = relationship("IOC", secondary="article_iocs", back_populates="articles")
    summaries = relationship("ThreatSummary", back_populates="article", cascade="all, delete-orphan")

class IOC(Base):
    __tablename__ = "iocs"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(IOCType), nullable=False, index=True)
    value = Column(String, nullable=False, index=True)
    description = Column(Text)
    source = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    enrichments = relationship("IOCEnrichment", back_populates="ioc", cascade="all, delete-orphan")
    articles = relationship("Article", secondary="article_iocs", back_populates="iocs")
    
    __table_args__ = (UniqueConstraint('type', 'value', name='uq_ioc_type_value'),)

class IOCEnrichment(Base):
    __tablename__ = "ioc_enrichments"
    
    id = Column(Integer, primary_key=True, index=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id", ondelete="CASCADE"), nullable=False, index=True)
    base_score = Column(Float)
    risk_score = Column(Float, index=True)
    sightings = Column(Integer, default=1)
    first_seen = Column(DateTime(timezone=True))
    last_seen = Column(DateTime(timezone=True))
    source_confidence = Column(Float)
    enrichment = Column(JSONB)
    tags = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    ioc = relationship("IOC", back_populates="enrichments")

class ArticleIOC(Base):
    __tablename__ = "article_iocs"
    
    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id", ondelete="CASCADE"), nullable=False, index=True)
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (UniqueConstraint('article_id', 'ioc_id', name='uq_article_ioc'),)

class ThreatSummary(Base):
    __tablename__ = "threat_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    mode = Column(String, nullable=False)  # soc, researcher, executive
    content = Column(Text, nullable=False)
    ioc_count = Column(Integer, default=0)
    risk_level = Column(String)  # low, medium, high, critical
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    article = relationship("Article", back_populates="summaries")