# scripts/fetch-articles.sh
#!/bin/bash

echo "📰 Fetching articles from RSS feeds..."

# Check if backend container is running
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Backend container is not running. Please start it first with 'docker-compose up'"
    exit 1
fi

# Run the RSS fetcher
docker-compose exec backend python rss_fetcher.py

echo "✅ Article fetch complete!"