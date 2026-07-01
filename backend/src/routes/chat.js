import express from "express";
import { store } from "../db/store.js";
import { generateAnswer } from "../services/gemini.js";
import { retrieveContext } from "../services/retriever.js";
import { HttpError } from "../utils/errors.js";

export const chatRouter = express.Router();

chatRouter.post("/", async (req, res, next) => {
  const started = Date.now();
  try {
    const question = String(req.body.question || "").trim();
    if (!question) throw new HttpError(400, "Question is required");

    const retrieved = await retrieveContext(question);
    const answer = await generateAnswer(question, retrieved.context);

    await store.logConversation({
      question,
      category: retrieved.category,
      score: retrieved.bestScore,
      answer,
      contextRef: retrieved.matches.map((item) => item.id || item.faq_id || item.document_id).filter(Boolean).join(","),
      responseTime: Date.now() - started
    });

    res.json({
      answer,
      confidence: retrieved.bestScore,
      category: retrieved.category,
      retrievalMode: retrieved.mode,
      sources: retrieved.matches.map((item) => ({ id: item.id || item.faq_id, category: item.category }))
    });
  } catch (err) {
    next(err);
  }
});

chatRouter.post("/leads", async (req, res, next) => {
  try {
    const { name, phone, email, programInterest, message } = req.body;
    if (!name || !phone) throw new HttpError(400, "Name and phone number are required");
    const lead = await store.createLead({ name, phone, email, programInterest, message });
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});
