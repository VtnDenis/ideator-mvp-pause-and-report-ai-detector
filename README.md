# Pause & Report — The AI Detector for Students & Researchers

**Check your own writing for robotic phrasing before submitting papers, essays, or theses. Get a human score, flag problematic sentences, and fix them — before anyone else notices.**

Unlike plagiarism checkers, Pause & Report tells *you* if your own writing sounds like a machine wrote it. It's not a cheat tool — it's a **confidence booster** for anyone who wants their work to sound authentically human.

---

## Why This Exists

With universities, journals, and preprint servers like [arXiv banning AI-generated submissions](https://blog.arXiv.org/), the academic world is taking AI detection seriously. Students and researchers now face a new kind of pressure: proving their work is their own.

But here's the problem — most AI detectors are designed to **catch** you, not **help** you. Pause & Report flips the script. It lets you scan your own draft *before* submission so you can catch unintentionally robotic phrasing and revise it. Think of it as spellcheck for authentic voice.

**This tool does NOT store your text, require login, or report you anywhere. It's private, free, and built for your peace of mind.**

---

## Features

- **Human Score** — Get a 0–100% score measuring how natural your writing sounds
- **Sentence-Level Flagging** — See exactly which sentences sound robotic, with specific reasons
- **No Login Required** — Paste and scan instantly. Zero friction, zero tracking
- **Sample Texts** — Try it with built-in samples that demonstrate robot vs. human writing
- **Chrome Extension** — Scan Google Docs and Word Online with one click
- **Privacy-First** — Text is analyzed in memory and never stored

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | [Next.js 14](https://nextjs.org/) (React, TypeScript, Tailwind CSS) |
| Backend API | [Flask](https://flask.palletsprojects.com/) (Python 3) |
| Analysis Engine | Heuristic classifier (pattern matching, vocabulary analysis, sentence structure scoring) |
| Chrome Extension | Manifest V3 |
| Deployment | [Vercel](https://vercel.com/) (frontend + serverless API) |

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Web App    │────▶│  Flask API   │────▶│  Analysis Engine │
│  (Next.js)  │     │  /api/*      │     │  (heuristic)     │
└─────────────┘     └──────────────┘     └──────────────────┘
        ▲                                        │
        │                                        ▼
┌─────────────┐                          ┌──────────────────┐
│  Chrome     │                          │  JSON Response   │
│  Extension  │                          │  (scores, flags) │
└─────────────┘                          └──────────────────┘
```

The Next.js frontend rewrites `/api/*` requests to the Python Flask backend, which runs a heuristic analysis engine that evaluates sentence structure, vocabulary complexity, repetitive patterns, and transitional phrasing.

---

## How the Analysis Works

The scoring engine evaluates each sentence on several dimensions:

1. **Formulaic Patterns** — Detects overused academic phrases like "it is important to note that..."
2. **Pompous Vocabulary** — Flags words like "utilize," "leverage," "paradigm," "synergistic"
3. **Repetitive Transitions** — Catches overuse of "moreover," "furthermore," "consequently"
4. **Filler Words** — Identifies unnecessary adverbs: "very," "quite," "extremely"
5. **Sentence Length** — Flags overly long sentences as potential GPT-style output
6. **Word Complexity** — Measures average word length to spot unnecessarily complex vocabulary

Each sentence gets an **AI score** (0–1). Sentences above the threshold are flagged with specific reasons. The overall **human score** is a weighted combination of the average AI score and the ratio of flagged sentences.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone & Install

```bash
git clone https://github.com/VtnDenis/ideator-mvp-pause-and-report-ai-detector
cd pause-and-report-ai-detector
```

### 2. Start the API Server

```bash
cd api
pip install -r requirements.txt
python index.py
```

The API runs on `http://localhost:5001`.

### 3. Start the Frontend

In a separate terminal:

```bash
# from project root
npm install
npm run dev
```

The app opens at `http://localhost:3000`.

### 4. Use the Chrome Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Open a Google Doc or Word Online doc and click **Scan with Pause & Report**

---

## API Reference

### `POST /api/analyze`

Analyze text for AI-like patterns.

**Request:**
```json
{
  "text": "Your text to analyze (min 20 characters, max 50,000)"
}
```

**Response:**
```json
{
  "human_score": 0.72,
  "ai_probability": 0.28,
  "flagged_sentences": [...],
  "all_sentences": [...],
  "summary": {
    "total_sentences": 12,
    "flagged_count": 3,
    "avg_ai_score": 0.28,
    "word_count": 210,
    "char_count": 1420
  }
}
```

### `GET /api/health`

```json
{ "status": "ok", "version": "1.0.0" }
```

---

## Project Structure

```
pause-and-report-ai-detector/
├── api/
│   ├── index.py            # Flask API with analysis engine
│   └── requirements.txt    # Python dependencies
├── extension/
│   ├── manifest.json       # Chrome extension manifest V3
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Extension popup logic
│   ├── content.js          # Google Docs/Word Online injector
│   └── icons/              # Extension icons
├── src/
│   ├── app/
│   │   ├── globals.css     # Global styles with Tailwind
│   │   ├── layout.tsx      # Root layout with fonts
│   │   └── page.tsx        # Main web app page
│   └── ...                 # Next.js config files
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## Deployment

The project is designed to deploy to **Vercel** with zero configuration:

```bash
npx vercel --prod --yes
```

The Vercel deployment automatically:
- Builds the Next.js frontend
- Deploys the Flask API as a serverless function

---

## Live Demo

[https://pause-and-report-ai-detector.vercel.app](https://pause-and-report-ai-detector.vercel.app)

---

## License

MIT — free to use, modify, and share. Built as an MVP by [VtnDenis](https://github.com/VtnDenis).
