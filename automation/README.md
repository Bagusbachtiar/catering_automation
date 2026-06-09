# WhatsApp Catering Bot (n8n Workflow)

AI-powered WhatsApp bot that handles catering orders end-to-end — from customer inquiry to confirmed order saved in the database.

## How It Works

```
Customer WhatsApp message
        ↓
  n8n Webhook (Meta API)
        ↓
  Smart Router (intent detection)
     ↙        ↘
  Chat flow   Order flow
  (Llama3)    (Order Form Handler)
                    ↓
          AI extraction (Qwen3:8b)
                    ↓
          Validation + missing fields
                    ↓
          Confirmed → Save to DB + Google Sheets
```

**Features:**
- Bilingual support (English & Indonesian)
- AI-powered order extraction from natural language or structured form
- Holiday detection — rejects orders on closed dates
- Menu validation against available items
- Conversation memory via Redis
- Customer profile persistence
- WhatsApp banner image sending

## Requirements

| Service | Purpose |
|---|---|
| [n8n](https://n8n.io) | Workflow automation |
| [Ollama](https://ollama.ai) | Local LLM hosting |
| `qwen3:8b` (Ollama) | Order data extraction |
| `llama3:latest` (Ollama) | General chat responses |
| Redis | Session/conversation state |
| WhatsApp Business API (Meta) | Messaging |
| Google Sheets (optional) | Order lead tracking |

## Import to n8n

1. Open your n8n instance
2. Go to **Workflows** → **Import from file**
3. Select `workflow.json`
4. Set up credentials:
   - **Redis** — point to your Redis instance
   - **WhatsApp** — add your Meta API token as HTTP header auth (`Authorization: Bearer <token>`)
   - **Google Sheets** (optional) — OAuth2
5. Update the webhook URL in your Meta App dashboard
6. Activate the workflow

## Configuration

Inside the workflow, the following nodes contain configurable values:

| Node | What to configure |
|---|---|
| `AI Order extraction` | Ollama model, available menu list |
| `AI Chat Prompt` | Business name, tone, opening hours |
| `Check Holidays` | Holiday dates (also manageable via dashboard) |
| `Send WhatsApp Message` | Meta API phone number ID |

## Notes

- Conversation history stored in Redis with 24-hour TTL per session
- Order data sent to the dashboard backend via HTTP (`/api/orders`)
- All LLM inference runs locally via Ollama — no external AI API calls
