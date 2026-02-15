# ShipOrSkip — MVP PRD

> **Hackathon:** Good Vibes Only: OpenClaw Edition (BNB Chain) · **Deadline:** 19 Feb 2026  
> **Track:** Builders' Tools (3 competitors, none related) · **Prize:** $100K across 10 winners  
> **One-liner:** BNB ecosystem intelligence — analyze 50+ BSC projects (dead vs alive), AI-powered idea validation for builders.

---

## MVP Scope

**IN:** Landing page with inline validator, Explorer grid with filters, Project detail with scoring breakdown, AI idea validation (Gemini 2.0 Flash), automated data pipeline (7 APIs → JSON), survival scoring (category-adaptive), smart contract scoreboard (BSC mainnet), OG share cards.

**OUT:** Narrative Radar page (compressed into Evidence section), wallet-gated features, user accounts, watchlists, comparison mode, email digest backend, real-time data, webhook/notification system, SaaS tiers.

---

## Flow 1: Validator (Landing → Validate → Result)

### US-001: Submit Idea for Validation
**As a** BNB builder, **I want** to describe my project idea and get an AI-powered intel briefing, **so that** I know what happened when others built something similar before I start.

**Acceptance Criteria:**
- [ ] Textarea accepts 20–500 chars with inline validation and char counter
- [ ] Category dropdown and target users field are provided
- [ ] Example chips ("DEX aggregator on BSC", "Play-to-earn game") auto-fill textarea on click
- [ ] POST to `/api/validate` calls Gemini 2.0 Flash with ecosystem context
- [ ] No wallet connection required

### US-002: Loading Theater
**As a** builder waiting for results, **I want** to see progressive loading stages referencing real data, **so that** I trust the tool is doing actual analysis.

**Acceptance Criteria:**
- [ ] 5-stage loading sequence with progress bar ("Scanning BNB ecosystem…" → "Found: {project} matches your category" → "Intel ready")
- [ ] Matched project name pulled from seed data by category
- [ ] Minimum 3s display time even if API responds faster

### US-003: View Validation Result
**As a** builder, **I want** to see a structured verdict (SHIP / SKIP / CAUTION) with score, risk factors, and recommendations, **so that** I can make an informed build decision.

**Acceptance Criteria:**
- [ ] Score ring animates 0→N, verdict badge color-coded (green/red/amber)
- [ ] Risk factors, "Your Edge" recommendation, and similar projects displayed
- [ ] Post-result CTAs: Share (Twitter pre-fill + clipboard permalink), Check Another, Explore Similar
- [ ] Result auto-saved to localStorage (max 20 entries, FIFO)

### US-004: Error & Edge States
**As a** builder, **I want** graceful error handling during validation, **so that** I'm never stuck on a broken screen.

**Acceptance Criteria:**
- [ ] API timeout (>15s): retry CTA + "Browse Projects" fallback
- [ ] Rate limit (>5 in 10 min): cooldown message with countdown
- [ ] Empty/short input: inline validation with helper text
- [ ] Network offline: input preserved, offline message shown

---

## Flow 2: Explorer (/projects → /projects/[slug])

### US-005: Browse Analyzed Projects
**As a** builder, **I want** to browse 50+ analyzed BSC projects in a filterable grid, **so that** I can explore the ecosystem landscape.

**Acceptance Criteria:**
- [ ] Project cards show: name, survival score badge, category tag, status badge (alive/zombie/dead), whale signal icon
- [ ] Filter by: category (DEX, Lending, Gaming, Meme…), status (alive/zombie/dead)
- [ ] Sort by: score, category, status
- [ ] Skeleton loading cards (6 pulsing placeholders) during load
- [ ] Empty filter state shows "No projects found" + Clear Filters CTA

### US-006: View Project Detail
**As a** builder, **I want** to see a full analysis report for a specific project, **so that** I understand why it survived or died.

**Acceptance Criteria:**
- [ ] Score breakdown with per-factor bars (TVL retention, tx trend, twitter activity, whale conviction, etc.)
- [ ] Post-mortem section for dead/zombie projects (what happened, root cause, lesson for builders)
- [ ] Alive summary for surviving projects (why it survives, key differentiator, risk factors)
- [ ] Token price chart (OHLCV from pre-fetched data) when token exists
- [ ] Whale conviction badge (STEALTH_ACCUMULATION / SMART_MONEY_EXIT / ALIGNED / DECLINE)
- [ ] Similar projects links + onchain proof BSCScan tx link
- [ ] Graceful degradation: missing data sections hidden, not broken

---

## Flow 3: Data Pipeline (seed → enrich → score → output)

### US-007: Automated Project Discovery
**As a** pipeline operator, **I want** to run `npm run seed` and auto-discover 50+ BSC projects from DeFiLlama + Moralis Entity API, **so that** the dataset is built programmatically.

**Acceptance Criteria:**
- [ ] DeFiLlama `/protocols` filtered for BSC → discovers DeFi projects (alive + dead)
- [ ] Moralis Entity API discovers Gaming/NFT/Tool dApps without TVL
- [ ] Merge + deduplicate → output curated list of 30–50 projects
- [ ] Manual seed overrides supported via `project-seed.json`

### US-008: Multi-Source Enrichment
**As a** pipeline operator, **I want** each project enriched from 7 APIs in parallel, **so that** scoring has comprehensive data.

**Acceptance Criteria:**
- [ ] Moralis: token stats, holder stats, token score, price, top holders, smart money, historical holders
- [ ] BSCScan: tx count, contract verification, ownership status
- [ ] GeckoTerminal: daily OHLCV candles for token projects
- [ ] DexScreener: price, volume, liquidity, FDV snapshot
- [ ] Twitter (twitterapi.io): last 20 tweets, mention volume, engagement
- [ ] Rate limiting per API with retry logic; total runtime ≤20 min
- [ ] Moralis CU budget stays within 40K/day (~2,600 CU actual)

### US-009: Category-Adaptive Survival Scoring
**As a** data analyst, **I want** projects scored 0–100 with category-specific weight formulas, **so that** DeFi, Gaming, Meme, and Infra projects are evaluated fairly.

**Acceptance Criteria:**
- [ ] DeFi weights: TVL retention 25%, tx trend 15%, whale conviction 10%, twitter 15%, etc.
- [ ] Gaming weights: contract tx 20%, unique wallets 15%, whale conviction 10%, twitter 15%, etc.
- [ ] Meme weights: holders 15%, distribution 10%, whale conviction 10%, price 15%, social 30%, etc.
- [ ] Status classification: alive (>60), zombie (30–60), dead (<30)
- [ ] Whale signal modifier: +5 stealth accumulation, −5 smart money exit

### US-010: Pipeline Output
**As a** frontend developer, **I want** the pipeline to output structured JSON files, **so that** the frontend renders from static data.

**Acceptance Criteria:**
- [ ] `data/projects.json` — scored projects with factors, raw data, AI narratives
- [ ] `data/token_charts.json` — OHLCV candle data per project
- [ ] `data/whale_signals.json` — whale conviction signals per project
- [ ] `data/narrative.json` — ecosystem narrative trends (rising/declining categories)
- [ ] `data-example/` committed with 5 sample projects for zero-API-key demo

---

## Flow 4: Smart Contract

### US-011: Onchain Scoreboard
**As a** hackathon judge, **I want** survival scores and idea attestations stored onchain on BSC, **so that** I can verify the project has real blockchain integration.

**Acceptance Criteria:**
- [ ] `ShipOrSkipScoreboard.sol` deployed to BSC mainnet
- [ ] `scoreProject()` stores name, category, status, score — publicly queryable via `projects[id]`
- [ ] `submitIdea()` records builder address, category, PMF score (no wallet needed for AI validation; wallet only for onchain registration)
- [ ] `updateSnapshot()` stores aggregate ecosystem stats (total/alive/zombie/dead)
- [ ] Contract address + explorer link in `bsc.address` file
- [ ] Batch registration script: `npm run seed:register`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router, SSR) |
| Styling | Tailwind CSS + design tokens |
| AI | Gemini 2.0 Flash (free, 15 RPM) |
| Charts | Recharts + TradingView lightweight-charts |
| Contract | Solidity + Hardhat → BSC Mainnet |
| Data APIs | DeFiLlama, Moralis, BSCScan, GeckoTerminal, DexScreener, CoinGecko, twitterapi.io |
| Deploy | Vercel (free) |
| Cost | $0 total |
