# Project: Problem, Solution & Impact

> **ShipOrSkip** — BNB Ecosystem Intelligence for Builders

---

## 1. Problem

Builders in the BNB ecosystem launch blind. They don't know:

- **What similar projects already exist** — and whether they survived or died
- **Why projects fail** — the specific patterns that kill 60%+ of BSC projects
- **Where the ecosystem narrative is moving** — which categories are rising, which are dying
- **Whether their idea has product-market fit** — or if they're repeating a failed pattern

The result: thousands of projects launch, most die, and builders repeat the same mistakes.

### The Vibecoding Paradox

The rise of vibecoding tools (Cursor, Windsurf, v0, Lovable, Replit, Base44) has made **building** easier than ever. Anyone can ship a project in hours. But none of these tools answer:

- *"What happened when others built THIS?"*
- *"Has someone already tried and failed?"*
- *"What's the ecosystem telling us about this category?"*

**More vibecoding tools → More projects launched → MORE projects fail → MORE need for pre-build intelligence.**

Vibecoding accelerates building. Without an intelligence layer, it just accelerates failure.

```mermaid
flowchart LR
    A[Builder has idea] --> B{ShipOrSkip?}
    B -->|Without| C[Open Cursor → Build 2hr → Launch → Die → Repeat]
    B -->|With| D[Validate → PMF Score 72 → 3 similar dead projects found]
    D --> E[Adjust approach → Build informed → Higher survival rate]
```

---

## 2. Solution

**ShipOrSkip** is a curated BNB ecosystem intelligence platform with four core modules:

### 🔎 Ecosystem Radar
30-50 BSC projects analyzed with a **category-adaptive survival scoring system** (0-100). Data sourced from 7 APIs (DeFiLlama, Moralis, BSCScan, GeckoTerminal, DexScreener, CoinGecko, Twitter) — fully automated pipeline.

### 💀 Post-Mortem Reports
For dead/zombie projects: *what happened, why it died, the timeline, root cause, and lessons for builders*. AI-generated from real data (Gemini 2.0 Flash).

### 📡 Narrative Radar
Ecosystem narrative trends from Twitter data — which categories are rising (+340% AI Agent mentions) vs declining (-62% GameFi). Helps builders time their entry.

### ✅ Idea Validator
Builder pastes their idea → system matches against project database → Gemini AI analyzes similar projects, death patterns, and narrative timing → returns **PMF score + actionable recommendation**.

**No wallet required** for any of the above. Zero friction for judges and users.

### What makes it different

| Platform | Question Answered |
|----------|-------------------|
| Cursor / Windsurf | "How to code this?" |
| v0 / Lovable | "How to design this?" |
| Replit / Base44 | "How to deploy this?" |
| **ShipOrSkip** | **"What happened when others built THIS?"** |

ShipOrSkip is **Step 0** — the intelligence layer before you open any coding tool.

---

## 3. Business & Ecosystem Impact

### Target Users

| Segment | Use Case | Value |
|---------|----------|-------|
| **Builders/Founders** (primary) | Validate idea before building | Avoid repeating proven failure patterns |
| **Existing Project Teams** (secondary) | Read market direction, prioritize features | Data-driven pivots |
| **Investors** (tertiary) | Landscape overview before investing | Portfolio intelligence |

### Ecosystem Value

- **For BNB Chain:** Reduces project failure rate → healthier ecosystem, better reputation
- **For builders:** Saves weeks/months of building something doomed to fail
- **For the community:** Transparent, data-driven project health scores — reduces information asymmetry

### Data Moat & Network Effect

```
More projects tracked → Better pattern matching → More accurate predictions
→ More builders trust ShipOrSkip → More ideas validated
→ More validation data → Even better pattern matching
→ ShipOrSkip becomes THE pre-build intelligence standard
```

Every post-mortem report = content marketing built-in. Every dead project = a lesson that's viral-worthy. **Data IS the distribution strategy.**

### Onchain Composability

The `ShipOrSkipScoreboard` smart contract stores survival scores onchain. Any other dApp can:
- Query a project's survival score before integrating
- Use scores as input for DeFi risk parameters
- Build on top of ShipOrSkip's intelligence layer

---

## 4. Limitations & Future Work

### Current Limitations (Hackathon Version)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Static data (pre-computed, not real-time) | Data may be hours/days old | Pipeline can be re-run; timestamps shown |
| Twitter data availability | Some dead project accounts deleted | BSCScan + DeFiLlama data still available |
| AI hallucination risk | Gemini may generate incorrect analysis | Rule-based scoring as primary; AI narrative as supplement |
| Sample size (30-50 projects) | Not comprehensive coverage | Covers all major categories; pipeline scales |
| No user accounts | Can't save validation history across devices | localStorage for MVP; accounts post-hackathon |

### Roadmap

**Short-term (Post-Hackathon):**
- Real-time data pipeline (auto-refresh every 24h)
- Expand to 200+ BSC projects
- User accounts + validation history sync
- API access for other builders

**Long-term (SaaS Vision):**

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Browse top 50 projects, basic survival scores |
| Builder | $29/mo | Full database, idea validator, narrative trends, weekly reports |
| Investor | $99/mo | Advanced analytics, portfolio tracking, alpha signals, API access |
| Enterprise | Custom | Custom ecosystem research, white-label reports |

### Open Questions

- Can survival scoring predict future success with >70% accuracy?
- What's the optimal feedback loop between user validations and score improvements?
- How to expand beyond BNB Chain while maintaining data quality?
