# Setup Guide

## 1. Install Runtime

Install Node.js 20 or newer and PostgreSQL 14 or newer.

Confirm:

```bash
node --version
npm --version
psql --version
```

## 2. Install Project Dependencies

```bash
cd hadaf-rag-chatbot
npm install
```

## 3. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Set these values in `backend/.env`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hadaf_chatbot
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=your-key-if-available
UPLOAD_DIR=uploads
```

The app can run without `DATABASE_URL` and `GEMINI_API_KEY` for demos, but production should use both.

## 4. Create Database

```bash
createdb hadaf_chatbot
psql "$DATABASE_URL" -f backend/db/schema.sql
npm run seed:admin
npm run seed:knowledge
```

## 5. Run

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Optional FAISS Service

The proposal names FAISS as the vector database. The backend can run without FAISS for development, but production semantic retrieval should use the included FAISS service.

Install Python dependencies:

```bash
pip install -r faiss-service/requirements.txt
```

Start FAISS:

```bash
npm run faiss
```

Add this to `backend/.env`:

```bash
FAISS_SERVICE_URL=http://127.0.0.1:8001
```

For all services together:

```bash
npm run dev:full
```

Admin login defaults:

```text
admin@hadaf.edu.pk
admin12345
```

Change these in `.env` before production.

## 6. First Knowledge Upload

Use the admin dashboard document upload and upload:

```text
backend/seeds/hadaf-sample-knowledge.txt
```

The real Hadaf Q&A sheet has also been extracted to:

```text
backend/seeds/questions-knowledge.txt
```

For PostgreSQL, import it with:

```bash
npm run seed:knowledge
```

Then ask the chatbot:

```text
What documents are required for admission?
```

## Admin Exports

The admin dashboard can download CSV files for:

- Admission leads
- Chatbot query logs

## 7. Production Notes

- Use PostgreSQL instead of the in-memory demo store.
- Set a strong `JWT_SECRET`.
- Set `GEMINI_API_KEY`.
- Use `FAISS_SERVICE_URL` for FAISS-backed retrieval.
- Use durable storage for `UPLOAD_DIR` in production.
- Deploy frontend on Vercel and backend on Render or a VPS.

## Full Local Stack With PostgreSQL

To run the React frontend, Node backend, PostgreSQL database, and FAISS service together:

```bash
docker compose up --build
```

This starts:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- FAISS: `http://localhost:8001`
- PostgreSQL: `localhost:5432`

The PostgreSQL container initializes from:

```text
backend/db/schema.sql
```

Uploaded documents are stored in the `api-uploads` Docker volume.
