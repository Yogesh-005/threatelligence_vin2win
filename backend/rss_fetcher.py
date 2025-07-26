import feedparser
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
from crud import get_feeds, get_article_by_link, create_article
from schemas import ArticleCreate
from services.ioc_processor import IOCProcessor
import asyncio
import os

logger = logging.getLogger(__name__)

def fetch_and_store_articles():
    """Fetch RSS feeds and process articles with IOCs"""
    db = SessionLocal()
    try:
        feeds = get_feeds(db)
        total_processed = 0
        total_iocs = 0
        
        logger.info(f"Processing {len(feeds)} RSS feeds...")
        
        for feed in feeds:
            try:
                logger.info(f"Fetching feed: {feed.name} ({feed.url})")
                parsed_feed = feedparser.parse(feed.url)
                
                if parsed_feed.bozo:
                    logger.warning(f"Feed parsing issues for {feed.name}: {parsed_feed.bozo_exception}")
                
                feed_processed = 0
                feed_iocs = 0
                
                for entry in parsed_feed.entries:
                    try:
                        # Check if article already exists
                        existing = get_article_by_link(db, entry.link)
                        if existing:
                            continue
                        
                        # Create new article
                        article_data = ArticleCreate(
                            title=entry.title,
                            link=entry.link,
                            published=getattr(entry, 'published', str(datetime.now())),
                            summary=getattr(entry, 'summary', ''),
                            feed_name=feed.name
                        )
                        
                        article = create_article(db, article_data)
                        feed_processed += 1
                        
                        # Process IOCs for this article
                        processor = IOCProcessor(db)
                        content = f"{article.title}\n\n{article.summary}"
                        
                        result = processor.process_article_iocs(
                            article.id, 
                            content, 
                            feed.name
                        )
                        
                        if result.get("success"):
                            ioc_count = result.get("processed_iocs", 0)
                            feed_iocs += ioc_count
                            if ioc_count > 0:
                                logger.info(f"Article {article.id}: Found {ioc_count} IOCs")
                        else:
                            logger.error(f"IOC processing failed for article {article.id}: {result.get('error')}")
                        
                    except Exception as e:
                        logger.error(f"Error processing entry from {feed.name}: {str(e)}")
                        continue
                
                logger.info(f"Feed {feed.name}: {feed_processed} new articles, {feed_iocs} IOCs extracted")
                total_processed += feed_processed
                total_iocs += feed_iocs
                
            except Exception as e:
                logger.error(f"Error fetching feed {feed.name}: {str(e)}")
                continue
        
        logger.info(f"RSS fetch complete: {total_processed} articles processed, {total_iocs} IOCs extracted")
        return {
            "success": True,
            "articles_processed": total_processed,
            "iocs_extracted": total_iocs
        }
        
    except Exception as e:
        logger.error(f"RSS fetch failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()

async def schedule_rss_fetch():
    """Schedule periodic RSS fetching"""
    interval_minutes = int(os.getenv("RSS_FETCH_INTERVAL", 60))  # Default 60 minutes
    
    logger.info(f"Scheduling RSS fetch every {interval_minutes} minutes")
    
    while True:
        try:
            logger.info("Starting scheduled RSS fetch...")
            result = fetch_and_store_articles()
            
            if result.get("success"):
                logger.info(f"Scheduled fetch completed: {result.get('articles_processed', 0)} articles")
            else:
                logger.error(f"Scheduled fetch failed: {result.get('error')}")
                
        except Exception as e:
            logger.error(f"Scheduled RSS fetch error: {str(e)}")
        
        # Wait for next iteration
        await asyncio.sleep(interval_minutes * 60)

def manual_rss_refresh():
    """Manual RSS refresh endpoint"""
    logger.info("Manual RSS refresh triggered")
    return fetch_and_store_articles()