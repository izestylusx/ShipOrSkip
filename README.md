# ShipOrSkip — BNB Ecosystem Intelligence for Builders

> **Don't Ship Blind.** Know what happened when others built the same thing.

[![Track](https://img.shields.io/badge/Track-Builders'%20Tools-blue)](https://dorahacks.io/hackathon/goodvibes/buidl)
[![Chain](https://img.shields.io/badge/Chain-BNB%20Chain-yellow)](https://www.bnbchain.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

## What is ShipOrSkip?

ShipOrSkip is an **ecosystem intelligence platform** that helps BNB builders make informed decisions *before* they start building. We analyze BNB ecosystem projects across key categories — scoring each on survival health, detecting whale conviction signals, and surfacing the stories behind dead projects.

In the era of vibecoding, anyone can build in hours. But without intelligence, vibecoding just accelerates failure. **ShipOrSkip is Step 0** — the intelligence layer before you open any coding tool.

## Key Features

- 🔎 **Ecosystem Radar** — BNB project dataset analyzed with survival scoring (0-100)
- 💀 **Post-Mortem Reports** — Why projects died or survived — actionable lessons
- 📡 **Narrative Radar** — Ecosystem narrative trends from Twitter data
- ✅ **Idea Validator** — Paste your idea → get PMF score + similar project analysis (powered by Grok `grok-4-1-fast-reasoning`)
- 🐋 **Whale Conviction Signals** — Stealth accumulation, smart money exit detection
- ⛓️ **Onchain Scoreboard** — Survival scores stored on BSC mainnet (composable, queryable)

## Live Demo

**🌐 [shiporskip.xyz](https://shiporskip.xyz)** — Try the Idea Validator, explore 200+ scored BNB projects, read post-mortems.

## Architecture

ShipOrSkip runs as a **two-server system** with a shared Supabase PostgreSQL database:

```
┌──────────────────────────────────────────────────┐
│  VPS A — Frontend (shiporskip.xyz)               │
│  Next.js 14 · Nginx · PM2 · Port 443            │
│  ┌────────────────┐  ┌────────────────────────┐  │
│  │  /validate      │  │  /api/validate          │  │
│  │  Idea Validator │→│  Grok + Kimi AI Engine  │  │
│  └────────────────┘  └────────────────────────┘  │
│  ┌────────────────┐  ┌────────────────────────┐  │
│  │  /projects      │  │  Supabase PostgreSQL   │  │
│  │  Explorer (ISR) │  │  ← ValidationRecord    │  │
│  └────────────────┘  └────────────────────────┘  │
│           │ fetches live data (ISR 600s)          │
└───────────┼──────────────────────────────────────┘
            │ HTTP
┌───────────▼──────────────────────────────────────┐
│  VPS B — Pipeline v2 (207.148.9.29:4000)         │
│  Docker · Express · node-cron (every 12h)        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐  │
│  │Discovery│→│Enricher │→│Scorer   │→│AI     │  │
│  │CoinGecko│ │Moralis  │ │13-factor│ │Grok   │  │
│  │DappBay  │ │DeFiLlama│ │adaptive │ │xAI    │  │
│  └─────────┘ └─────────┘ └─────────┘ └───────┘  │
│           │                                       │
│  ┌────────▼───────────────────────────────────┐  │
│  │  Supabase PostgreSQL (shared)               │  │
│  │  ← Project · ProjectSnapshot · PipelineRun  │  │
│  │  ← ValidationRecord (shared with frontend)  │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │  REST API (:4000/api/v1)                    │  │
│  │  /projects · /pipeline/status · /health     │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────┐
│  BSC Mainnet                                      │
│  ShipOrSkipScoreboard.sol                        │
│  — 220 project survival scores on-chain          │
└──────────────────────────────────────────────────┘
```

**Why two servers?** The pipeline spikes CPU/memory every 12h during enrichment + AI analysis. Separating it prevents interference with the frontend's 60-90s Grok reasoning responses.

---

## Setup Guide

### Option A: Quick Demo (no API keys needed)

```bash
git clone https://github.com/izestylusx/ShipOrSkip.git
cd ShipOrSkip
npm install
npm run dev   # http://localhost:3000
```

The app fetches live data from the public Pipeline v2 API (`207.148.9.29:4000`). If unavailable, it falls back to `data/projects.json`. Idea Validator works in data-driven fallback mode (no AI verdict).

### Option B: Full Setup

#### 1. Supabase Database

Both Frontend and Pipeline share the same Supabase PostgreSQL instance:

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Settings → Database → Connection String (URI)**
3. Copy **Transaction pooler** (port 6543) → `DATABASE_URL`
4. Copy **Session pooler** (port 5432) → `DIRECT_URL`

```bash
# Sync Prisma schema to Supabase (creates tables)
npx prisma db push
```

This creates two sets of tables:
- **Frontend schema** (`prisma/schema.prisma`): `validation_records` — stores every anonymous idea validation (category, PMF score, signal, AI analysis)
- **Pipeline schema** (`pipeline-v2/prisma/schema.prisma`): `projects`, `project_snapshots`, `pipeline_runs` — stores 200+ BNB ecosystem projects with daily snapshots and pipeline execution logs

#### 2. Frontend (VPS A)

```bash
git clone https://github.com/izestylusx/ShipOrSkip.git
cd ShipOrSkip
npm install
cp .env.example .env.local
```

**Required environment variables:**

```env
# Supabase PostgreSQL (for storing user-submitted idea validations)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# AI Engine (Grok = primary verdict + Twitter intel)
XAI_API_KEY=your_xai_key        # https://console.x.ai/

# AI Engine (Kimi = Reddit community intel, optional)
KIMI_API_KEY=sk-kimi-your-key   # https://platform.moonshot.cn/

# Anti-Spam CAPTCHA (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key     # https://dash.cloudflare.com/ → Turnstile
TURNSTILE_SECRET_KEY=your_secret_key

# Pipeline API connection (defaults to our VPS if not set)
PIPELINE_API_URL=http://207.148.9.29:4000/api/v1

# Smart Contract (BSC Mainnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xd6a229D8cFbde4be596dd9Cd53d1b3E8bD272432
NEXT_PUBLIC_CHAIN_ID=56
```

```bash
# Push Prisma schema (creates validation_records table)
npx prisma db push

# Start development server
npm run dev

# Production build + deploy (VPS with Nginx + PM2)
npm run build
# See docs/DEPLOY_FRONTEND_VPS.md for VPS deployment
```

**What the frontend stores in Supabase:**
- Every idea validation submitted by users (anonymous, no PII)
- Used for ecosystem intelligence: aggregate stats, category breakdown, average PMF scores, death pattern analysis
- Powers the "Development Ecosystem Intelligence" stats shown on the landing page

#### 3. Data Pipeline (VPS B — separate server)

The pipeline is an **autonomous service** that discovers, enriches, scores, and AI-analyzes 200+ BNB Chain projects. It runs on its own VPS using Docker.

```bash
cd pipeline-v2-public
cp .env.example .env
```

**Required environment variables:**

```env
# Database (same Supabase instance as frontend)
DATABASE_URL=postgresql://postgres.[ref]:[password]@host:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@host:5432/postgres

# API Security
PIPELINE_API_KEY=your-long-random-secret

# Data Sources
COINGECKO_API_KEY=your_key    # Discovery + token resolution
MORALIS_API_KEY=your_key      # On-chain enrichment (BSC)
NODEREAL_API_KEY=your_key     # Holder count + token supply
XAI_API_KEY=your_key          # AI survival analysis (Grok)

# Scheduler (node-cron)
PIPELINE_INTERVAL_HOURS=12    # Runs every 12h automatically
```

```bash
# Deploy with Docker
docker build -t pipeline-v2 .
docker run -d --name shipOrSkip-pipeline \
  --env-file .env \
  -p 4000:4000 \
  --restart unless-stopped \
  pipeline-v2

# Push Prisma schema (creates projects, project_snapshots, pipeline_runs tables)
docker exec shipOrSkip-pipeline npx prisma db push
```

**Automated scheduling:** The pipeline uses `node-cron` to automatically refresh all project data every 12 hours. It alternates between full runs (re-score everything) and incremental runs (only new projects). No manual intervention needed after deployment.

**Pipeline API endpoints:**

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/v1/health` | No | Health check |
| `GET /api/v1/projects` | No | All scored projects (paginated) |
| `GET /api/v1/projects/:slug` | No | Single project with historical snapshots |
| `GET /api/v1/pipeline/status` | No | Last run info + next scheduled run |
| `POST /api/v1/pipeline/trigger` | Bearer token | Manually trigger pipeline run |

#### 4. Smart Contract (Optional)

```bash
# Deploy to BSC Mainnet
npm run onchain:deploy:mainnet

# Batch register survival scores on-chain
npm run onchain:register:mainnet
```

#### 5. Verify Everything Works

```bash
# Frontend loads with live data
curl http://localhost:3000

# Pipeline API is healthy
curl http://207.148.9.29:4000/api/v1/health
# → {"status":"ok"}

# Pipeline last run status
curl http://207.148.9.29:4000/api/v1/pipeline/status
# → {"lastRun":{...},"nextRunAt":"...","intervalHours":12}

# Contract on BSCScan
# → https://bscscan.com/address/0xd6a229D8cFbde4be596dd9Cd53d1b3E8bD272432
```

---

## Data Validity & Provenance (for Judges)

- Current hackathon build runs in **snapshot mode**: UI reads from `data/projects.json` to ensure stable and reproducible judging.
- `data/projects.json` is a **temporary submission dataset**, not the final production ingestion architecture.
- Discovery baseline for this snapshot is manually curated from **BNB Chain Dapp directory (DappBay)**, then normalized into our schema.
- Validation and enrichment are layered from **NodeReal on-chain signals** and **X social signals** (plus supporting market/on-chain sources where available).
- Every project record includes score factors and timestamps so outputs are auditable.
- Production roadmap is **dynamic pipeline mode** (scheduled refresh + premium providers such as Moralis/RootData) without changing frontend contract.

### Submission Disclosure (copy-ready)

For this hackathon submission, ShipOrSkip uses a reproducible snapshot dataset (`data/projects.json`) so judges can run the product deterministically in local/dev environments. The current snapshot is bootstrapped from BNB ecosystem project listings and enriched with on-chain + social evidence (NodeReal and X as primary supporting layers). This is an MVP reliability choice for judging, while the architecture is designed to scale to automated premium ingestion (for example Moralis/RootData) in post-hackathon production.

## Documentation

| Document | Description |
|----------|-------------|
| [📋 PROJECT.md](docs/PROJECT.md) | Problem, solution, impact, roadmap |
| [🔧 TECHNICAL.md](docs/TECHNICAL.md) | Architecture, setup guide, demo walkthrough |
| [🤖 AI_BUILD_LOG.md](docs/AI_BUILD_LOG.md) | AI-assisted development process log |
| [⛓️ bsc.address](bsc.address) | Smart contract deployments |

## Onchain Proof

See [`bsc.address`](bsc.address) for deployed contract addresses and explorer links.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS v4, TypeScript |
| AI | Grok `grok-4-1-fast-reasoning` (primary verdict), Kimi K2.5 (Reddit intel), Grok `grok-4-1-fast-non-reasoning` (X/Twitter intel) |
| Database | Supabase PostgreSQL + Prisma v5 ORM (shared between frontend + pipeline) |
| Data Pipeline | Docker + Express + node-cron (12h auto-refresh) — CoinGecko + Moralis + DeFiLlama + NodeReal + Twitter |
| Scoring | 13-factor category-adaptive survival scoring (0-100), 7 weight profiles |
| Charts | Recharts + TradingView Lightweight Charts |
| Smart Contract | Solidity + Hardhat (BSC Mainnet) |
| Anti-spam | Cloudflare Turnstile CAPTCHA |
| Deploy | 2× VPS (Nginx + PM2 frontend, Docker pipeline) — supports 90s AI validation timeout |

## AI-Assisted Development

This project was built with significant AI assistance throughout the entire development lifecycle — from strategic planning to code implementation. See [AI_BUILD_LOG.md](docs/AI_BUILD_LOG.md) for the full process log.

## Hackathon

- **Live:** [shiporskip.xyz](https://shiporskip.xyz)
- **Event:** [Good Vibes Only: OpenClaw Edition](https://dorahacks.io/hackathon/goodvibes/detail) (BNB Chain)
- **Track:** Builders' Tools
- **Prize Pool:** $100K across 10 winners
- **Scoring:** 40% community vote + 60% sponsor judges

## License

MIT
