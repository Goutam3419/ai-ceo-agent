# Project Status Report — AI CEO Agent Website

**Purpose of this document:** Full technical snapshot of what has been built so far, for planning next steps.

**Repo:** https://github.com/Goutam3419/ai-ceo-agent
**Live URL:** https://ai-ceo-agent.vercel.app
**Stack:** Next.js 14.2.5 (App Router), React 18, TypeScript, Tailwind CSS, Anthropic Claude API, Firebase Auth, Fabric.js, GitHub REST API
**Hosting:** Vercel (auto-deploys from GitHub `main` branch)

---

## 1. High-Level Concept

A single Next.js project hosting three separate products under one domain:

| Route | Purpose | Access |
|---|---|---|
| `/admin` | Private chat console — owner talks to "CEO Agent" (Claude-powered) to manage the business/site | Password-protected (single owner) |
| `/site` | Public business website — intended to be built/edited BY the CEO Agent itself via chat commands | Public, no login |
| `/rangoli` | A separate Canva-like design tool product (templates for YouTube/Instagram/Facebook, canvas editor) | Public, requires user signup/login (Firebase Auth) |

The core idea: the owner never touches code. They chat with the CEO Agent in `/admin`, and the agent proposes code changes to the live website, which the owner approves via a "Confirm & Push" button.

---

## 2. `/admin` — CEO Agent Console

- Single-owner login via a password stored in `ADMIN_PASSWORD` env var (simple cookie-based session, not OAuth).
- `middleware.ts` protects `/admin`, `/api/chat`, `/api/apply-change` — redirects unauthenticated requests to `/login`.
- Chat UI (`app/admin/page.tsx`): two tabs — **Chat** and **Dashboard**.
  - **Chat tab:** message list, 4 category chips (Image/Video/Coding/Blogging) the owner can tag a message with, text input.
  - **Dashboard tab:** grid of 6 "team" cards (Photo, Video, Audio, Code, Blog, Website) showing status. The "Website" card links to `/site`.
- Backend (`app/api/chat/route.ts`): calls Claude (`claude-sonnet-4-5`) with a system prompt defining the "CEO Agent" persona, and gives it **two tools**:
  1. `read_website_file` — reads a file from the GitHub repo (via `lib/github.ts`, using `GITHUB_TOKEN`/`GITHUB_REPO`/`GITHUB_BRANCH`).
  2. `propose_website_change` — does NOT push to GitHub directly. It returns a proposed `{path, content, commit_message, explanation}` back to the frontend.
- The frontend shows the proposal as a card with **Confirm & Push** / **Reject** buttons. Confirm calls `app/api/apply-change/route.ts`, which pushes the file to GitHub via the GitHub Contents API. Vercel then auto-deploys.
- System prompt explicitly instructs the agent: all public website pages must live under `app/site/` only; it must never touch `app/admin`, `app/login`, `app/api`, or `app/rangoli`.
- **No image/video/audio generation tools exist yet** — the agent is instructed to be honest about this and not fake capabilities.

## 3. `/site` — Public Website (placeholder stage)

- Currently just a placeholder page (`app/site/page.tsx`) saying "website taiyar ho rahi hai" — the CEO Agent is meant to build real pages here via the tool above, but this hasn't been tested end-to-end yet (blocked on Anthropic billing credit at one point).
- **Latest addition (not yet in a delivered zip — see Section 6):** a floating public chatbot widget (`components/PublicChatWidget.tsx`) calling a new **public, unauthenticated** endpoint `app/api/public-chat/route.ts`. This endpoint deliberately has NO tools (no file read/write) — it's a customer-facing FAQ-style bot, separate from the powerful admin agent, for security (random site visitors must not be able to trigger website edits).

## 4. `/rangoli` — Canva-style Design Tool (separate product/brand)

- Own visual identity: Poppins (display) + Inter (body) fonts, distinct color tokens (`rangoli`, `rangolibg`, `rangoliink`, `rangolisoft`, plus authentic per-platform colors `ytred`/`igpink`/`fbblue`).
- **Auth:** Firebase Authentication (email/password). `lib/firebase.ts` initializes Firebase **client-side only** (`typeof window !== "undefined"` guard) — this was a hard-won fix; initializing Firebase during Next.js's build-time static prerendering was crashing the Vercel build with `auth/invalid-api-key` when env vars weren't set yet. Now it fails gracefully (shows a "Firebase not configured" message) instead of crashing.
- Pages: `/rangoli` (home — search, 4 categories, template grid with Free/Pro badges), `/rangoli/login` (signup/login form), `/rangoli/profile` (basic info, My Designs/Purchases stubs, logout), `/rangoli/editor/[id]` (the canvas editor).
- **Templates:** `lib/rangoli-templates.ts` — 8 hand-written starter templates (2 per category) as Fabric.js JSON objects, mix of free/premium (premium is just a visual badge — no payment gate implemented yet).
- **Categories:** `lib/rangoli-categories.ts` — YouTube Thumbnail (1280×720), Instagram Post (1080×1080), Instagram Story (1080×1920), Facebook Post (1200×630).
- **Canvas editor:** Fabric.js v5, loaded via dynamic `import("fabric")` (client-only, since Fabric needs `document`). Mobile-friendly: canvas auto-scales to container width, large touch-friendly corner handles (`cornerSize: 22`).
  - Base toolset (delivered): Add Text, Add Image (file upload), Add Rectangle, Add Circle, Delete, 6 background color swatches, Download as PNG.
  - **In-progress upgrade (not yet zipped):** a selection-aware properties panel — Duplicate, Bring Forward/Send Backward (layering), font-size +/- for text objects, fill-color swatches, opacity control. Selection tracked via Fabric `selection:created/updated/cleared` events into React state. Code for the handler functions has been written; the actual UI panel JSX to expose these controls in the toolbar has **not yet been added or packaged into a zip**.
- **Not yet built:** Firestore database (for saving designs / "My Designs"), payment integration (Razorpay planned) for premium templates, more templates (only 8 of a planned ~100).

## 5. Shared Infrastructure

- **`lib/github.ts`:** `readRepoFile(path)` / `writeRepoFile(path, content, commitMessage)` using GitHub REST Contents API with a fine-grained PAT (`GITHUB_TOKEN`). Used only by the admin coding tool.
- **`types/fabric.d.ts`:** empty `declare module "fabric"` — needed because `fabric` has no bundled TypeScript types, which was breaking the Vercel build (`next build` type-checks by default).
- **Deployment flow the owner uses:** builds happen only through Termux (Android) → `git push --force` to GitHub `main` → Vercel auto-builds. There is no local dev server in play; everything is edited by Claude, zipped, manually transferred via Termux, and pushed.

## 6. Environment Variables (Vercel)

Confirmed added by the owner so far:
```
ANTHROPIC_API_KEY
ADMIN_PASSWORD
GITHUB_TOKEN
GITHUB_REPO        = Goutam3419/ai-ceo-agent
GITHUB_BRANCH      = main
NEXT_PUBLIC_FIREBASE_API_KEY          = AIzaSy... (added)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN      = rangoli-app-f042d.firebaseapp.com (added)
NEXT_PUBLIC_FIREBASE_PROJECT_ID       = rangoli-app-f042d  (— being added, in progress)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   = rangoli-app-f042d.firebasestorage.app (not yet confirmed added)
NEXT_PUBLIC_FIREBASE_APP_ID           = 1:1062104010403:web:... (not yet confirmed added)
```
Firebase project: `rangoli-app-f042d`, Email/Password sign-in method enabled in Firebase Console.

## 7. Known Issues / Unverified at Time of Writing

- Rangoli login has not yet been successfully tested end-to-end on the live site (Firebase env vars were still being entered one-by-one into Vercel).
- `/site` homepage generation by the CEO Agent (the "confirm & push" flow) has not been confirmed working end-to-end by the owner yet — it was blocked earlier by Anthropic account having zero credit balance; unclear if since resolved.
- The three most recent build failures (in order, all fixed) were:
  1. `fabric` module had no TypeScript types → fixed with `types/fabric.d.ts`.
  2. Firebase `getAuth()` was throwing at build/prerender time because it was imported/executed even on pages marked `export const dynamic = "force-dynamic"` (that flag does NOT prevent module-level code from running during Next's page-data-collection phase) → fixed by guarding Firebase init behind `typeof window !== "undefined"`.
  3. Even after that, an intermittent blank white screen occurred on `/rangoli` — root cause: Firebase keys still not present in Vercel at the time, causing `getAuth()` to throw synchronously in the browser too (uncaught, since not yet wrapped in try/catch) → most recent fix wraps init in try/catch and exposes a `firebaseConfigured` flag so pages render a friendly warning instead of a blank crash.
- **Payment/premium unlock for Rangoli templates is not implemented** — badges are cosmetic only right now.
- **No Firestore yet** — "My Designs" and "My Purchases" in the Rangoli profile page are static placeholders ("Coming soon").

## 8. In-Progress, Not Yet Delivered to Owner (exists only in this session's sandbox)

The owner asked for three things before this report was requested, and this work was started but **not finished/packaged**:
1. Public chatbot widget on `/site` (component + safe public API route) — code written.
2. Premium visual polish pass (gradients, hover/press animations, fade-in transitions) applied to `/admin` and `/rangoli` home — code written.
3. Rangoli canvas editor upgrade (duplicate, layer ordering, font size, fill color, opacity) — **handler functions written, but the actual toolbar UI to expose these controls to the user was not yet added**, and none of this has been zipped or pushed to GitHub yet.

## 9. Suggested Next Steps (for planning)

- Finish and ship the in-progress work in Section 8.
- Verify Rangoli login end-to-end once all 5 Firebase env vars are confirmed in Vercel.
- Verify the `/site` agent-driven page generation end-to-end.
- Decide on payment provider integration for Rangoli premium templates (Razorpay was discussed for India).
- Add Firestore for persisting Rangoli user designs.
- Decide whether to build additional CEO Agent tools (image/video/audio generation) and which providers (Replicate was discussed as the likely choice for open-source models via API, no self-hosting).
