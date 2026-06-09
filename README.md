# Catering Automation

A full-stack catering management system with a WhatsApp AI bot for automated order taking and a web dashboard for order management.

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

## Dashboard

Web-based admin panel for managing catering operations.

**Features:**
- Order management (view, update status, payment tracking)
- Menu management with images and pricing
- Holiday calendar (blocks orders on closed dates)
- Banner image uploads for WhatsApp menu display
- Customer order history

**Stack:** HTML/CSS/JS frontend · Node.js + Express · SQLite (better-sqlite3)

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

## Automation (WhatsApp AI Bot)

See [automation/README.md](automation/README.md) for setup instructions.

## License

MIT — see [LICENSE](LICENSE)
