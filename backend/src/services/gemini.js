import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAnswer(question, context) {
  if (!context) {
    return "I could not find verified Hadaf College information for this question yet. Please contact the admission office or leave your details so the team can follow up.";
  }

  if (!process.env.GEMINI_API_KEY) {
    return `Based on the available Hadaf College information: ${context.split("\n").slice(0, 3).join(" ")}`;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
  const prompt = [
    "You are the official Hadaf College website admission and student support assistant.",
    "Answer only from the provided context. If the context is insufficient, say so and suggest contacting admissions.",
    "Keep the answer clear, polite, and helpful.",
    "",
    `Question: ${question}`,
    "",
    `Context:\n${context}`
  ].join("\n");

  const result = await model.generateContent(prompt);
  return result.response.text();
}
