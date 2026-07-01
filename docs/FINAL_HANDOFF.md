# Final Handoff

## Project

AI-Powered RAG-Based Admission and Student Support Chatbot for Hadaf College Website.

## Demo URLs

When running locally:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- FAISS service: `http://127.0.0.1:8001`

## Admin Login

```text
Email: admin@hadaf.edu.pk
Password: admin12345
```

Change these values before production.

## Quick Local Run

```bash
npm install
npm run dev
```

Optional FAISS service:

```bash
npm run faiss
```

Full stack with PostgreSQL, backend, frontend, and FAISS:

```bash
docker compose up --build
```

## Demo Script

1. Open the frontend.
2. Ask: `What documents are required for admission?`
3. Ask: `Which programs are offered at Hadaf College?`
4. Ask: `Can students ask about scholarships?`
5. Ask an unrelated question to show fallback behavior.
6. Submit an admission follow-up lead.
7. Open admin dashboard.
8. Show analytics, topic breakdown, query history, and leads.
9. Add a new FAQ and ask the chatbot a related question.
10. Upload a text, PDF, or DOCX knowledge document.
11. Export leads and query logs as CSV.
12. Run the evaluation command and show the report.

## Verification Commands

```bash
npm test
npm run evaluate
npm run build
```

Latest known local verification:

- Backend API tests: `8/8` passed
- Evaluation: `0.97` average score, `4/4` pass
- Frontend production build: passed

## Implemented Proposal Requirements

- React student/parent chatbot interface
- React admin dashboard
- Node.js/Express backend APIs
- PostgreSQL schema
- FAISS retrieval service
- Gemini response generation with local fallback
- FAQ management
- Document upload, chunking, file-path storage, and deletion
- Lead collection
- Query and response logging
- Analytics and topic breakdown
- CSV exports for leads and query logs
- Evaluation workflow and Markdown report
- Docker/Render/Vercel deployment configuration

## Production Notes

- Use PostgreSQL with `DATABASE_URL`.
- Set a strong `JWT_SECRET`.
- Set `GEMINI_API_KEY`.
- Set `FAISS_SERVICE_URL`.
- Use durable storage for uploaded documents.
- Replace demo admin credentials.
- Review Hadaf official documents before public release.

## Real Hadaf Data Included

`Questions.xlsx` was converted into:

```text
backend/seeds/questions-knowledge.txt
```

The local demo store loads this seed automatically when no PostgreSQL database is configured. In production, upload the same file from the admin dashboard or load it into PostgreSQL as a document source.
