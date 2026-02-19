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

## Quick Start

```bash
# Clone the repo
git clone https://github.com/<your-username>/ShipOrSkip.git
cd ShipOrSkip

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Recommended: XAI_API_KEY (AI verdict mode). Optional: MORALIS_API_KEY, BSCSCAN_API_KEY, etc. for pipeline refresh.

# Run data pipeline (optional; regenerates snapshot dataset)
npm run seed

# Start development server
npm run dev
```

> **No API keys?** Run `npm run dev` directly — the app ships with `data-example/` containing sample data for instant demo.

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
| [📎 EXTRAS.md](docs/EXTRAS.md) | Demo video & presentation links |
| [🤖 AI_BUILD_LOG.md](docs/AI_BUILD_LOG.md) | AI-assisted development process log |
| [⛓️ bsc.address](bsc.address) | Smart contract deployments |

## Onchain Proof

See [`bsc.address`](bsc.address) for deployed contract addresses and explorer links.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS v4, TypeScript |
| AI | Grok `grok-4-1-fast-reasoning` (primary verdict), Kimi K2.5 (Reddit intel), Grok `grok-4-1-fast-non-reasoning` (X/Twitter intel) |
| Data Pipeline | Dapp discovery snapshot + NodeReal + X + BSCScan + CoinGecko + GeckoTerminal + DexScreener |
| Charts | Recharts + TradingView Lightweight Charts |
| Smart Contract | Solidity + Hardhat (BSC Mainnet) |
| Anti-spam | Cloudflare Turnstile CAPTCHA |
| Deploy | VPS (Nginx + PM2) — supports 90s AI validation timeout |

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
