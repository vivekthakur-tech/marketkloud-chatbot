"""
Run once to index the knowledge base into ChromaDB.
Usage: python ingest.py
"""

import chromadb
from chromadb.utils import embedding_functions
import os
import re

DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "docs")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> list[str]:
    """Split text into overlapping chunks on paragraph boundaries."""
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) < chunk_size:
            current = (current + "\n\n" + para).strip()
        else:
            if current:
                chunks.append(current)
            # overlap: carry last sentence of previous chunk
            sentences = current.split(". ")
            overlap_text = ". ".join(sentences[-2:]) if len(sentences) > 2 else ""
            current = (overlap_text + "\n\n" + para).strip()

    if current:
        chunks.append(current)

    return chunks


def ingest():
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Clear and recreate to avoid duplicates on re-run
    try:
        client.delete_collection("marketkloud_docs")
        print("Cleared existing collection.")
    except Exception:
        pass

    collection = client.create_collection(
        name="marketkloud_docs",
        embedding_function=embedding_fn,
    )

    all_chunks = []
    all_ids = []
    all_metadata = []

    for filename in os.listdir(DOCS_DIR):
        if not filename.endswith(".txt"):
            continue
        filepath = os.path.join(DOCS_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()

        chunks = chunk_text(text)
        print(f"{filename}: {len(chunks)} chunks")

        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_ids.append(f"{filename}_{i}")
            all_metadata.append({"source": filename, "chunk": i})

    if not all_chunks:
        print("No documents found in docs/ directory.")
        return

    # Batch upsert
    batch_size = 50
    for i in range(0, len(all_chunks), batch_size):
        collection.add(
            documents=all_chunks[i : i + batch_size],
            ids=all_ids[i : i + batch_size],
            metadatas=all_metadata[i : i + batch_size],
        )

    print(f"\nDone. {collection.count()} chunks indexed into ChromaDB.")
    print("Run: uvicorn main:app --reload")


if __name__ == "__main__":
    ingest()
