import { GoogleGenerativeAI } from "@google/generative-ai";

const fallbackDimensions = 128;

function fallbackEmbedding(text) {
  const vector = Array.from({ length: fallbackDimensions }, () => 0);
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
    }
    vector[hash % fallbackDimensions] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export async function embedText(text) {
  if (!process.env.GEMINI_API_KEY) return fallbackEmbedding(text);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export function cosineSimilarity(left, right) {
  if (!left?.length || !right?.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftMag = 0;
  let rightMag = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMag += left[index] * left[index];
    rightMag += right[index] * right[index];
  }

  const denominator = Math.sqrt(leftMag) * Math.sqrt(rightMag);
  return denominator ? dot / denominator : 0;
}
