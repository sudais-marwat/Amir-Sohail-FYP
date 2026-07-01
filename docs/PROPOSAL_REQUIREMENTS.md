# Proposal Requirements Map

Source: `fyp proposal version 1.docx`

## Product

AI-powered RAG-based admission and student support chatbot for the Hadaf College website.

## Users

- Students
- Parents
- Prospective applicants
- Website visitors
- Admin/admission staff

## Functional Requirements

- Website chatbot for natural-language questions
- Admission query answers
- Student support query answers
- Retrieval from uploaded documents and FAQs
- Gemini API response generation
- Admin FAQ create, update, delete
- Admin document upload
- Uploaded document processing into retrieval chunks
- PostgreSQL storage for user queries
- Chatbot response logging
- Admission lead collection
- Admin admission lead viewing
- Frequently asked question viewing
- Basic chatbot analytics
- Fallback response when no relevant information exists
- Admin knowledge base updates without code changes

## Non-Functional Requirements

- Simple, clear, responsive interface
- Admin authentication
- Fast responses
- Answers grounded in official college information
- Maintainable FAQ/document updates
- Future expansion for more campuses, programs, and languages
- Online deployment support
- Organized records for queries, documents, leads, and responses

## Locked Stack

- Frontend: React
- Admin panel: React
- Backend: Node.js
- Database: PostgreSQL
- Vector database: FAISS
- AI model/API: Gemini API
- Deployment: Vercel + Render or VPS

## Database Tables

- `admin_users`
- `faqs`
- `documents`
- `knowledge_chunks`
- `user_queries`
- `chatbot_responses`
- `admission_leads`
- `analytics_records`

## Current Implementation Coverage

- React chatbot UI: implemented
- React admin dashboard: implemented
- Node/Express API: implemented
- PostgreSQL schema: created
- FAQ management: API and UI implemented
- Document upload, file-path storage, deletion, and chunking: API and UI implemented
- Query and response logging: API implemented
- Query history: API and admin UI implemented
- Lead collection: API and UI implemented
- Lead and query CSV exports: API and admin UI implemented
- Analytics: query totals, last-24h count, top topic, topic breakdown, and recent query history implemented
- Gemini generation: implemented with no-key fallback
- Embedding-based retrieval: implemented with Gemini embeddings and deterministic local fallback
- FAISS: optional FastAPI service added and backend uses it when `FAISS_SERVICE_URL` is set
- Authentication: JWT login implemented
- Evaluation workflow: sample question dataset, scoring runner, and Markdown report implemented
- Full local deployment: Docker Compose stack added for React, Node, PostgreSQL, and FAISS

## Remaining Work

- Persist FAISS indexes to disk or object storage if the knowledge base becomes large
- Configure cloud durable upload storage for hosted production deployment
- Deploy frontend, backend, PostgreSQL, and FAISS service to hosted infrastructure
