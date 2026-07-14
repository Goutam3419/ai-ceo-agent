# AI CEO Agent — Master Reference Document (Final)

**Purpose:** Single source of truth for architecture, decisions, and roadmap. Use this to keep Claude, GPT, and the owner aligned. No decision here should be silently changed — if something needs to change, flag it explicitly first.

**Repo:** https://github.com/Goutam3419/ai-ceo-agent
**Live URL:** https://ai-ceo-agent.vercel.app
**Stack:** Next.js 14.2.5 (App Router), React 18, TypeScript, Tailwind CSS, Anthropic Claude API, Firebase (Auth, and Firestore to come), Fabric.js, GitHub REST API, Vercel

---

## PART 1 — PERMANENT ARCHITECTURE (never changes)

```
/admin    → Private, owner-only AI CEO console (password-protected)
/site     → Public business website (built/edited by CEO Agent via GitHub)
/rangoli  → Canva-style design platform (public, Firebase Auth login)
```

- `/admin` is the ONLY place the owner talks to the CEO Agent.
- The CEO Agent's website-editing tool (`read_website_file` / `propose_website_change`) touches **real GitHub files** and triggers **real Vercel deployments**, but only after the owner clicks "Confirm & Push."
- Public users (Rangoli, future Website Builder) NEVER get GitHub/Vercel/admin access. Their content lives in Firestore and renders dynamically — never as committed `.tsx` files.

---

## PART 2 — WHAT IS ACTUALLY BUILT TODAY

### `/admin` (CEO Agent console)
- Password login (`ADMIN_PASSWORD` env var, cookie session), protected by `middleware.ts`.
- Chat tab + Dashboard tab (6 team cards: Photo/Video/Audio/Code/Blog/Website — Website card links to `/site`).
- Backend (`app/api/chat/route.ts`): Claude (`claude-sonnet-4-5`) with system prompt + 2 tools:
  - `read_website_file` (via `lib/github.ts`)
  - `propose_website_change` (returns a proposal; actual push happens via `app/api/apply-change/route.ts` only after owner confirms in UI)
- System prompt restricts the agent to only ever writing inside `app/site/` — never `app/admin`, `app/login`, `app/api`, `app/rangoli`.
- No image/video/audio generation tools exist yet. Agent is instructed to say so honestly, never fake it.

### `/site` (public website)
- Still a placeholder page ("website taiyar ho rahi hai") — the CEO Agent has not yet been used end-to-end to build real content here.
- **In progress, not yet delivered/zipped:** a public, unauthenticated chatbot widget (`components/PublicChatWidget.tsx` + `app/api/public-chat/route.ts`) — deliberately has NO tools, cannot edit the site, purely a customer-facing FAQ bot. Code written but not packaged into a zip yet.

### `/rangoli` (design tool)
- Firebase Authentication (email/password). `lib/firebase.ts` initializes **client-side only** (`typeof window !== "undefined"` guard) with try/catch — this was a hard-won fix after two build-breaking incidents (see Part 4).
- Pages: home (search + 4 categories + template grid), login, profile (My Designs/Purchases are stubs), editor (`/rangoli/editor/[id]`).
- 8 starter templates (`lib/rangoli-templates.ts`), 4 categories with authentic platform colors (`lib/rangoli-categories.ts`): YouTube Thumbnail, Instagram Post, Instagram Story, Facebook Post.
- Canvas editor: Fabric.js v5 (dynamic client-only import), mobile-friendly (auto-scaled canvas, large touch handles). Base tools: Text, Image upload, Rectangle, Circle, Delete, 6 BG color swatches, Download PNG.
- **In progress, not yet delivered:** selection-aware properties panel (Duplicate, Bring Forward/Send Backward, font size, fill color, opacity) — handler functions written, toolbar UI not yet added, not zipped/pushed.
- **Not built yet:** Firestore (My Designs persistence), payment for premium templates, more templates (only 8 of a planned larger set).

### Shared infra
- `lib/github.ts` — GitHub Contents API read/write, used only by the admin coding tool.
- `types/fabric.d.ts` — empty module declaration, required because `fabric` ships no TS types (was breaking `next build`'s type check).
- Deployment workflow: owner has no local dev machine — everything happens via **Termux (Android) → `git push --force` → GitHub `main` → Vercel auto-build**. There is no local `npm run dev` in the loop.

---

## PART 3 — ENVIRONMENT VARIABLES (Vercel)

```
ANTHROPIC_API_KEY
ADMIN_PASSWORD
GITHUB_TOKEN
GITHUB_REPO                          = Goutam3419/ai-ceo-agent
GITHUB_BRANCH                        = main
NEXT_PUBLIC_FIREBASE_API_KEY         = (added)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN     = rangoli-app-f042d.firebaseapp.com (added)
NEXT_PUBLIC_FIREBASE_PROJECT_ID      = rangoli-app-f042d (added, per owner)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET  = rangoli-app-f042d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_APP_ID          = 1:1062104010403:web:7560c9b0071b3b6dbc3916
```
Firebase project: `rangoli-app-f042d`, Email/Password sign-in enabled.

---

## PART 4 — HARD-WON LESSONS (do not repeat these mistakes)

1. **Any npm package without bundled TypeScript types breaks `next build`** (happened with `fabric`). Fix: add a `declare module "x"` file under `types/`.
2. **`export const dynamic = "force-dynamic"` does NOT stop Next.js from executing module-level code during the build's page-data-collection phase.** It only affects request-time rendering. If a module throws at import time (e.g., Firebase `getAuth()` with a bad/missing key), the build still crashes even with this flag.
3. **The actual fix for client-only SDKs (Firebase) is to guard initialization behind `typeof window !== "undefined"`, AND wrap it in try/catch**, exposing a `configured: boolean` flag so pages can render a friendly warning instead of a blank white-screen crash when env vars are missing.
4. **Every code change requires a brand new zip**, re-downloaded on the phone, re-extracted in Termux, and re-pushed — old zips left on the phone accumulate as `-1`, `-2`, `-3`... and it's easy to accidentally push a stale one. Always confirm the zip's file size/timestamp with `ls -la` before extracting.
5. The owner's full deploy loop, every time: download zip → `cd ~ && rm -rf ai-ceo-agent` → `unzip <latest>.zip -d ~/ai-ceo-agent` → `cd ~/ai-ceo-agent/ceo-agent-website` → `git add . && git commit -m "..."` → `git push -u origin main --force`.

---

## PART 5 — FINAL ARCHITECTURE DECISIONS (agreed with GPT, fixed unless a technical blocker forces a revisit)

1. **Single AI Agent model.** No real multi-agent orchestration. One Claude API call per request. "Departments" (CEO, Coding, Design, Website, Content, QA) are internal roles inside one system prompt — not separate API calls, not an orchestration framework. Real multi-agent architecture is a Version 2+ discussion only if proven necessary.

2. **Website Builder is fully independent from GitHub.**
   - Owner path: `/admin` → CEO Agent → GitHub → Vercel (unchanged, real files).
   - Public path: User → Firestore (JSON) → dynamic Next.js rendering → public URL. Never touches GitHub, never triggers deployments, never generates `.tsx` files.

3. **Website publishing = Option 2.** Every published user website gets its own public route, e.g. `/site/u/username` or `/site/p/project-id`, rendered dynamically from Firestore data — no repo commits.

4. **Shared Firestore data layer**, designed once, reused by every future module (Website Builder, Marketplace, future apps). Example collections: `users`, `projects`, `templates`, `assets`, `marketplace`, `orders`, `workspaces`, `analytics`, `notifications`. Every project has a `type` field (`website` / `rangoli` / future types). No duplicated schemas per feature.

5. **Firestore Security Rules are designed together with the data model, not postponed.** Order: (1) Shared Data Model → (2) Security Rules → (3) Application Features. Rules:
   - Users read/write only their own projects/designs.
   - Marketplace data publicly readable where appropriate; only owners/admins can modify their own items.
   - Owner-only collections (CEO config, admin settings, GitHub tokens, business analytics) are NEVER accessible to normal users.
   - All sensitive operations validated server-side, never client-side-only.

6. **Git strategy** (replaces the current "force-push straight to main" habit):
   ```
   main      — always production-ready
   develop   — daily development
   feature/* — one branch per feature
   ```
   Flow: build + typecheck + lint + manual review → merge to `develop` → test → merge to `main` → deploy. Gives an actual rollback path.
   *(Note: this is a process change from the owner's current Termux workflow and will need new git commands taught step-by-step when adopted.)*

7. **Small iterations only.** No milestone is one giant implementation. Every milestone splits into small tasks, each with its own commit (e.g., Website Builder → Task 1: Workspace Layout → commit → Task 2: Canvas → commit → ...).

8. **Persistent CEO memory** (future work): project goals, completed/pending tasks, brand identity, design system, business rules, long-term plans — stored separately from raw chat history, not yet implemented.

9. **One global design system**, defined before large UI work starts (typography, spacing, colors, icons, buttons, cards, inputs, animations, glass effects, gradients, shadows). Every module reuses it — no parallel/duplicate UI styles.

10. **Core principle:** Quality and long-term maintainability outrank feature count or speed. One coding convention, one architecture, no parallel implementations, no conflicting patterns.

---

## PART 6 — DIVISION OF LABOR (agreed)

- **Claude (this assistant)** = primary implementation engineer. Writes/modifies all production code, handles debugging, the Termux/GitHub/Vercel deployment workflow.
- **GPT** = System Architect, Technical Reviewer, Product Planner, Feature Designer, Security Reviewer, Scalability Reviewer, Long-term Architecture Advisor.
- **Flow for any new feature:** GPT finalizes architecture/strategy → Claude implements inside the existing codebase → Claude handles debugging/deployment → GPT reviews major architectural decisions as needed.
- If Claude believes a decision should change due to practical implementation constraints, **say so before changing it** — never change silently.

---

## PART 7 — CONSOLIDATED ROADMAP (deduplicated from the original 20 phases)

The original 20-phase plan had heavy duplication (Command Center built 4x across phases 3/7/12/19, Marketplace 2x across 8/18, Website Builder 2x across 5/17, Agent/Department concept 3x across 7/12/14). Agreed consolidated priority order:

1. **AI CEO Admin** — mature the existing console (CEO "thinking" process, project memory, task tracking) — extend, don't rebuild.
2. **Public Website (`/site`)** — make it real; first true end-to-end test of the CEO Agent building actual pages. Ship the pending public chatbot widget.
3. **Rangoli Editor** — upgrade in place (layers, undo/redo, more shape/text tools) — this is Phase 6's *core*, done once, not rebuilt as "2.0" later.
4. **Template Gallery** — extend within Rangoli (more templates, better search/filter) — not a separate module.
5. **Website Builder** — the owner's highest-priority long-term feature. Built once, scalable from day one (drag & drop, block library, components, theme system, responsive editing, animations, AI assistant, export, template system). Firestore-based, GitHub-independent (see Part 5, decision 2).
6. **Marketplace** — start only once Website Builder is stable. One implementation, not rebuilt later as "v2".
7. **AI Content Studio** — architecture/placeholders only until real providers (Replicate, ElevenLabs, etc.) are connected. Never fake generation.
8. **Automation** — realistic AI "agent" set to start: CEO, Coding, Design, Website, Content, QA (5–6 roles, not 21) — internal roles per Part 5 decision 1, not separate API calls.
9. **Analytics** — one dashboard, reused/extended, not rebuilt across multiple phases.
10. **Developer Platform** — lowest priority; only if time/need remains.
11. **Final Production Polish** — audit, performance, accessibility, security review, documentation, before calling it v1.0. Explicitly wait for owner approval before any v2.0 work.

**Immediate next step per this plan:** Firestore shared data model + security rules design, before any Website Builder work begins.

---

## PART 8 — OPEN ITEMS / NOT YET DECIDED

- Payment provider for Rangoli/Marketplace premium content — Razorpay was mentioned as the likely choice (India-focused) but not finalized or integrated.
- Which AI providers to connect first for image/video/audio (Replicate mentioned as the likely low-cost, no-self-hosting option) — not yet decided or purchased.
- Exact Firestore collection schemas — agreed in principle (Part 5, decision 4) but not yet designed field-by-field.
- Whether/when to migrate off the current "force-push to main" workflow to the branch strategy in Part 5 decision 6 — agreed in principle, not yet adopted in practice.
