# 🛡️ Threatelligence 

Threatelligence is an intelligent, full-stack **RSS Threat Intelligence Platform** that automatically aggregates news feeds, extracts IOCs (Indicators of Compromise), performs risk scoring, and generates AI-powered threat summaries — all within a clean and interactive dashboard.

> 🚀 **Final Submission for Societe Generale Hackathon**  
> 🧑‍💻 **Team: vin2win**  
> 👨‍💻 **Yogesh P (22BPS1044)**  
> 👩‍💻 **Bharathi R (22BPS1010)**

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
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**
- **Redis** (optional)

---

## ⚡ Quickstart

### 🐍 Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with DB credentials, API keys, and options

# Database setup
alembic upgrade head
python seed_feeds.py

# Start server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 🌐 Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:8000/api

npm start
```

---

## 🔑 API Keys (Optional but Powerful)

Add the following to your backend `.env` file for enhanced functionality:

```env
# AI Summarization
OPENROUTER_API_KEY=your_openrouter_key_here

# IOC Enrichment
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
VIRUSTOTAL_API_KEY=your_virustotal_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/threatelligence
FETCH_TIME=08:00
```

---

## 🔁 Manual Operations

### Trigger RSS Feed Refresh
```bash
# Manual refresh via API
curl -X POST http://localhost:8000/api/feeds/refresh

# Or use the web interface refresh button
```

### Check System Health
```bash
curl http://localhost:8000/health
```

---

## 📊 Dashboard Preview

Visit **http://localhost:3000** to access:

- **📰 RSS Feeds Management** - Add, remove, and monitor feeds
- **📄 Articles View** - Browse aggregated threat intelligence articles  
- **🎯 IOC Dashboard** - View extracted indicators with risk scores
- **🤖 AI Summaries** - Get intelligent threat analysis
- **📈 Analytics** - Monitor feed performance and IOC trends

### Key Dashboard Features:
- Real-time article aggregation
- Automated IOC extraction from content
- Risk scoring and threat classification
- AI-powered threat summarization
- Interactive data visualization
- Manual feed refresh capability

---

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:8000/health

# Test manual feed refresh
curl -X POST http://localhost:8000/api/feeds/refresh

# Test API endpoints
curl http://localhost:8000/api/feeds
curl http://localhost:8000/api/articles
curl http://localhost:8000/api/iocs
```

---

---

## 🔐 Security Considerations

- ⚠️ **Never commit `.env` files or API keys to version control**
- 🔒 Use strong database credentials
- 🌐 Enable CORS restrictions in `app.py` as needed
- 🔄 Regularly rotate API keys and credentials
- 📊 Monitor API rate limits for external services

---

## 🛠️ Development Tips

- Use the manual refresh button during development
- Monitor database through pgAdmin for debugging
- Check logs for RSS parsing errors
- Test IOC extraction with sample threat articles
- Validate AI summaries with different content types

---

## 📈 System Architecture

- **Database**: PostgreSQL with SQLAlchemy ORM for reliable data storage
- **Background Tasks**: APScheduler for automated RSS feed processing
- **IOC Processing**: Custom extraction engine with regex patterns
- **AI Integration**: OpenRouter API for intelligent threat summarization
- **Real-time Updates**: RESTful API with manual refresh capabilities

---

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`

2. **RSS Feed Parsing Failures**
   - Check internet connectivity
   - Validate RSS feed URLs
   - Monitor logs for specific errors

3. **Frontend Connection Issues**
   - Ensure backend is running on port 8000
   - Check API URL in frontend `.env`
   - Verify CORS configuration

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints:
- `GET /api/feeds` - List RSS feeds
- `POST /api/feeds/refresh` - Manual refresh
- `GET /api/articles` - List articles
- `GET /api/iocs` - List extracted IOCs
- `GET /health` - System health check

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📣 Acknowledgements

- **[OpenRouter](https://openrouter.ai/)** for LLM-powered threat summarization
- **[AbuseIPDB](https://abuseipdb.com/)** and **[VirusTotal](https://virustotal.com/)** for IOC enrichment and validation
- **[FastAPI](https://fastapi.tiangolo.com/)** and **[React.js](https://reactjs.org/)** for robust framework support
- **[SQLAlchemy](https://sqlalchemy.org/)** for database ORM
- **[feedparser](https://feedparser.readthedocs.io/)** for RSS parsing
- **Societe Generale** for hosting this innovative hackathon

---

## 🏆 About This Submission

**Threatelligence** represents a comprehensive approach to automated threat intelligence gathering and analysis. By combining RSS feed aggregation, intelligent IOC extraction, risk assessment, and AI-powered summarization, this platform empowers cybersecurity professionals with real-time threat visibility and actionable intelligence.

The system is designed to be:
- **Scalable**: Handle multiple RSS feeds and high article volumes
- **Intelligent**: AI-powered analysis and risk scoring
- **User-Friendly**: Clean, intuitive dashboard interface
- **Extensible**: Modular architecture for easy feature additions
- **Production-Ready**: Comprehensive error handling and monitoring

---

## 🏁 Final Note

Threatelligence empowers cybersecurity teams and researchers with real-time visibility, enriched threat context, and intelligent automation — all delivered through a unified, professional interface.

This platform demonstrates the power of combining traditional RSS aggregation with modern AI capabilities to create a next-generation threat intelligence solution.

---

> **Submitted as part of the Societe Generale Hackathon 2025**  
> **Built with passion and innovation by Team vin2win**  
> **👨‍💻 Yogesh P (22BPS1044)**  
> **👩‍💻 Bharathi R (22BPS1010)**

---

**Happy Threat Hunting! 🔍🛡️**