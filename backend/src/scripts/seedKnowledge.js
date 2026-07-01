import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { chunkText } from "../services/chunker.js";
import { embedText } from "../services/embeddings.js";

dotenv.config();

const { store } = await import("../db/store.js");

const seedPath = path.resolve("seeds/questions-knowledge.txt");
const text = await readFile(seedPath, "utf8");
const chunks = await Promise.all(
  chunkText(text, 1200, 160).map(async (chunk) => ({
    text: chunk,
    embedding: await embedText(chunk)
  }))
);

const doc = await store.addDocument(
  {
    title: "Questions.xlsx Knowledge",
    fileName: "questions-knowledge.txt",
    filePath: seedPath,
    category: "official-questions",
    uploadedBy: null
  },
  chunks
);

console.log(`Knowledge seeded: ${doc.title || doc.fileName} (${chunks.length} chunks)`);
