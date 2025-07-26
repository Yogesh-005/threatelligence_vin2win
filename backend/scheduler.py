import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from rss_fetcher import fetch_and_store_articles

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def start_scheduler():
    """Start the background scheduler for RSS fetching"""
    scheduler = BackgroundScheduler()
    
    # Get fetch time from environment variable (default: 08:00)
    fetch_time = os.getenv("FETCH_TIME", "08:00")
    hour, minute = map(int, fetch_time.split(":"))
    
    logger.info(f"Scheduling daily RSS fetch at {fetch_time}")
    
    # Schedule daily job
    scheduler.add_job(
        func=fetch_and_store_articles,
        trigger=CronTrigger(hour=hour, minute=minute),
        id='daily_rss_fetch',
        name='Daily RSS Feed Fetch',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully")
    return scheduler