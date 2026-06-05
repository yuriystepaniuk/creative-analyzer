# Creative Analyzer — Plan

## Summary

Web tool for a performance marketing team:
1. User pastes a public Google Drive URL (image or video)
2. Backend (Cloudflare Worker) downloads the file and sends it to Gemini API
3. Gemini returns structured JSON: person parameters table + audio transcript
4. Frontend displays the result

**Stack:** Cloudflare Workers (backend) + React/Vite (frontend on Cloudflare Pages) + Gemini API

---

## ⚠️ Open question

The task says "визначити сім параметрів" but the list is cut off. Assumed parameters for dating vertical:

| # | Parameter (UA) | Field name |
|---|---|---|
| 1 | Стать | `gender` |
| 2 | Приблизний вік | `age_range` |
| 3 | Етнічність / тип зовнішності | `ethnicity` |
| 4 | Колір волосся | `hair_color` |
| 5 | Тип статури | `body_type` |
| 6 | Стиль одягу | `clothing_style` |
| 7 | Настрій / вираз обличчя | `mood` |

> Confirm or replace before Step 4 (Gemini prompt).

---

## Steps

### Step 1 — Repo & project scaffold
- [ ] Create GitHub repo `unicorn-creative-analyzer`
- [ ] Init monorepo structure:
  ```
  /worker    ← Cloudflare Worker (Hono or vanilla)
  /frontend  ← React + Vite app
  ```
- [ ] Add root `.gitignore`
- [ ] Verify `node` / `wrangler` CLI available locally

---

### Step 2 — Cloudflare Worker scaffold
- [ ] `cd worker && npm create cloudflare@latest` (choose "Hello World" Worker, TypeScript)
- [ ] Confirm `wrangler.toml` is correct (name, compatibility_date)
- [ ] Add `GEMINI_API_KEY` as a secret placeholder in `wrangler.toml` (as `[vars]` comment — real value via `wrangler secret put`)
- [ ] Deploy "Hello World" to verify the account + deploy pipeline works → get a `.workers.dev` URL
- [ ] Commit

---

### Step 3 — Google Drive download logic (Worker)
- [ ] Write `src/gdrive.ts` utility:
  - Input: any Google Drive share URL
  - Extract `fileId` via regex (`/file/d/([^/]+)`)
  - Build direct download URL: `https://drive.google.com/uc?export=download&id={fileId}`
  - Follow redirects; handle Google's virus-scan confirmation page (large files return an HTML page with a confirmation token — parse and retry)
  - Detect `Content-Type` from response headers; fall back to extension sniffing
  - Return `{ buffer: ArrayBuffer, mimeType: string }`
- [ ] Manual test with all 6 provided URLs (log mimeType + byte size)
- [ ] Commit

---

### Step 4 — Gemini integration (Worker)
- [ ] Confirm the 7 person parameters (see ⚠️ above)
- [ ] Write `src/gemini.ts`:
  - Use `@google/generative-ai` SDK or raw `fetch` to `generativelanguage.googleapis.com`
  - Choose model: `gemini-1.5-flash` (supports vision + video + audio in one request)
  - **One request** for both visual analysis and transcript (avoids double billing + latency)
  - Define TypeScript output schema:
    ```ts
    interface AnalysisResult {
      person: {
        gender: string | null;
        age_range: string | null;
        ethnicity: string | null;
        hair_color: string | null;
        body_type: string | null;
        clothing_style: string | null;
        mood: string | null;
      } | null;          // null if no person in frame
      transcript: string | null;  // null if no speech
    }
    ```
  - Use `responseMimeType: "application/json"` + `responseSchema` for structured output
  - Write a careful prompt (see prompt design notes below)
- [ ] Prompt design notes:
  - Instruct Gemini to analyze only the person in focus (ignore blurred/background figures)
  - Return `person: null` if no person detected
  - Return `transcript: null` if no speech (only music / silence / image)
  - Transcript in original language, no translation, no timestamps
  - Force JSON — no markdown wrappers
- [ ] Test with all 6 URLs; log raw Gemini response
- [ ] Commit

---

### Step 5 — Worker HTTP API
- [ ] Add route `POST /analyze` in Worker:
  - Body: `{ url: string }`
  - Validate URL format (must contain `drive.google.com`)
  - Call `downloadFromDrive(url)`
  - Call `analyzeWithGemini(buffer, mimeType)`
  - Return `200 { data: AnalysisResult }` or `4xx/5xx { error: string }`
- [ ] Add CORS headers (needed for frontend on different origin during dev)
- [ ] Add basic input validation + error handling (invalid URL, unsupported file type, Gemini API error)
- [ ] Test with `curl` / Postman against deployed Worker
- [ ] Commit

---

### Step 6 — Frontend scaffold
- [ ] `cd frontend && npm create vite@latest` (React + TypeScript)
- [ ] Install deps: nothing extra needed for MVP (plain fetch)
- [ ] Create `.env.local` with `VITE_API_URL=https://<worker>.workers.dev`
- [ ] Confirm `npm run dev` starts locally
- [ ] Commit

---

### Step 7 — Frontend UI
- [ ] Layout: single-page, centered, clean
- [ ] Components:
  - `UrlInput` — text input + "Аналізувати" button
  - `StatusBar` — loading spinner / error message / empty state
  - `PersonTable` — renders 7-row table from `person` object; shows "Людину не знайдено" if `person === null`
  - `TranscriptBlock` — shows transcript text or "Мова відсутня" if `null`
- [ ] States to handle:
  - `idle` — initial empty state
  - `loading` — request in flight (disable button, show spinner)
  - `success` — show table + transcript
  - `error` — show error message with retry option
- [ ] Minimal styling (CSS modules or Tailwind — whichever is faster)
- [ ] Commit

---

### Step 8 — Frontend deploy to Cloudflare Pages
- [ ] Add `wrangler.toml` or use `pages.dev` direct upload
- [ ] Set `VITE_API_URL` as Pages environment variable
- [ ] `npm run build` → deploy via `wrangler pages deploy dist`
- [ ] Verify public URL works end-to-end with all 6 test files
- [ ] Commit

---

### Step 9 — End-to-end test with all 6 creatives
- [ ] Test each URL, note results:

| URL | File type | Person found? | Transcript? | Notes |
|-----|-----------|--------------|-------------|-------|
| `1vd8C8tL...` | ? | ? | ? | |
| `1jITp26v...` | ? | ? | ? | |
| `1RecmQXu...` | ? | ? | ? | |
| `1eFbqsGV...` | ? | ? | ? | |
| `1e6VM-74...` | ? | ? | ? | |
| `1hJGB8OQ...` | ? | ? | ? | |

- [ ] Fix any issues found
- [ ] Document any file that couldn't be processed in README

---

### Step 10 — README
- [ ] Sections:
  - **Архітектурні рішення** — why Cloudflare Workers, why Gemini 1.5 Flash, one-request vs two, structured output approach
  - **Як використовував AI-інструменти** — honest description of Claude Code / other tools used
  - **Що зробив би далі** (якби ще 5 годин): caching, file size limits, batch URLs, better error UX, rate limiting
  - **Тестові файли** — results table from Step 9
- [ ] Commit

---

### Step 11 — Final review & submission
- [ ] Double-check public Worker URL responds
- [ ] Double-check Cloudflare Pages URL loads frontend
- [ ] Repo is public on GitHub
- [ ] README is complete
- [ ] Submit links
