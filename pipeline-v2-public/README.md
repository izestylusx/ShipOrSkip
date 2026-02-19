# ShipOrSkip — Data Pipeline

> BNB Chain ecosystem intelligence pipeline. Discovers, enriches, scores, and analyzes 200+ BNB Chain projects to produce SHIP / WATCH / SKIP verdicts.

## Architecture

```
CoinGecko Pro ──────────────────────┐
                                    ▼
                          Phase 1: Discovery
                          bnb-chain-ecosystem
                          top 200 + 22 emerging
                                    │
                                    ▼
                          Phase 1.5: Token Resolution
                          CoinGecko platforms → Moralis verify
                                    │
Moralis Web3 API ──────────────────►│
                                    ▼
                          Phase 2: Enrichment
                          Moralis on-chain + CoinGecko OHLCV
                                    │
DeFiLlama ─────────────────────────►│
Twitter/Grok ──────────────────────►│
                                    ▼
                          Phase 3: Scoring
                          13 factors · 7 weight profiles
                                    │
xAI Grok ──────────────────────────►│
                                    ▼
                          Phase 4: AI Analysis
                          aliveSummary / postMortem
                                    │
                                    ▼
                          Phase 5: PostgreSQL
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- API keys: CoinGecko Pro, Moralis, xAI Grok

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in your API keys

# 3. Set up database
npx prisma migrate dev

# 4. Run the pipeline
npx ts-node src/cli.ts run

# 5. Start the API server
npm run dev
```

### Docker

```bash
docker-compose up -d
```

## API Keys

| Key | Source | Free Tier |
|-----|--------|-----------|
| `COINGECKO_API_KEY` | [coingecko.com/api](https://www.coingecko.com/api/documentation) | Demo: 30 req/min |
| `MORALIS_API_KEY` | [moralis.io](https://moralis.io) | 1,500 req/min |
| `XAI_API_KEY` | [x.ai](https://x.ai) | Pay-as-you-go |
| `TWITTER_BEARER_TOKEN` | [developer.twitter.com](https://developer.twitter.com) | Optional |

## Scoring System

13 factors across 7 category-specific weight profiles:

| Factor | Description |
|--------|-------------|
| `userActivity` | On-chain active addresses (Moralis proxy) |
| `userGrowth` | 7d price trend as engagement growth signal |
| `txActivity` | 24h transfer count → weekly estimate |
| `tvlHealth` | DeFiLlama TVL size + 30d trend |
| `priceMomentum` | 30d price change |
| `tradingHealth` | Volume / market cap ratio |
| `holderStrength` | Holder count + distribution |
| `marketSentiment` | Multi-timeframe price composite |
| `contractTrust` | Moralis contract verification |
| `categoryHealth` | Median score of same-category projects |
| `ecosystemRank` | CoinGecko BNB Chain ecosystem rank |
| `marketCap` | Market cap tier |
| `twitterActivity` | Days since last tweet |

### Verdict Thresholds

| Verdict | Score |
|---------|-------|
| SHIP | ≥ 60 |
| WATCH | 40–59 |
| SKIP | < 40 |

## API Endpoints

```
GET  /api/v1/projects            # list projects (filter: verdict, category)
GET  /api/v1/projects/:id        # single project + 30-day snapshot
GET  /api/v1/projects/stats      # SHIP/WATCH/SKIP counts, avg score
GET  /api/v1/pipeline/status     # last run info
POST /api/v1/pipeline/trigger    # manual trigger (requires X-API-Key header)
GET  /api/v1/exports/latest      # full JSON export of current scores
GET  /api/v1/health              # health check
```

## Environment Variables

See [.env.example](.env.example) for full reference.

## License

MIT
