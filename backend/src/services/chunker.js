export function chunkText(text, size = 900, overlap = 120) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + size, cleaned.length);
    chunks.push(cleaned.slice(start, end).trim());
    if (end === cleaned.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
