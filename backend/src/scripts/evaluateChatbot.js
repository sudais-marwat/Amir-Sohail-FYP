import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { createApp } from "../app.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "../..");
const datasetPath = path.join(backendRoot, "evaluation/sample-questions.json");
const reportPath = path.join(backendRoot, "evaluation/latest-report.md");
const app = createApp();

function keywordScore(answer, keywords) {
  if (!keywords.length) return 1;
  const normalized = answer.toLowerCase();
  const hits = keywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
  return hits / keywords.length;
}

function verdict(score) {
  if (score >= 0.8) return "Pass";
  if (score >= 0.5) return "Partial";
  return "Needs review";
}

const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const results = [];

for (const item of dataset) {
  const res = await request(app).post("/api/chat").send({ question: item.question });
  const answer = res.body.answer || "";
  const categoryMatch = res.body.category === item.expectedCategory;
  const keywordCoverage = keywordScore(answer, item.keywords || []);
  const confidence = Number(res.body.confidence || 0);
  const score = (categoryMatch ? 0.4 : 0) + keywordCoverage * 0.5 + (confidence > 0 ? 0.1 : 0);

  results.push({
    ...item,
    status: res.status,
    answer,
    actualCategory: res.body.category,
    retrievalMode: res.body.retrievalMode,
    confidence,
    categoryMatch,
    keywordCoverage,
    score,
    verdict: verdict(score)
  });
}

const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
const passCount = results.filter((result) => result.verdict === "Pass").length;

const lines = [
  "# Chatbot Evaluation Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Questions evaluated: ${results.length}`,
  `Average score: ${averageScore.toFixed(2)}`,
  `Pass count: ${passCount}/${results.length}`,
  "",
  "| Question | Expected | Actual | Confidence | Keywords | Verdict |",
  "| --- | --- | --- | ---: | ---: | --- |",
  ...results.map((result) =>
    `| ${result.question.replace(/\|/g, "\\|")} | ${result.expectedCategory} | ${result.actualCategory} | ${result.confidence.toFixed(2)} | ${Math.round(result.keywordCoverage * 100)}% | ${result.verdict} |`
  ),
  "",
  "## Notes",
  "",
  "- Category match contributes 40% of the score.",
  "- Keyword coverage contributes 50% of the score.",
  "- Any positive retrieval confidence contributes 10% of the score.",
  "- This is a repeatable technical check; final evaluation should also include human review for answer usefulness and usability."
];

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${lines.join("\n")}\n`);

console.log(`Evaluation complete: ${reportPath}`);
console.log(`Average score: ${averageScore.toFixed(2)} (${passCount}/${results.length} pass)`);
