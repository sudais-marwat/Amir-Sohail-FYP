# Deployment

## Frontend on Vercel

Use `frontend` as the project directory.

Set:

```bash
VITE_API_URL=https://your-backend-url/api
```

Build command and output are defined in `frontend/vercel.json`.

## Backend on Render

Use `render.yaml` from the repository root.

Required environment variables:

```bash
DATABASE_URL=postgres://...
JWT_SECRET=long-random-secret
FRONTEND_ORIGIN=https://your-frontend-url
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
FAISS_SERVICE_URL=https://your-faiss-service-url
UPLOAD_DIR=uploads
```

Run the schema after the database is created:

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
npm run seed:admin
```

## FAISS Service

The FAISS service is deployable with `faiss-service/Dockerfile`.

Health check:

```bash
GET /health
```

Search endpoint:

```bash
POST /search
```

The backend automatically uses FAISS when `FAISS_SERVICE_URL` is set.

## Uploaded Documents

The backend saves uploaded source files under `UPLOAD_DIR` and stores that path in the `documents` table. For production, mount persistent disk storage or replace local upload storage with object storage.

## CSV Exports

Authenticated admins can export:

- `/api/admin/leads.csv`
- `/api/admin/queries.csv`

## Local Verification Commands

```bash
npm test
npm run build
```

## Docker Compose

For a production-like local run with PostgreSQL and FAISS:

```bash
docker compose up --build
```

The Compose stack uses:

- `postgres:16-alpine` for PostgreSQL
- `backend/Dockerfile` for the Node API
- `faiss-service/Dockerfile` for vector retrieval
- `frontend/Dockerfile` for the React static frontend
