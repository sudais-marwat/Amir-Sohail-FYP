import { GoogleGenerativeAI } from "@google/generative-ai";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

function cleanModelAnswer(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function runModel(genAI, modelName, prompt) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return cleanModelAnswer(result.response.text());
}

export async function generateAnswer(question, context) {
  if (!context) {
    return "I don't have verified Hadaf College information on that just yet. For the most accurate answer, please reach out to the admission office — or share your details in the Admission Follow-Up form and our team will get back to you soon.";
  }

  if (!process.env.GEMINI_API_KEY) {
    return `Based on the available Hadaf College information: ${context.split("\n").slice(0, 3).join(" ")}`;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = [
    "You are the official Hadaf College website admission and student support assistant.",
    "Answer only from the provided context. If the context is insufficient, say so and suggest contacting admissions.",
    "Open with a brief, warm acknowledgement when it fits naturally, then give the answer.",
    "Keep the answer clear, polite, helpful, and easy for students/parents to understand.",
    "When useful, end with one short, friendly next step (for example: visiting the admission office or using the Admission Follow-Up form).",
    "Use plain text only. Do not use Markdown, asterisks, bold text, tables, or dense paragraphs.",
    "Detailed answers are allowed, but structure them with short paragraphs and readable hyphen bullets.",
    "Use simple wording. Explain briefly what each important item means if that helps the user.",
    "For list-style answers, group related points instead of making one compact paragraph.",
    "If you use section headings, write them as simple labels ending with a colon, for example: Required documents:",
    "For required documents, give a direct common-documents list first, then add a short note about program-specific differences.",
    "Do not repeat the question. Do not add generic disclaimers unless the context is genuinely missing.",
    "",
    `Question: ${question}`,
    "",
    `Context:\n${context}`
  ].join("\n");

  try {
    return await runModel(genAI, PRIMARY_MODEL, prompt);
  } catch (primaryError) {
    console.warn(`Gemini primary model "${PRIMARY_MODEL}" failed, falling back to "${FALLBACK_MODEL}":`, primaryError.message);
    return await runModel(genAI, FALLBACK_MODEL, prompt);
  }
}
