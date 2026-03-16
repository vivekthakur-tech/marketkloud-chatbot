# MarketKloud RAG Chatbot

AI-powered website chatbot for MarketKloud. Answers visitor questions, qualifies leads, and books discovery calls — all free to run.

**Stack:** FastAPI · ChromaDB · Groq (LLaMA 3) · Sentence Transformers · Render  
**Monthly cost:** $0

---

## What it does

- Welcomes visitors and answers questions about MarketKloud's services, pricing, and process
- Uses RAG (Retrieval-Augmented Generation) — answers from your actual knowledge base, not hallucinations
- Detects booking intent and shows a Calendly link automatically
- Embeds on any website with one `<script>` tag

---

## Project Structure

```
marketkloud-chatbot/
├── backend/
│   ├── main.py           ← FastAPI app (chat endpoint, RAG logic)
│   ├── ingest.py         ← Indexes knowledge base into ChromaDB
│   ├── requirements.txt  ← Python dependencies
│   ├── render.yaml       ← Render deployment config
│   └── .env.example      ← Environment variable template
├── widget/
│   ├── widget.js         ← Chat bubble (embed on any website)
│   └── demo.html         ← Local preview page
└── docs/
    └── knowledge_base.txt ← MarketKloud content (edit this)
```

---

## Step 1 — Get a free Groq API key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card)
3. Create an API key
4. Copy it — you'll need it in Step 3

---

## Step 2 — Run locally (optional, to test first)

```bash
# Clone / download this project
cd marketkloud-chatbot/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
# Edit .env — add your GROQ_API_KEY and CALENDLY_URL

# Index the knowledge base
python ingest.py

# Start the server
uvicorn main:app --reload
# Server runs at http://localhost:8000
```

Open `widget/demo.html` in your browser — the chat widget will appear in the bottom right.

---

## Step 3 — Deploy to Render (free)

### 3a. Push to GitHub

```bash
git init
git add .
git commit -m "MarketKloud chatbot"
git remote add origin https://github.com/YOUR_USERNAME/marketkloud-chatbot.git
git push -u origin main
```

### 3b. Create Render service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set these fields:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python ingest.py`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free

### 3c. Add environment variables

In Render dashboard → Environment:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | your key from console.groq.com |
| `CALENDLY_URL` | https://calendly.com/your-username/discovery |

### 3d. Add a disk (for ChromaDB persistence)

In Render dashboard → Disks → Add Disk:
- **Mount Path:** `/opt/render/project/src/chroma_db`
- **Size:** 1 GB (free)

Click **Deploy**. Takes ~3 minutes.

Your API will be live at: `https://marketkloud-chatbot.onrender.com`

---

## Step 4 — Embed on your website

Add this one line before `</body>` on any page:

```html
<script src="https://YOUR_GITHUB_PAGES_OR_CDN/widget.js"
        data-api="https://marketkloud-chatbot.onrender.com"></script>
```

**Simplest option — host widget.js on GitHub Pages:**

1. Go to your GitHub repo → Settings → Pages
2. Source: Deploy from branch → main → /widget folder
3. Widget URL becomes: `https://YOUR_USERNAME.github.io/marketkloud-chatbot/widget.js`

---

## Step 5 — Update the knowledge base

Edit `docs/knowledge_base.txt` with any new services, pricing changes, or FAQs.

Then re-run ingest:
```bash
python ingest.py
```

On Render, push to GitHub — the build command runs `ingest.py` automatically on each deploy.

---

## Important notes

### Free tier cold starts
Render's free tier spins down after 15 minutes of inactivity. The first message after idle takes ~30 seconds to respond. To fix this, upgrade to the $7/month Starter plan, or add a free keep-alive service (UptimeRobot pings your `/health` endpoint every 10 minutes).

### Groq free tier limits
Groq's free tier allows ~14,400 requests/day with LLaMA 3 70B. More than enough for a new website with normal traffic.

### Adding more documents
Drop additional `.txt` files into the `docs/` folder and re-run `ingest.py`. The system supports multiple files automatically.

---

## Customisation

**Change the welcome message:** Edit `WELCOME` at the top of `widget/widget.js`

**Change the AI personality:** Edit `SYSTEM_PROMPT` in `backend/main.py`

**Change the LLM model:** Edit `model="llama3-70b-8192"` in `main.py` — other options: `llama3-8b-8192` (faster, cheaper), `mixtral-8x7b-32768` (longer context)

**Change colours:** Edit the CSS variables at the top of `widget/widget.js`
