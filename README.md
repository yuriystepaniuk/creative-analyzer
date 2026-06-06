# Creative Analyzer

A tool for a performance marketing team (dating vertical). Accepts a Google Drive URL with an image or video, analyzes the creative via Gemini 2.5 Flash, and returns 7 person parameters for the subject in focus + speech transcript.

---

## Deploy

**Backend (Cloudflare Workers)**
```bash
npm run deploy:backend
```

**Frontend (Cloudflare Pages)**
```bash
npm run deploy:frontend
```

On first run, wrangler will prompt for a project name — use `creative-analyzer-frontend`. After deploy, set the environment variable in Cloudflare Dashboard → Workers & Pages → creative-analyzer-frontend → Settings → Environment Variables:
```
VITE_API_URL = https://creative-analyzer.<your-subdomain>.workers.dev
```
Then redeploy so the variable is picked up by the build.

---

## Architectural decisions

**Cloudflare Workers + Hono** — instead of Node.js/Express. Workers deploy in seconds, have no cold start for lightweight tasks, and natively support the `fetch` API. Hono was chosen for its minimal overhead and TypeScript-first design.

**Gemini 2.5 Flash** — multimodal model that accepts images and video directly as `inline_data` (base64). Structured output via `responseSchema` guarantees valid JSON without parsing free text. Temperature 0.1 gives deterministic, predictable results.

**Google Drive as file source** — the team already stores creatives on Drive. Instead of a separate upload pipeline, users just paste a link. The backend handles the redirect chain and confirms the virus-scan page for large files automatically.

**Layered backend architecture:** `routes → services → api + validation + helpers + constants`. Each layer has a single responsibility. `api/` is HTTP only. `helpers/` are pure functions with no side effects. `validation/` checks rules at system boundaries. Errors are typed (`ValidationError`, `DownloadError`, `GeminiError`) and carry their HTTP status.

**React + Vite + CSS Modules** — no UI libraries. Each component lives in its own folder with a co-located `.module.css`. State is managed in a single `useAnalyze` hook; components are purely presentational.

---

## How I used AI tools

Claude Code was the primary tool throughout the session — both for code generation and as a substitute for documentation on an unfamiliar stack.

**Planning upfront**
Before writing any code, I worked through the task with Claude: what exactly needs to be built, what was unclear (the person parameters weren't fully specified in the brief — had to clarify), which stack fits and why. Then broke it into atomic steps and worked through them in order. This gave a clear picture of dependencies between parts before writing the first line.

**Learning new tools through questions**
Cloudflare Workers, Hono, and the Gemini API were all new to me. Instead of reading docs linearly, I asked specific questions: how to set up CORS in Hono, how to pass secrets via `.dev.vars`, what the `responseSchema` looks like for structured output in Gemini. This is faster than finding the right section in the docs, but carries a risk — AI can answer based on an outdated API version. That's exactly what happened: I started with `gemini-2.0-flash`, which turned out to be deprecated. Only noticed when I got a runtime error.

**Debugging via screenshots**
When an error was hard to describe in text, I dropped a screenshot directly into the chat. For example, the frontend was showing `Unexpected token 'I', "Internal S"... is not valid JSON` — the screenshot explained the context better than a description would. Same with the deprecated model error: screenshot of the console → immediate solution.

**Where I got stuck**
The most time went into the Google Drive download pipeline. Drive doesn't return a file directly — large files land on an HTML confirmation page (virus scan), requiring token extraction and a second request. There's no official documentation for this, only community workarounds. I described the behavior to Claude and we worked through the three different response formats Drive uses depending on file size.

Second was Hono error handling. Intuitively I wrote `app.use("*", errorMiddleware)`, but that doesn't catch errors thrown inside route handlers. The correct way is `app.onError()`. Found it through debugging: the middleware was being called, but errors still came back as plain 500s without my format.

**Refactoring and code review**
Once the code was working, I asked Claude to review specific files and explain what could be improved. I didn't just accept the changes — I worked through why: where the boundary between layers sits, what belongs in a helper vs. the API layer, how to handle errors correctly in Hono. It took more time than just saying "make it better," but gave real understanding.

---

## What I'd do next (given 5 more hours)

**Database and result caching**
Add Cloudflare D1 (edge SQLite) to store analysis results keyed by `fileId` (extracted from the URL). On each new request — check the DB first: if a record exists, return the result instantly without downloading the file or calling Gemini. This eliminates duplicate work: if two team members analyze the same creative, Gemini is called only once and all subsequent requests are free. Google Drive `fileId` is stable — one file, one ID — so the cache stays valid.

The DB also enables filtering — pull stored creatives by parameter (`ethnicity`, `gender`, `age`, `activity`, etc.), build summary tables, compare creative pools.

**Batch analysis with streaming**
Accept multiple URLs at once. Show results as they complete via Server-Sent Events — no waiting for all to finish, each request's progress is visible in real time.

**Language switcher**
UA / EN toggle (possibly more) via `i18n`. The Gemini prompt adapts to the selected language so parameter values arrive already localized.

**Light / dark theme**
CSS custom properties with `prefers-color-scheme` as the default, plus a manual toggle.
