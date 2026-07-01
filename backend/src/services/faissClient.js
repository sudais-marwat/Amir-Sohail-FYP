export async function searchFaiss({ queryEmbedding, chunks, topK = 5 }) {
  if (!process.env.FAISS_SERVICE_URL) return null;

  const res = await fetch(`${process.env.FAISS_SERVICE_URL.replace(/\/$/, "")}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query_embedding: queryEmbedding,
      chunks: chunks.filter((chunk) => Array.isArray(chunk.embedding)),
      top_k: topK
    })
  });

  if (!res.ok) {
    throw new Error(`FAISS service failed with ${res.status}`);
  }

  const data = await res.json();
  return data.matches || [];
}
