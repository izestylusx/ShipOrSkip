# ShipOrSkip — AI Build Log

> **Hackathon:** Good Vibes Only: OpenClaw Edition (BNB Chain)  
> **Builder:** @tubagus  
> **AI Tools:** GitHub Copilot (Claude Opus 4.6), Gemini 2.0 Flash  
> **Period:** 14-19 Feb 2026

---

## How AI Was Used

ShipOrSkip was built with significant AI assistance throughout the entire development lifecycle — from strategic planning to code implementation. AI was used as a **specialist tool**, not a replacement for human decision-making.

### Methodology

```
Per Component:
  1. Human decides WHAT to build (scope, priority, architecture)
  2. AI generates the implementation (code, copy, configs)
  3. Human reviews + tests (quality gate)
  4. AI iterates if needed (fix/improve based on feedback)
  5. Human commits + pushes (git log)
```

**Human decisions:** Scope, priorities, cut decisions, acceptance testing, architecture sign-off, data source selection.  
**AI execution:** Code generation, data pipeline scripts, component implementation, copy writing, documentation.

---

## Build Log

### Day 0 — Pre-Build (Before Feb 14)

> Planning phase — all strategic documents were created with AI assistance.

| Time | What Was Built | Files | Commit |
|------|----------------|-------|--------|
| — | Comprehensive project plan: problem statement, solution design, architecture, data pipeline design, scoring formula, API specifications, repo structure, seed project list, tech stack evaluation, timeline | Internal planning doc (1816 lines) | `[D0]` |
| — | Brand strategy: name evaluation, market positioning, brand archetype, voice & tone, visual identity (colors, typography) | Internal brand doc | `[D0]` |
| — | Frontend architecture: page structure, validator UX flow, loading theater design, error states, behavioral design patterns, retention loops | Internal architecture doc (1184 lines) | `[D0]` |
| — | Design system: color tokens, typography scale, spacing system, effects library, Tailwind v4 integration, accessibility guide | `design-system/` (7 files) | `[D0]` |
| — | Submission documents: README.md, PROJECT.md, TECHNICAL.md scaffolded with content from planning phase | `README.md`, `docs/` | `[D0]` |

**Summary Day 0:** 5000+ lines of planning, architecture, and design system output. All AI-generated with human direction, review, and strategic decisions.

---

### Day 1 — 14 Feb 2026: Foundation + Pipeline

| Time | What Was Built | Files | Commit |
|------|----------------|-------|--------|
| | | | |

**End of Day 1 Status:**
- [ ] `npm run dev` works
- [ ] `npm run seed` outputs data/projects.json with 30+ projects
- [ ] Each project has survivalScore 0-100
- [ ] Contract deployed to BSC testnet
- [ ] .env.example complete

**Commits today:** 0/7  
**Blockers:** —  
**Key decisions:** —

---

### Day 2 — 15 Feb 2026: Frontend Core

| Time | What Was Built | Files | Commit |
|------|----------------|-------|--------|
| | | | |

**End of Day 2 Status:**
- [ ] Landing page renders with hero + stats
- [ ] Validator form accepts input
- [ ] API /api/validate returns Gemini response
- [ ] Loading theater shows progressive stages
- [ ] Result displays score + verdict + risk factors

**Commits today:** 0/5  
**Blockers:** —  
**Key decisions:** —

---

### Day 3 — 16 Feb 2026: Explorer + Detail

| Time | What Was Built | Files | Commit |
|------|----------------|-------|--------|
| | | | |

**End of Day 3 Status:**
- [ ] /projects shows 30+ project cards with filters
- [ ] /projects/[slug] shows project detail with charts
- [ ] Evidence section on landing page
- [ ] Footer with email capture

**Commits today:** 0/4  
**Blockers:** —  
**Key decisions:** —

---

### Day 4 — 17 Feb 2026: Polish + Onchain

| Time | What Was Built | Files | Commit |
|------|----------------|-------|--------|
| | | | |

**End of Day 4 Status:**
- [ ] /validate standalone page with history
- [ ] Post-result CTAs working
- [ ] Contract deployed BSC mainnet
- [ ] Scores registered onchain
- [ ] Mobile responsive all pages
- [ ] Animations (fade-in)

**Commits today:** 0/6  
**Blockers:** —  
**Key decisions:** —

---

### Day 5 — 18 Feb 2026: Finalize + Submit

| Time | What Was Built | Files | Commit |
|------|----------------|-------|--------|
| | | | |

**End of Day 5 Status:**
- [ ] PROJECT.md finalized
- [ ] TECHNICAL.md verified (setup steps work)
- [ ] bsc.address updated with mainnet contract
- [ ] Vercel production deployed
- [ ] DoraHacks BUIDL submitted
- [ ] Twitter thread posted

**Commits today:** 0/8  
**Blockers:** —  
**Key decisions:** —

---

## Summary Stats

| Metric | Value |
|--------|-------|
| **Total commits** | — |
| **Total AI-assisted tasks** | — |
| **Lines of code (AI-generated)** | — |
| **Lines of code (human-written)** | — |
| **Planning output (AI-generated)** | ~5000+ lines |
| **Data pipeline scripts** | — |
| **Frontend components** | — |
| **API routes** | — |
| **Smart contracts** | 1 |
| **Design tokens** | 5 files |
| **Build duration** | 5 days |

---

## AI Task Breakdown

> What AI was used for at each stage.

| Phase | AI Tasks | Human Tasks |
|-------|----------|-------------|
| **Planning** | Project plan, brand strategy, frontend architecture, design tokens | Scope decisions, market analysis, priority setting |
| **Foundation** | Project scaffold, data pipeline scripts, contract boilerplate | Architecture decisions, API key setup, pipeline verification |
| **Frontend** | UI components, layout, forms, loading states, result display | UX review, design decisions, browser testing |
| **Backend** | API routes, Gemini integration, scoring engine | Data validation, API selection, error handling strategy |
| **Polish** | Animations, mobile optimization, copy refinement | Final testing, deployment, submission |
| **Docs** | Documentation generation, demo script | Content review, accuracy verification |

---

## Features Cut (and Why)

| Feature | Planned Day | Cut? | Reason |
|---------|-------------|------|--------|
| | | | |

---

## Lessons Learned

> To be filled after hackathon completion.

1. —
2. —
3. —

---

*This log is updated with every commit. Last updated: 14 Feb 2026*
