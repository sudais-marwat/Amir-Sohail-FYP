import { store } from "../db/store.js";
import { cosineSimilarity, embedText } from "./embeddings.js";
import { searchFaiss } from "./faissClient.js";

const stopWords = new Set(["the", "is", "are", "a", "an", "to", "for", "of", "and", "or", "in", "on", "what", "how", "can"]);

function terms(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term && !stopWords.has(term));
}

function score(query, chunk) {
  const q = new Set(terms(query));
  const c = terms(chunk);
  if (!q.size || !c.length) return 0;
  const hits = c.filter((term) => q.has(term)).length;
  return hits / Math.sqrt(c.length);
}

function inferCategory(question, matches) {
  const text = question.toLowerCase();
  if (/\b(document|admission|apply|form|eligibility|interview|merit)\b/.test(text)) return "admissions";
  if (/\b(program|course|fsc|ics|fa|icom|bs|computer|medical|engineering)\b/.test(text)) return "programs";
  if (/\b(scholarship|concession|discount|fee concession|merit scholarship)\b/.test(text)) return "scholarships";
  if (/\b(fee|payment|refund|installment)\b/.test(text)) return "fees";
  if (/\b(hostel|transport|bus|route)\b/.test(text)) return "facilities";
  const category = matches.find((item) => item.category && item.category !== "official-questions")?.category;
  return category || matches[0]?.category || "general";
}

function isOutOfDomain(question) {
  const text = question.toLowerCase();
  const domainPattern = /\b(hadaf|college|student|parent|admission|apply|program|course|fsc|ics|fa|icom|bs|fee|scholarship|document|campus|hostel|transport|faculty|teacher|principal|attendance|exam|class|timing|contact|phone|whatsapp|email|portal|complaint|uniform|lab|library|career)\b/;
  const offTopicPattern = /\b(laptop|mobile|hotel|flight|dubai|karachi weather|bitcoin|stock|movie|recipe|restaurant)\b/;
  return offTopicPattern.test(text) && !domainPattern.test(text);
}

export async function retrieveContext(question) {
  if (isOutOfDomain(question)) {
    return formatResult(question, [], "fallback");
  }

  const chunks = await store.knowledgeChunks();
  const questionEmbedding = await embedText(question);

  const faissMatches = await searchFaiss({ queryEmbedding: questionEmbedding, chunks, topK: 5 }).catch(() => null);
  if (faissMatches?.length) {
    const useful = faissMatches.filter((item) => item.score > 0.3);
    return formatResult(question, useful, "faiss");
  }

  const ranked = chunks
    .map((chunk) => {
      const vectorScore = cosineSimilarity(questionEmbedding, chunk.embedding);
      const lexicalScore = score(question, chunk.chunk_text);
      return { ...chunk, score: Math.max(vectorScore, lexicalScore), vectorScore, lexicalScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const useful = ranked.filter((item) => item.lexicalScore > 0 || item.vectorScore > 0.3);
  return formatResult(question, useful, "local-vector");
}

function formatResult(question, useful, mode) {
  return {
    matches: useful,
    context: useful.map((item, index) => `[${index + 1}] ${item.chunk_text}`).join("\n\n"),
    bestScore: useful[0]?.score || 0,
    category: useful.length ? inferCategory(question, useful) : "general",
    mode
  };
}
