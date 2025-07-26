# scripts/init-db.sh
#!/bin/bash

set -e

echo "🗄️  Initializing database..."

# Start only the database service
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec backend python -m alembic upgrade head

# Seed the database
echo "🌱 Seeding database with RSS feeds..."
docker-compose exec backend python seed_feeds.py

echo "✅ Database initialization complete!"