from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import chromadb
from chromadb.utils import embedding_functions
import os
import re

app = FastAPI(title="MarketKloud RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── CLIENTS ──────────────────────────────────────────────────────
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chroma_client = chromadb.PersistentClient(path="./chroma_db")

embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

collection = chroma_client.get_or_create_collection(
    name="marketkloud_docs",
    embedding_function=embedding_fn,
)

CALENDLY_URL = os.environ.get("CALENDLY_URL", "https://calendly.com/marketkloud/discovery")

SYSTEM_PROMPT = """You are the AI assistant for MarketKloud, an AI systems and software engineering agency.

Your role:
- Welcome visitors warmly
- Answer questions about MarketKloud's services, pricing, process, and team
- Help visitors understand if MarketKloud is the right fit for their project
- When someone is ready to discuss a project or book a call, provide the Calendly booking link

Tone: Professional, helpful, concise. Sound like a knowledgeable team member, not a generic bot.

Rules:
- Only answer based on the context provided. If you don't know something, say "I'll make sure the team follows up on that."
- Keep responses under 120 words unless a detailed answer is genuinely needed
- Never make up pricing, timelines, or capabilities not in the context
- If someone mentions their project needs, acknowledge it specifically and suggest a discovery call
- BOOKING_TRIGGER: If the user wants to book a call, schedule a meeting, or is clearly ready to proceed, include this exact string at the end of your response: [SHOW_BOOKING]"""


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    reply: str
    show_booking: bool = False


def retrieve_context(query: str, n_results: int = 4) -> str:
    if collection.count() == 0:
        return ""
    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
    )
    docs = results.get("documents", [[]])[0]
    return "\n\n---\n\n".join(docs) if docs else ""


def detect_booking_intent(text: str) -> bool:
    keywords = [
        "book", "schedule", "meeting", "call", "discovery",
        "get started", "start a project", "hire", "work with you",
        "contact", "reach out", "talk to someone", "speak with",
    ]
    lower = text.lower()
    return any(kw in lower for kw in keywords)


@app.get("/")
def root():
    return {"status": "MarketKloud chatbot running"}


@app.get("/health")
def health():
    return {"status": "ok", "docs_indexed": collection.count()}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    context = retrieve_context(req.message)

    messages = [
        {
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\nRelevant context from MarketKloud's knowledge base:\n{context}"
            if context
            else SYSTEM_PROMPT,
        }
    ]

    for turn in req.history[-6:]:
        if turn.get("role") in ("user", "assistant"):
            messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": req.message})

    response = groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=messages,
        max_tokens=400,
        temperature=0.4,
    )

    reply = response.choices[0].message.content.strip()

    show_booking = "[SHOW_BOOKING]" in reply or detect_booking_intent(req.message)
    reply = reply.replace("[SHOW_BOOKING]", "").strip()

    if show_booking and CALENDLY_URL not in reply:
        reply += f"\n\n📅 **Book your free 20-minute discovery call:** {CALENDLY_URL}"

    return ChatResponse(reply=reply, show_booking=show_booking)


@app.get("/calendly")
def get_calendly():
    return {"url": CALENDLY_URL}
