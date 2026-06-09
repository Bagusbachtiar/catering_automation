# Catering Automation

![n8n](https://img.shields.io/badge/n8n-workflow-orange?logo=n8n)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Business_API-25D366?logo=whatsapp&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Qwen3_8B-black)
![Redis](https://img.shields.io/badge/Redis-session_state-DC382D?logo=redis&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-backend-339933?logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-containerized-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

A full-stack catering management system with a WhatsApp AI bot for automated order taking and a web dashboard for order management.

**[Watch Demo]([ADD_LINKEDIN_URL_HERE](https://www.linkedin.com/feed/update/urn:li:activity:7469298447599382528/))**

## Structure

```
catering_automation/
├── dashboard/        # Web admin dashboard
│   ├── backend/      # Express + SQLite API server
│   ├── css/
│   ├── js/
│   └── *.html        # Dashboard pages
└── automation/       # n8n WhatsApp bot workflow
    └── workflow.json
```

## Stack

| Layer | Technology |
|---|---|
| Workflow automation | n8n |
| AI extraction | Qwen3 8B via Ollama (local LLM) |
| AI chat | Llama3 via Ollama (local LLM) |
| Messaging | WhatsApp Business API (Meta) |
| Session state | Redis |
| Lead tracking | Google Sheets (optional) |
| Backend | Node.js · Express |
| Database | SQLite (better-sqlite3) |
| Infrastructure | Docker + Docker Compose |

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env — set N8N_ENCRYPTION_KEY and WEBHOOK_URL
docker compose up -d
```

Services started:
- n8n at `http://localhost:5678`
- Ollama at `http://localhost:11434`
- Redis at `localhost:6379`

Pull required Ollama models after first start:
```bash
docker exec ollama ollama pull qwen3:8b
docker exec ollama ollama pull llama3
```

## Dashboard

Web-based admin panel for managing catering operations.

**Features:**
- Order management (view, update status, payment tracking)
- Menu management with images and pricing
- Holiday calendar (blocks orders on closed dates)
- Banner image uploads for WhatsApp menu display
- Customer order history

### Setup

```bash
cd dashboard/backend
cp .env.example .env
# Edit .env with your credentials
npm install
node server.js
```

Open `http://localhost:3000` in your browser.

**Environment variables:**

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `ADMIN_PASSWORD` | Dashboard login password |
| `AUTH_TOKEN` | Session token for API auth |

## WhatsApp Bot (n8n Automation)

See [automation/README.md](automation/README.md) for full setup — including n8n workflow import, Ollama model setup, and credential configuration.

## License

MIT — see [LICENSE](LICENSE)
