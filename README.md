# 🎙️ Meeting Summarizer

> Upload a meeting audio recording → get a transcript, executive summary, key decisions, and action items — automatically.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Groq](https://img.shields.io/badge/Groq-Whisper%20%2B%20LLaMA-F55036)](https://console.groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Storage-3ECF8E?logo=supabase)](https://supabase.com)

---

## Architecture

```
React (Vercel) → FastAPI (Render) → Groq Whisper (ASR) → Groq LLaMA (LLM) → Supabase (DB + Storage)
```

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React + Vite + TailwindCSS | Vercel (free) |
| Backend | FastAPI (Python 3.11) | Render (free) |
| ASR | Groq Whisper `large-v3-turbo` | Groq free tier |
| LLM | Groq LLaMA 3.3 70B | Groq free tier |
| Database | Supabase Postgres | Supabase free tier |
| Storage | Supabase Storage | Supabase free tier |

---

## Features

- 🎙️ **Drag-and-drop** audio upload (MP3, WAV, M4A, OGG · max 25 MB)
- ⚡ **Async processing** — upload returns instantly, results stream via polling
- 📋 **Structured output** — executive summary, key decisions, action items (owner + deadline)
- 🔊 **Audio playback** — listen back via secure signed URL
- 📜 **Full transcript** — scrollable, copyable raw text
- 🕓 **Meeting history** — sidebar with all past meetings, status badges, delete
- 🆓 **100% free-tier** — zero infrastructure cost

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free)
- A [Supabase project](https://supabase.com) (free)

### 1 — Supabase Setup

Run [`backend/schema.sql`](backend/schema.sql) in your Supabase SQL Editor.  
This creates the `meetings` table, indexes, RLS policies, and the `audio` storage bucket.

### 2 — Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Create your .env (copy from template)
cp .env.example .env
# Fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3 — Frontend

```bash
cd frontend
npm install
# .env is pre-configured to point at localhost:8000
npm run dev
```

App: http://localhost:5173

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key — get at [console.groq.com](https://console.groq.com) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Dashboard → Project Settings → API) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (include your Vercel URL for prod) |
| `MAX_FILE_SIZE_MB` | Max upload size in MB (default: 25) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (e.g. `https://your-app.onrender.com` for prod) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/meetings/upload` | Upload audio → returns `{meeting_id}` immediately |
| `GET` | `/api/meetings` | List all meetings |
| `GET` | `/api/meetings/{id}` | Get meeting detail (poll for status) |
| `GET` | `/api/meetings/{id}/audio-url` | Get signed URL for audio playback |
| `DELETE` | `/api/meetings/{id}` | Delete meeting + audio file |

### Processing Status Flow

```
POST /upload → status: pending
                    ↓  (BackgroundTask starts)
              status: processing
                    ↓  (Whisper + LLaMA complete)
              status: done  ← poll GET /{id} every 3s until here
```

---

## Deployment

### Backend → Render

1. Push the repo to GitHub
2. Create a Render **Web Service** → connect your repo → Root Directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add all env vars in Render dashboard
6. Note your Render URL (e.g. `https://meeting-summarizer-api.onrender.com`)

### Frontend → Vercel

1. Import repo into Vercel → Framework: Vite → Root Directory: `frontend`
2. Add env var: `VITE_API_URL=https://your-render-url.onrender.com`
3. Add your Vercel URL to `ALLOWED_ORIGINS` in Render env vars
4. Deploy

> **Note:** Render free tier sleeps after inactivity. The frontend shows a "Waking up server…" state and uses a 60-second timeout to handle cold starts gracefully.

---

## Running Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
```

12 tests covering:
- Upload validation (file type, size limit)
- Route responses (list, get, 404)
- LLM JSON extraction (clean, markdown-fenced, malformed)
- Summarization service (success, bad JSON, API errors)

---

## Free-Tier Limits

| Service | Limit | Impact |
|---|---|---|
| Groq Whisper | 2000 req/day · 28800 sec/day · 25 MB max | Daily cap and file size |
| Groq LLM | 30 req/min | Rate limiting on summarization |
| Supabase DB | 500 MB | Transcript storage |
| Supabase Storage | 1 GB | Audio file storage |
| Render | Sleeps when idle | ~30–50s cold start |

---

## Project Structure

```
Meeting_summarizer/
├── backend/
│   ├── main.py               # FastAPI app
│   ├── config.py             # Settings (Pydantic)
│   ├── database.py           # Supabase client
│   ├── models.py             # Pydantic schemas
│   ├── schema.sql            # Supabase DB schema
│   ├── routers/
│   │   └── meetings.py       # All API routes
│   ├── services/
│   │   ├── transcription.py  # Groq Whisper
│   │   └── summarization.py  # Groq LLaMA + JSON parse
│   ├── tests/
│   │   ├── test_meetings.py
│   │   └── test_summarization.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── api/meetings.js
│       └── components/
│           ├── UploadForm.jsx
│           ├── StatusBanner.jsx
│           ├── ResultTabs.jsx
│           ├── ActionItem.jsx
│           └── MeetingList.jsx
├── .gitignore
└── README.md
```
