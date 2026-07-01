# Hadaf RAG Chatbot

AI-powered admission and student support chatbot based on the FYP proposal.

## What Is Included

- React chatbot UI for students, parents, and visitors
- React admin dashboard for FAQs, documents, leads, queries, and analytics
- Node.js/Express API
- PostgreSQL schema for admins, FAQs, documents, chunks, queries, responses, leads, and analytics
- RAG service with knowledge chunk retrieval, embeddings, Gemini answer generation, and fallback grounded responses
- Optional FAISS retrieval service with in-process vector ranking fallback

## Requirements

- Node.js 20+
- PostgreSQL 14+
- Gemini API key
- Python 3.11+ for FAISS semantic search service

## Setup

Full setup steps are in [docs/SETUP.md](docs/SETUP.md).
Deployment steps are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
Evaluation steps are in [docs/EVALUATION.md](docs/EVALUATION.md).
Final demo handoff is in [docs/FINAL_HANDOFF.md](docs/FINAL_HANDOFF.md).

```bash
npm install
cp backend/.env.example backend/.env
```

Create the database and run:

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
npm run seed:admin
npm run seed:knowledge
```

Start both apps:

```bash
npm run dev
```

Run the optional FAISS service:

```bash
pip install -r faiss-service/requirements.txt
npm run faiss
```

Set `FAISS_SERVICE_URL=http://127.0.0.1:8001` in `backend/.env` to make the backend use FAISS retrieval.

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

Run evaluation:

```bash
npm run evaluate
```

Run the full stack with PostgreSQL and FAISS:

```bash
docker compose up --build
```

## Environment

See [backend/.env.example](backend/.env.example).

If `DATABASE_URL` is not set, the API runs with an in-memory store for demos. If `GEMINI_API_KEY` is not set, embeddings and answers use deterministic local fallbacks so the RAG flow still works during development.
