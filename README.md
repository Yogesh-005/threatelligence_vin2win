# Threatelligence: AI-Powered Threat Intelligence Aggregator

## Overview

*Threatelligence* is a full-stack platform for automated cyber threat intelligence. It aggregates multiple news and research feeds, extracts and enriches indicators of compromise (IOCs), applies dynamic risk scoring, and generates AI-driven threat summaries—all accessible via a unified dashboard.

*Final Submission for Societe Generale Hackathon 2025*  
*Team: vin2win — Yogesh P, Bharathi R*

## Live Demo

**Access the deployed application:** [https://threatelligence-frontend-production.up.railway.app/](https://threatelligence-frontend-production.up.railway.app/)

The live demo includes:
- Real-time RSS feed aggregation
- IOC extraction and enrichment
- AI-powered threat summarization
- Interactive dashboard with analytics
- Full threat intelligence workflow

## Features

- Automated and manual RSS feed aggregation
- IOC extraction (IP addresses, URLs, domains, file hashes)
- Risk scoring and enrichment using trusted external sources
- AI-powered threat summarization utilizing OpenRouter LLMs
- Interactive dashboard with real-time updates and IOC management
- Analytics and filtering for IOCs and article feeds
- Support for custom feeds, patterns, and on-demand scheduling

## Tech Stack

- *Backend:* Python, FastAPI, SQLAlchemy ORM, PostgreSQL, APScheduler
- *Frontend:* React (JavaScript), Axios
- *AI Integration:* OpenRouter API (summarization), AbuseIPDB, VirusTotal (enrichment)
- *RSS Parsing:* feedparser
- *Containerization & Orchestration:* Docker, docker-compose
- *Optional:* Redis for improved caching

## Project Structure


```
threatelligence/
├── backend/
│   ├── app.py                  # FastAPI backend
│   ├── crud.py, models.py      # Database models
│   ├── rss_fetcher.py          # RSS extraction engine
│   ├── services/               # IOC processor & AI summarizer
│   ├── alembic/                # DB migrations
├── frontend/
│   ├── src/
│   │   ├── components/         # Dashboard, Feeds, IOCs
│   │   └── api/client.js       # Axios config
│   ├── .env.example
├── scripts/
│   ├── fetch-articles.sh       # CLI triggers
│   └── init-db.sh
└── README.md
```


## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis (optional)

## How to Run

### Backend

bash
cd backend
python -m venv venv
# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Edit for DB, API keys, options

alembic upgrade head
python seed_feeds.py

uvicorn app:app --host 0.0.0.0 --port 8000 --reload


### Frontend

bash
cd frontend
npm install
cp .env.example .env  # Set REACT_APP_API_URL
npm start


## Configuration

Edit .env files in the backend and frontend directories to specify database URLs, API keys, and service options.  
Example backend entries:


OPENROUTER_API_KEY=your_openrouter_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
VIRUSTOTAL_API_KEY=your_virustotal_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/threatelligence
FETCH_TIME=08:00


## Key Dashboard Screens

- RSS Feeds Management: Add/remove/monitor feeds
- Article View: Aggregated feed content
- IOC Dashboard: Extracted indicators, risk analytics
- Threat Summaries: AI-generated insights
- Analytics: IOC and feed trends over time

## API Documentation

Once backend is running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

*Notable Endpoints:*
- GET /api/feeds — List configured feeds
- POST /api/feeds/refresh — Manual feed refresh
- GET /api/articles — Aggregated articles
- GET /api/iocs — Extracted indicators
- POST /api/summarize — AI threat summarization
- GET /health — Health check

## Testing and Troubleshooting

- Backend: curl http://localhost:8000/health
- Refresh feeds: curl -X POST http://localhost:8000/api/feeds/refresh
- Validate API keys and DB connectivity in .env
- Check logs for parsing/enrichment errors

## Security

- Never commit .env or secret keys to source control
- Use strong database credentials and restrict API key sharing
- Enable CORS according to your deployment
- Rotate API keys as needed and monitor quota usage

## Documentation & References

- [OpenRouter](https://openrouter.ai/) (AI summarization)
- [AbuseIPDB](https://abuseipdb.com/) & [VirusTotal](https://virustotal.com/) (enrichment)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [feedparser](https://feedparser.readthedocs.io/)

For full project details and updates, see the code repository and in-app documentation.

## About This Submission

Threatelligence blends traditional threat feed aggregation with modern AI and automation to deliver a scalable, extensible, and professional solution for actionable cyber threat intelligence. The platform features rigorous IOC extraction, contextual enrichment, risk scoring, and AI-written summaries—all accessible through a clean dashboard and robust API.

*Developed for Societe Generale Hackathon 2025*  
*Team: vin2win — Yogesh P (22BPS1044), Bharathi R (22BPS1010)*

For questions or contributions, consult the API docs or repository guidelines. All code is MIT-licensed.  

Happy threat hunting!
