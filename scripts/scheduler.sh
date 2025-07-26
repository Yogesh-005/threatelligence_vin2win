# scripts/scheduler.sh
#!/bin/bash

set -e

echo "⏰ Starting RSS fetch scheduler..."

# Get fetch time from environment or use default
FETCH_TIME=${FETCH_TIME:-"08:00"}

echo "📅 Scheduled to run daily at $FETCH_TIME"

# Create a simple cron job
echo "0 8 * * * cd $(pwd) && ./scripts/fetch-articles.sh >> /var/log/rss-fetcher.log 2>&1" | crontab -

echo "✅ Scheduler configured!"
echo "To check scheduled jobs: crontab -l"
echo "To remove scheduler: crontab -r"