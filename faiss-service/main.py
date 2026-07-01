from typing import Any

import faiss
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel


class Chunk(BaseModel):
    id: str | None = None
    faq_id: str | None = None
    document_id: str | None = None
    chunk_text: str
    category: str = "general"
    embedding: list[float]


class SearchRequest(BaseModel):
    query_embedding: list[float]
    chunks: list[Chunk]
    top_k: int = 5


app = FastAPI(title="Hadaf FAISS Retrieval Service")


def normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1
    return vectors / norms


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/search")
def search(payload: SearchRequest) -> dict[str, Any]:
    chunks = [chunk for chunk in payload.chunks if chunk.embedding]
    if not chunks:
        return {"matches": []}

    vectors = np.array([chunk.embedding for chunk in chunks], dtype="float32")
    query = np.array([payload.query_embedding], dtype="float32")

    if vectors.ndim != 2 or query.shape[1] != vectors.shape[1]:
        return {"matches": []}

    vectors = normalize(vectors)
    query = normalize(query)

    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)
    scores, indexes = index.search(query, min(payload.top_k, len(chunks)))

    matches = []
    for score, index_value in zip(scores[0], indexes[0]):
        if index_value < 0:
            continue
        chunk = chunks[int(index_value)].model_dump()
        chunk["score"] = float(score)
        matches.append(chunk)

    return {"matches": matches}
