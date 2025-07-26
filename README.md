```markdown
# 🛡️ Threatelligence - Final Submission (Societe Generale Hackathon)

Threatelligence is an intelligent, full-stack **RSS Threat Intelligence Platform** that automatically aggregates news feeds, extracts IOCs (Indicators of Compromise), performs risk scoring, and generates AI-powered threat summaries — all within a clean and interactive dashboard.

> 🚀 **Final Submission for Societe Generale Hackathon**  
> 🧑‍💻 Team: **vin2win**  
> 👨‍💻 Yogesh P (22BPS1044)  
> 👩‍💻 Bharathi R (22BPS1010)

---

## 📌 Features

- ✅ **RSS Feed Aggregation** (auto & manual)
- ✅ **IOC Extraction** (IPs, URLs, domains, hashes)
- ✅ **Risk Scoring** and IOC Enrichment
- ✅ **AI Threat Summarization** (OpenRouter powered)
- ✅ **Interactive Dashboard** with real-time updates
- ✅ **IOC Management Panel** with filters and analytics
- ✅ **Custom Feed & Pattern Support**
- ✅ **Scheduler** for daily feed processing

---

## 🏗️ Project Structure

```

threatelligence/
├── backend/
│   ├── app.py                  # FastAPI backend
│   ├── crud.py, models.py      # Database models
│   ├── rss\_fetcher.py          # RSS extraction engine
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
├── docker-compose.yml
└── README.md

````

---

## ⚙️ Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis (optional)

---

## ⚡ Quickstart

### 🐍 Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # (Windows)
pip install -r requirements.txt

# Configure env
cp .env.example .env
# Edit .env with DB, API keys, and options

# Database setup
alembic upgrade head
python seed_feeds.py

# Start server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
````

---

### 🌐 Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:8000/api
npm start
```

---

## 🔑 API Keys (Optional but Powerful)

Add the following to your `.env` file:

```env
OPENROUTER_API_KEY=your_key_here
ABUSEDB_API_KEY=your_key_here
VIRUSTOTAL_API_KEY=your_key_here
```

---

## 🔁 Manual Trigger

```bash
# Refresh RSS feeds & extract IOCs
curl -X POST http://localhost:8000/api/feeds/refresh
```

---

## 📊 Dashboard Preview

Visit `http://localhost:3000/dashboard` to:

* View articles and extracted IOCs
* Analyze risk scores
* Generate AI summaries

---

## 🧪 Testing

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/feeds/refresh
```

---

## 🚀 Deployment (Optional)

### Backend (FastAPI with Gunicorn)

```bash
pip install gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (React Production Build)

```bash
npm run build
# Serve with nginx or static file server
```

---

## 🔐 Security Tips

* Never commit `.env` files or API keys.
* Use strong database credentials.
* Enable CORS restrictions in `app.py`.
* Consider adding authentication for production deployments.

---

## 📣 Acknowledgements

* [OpenRouter](https://openrouter.ai/) for LLM summarization
* [AbuseIPDB](https://abuseipdb.com/) and [VirusTotal](https://virustotal.com/) for IOC enrichment
* [FastAPI](https://fastapi.tiangolo.com/) and [React.js](https://reactjs.org/) for framework support

---

## 🏁 Final Note

Threatelligence empowers cybersecurity teams and researchers with real-time visibility, enriched threat context, and automation — all from a unified interface.

> Submitted as part of the **Societe Generale Hackathon 2025**
> Built with passion by **vin2win**
> Yogesh P (22BPS1044)
> Bharathi R (22BPS1010)

---

```

Let me know if you’d like:
- A version with images (like dashboard screenshots)
- A minimal version for GitHub
- A CONTRIBUTING.md or LICENSE.md file too

Would you like me to push this `README.md` into your repo as well?
```
