import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { errorHandler } from "./utils/errors.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "hadaf-rag-chatbot" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/admin", adminRouter);
  app.use(errorHandler);

  return app;
}
