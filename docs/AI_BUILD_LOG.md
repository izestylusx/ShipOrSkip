# ShipOrSkip — AI Build Log

> **Hackathon:** Good Vibes Only: OpenClaw Edition (BNB Chain)  
> **Builder:** @tubagus  
> **AI Tools Used:** GitHub Copilot (Claude Sonnet 4.6), Grok-4 / xAI, Kimi K2.5 / Moonshot, Gemini 2.0 Flash  
> **Build Period:** 14–19 Feb 2026  
> **Reconstruction Method:** Derived from final codebase structure, file contents, and delivery artifacts.

---

## How AI Was Used

ShipOrSkip was built almost entirely with AI assistance. The human role was **direction and judgment** — deciding scope, selecting data sources, reviewing outputs, and running the acceptance test on each deliverable. AI handled implementation.

### Workflow per component

```
1. Human defines the problem + acceptance criteria
2. AI generates first implementation
3. Human tests + identifies failures
4. AI iterates (bug fix / improvement)
5. Human commits when acceptance criteria met
```

**Human-owned:** Architecture decisions, data source selection, API key setup, prompt engineering direction, UX review, deployment execution, submission.  
**AI-owned:** All code generation, all documentation, enrichment logic, scoring formulas, contract code, component implementation, copy.

---

## Build Log (by Component)

> Reconstructed from final codebase working backwards. Days are approximate.

---

### Phase 1 — Planning & System Architecture (Day 0, Pre-build)

Before writing any code, AI generated the full system design blueprint.

| Deliverable | Output |
|-------------|--------|
| Problem framing | Vibecoding paradox: tools make building fast, but no intelligence layer → builders repeat failed patterns |
| Solution architecture | Two-tier: VPS pipeline (data) + VPS frontend (Next.js). Separation justification: pipeline spikes CPU every 12h, must not impact 90s AI validation timeout |
| 13-factor scoring model | Category-adaptive weights per project type (DeFi/Gaming/Infrastructure/Social/Meme with token vs no-token variants). 7 weight profiles total |
| Data source mapping | Identified 7 enrichment sources and their failure modes. Fallback chain: primary → secondary → local JSON |
| Frontend page map | Landing (trust + evidence), Explorer (filter/sort/search), Detail (scores + post-mortem), Validator (async AI + onchain proof) |
| Design system | Color tokens, typography scale, spacing system, Tailwind v4 integration, accessibility guide — `design-system/` (7 files) |
| Submission docs scaffolded | `README.md`, `docs/PROJECT.md`, `docs/TECHNICAL.md`, `docs/PRD-MVP.md` |

**Approx output:** ~7,000 lines of planning + design documents. All AI-generated from human-defined problem statement.

---

### Phase 2 — Data Pipeline: Discovery + Enrichment (Days 1–3)

The core data asset: 1,600+ BNB Chain projects discovered from public APIs, curated down to 111 representative projects, each enriched from up to 7 data sources.

#### 2a. Project Discovery

| Module | What It Does |
|--------|--------------|
| `pipeline-v2-public/src/pipeline/collector.ts` | Discovers BNB Chain projects from CoinGecko `/coins/markets` with BSC filter. Resolves token addresses. Rate-limited with configurable delays |
| `pipeline-v2-public/src/sources/defillama.ts` | Discovers protocols from DeFiLlama `/protocols`. Extracts BSC-native entries. Generates both alive cohort (TVL≥$500K) and zombie cohort (TVL<$10K with token) for contrast dataset |

**Key engineering problem solved:** DeFiLlama returns chain-prefixed addresses (`bsc:0x...`, `arbitrum:0x...`). Added `extractBscAddress()` helper to strip prefix, filter non-BSC chains, handle multi-chain formats.

#### 2b. Multi-Source Enrichment

Each project goes through a parallel enrichment cascade via modular source adapters in `pipeline-v2-public/src/sources/`.

| Module | Source | Data Extracted |
|--------|--------|----------------|
| `sources/coingecko.ts` | CoinGecko API | Market cap, 30d price trend, community size (Telegram, watchlist count), developer activity (commits), sentiment score. **Also corrects wrong token addresses** from `platforms["binance-smart-chain"]` field |
| `sources/moralis.ts` | Moralis Web3 API | Token holder count, top-holder concentration, 24h transfer activity, contract verification |
| `sources/defillama.ts` | DeFiLlama `/protocol/{slug}` | Real TVL history per protocol, monthly snapshots, peak TVL |
| `sources/twitter.ts` | Grok / xAI x_search | Twitter follower count, last post date, engagement signals, whale movement patterns |
| `pipeline/enricher.ts` | Orchestrator | Coordinates all source adapters in parallel with retry logic and rate limiting |
| `pipeline/resolver.ts` | Token Resolver | 2-layer cascade: CoinGecko platforms field → Moralis contract verification |

**Key bug fixed:** 14 seed projects had wrong BSC token addresses. CoinGecko's `platforms["binance-smart-chain"]` field is the most reliable address source — enrichment module now auto-corrects these.

**Key bug fixed:** Symbols showing as "Cake-LP" (PancakeSwap LP pair) instead of project token. Root cause: DexScreener returns LP pairs when the project's own token has low liquidity. Fix: use CoinGecko `symbol` field as primary, DexScreener as fallback.


#### 2c. Curation & Orchestration

| Module | What It Does |
|--------|--------------|
| `pipeline/orchestrator.ts` | Coordinates the full pipeline: discovery → enrichment → scoring → analysis → storage. Manages pipeline state and step sequencing |
| `pipeline/store.ts` | Persists enriched + scored projects to PostgreSQL via Prisma. Handles upsert logic and data validation before write |
| `pipeline/analyzer.ts` | AI-powered post-mortem analysis for dead/zombie projects. Generates narrative explanations of failure patterns |

**Result:** 111 curated projects across 9 categories. 21 alive / 84 zombie / 6 dead. Scores range 29–71. Stored in PostgreSQL, served via Express API.

---

### Phase 3 — Scoring Engine (Day 3)

**Directory:** `pipeline-v2-public/src/scoring/` (3 modules: `factors.ts`, `weights.ts`, `signals.ts`)

The scoring engine is the analytical core of ShipOrSkip. It aggregates enrichment data into a single 0–100 survival score.

| Design Decision | Detail |
|-----------------|--------|
| **13 scoring factors** | `tvlRetention`, `txTrend`, `priceTrend`, `tokenQuality`, `contractActivity`, `holderQuality`, `liquidityDepth`, `communityEngagement`, `marketRelevance`, `devActivity`, `ecosystemFit`, `narrativeMomentum`, `contractFlags` |
| **7 weight profiles** | `defi_token`, `defi_notoken`, `gaming_token`, `gaming_notoken`, `infrastructure`, `social`, `meme`. Each category weights factors differently (DeFi = TVL-heavy, Gaming = community-heavy, Meme = narrative-heavy) |
| **`NULL_SCORE = -1` sentinel** | If enrichment data is missing for a factor, score is -1 (excluded from weighted average). Missing data does NOT penalize — projects scored on available evidence only. This single decision improved score accuracy significantly |
| **`classifyStatus()`** | Classifies each project as `alive / zombie / dead / pivoted` using NodeReal transfer recency, DexScreener 24h activity, CoinGecko volume, and DeFiLlama TVL trend — NOT user-reported data |
| **Category inference** | `src/lib/category-inference.ts` — resolves free-text idea input to one or more weighted scoring categories. Handles aliases, compound categories, misspellings |

---

### Phase 4 — Frontend (Days 1–4)

Built with Next.js 14 App Router, Tailwind CSS, design system tokens.

#### 4a. Pages

| Page | Key Features |
|------|--------------|
| `/` Landing | TrustStrip (logos + social proof), StatsBar (animated counters from live Supabase stats), EvidenceSection (real dead project case studies), floating mobile Validate CTA |
| `/projects` Explorer | FilterBar (category + status), search (name/description), sort (score, status, category), ProjectCard with score badge, SkeletonCard loading state, EmptyState for zero results |
| `/projects/[slug]` Detail | ScoreBreakdown (factor-by-factor visual), MetricsTable (enrichment data table), PostMortemPanel (AI-generated narrative for dead/zombie), PipelineMetrics (data sources used), RelatedProjects (same category) |
| `/validate` Validator | Async AI validation flow, ValidationHistory (last 10 validations from localStorage), mobile fullscreen result overlay |

#### 4b. Components (35+ total)

| Group | Components |
|-------|------------|
| **Navigation** | `Nav.tsx` (hamburger mobile), `Footer.tsx` (global via RootLayout) |
| **Home** | `TrustStrip.tsx`, `StatsBar.tsx`, `EvidenceSection.tsx` |
| **Explorer** | `FilterBar.tsx`, `ProjectCard.tsx`, `SkeletonCard.tsx`, `EmptyState.tsx` |
| **Project Detail** | `ScoreBreakdown.tsx`, `MetricsTable.tsx`, `PostMortemPanel.tsx`, `PipelineMetrics.tsx`, `RelatedProjects.tsx` |
| **Validator** | `IdeaInput.tsx`, `ExampleChips.tsx`, `LoadingTheater.tsx`, `LoadingOverlay.tsx`, `ValidationResult.tsx`, `PostResultActions.tsx`, `FeedbackRow.tsx`, `ValidationHistory.tsx`, `TrendAnalysisPanel.tsx`, `EcosystemIntelPanel.tsx`, `RedditIntelPanel.tsx` |
| **Hooks** | `useValidationHistory.ts` |
| **Lib utilities** | `score-color.ts`, `exportMarkdown.ts`, `exportPng.ts`, `category-inference.ts`, `ecosystem-stats.ts` |

#### 4c. Data Layer

| File | Role |
|------|------|
| `src/lib/data.ts` | Primary data access layer. Fetches from VPS Pipeline API first, falls back to local `data/projects.json`. ISR-aware |
| `src/lib/pipeline-api.ts` | REST client for VPS at `207.148.9.29:4000`. 8s timeout with local JSON fallback |
| `src/lib/pipeline-mapper.ts` | Maps VPS pipeline response schema → frontend `ProjectData` type |
| `src/lib/ecosystem-stats.ts` | Aggregates category survival rates, death patterns, and ecosystem-wide stats. Used as grounding context for AI validation prompts |

---

### Phase 5 — AI Validation Layer (Days 2–5)

The validator is the most complex subsystem. It uses a **dual-oracle architecture** with async job execution to stay within Vercel function limits.

#### 5a. Architecture

```
POST /api/validate  →  createJob() → { jobId }
                        ↓ async background
                    ┌── getValidationIntel()      [Grok: X/Twitter via x_search]
                    ├── getRedditCommunityIntel() [Kimi: Reddit/web via $web_search]
                    └── (parallel)
                        ↓
                    getKimiValidationVerdict()  [Kimi K2.5: PMF score + reasoning]
                    (fallback: getValidationVerdict() Grok-4-reasoning)
                        ↓
                    recordValidation()  [Supabase persist]
                    completeJob()

GET /api/validate/status?jobId=xxx  →  poll, returns step + result when done
```

**Why async jobs:** Grok `x_search` + Kimi `$web_search` calls take 30–90s. Vercel has a 10s function timeout. The async job system (POST → jobId → GET poll) solves this completely.

#### 5b. AI Integrations

| File | Model | Role |
|------|-------|------|
| `src/lib/grok-api.ts` (554 lines) | Grok-4.1 / xAI | **X/Twitter Intel:** Uses `/v1/responses` API with `x_search` tool to fetch live real-time signals from X (`grok-4-1-fast-non-reasoning`). **Primary verdict:** `grok-4-1-fast-reasoning` generates PMF score (0-100), signal (SHIP / SHIP_WITH_CAUTION / HIGH_RISK), death patterns, biggest risks, edge required |
| `src/lib/kimi-api.ts` (478 lines) | Kimi K2.5 / Moonshot | **Reddit/Web Intel only:** Uses `$web_search` tool to surface community discussions, builder complaints, and forum patterns. 30s timeout — non-blocking bonus data, not critical path |
| `src/app/api/validate/route.ts` (791 lines) | Orchestrator | Manages job lifecycle. Runs Grok intel + Kimi reddit intel in parallel. Builds a unified context object passed to Grok verdict. Handles all error states and fallback paths |

#### 5c. Prompt Engineering

The verdict prompt includes:
- Ecosystem intelligence from our own database (e.g., "32% of DeFi projects in our dataset are zombie, avg PMF 41/100")
- 3 most similar existing projects from our dataset with their actual survival outcomes
- Live X/Twitter signals from Grok (what the market narrative is saying right now)
- Live Reddit/web signals from Kimi (what builders are saying in forums — bonus intel, non-blocking)
- Category-specific death pattern library derived from our scored dataset

This makes the prompt **impossible to replicate** by asking a general AI — it requires our specific curated dataset and real-time dual-source intel.

#### 5d. Other Validation APIs

| Route | Description |
|-------|-------------|
| `GET /api/validate/stats` | Aggregate community stats: total validations, category breakdown, avg PMF, top death patterns. Powered by Supabase `ValidationRecord` table |
| `GET /api/validate/history` | Recent community validations (anonymized). Powers social-proof feed on Validator page |
| `GET /api/validate/status?jobId=` | Polls async job status. Returns step progress (`queued → intel → reddit_intel → verdict → done`) and result when complete |

---

### Phase 6 — Smart Contract & Onchain Proof (Day 4)

**File:** `contracts/ShipOrSkipScoreboard.sol`

| Item | Detail |
|------|--------|
| **Contract** | `ShipOrSkipScoreboard.sol` — stores survival scores (0–100) for projects, builder idea attestation hashes (with on-chain nonce to prevent front-running), and ecosystem snapshots |
| **Public composability** | Any protocol can query scores via `getProject(slug)`, `getIdeaRecord(builder)`, `getLastSnapshot()`. Designed to be a shared public good for the BNB ecosystem |
| **Tests** | 15/15 Hardhat tests passing across deploy, register, submitIdea, snapshot, and access-control scenarios |
| **BSC Mainnet** | Contract: `0xd6a229D8cFbde4be596dd9Cd53d1b3E8bD272432` |
| **Proof tx** | `0x4afe87ab4df35e14ca0f91adaac35061b31d8da438dd9b66c8468a1f18deef58` |
| **Registered** | 111 project scores + 1 ecosystem snapshot written on-chain |
| **`submitIdea()` flow** | Builder connects wallet → signs tx → idea hash (keccak256 of description) written to contract. Tx hash shown in validator result → proof of validation timestamp |

**Onchain scripts** (`onchain/scripts/`):
- `deploy-scoreboard.js` — deploys contract, writes initial snapshot
- `register-scoreboard.js` — batch registers project scores from `data/projects.json`
- `submit-idea.js` — test submission script
- `update-snapshot.js` — refreshes ecosystem snapshot after pipeline re-run

---

### Phase 7 — Database & Persistence (Day 5)

**File:** `prisma/schema.prisma`, `src/lib/validation-store.ts`, `src/lib/prisma.ts`

| Component | Detail |
|-----------|--------|
| **Database** | Supabase PostgreSQL via Prisma ORM |
| **Model: `ValidationRecord`** | Persists every anonymous validation: `category`, `signal`, `pmfScore`, `ideaDescription`, `targetUsers`, `recommendation`, `biggestRisk`, `deathPatterns`, `edgeNeeded`, `timingAssessment`, `analysisMode` (ai / fallback) |
| **Why this matters** | Creates a data moat: after 100+ validations, stats like "DeFi ideas avg PMF 38/100, 72% HIGH_RISK" are real community intelligence. Cannot be replicated by asking a general AI |
| **`validation-store.ts`** | `recordValidation()`, `getValidationAggregateStats()`, `getSimilarIdeaCount()`, `flushValidationStore()`. Designed for serverless: no PII, Prisma connection pooling via Supabase |

---

### Phase 8 — VPS Pipeline Backend (Day 5)

**Directory:** `pipeline-v2-public/`

The backend pipeline that runs autonomously on VPS B (Docker + PostgreSQL). Refreshes project data every 12 hours.

| Module | File | Role |
|--------|------|------|
| **Scheduler** | `src/scheduler.ts` | Cron: runs full pipeline every 12h. Handles concurrency lock so overlapping runs don't conflict |
| **Pipeline orchestrator** | `src/index.ts` + `src/pipeline/` | Coordinates discovery → enrichment → scoring → AI analysis → DB upsert |
| **Scoring** | `src/scoring/` | Production version of the scoring engine (TypeScript, runs against PostgreSQL, not local JSON) |
| **Sources** | `src/sources/` | Modular enrichment source adapters. Each source is independently retryable |
| **API** | `src/api/` | Express REST API exposing `/api/v1/projects`, `/api/v1/stats` for frontend consumption |
| **Config** | `src/config.ts` | Rate limits, retry strategies, cache TTLs per source |
| **Docker** | `Dockerfile` + `docker-compose.yml` | Production deploy: Node.js app + PostgreSQL. Persistent volume for DB. `docker-compose up -d` to launch |

---

### Phase 9 — Final Polish & Submission (Day 5–6)

| Task | Detail |
|------|--------|
| **ISR + revalidation** | `GET /api/revalidate` triggers on-demand ISR cache purge for project pages when pipeline refreshes data |
| **Export functions** | `exportMarkdown.ts` — generates shareable `.md` validation report. `exportPng.ts` — html2canvas screenshot of result card for social sharing |
| **`score-color.ts`** | Semantic color utility mapping score ranges to brand tokens. Used across `ScoreBreakdown`, `ProjectCard`, `ValidationResult` |
| **`EcosystemIntelPanel`** | Shows per-category survival stats from our own dataset inside the validator result. Death rate, top death patterns, category narrative |
| **Contract verification** | `npx hardhat verify --network bsc 0xd6a229...2432` — contract source verified on BscScan |
| **Docs finalized** | `README.md`, `docs/PROJECT.md`, `docs/TECHNICAL.md` reviewed and submission-ready |
| **`pipeline-v2-public/`** | Public version of backend pipeline prepared for repo. Internal proprietary discovery logic replaced with documented public API equivalents |

---

## Complete File Map

```
src/
  app/
    page.tsx                        ← Landing page
    layout.tsx                      ← RootLayout (Nav + Footer)
    globals.css                     ← Design tokens
    projects/
      page.tsx                      ← Explorer
      [slug]/page.tsx               ← Project detail
    validate/
      page.tsx                      ← Validator page
    api/
      validate/
        route.ts                    ← Main validation orchestrator (801 lines)
        status/route.ts             ← Job status polling
        history/route.ts            ← Community validation history
        stats/route.ts              ← Aggregate stats
      revalidate/route.ts           ← ISR cache invalidation
  components/
    Nav.tsx / Footer.tsx
    home/  TrustStrip, StatsBar, EvidenceSection
    projects/  FilterBar, ProjectCard, SkeletonCard, EmptyState
    project-detail/  ScoreBreakdown, MetricsTable, PostMortemPanel, PipelineMetrics, RelatedProjects
    validator/  IdeaInput, ExampleChips, LoadingTheater, LoadingOverlay,
                ValidationResult, PostResultActions, FeedbackRow,
                ValidationHistory, TrendAnalysisPanel, EcosystemIntelPanel, RedditIntelPanel
  hooks/
    useValidationHistory.ts
  lib/
    grok-api.ts                     ← Grok/xAI: X intel + primary verdict (grok-4-1-fast-reasoning)
    kimi-api.ts                     ← Kimi K2.5: Reddit intel (30s timeout, non-blocking)
    ecosystem-stats.ts              ← Category survival aggregation
    category-inference.ts           ← Free-text → scoring category resolution
    validation-store.ts             ← Supabase persistence for validations
    validation-jobs.ts              ← Async job lifecycle manager
    pipeline-api.ts                 ← VPS REST client
    pipeline-mapper.ts              ← VPS response → ProjectData mapper
    data.ts                         ← Primary data access (API + JSON fallback)
    score-color.ts                  ← Score → brand color token
    exportMarkdown.ts / exportPng.ts ← Share/export utilities
    x-api.ts                        ← X/Twitter API (OAuth 1.0a)
    prisma.ts                       ← Prisma client singleton

pipeline-v2-public/ (VPS backend pipeline)
  src/
    index.ts                        ← Entry point + Express server
    scheduler.ts                    ← 12h cron scheduler with concurrency lock
    config.ts                       ← Rate limits, retry strategies, cache TTLs
    cli.ts                          ← CLI interface for manual pipeline runs
    pipeline/
      orchestrator.ts               ← Full pipeline coordination: discover → enrich → score → store
      collector.ts                  ← CoinGecko + DeFiLlama project discovery
      resolver.ts                   ← Token address resolution (2-layer cascade)
      enricher.ts                   ← Parallel enrichment coordinator with retry logic
      scorer.ts                     ← 13-factor scoring with category-adaptive weights
      analyzer.ts                   ← AI post-mortem analysis for dead/zombie projects
      twitter-enricher.ts           ← Twitter/X signal enrichment via Grok
      store.ts                      ← PostgreSQL upsert via Prisma
    sources/
      coingecko.ts                  ← Market cap, price trend, community, dev activity
      defillama.ts                  ← TVL history, monthly snapshots, peak TVL
      moralis.ts                    ← Holder count, concentration, transfer activity
      twitter.ts                    ← Follower count, engagement signals
    scoring/
      factors.ts                    ← 13 scoring factor calculations
      weights.ts                    ← 7 category-adaptive weight profiles
      signals.ts                    ← Ship/Skip signal classification
    shared/
      types.ts                      ← Shared TypeScript types
      category-map.ts               ← Category mapping and aliases
      rate-limiter.ts               ← Configurable rate limiting
      logger.ts                     ← Structured logging
    api/
      router.ts                     ← Express route definitions
      projects.controller.ts        ← /api/v1/projects endpoint
      pipeline.controller.ts        ← /api/v1/pipeline trigger endpoint
      exports.controller.ts         ← /api/v1/exports endpoint
      middleware.ts                 ← Auth, CORS, rate limiting middleware
  prisma/                           ← Database schema + migrations
  Dockerfile                        ← Production container
  docker-compose.yml                ← App + PostgreSQL orchestration

contracts/
  ShipOrSkipScoreboard.sol          ← Survival scores + idea attestations
onchain/scripts/
  deploy-scoreboard.js / register-scoreboard.js / submit-idea.js / update-snapshot.js

prisma/schema.prisma                ← ValidationRecord model
```

---

## Summary Stats

| Metric | Value |
|--------|-------|
| **Build duration** | 6 days (14–19 Feb 2026) |
| **Total AI-assisted code tasks** | ~60 distinct tasks |
| **Lines of code (AI-generated)** | ~20,000 lines |
| **Lines of planning docs (AI-generated)** | ~7,000 lines |
| **Human-written lines** | ~300 (configs, .env, bug diagnoses, key decisions) |
| **Pipeline modules** | 8 pipeline modules + 4 source adapters + 3 scoring modules + 4 shared utilities |
| **Frontend components** | 35+ modular components |
| **API routes** | 6 (validate, status, history, stats, revalidate, og) |
| **AI model integrations** | 3 (Grok-4.1/xAI primary, Kimi K2.5/Moonshot Reddit intel, Gemini 2.0 Flash fallback) |
| **Smart contract** | `ShipOrSkipScoreboard.sol` — BSC mainnet `0xd6a229...2432` |
| **Onchain records** | 111 project scores + 1 ecosystem snapshot |
| **Database** | Supabase PostgreSQL via Prisma (`ValidationRecord`) |
| **Projects in dataset** | 111 curated (enriched from multi-source BNB Chain data) |
| **Enrichment sources** | 7 (NodeReal, DexScreener, CoinGecko, CoinMarketCap, DeFiLlama, GeckoTerminal, whale signals) |
| **Infrastructure** | 2× VPS (pipeline + frontend), Docker, Nginx, PM2 |

---

## AI Tool Allocation

| Tool | Where Used | Why This Tool |
|------|-----------|---------------|
| **GitHub Copilot (Claude Sonnet 4.6)** | All code generation, all documentation, pipeline modules, frontend components, contract, tests | Primary coding assistant — full workspace context |
| **Grok-4.1 / xAI** | X/Twitter trend intel in validator, whale signal research, **primary verdict** (grok-4-1-fast-reasoning) | Only model with real-time X access via `x_search`. Fast reasoning for reliable PMF scoring |
| **Kimi K2.5 / Moonshot** | Reddit/web community intel (non-blocking, 30s timeout) | `$web_search` for non-Twitter community signals. Bonus intel layer, not on critical path |
| **Gemini 2.0 Flash** | Early validation prototype (replaced by Kimi+Grok) | Fast structured output. Kept as tertiary fallback in codebase |

---

## Key Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **Dual AI oracle (Grok + Kimi)** | X/Twitter and Reddit/forums are genuinely different signal sources. Grok is primary for verdict (fast, reliable). Kimi provides bonus Reddit intel (non-blocking, 30s timeout) |
| **Async job system** | VPS function timeout is 90s. Grok `x_search` + reasoning take 40–70s. Jobs decouple these |
| **`NULL_SCORE = -1` sentinel** | Missing enrichment data should be excluded from scoring, not penalized. This one change improved score accuracy measurably |
| **VPS over Vercel for pipeline** | Pipeline runs spike CPU/memory for 3–5 minutes. This would cause Vercel serverless cold-start failures and cost spikes |
| **ISR + JSON fallback** | If VPS is down or cold, frontend must still work. `data/projects.json` is the last-resort cache |
| **Anonymous validation records** | No user accounts. Category + signal + score only. GDPR-clean by design |
| **Onchain idea hashing** | `keccak256(description)` written by builder's wallet = proof of timestamp + authorship without exposing the idea text itself |

---

## Features Cut During Build

| Feature | Reason |
|---------|--------|
| Moralis enrichment | No API key available during hackathon window |
| GeckoTerminal full coverage | Rate-limited at 429; DexScreener provides equivalent liquidity data |
| BSCScan contract metrics | V1 API deprecated; V2 requires paid BSC plan |
| Twitter thread on submission day | Deprioritized in favor of Kimi integration + VPS deployment |
| 159-project target | Small categories (Lending=4, Bridge=4, Meme=2) hit natural availability limits |

---

## Lessons Learned

1. **Validate APIs before building scripts.** BSCScan's V1 deprecation and DeFiLlama's address format were discovered during implementation, not design. Cost: 1 full day.

2. **Async job architecture is non-negotiable for Vercel + AI calls.** The 10s function limit makes synchronous AI validation impossible. Designing this upfront would have saved 4 hours of refactoring.

3. **`NULL_SCORE` > zero-fallback.** Treating missing enrichment as 0 punishes projects with limited data (new, niche). Excluding them from the weighted average produces scores that only reflect what is known — much more honest.

4. **Two AI oracles > one smarter oracle.** Grok owns X/Twitter intel + primary verdict (`grok-4-1-fast-reasoning`); Kimi owns Reddit/web intel (non-blocking, 30s timeout). The split produces richer, more grounded validation narratives. Grok's fast reasoning delivers reliable PMF scores while Kimi adds bonus community context.

5. **Vibecoding scales linearly with scope discipline.** 20,000 lines in 6 days is achievable only when scope is ruthlessly bounded. Every feature added mid-build has compounding cost. The features cut list above represents real discipline moments.

---

*Reconstructed 19 Feb 2026 from final codebase structure, file contents, and delivery artifacts. Timing where noted is approximate.*

