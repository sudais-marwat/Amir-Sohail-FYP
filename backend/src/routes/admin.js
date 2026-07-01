import express from "express";
import { unlink } from "node:fs/promises";
import multer from "multer";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { chunkText } from "../services/chunker.js";
import { extractDocumentText } from "../services/documentText.js";
import { embedDocument } from "../services/embeddings.js";
import { saveUpload } from "../services/uploadStorage.js";
import { toCsv } from "../utils/csv.js";
import { HttpError } from "../utils/errors.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
export const adminRouter = express.Router();

adminRouter.use(requireAuth);

adminRouter.get("/analytics", async (_req, res, next) => {
  try {
    res.json(await store.analytics());
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/faqs", async (_req, res, next) => {
  try {
    res.json(await store.listFaqs());
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/faqs", async (req, res, next) => {
  try {
    if (!req.body.question || !req.body.answer) throw new HttpError(400, "Question and answer are required");
    const embedding = await embedDocument(`${req.body.question}\n${req.body.answer}`, req.body.question);
    res.status(201).json(await store.createFaq({ ...req.body, embedding }));
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/faqs/:id", async (req, res, next) => {
  try {
    const embedding = await embedDocument(`${req.body.question}\n${req.body.answer}`, req.body.question);
    const faq = await store.updateFaq(req.params.id, { ...req.body, embedding });
    if (!faq) throw new HttpError(404, "FAQ not found");
    res.json(faq);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/faqs/:id", async (req, res, next) => {
  try {
    await store.deleteFaq(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/documents", async (_req, res, next) => {
  try {
    res.json(await store.listDocuments());
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/documents", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, "Document file is required");
    const text = await extractDocumentText(req.file);
    const chunkTexts = chunkText(text);
    if (!chunkTexts.length) throw new HttpError(400, "No readable text found in document");
    const title = req.body.title || req.file.originalname;
    const chunks = await Promise.all(chunkTexts.map(async (chunk) => ({ text: chunk, embedding: await embedDocument(chunk, title) })));
    const filePath = await saveUpload(req.file);
    const doc = await store.addDocument(
      {
        title,
        fileName: req.file.originalname,
        filePath,
        category: req.body.category || "general",
        uploadedBy: req.admin.id
      },
      chunks
    );
    res.status(201).json({ ...doc, chunks: chunks.length });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/documents/:id", async (req, res, next) => {
  try {
    const doc = await store.getDocument(req.params.id);
    if (!doc) throw new HttpError(404, "Document not found");
    const filePath = doc.file_path || doc.filePath;
    await store.deleteDocument(req.params.id);
    if (filePath) await unlink(filePath).catch(() => {});
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/leads", async (_req, res, next) => {
  try {
    res.json(await store.listLeads());
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/leads.csv", async (_req, res, next) => {
  try {
    const rows = (await store.listLeads()).map((lead) => ({
      ...lead,
      programInterest: lead.program_interest || lead.programInterest
    }));
    const csv = toCsv(rows, [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "programInterest", label: "Program Interest" },
      { key: "message", label: "Message" },
      { key: "created_at", label: "Created At" }
    ]);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", "attachment; filename=\"hadaf-admission-leads.csv\"");
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/queries", async (_req, res, next) => {
  try {
    res.json(await store.listQueries());
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/queries.csv", async (_req, res, next) => {
  try {
    const rows = await store.listQueries();
    const csv = toCsv(rows, [
      { key: "user_question", label: "Question" },
      { key: "query_category", label: "Category" },
      { key: "retrieval_score", label: "Retrieval Score" },
      { key: "created_at", label: "Created At" }
    ]);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", "attachment; filename=\"hadaf-chatbot-queries.csv\"");
    res.send(csv);
  } catch (err) {
    next(err);
  }
});
