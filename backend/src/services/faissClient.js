const FAISS_TIMEOUT_MS = Number(process.env.FAISS_TIMEOUT_MS) || 6000;

export async function searchFaiss({ queryEmbedding, chunks, topK = 5 }) {
  if (!process.env.FAISS_SERVICE_URL) return null;

  // Abort quickly if the FAISS service is slow or cold-starting, so the
  // caller can fall back to fast in-process retrieval instead of hanging.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FAISS_TIMEOUT_MS);

  try {
    const res = await fetch(`${process.env.FAISS_SERVICE_URL.replace(/\/$/, "")}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        chunks: chunks.filter((chunk) => Array.isArray(chunk.embedding)),
        top_k: topK
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`FAISS service failed with ${res.status}`);
    }

    const data = await res.json();
    return data.matches || [];
  } finally {
    clearTimeout(timer);
  }
}
