# ShipOrSkip — BNB Ecosystem Intelligence for Builders

> **Don't Ship Blind.** Know what happened when others built the same thing.

[![Track](https://img.shields.io/badge/Track-Builders'%20Tools-blue)](https://dorahacks.io/hackathon/goodvibes/buidl)
[![Chain](https://img.shields.io/badge/Chain-BNB%20Chain-yellow)](https://www.bnbchain.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

## What is ShipOrSkip?

ShipOrSkip is an **ecosystem intelligence platform** that helps BNB builders make informed decisions *before* they start building. We analyze 30-50 BSC projects across DeFi, Gaming, Meme, and Infrastructure — scoring each on survival health, detecting whale conviction signals, and surfacing the stories behind dead projects.

In the era of vibecoding, anyone can build in hours. But without intelligence, vibecoding just accelerates failure. **ShipOrSkip is Step 0** — the intelligence layer before you open any coding tool.

## Key Features

- 🔎 **Ecosystem Radar** — 30-50 BSC projects analyzed with survival scoring (0-100)
- 💀 **Post-Mortem Reports** — Why projects died or survived — actionable lessons
- 📡 **Narrative Radar** — Ecosystem narrative trends from Twitter data
- ✅ **Idea Validator** — Paste your idea → get PMF score + similar project analysis (powered by Gemini 2.0 Flash)
- 🐋 **Whale Conviction Signals** — Stealth accumulation, smart money exit detection
- ⛓️ **Onchain Scoreboard** — Survival scores stored on BSC mainnet (composable, queryable)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/<your-username>/ShipOrSkip.git
cd ShipOrSkip

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in: MORALIS_API_KEY, BSCSCAN_API_KEY, GEMINI_API_KEY

# Run data pipeline (fetches and analyzes 30-50 BSC projects)
npm run seed

# Start development server
npm run dev
```

> **No API keys?** Run `npm run dev` directly — the app ships with `data-example/` containing sample data for instant demo.

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
| AI | Gemini 2.0 Flash (free tier) |
| Data Pipeline | DeFiLlama, Moralis, BSCScan, GeckoTerminal, DexScreener, Twitter |
| Charts | Recharts + TradingView Lightweight Charts |
| Smart Contract | Solidity + Hardhat (BSC Mainnet) |
| Deploy | Vercel |

## AI-Assisted Development

This project was built with significant AI assistance throughout the entire development lifecycle — from strategic planning to code implementation. See [AI_BUILD_LOG.md](docs/AI_BUILD_LOG.md) for the full process log.

## Hackathon

- **Event:** [Good Vibes Only: OpenClaw Edition](https://dorahacks.io/hackathon/goodvibes/detail) (BNB Chain)
- **Track:** Builders' Tools
- **Prize Pool:** $100K across 10 winners
- **Scoring:** 40% community vote + 60% sponsor judges

## License

MIT
