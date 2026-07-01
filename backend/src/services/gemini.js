import { GoogleGenerativeAI } from "@google/generative-ai";

function cleanModelAnswer(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateAnswer(question, context) {
  if (!context) {
    return "I could not find verified Hadaf College information for this question yet. Please contact the admission office or leave your details so the team can follow up.";
  }

  if (!process.env.GEMINI_API_KEY) {
    return `Based on the available Hadaf College information: ${context.split("\n").slice(0, 3).join(" ")}`;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
  const prompt = [
    "You are the official Hadaf College website admission and student support assistant.",
    "Answer only from the provided context. If the context is insufficient, say so and suggest contacting admissions.",
    "Keep the answer clear, polite, helpful, and easy for students/parents to understand.",
    "Use plain text only. Do not use Markdown, asterisks, bold text, tables, or dense paragraphs.",
    "Detailed answers are allowed, but structure them with short paragraphs and readable hyphen bullets.",
    "Use simple wording. Explain briefly what each important item means if that helps the user.",
    "For list-style answers, group related points instead of making one compact paragraph.",
    "For required documents, give a direct common-documents list first, then add a short note about program-specific differences.",
    "Do not repeat the question. Do not add generic disclaimers unless the context is genuinely missing.",
    "",
    `Question: ${question}`,
    "",
    `Context:\n${context}`
  ].join("\n");

  const result = await model.generateContent(prompt);
  return cleanModelAnswer(result.response.text());
}
