"""Script to seed the database with 13 RSS feeds"""
import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Feed

# Default feeds configuration
DEFAULT_FEEDS = [
    {"name": "BBC News", "url": "http://feeds.bbci.co.uk/news/rss.xml"},
    {"name": "CNN Top Stories", "url": "http://rss.cnn.com/rss/edition.rss"},
    {"name": "Reuters World", "url": "https://feeds.reuters.com/reuters/worldNews"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"},
    {"name": "Hacker News", "url": "https://hnrss.org/frontpage"},
    {"name": "The Verge", "url": "https://www.theverge.com/rss/index.xml"},
    {"name": "Ars Technica", "url": "http://feeds.arstechnica.com/arstechnica/index"},
    {"name": "NPR News", "url": "https://feeds.npr.org/1001/rss.xml"},
    {"name": "Guardian World", "url": "https://www.theguardian.com/world/rss"},
    {"name": "Associated Press", "url": "https://feeds.apnews.com/ApNews/apf-topnews"},
    {"name": "Wired", "url": "https://www.wired.com/feed/rss"},
    {"name": "MIT Technology Review", "url": "https://www.technologyreview.com/feed/"},
    {"name": "Scientific American", "url": "http://rss.sciam.com/ScientificAmerican-Global"}
]

def seed_feeds():
    """Seed the database with default RSS feeds"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if feeds already exist
        existing_count = db.query(Feed).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} feeds. Skipping seed.")
            return
        
        # Add default feeds
        for feed_data in DEFAULT_FEEDS:
            feed = Feed(
                name=feed_data["name"],
                url=feed_data["url"],
                active=True
            )
            db.add(feed)
        
        db.commit()
        print(f"Successfully seeded {len(DEFAULT_FEEDS)} RSS feeds to the database.")
        
        # Print seeded feeds
        print("\nSeeded feeds:")
        for i, feed in enumerate(DEFAULT_FEEDS, 1):
            print(f"{i:2d}. {feed['name']}: {feed['url']}")
            
    except Exception as e:
        print(f"Error seeding feeds: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_feeds()