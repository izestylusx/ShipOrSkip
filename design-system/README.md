# ShipOrSkip — Design System

> The systematic foundation for every screen in ShipOrSkip.  
> Tokens over hard-coded values. Accessibility as a constraint, not an afterthought.

---

## Architecture

```
design-system/
├── tokens/
│   ├── index.css          ← Import this for all tokens
│   ├── colors.css         ← Primitive scales + semantic + component tokens
│   ├── typography.css     ← Font families, sizes, weights, composites
│   ├── spacing.css        ← Spacing scale, sizing, layout containers
│   └── effects.css        ← Shadows, borders, radii, motion, z-index
├── tailwind.css           ← Tailwind v4 @theme integration
├── accessibility.md       ← Contrast tables, color-blind guide, checklist
└── README.md              ← This file
```

---

## Token Layers

All design decisions flow through three layers:

| Layer | Purpose | Example | When to Change |
|-------|---------|---------|----------------|
| **Primitive** | Raw values | `--color-ship-600: #0D9669` | Rarely (brand change) |
| **Semantic** | Contextual meaning | `--verdict-ship: var(--color-ship-600)` | Theme/mode changes |
| **Component** | Specific element | `--badge-ship-bg: var(--verdict-ship)` | Component redesign |

**Rule:** Never use primitives directly in components. Always go through semantic → component tokens.

---

## Quick Start

### Option 1: CSS Custom Properties (Framework-agnostic)
```css
@import './design-system/tokens/index.css';

.verdict-card {
  background: var(--card-bg);
  border: var(--border-default-width) solid var(--card-border);
  border-radius: var(--radius-card);
  padding: var(--padding-card);
}

.verdict-badge-ship {
  background: var(--badge-ship-bg);
  color: var(--badge-ship-text);
  border-radius: var(--radius-badge);
  padding: var(--padding-badge);
  font: var(--type-label);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.score-value {
  font: var(--type-score-xl);
  font-family: var(--font-mono);
  color: var(--score-text);
}
```

### Option 2: Tailwind v4
```css
/* In your main CSS file */
@import "tailwindcss";
@import "./design-system/tailwind.css";
```

```html
<!-- Then in your components -->
<div class="bg-white text-warm-900 rounded-xl p-5 border border-warm-300 shadow-sm">
  <span class="bg-ship-100 text-ship-800 rounded-full px-2.5 py-1 text-xs font-medium tracking-wider uppercase">
    ✓ SHIP
  </span>
  <p class="font-mono text-5xl font-bold text-warm-900">87</p>
</div>
```

---

## Color System

### Brand Palette

| Name | Role | Anchor | Scale |
|------|------|--------|-------|
| **Warm Neutrals** | Foundation/page surface | `#FAF9F6` (100) | 50–950 |
| **Ink** | Dark frame (nav/footer) | `#1A1A1A` (900) | 50–950 |
| **Teal-Green (Ship)** | Positive verdicts | `#0D9669` (600) | 50–950 |
| **Coral-Red (Skip)** | Negative verdicts | `#DC4A4A` (500) | 50–950 |
| **Warm Amber (Wait)** | Caution/zombie | `#D97C0A` (600) | 50–950 |
| **Blue (Data)** | Information/links | `#2563EB` (600) | 50–950 |
| **Purple (Whale)** | Smart money/premium | `#8B5CF6` (500) | 50–950 |
| **Stone** | Neutrals (warm undertone) | Tailwind Stone | 50–950 |

### Color Ratio
- **60%** — Warm Neutrals + Stone (surfaces, containers, backgrounds)
- **30%** — Verdict colors (teal-green/coral/amber for decisions)
- **10%** — Blue + Purple (accents, special elements)

### Theme Architecture
Default is **warm editorial light** (`warm-100` base, white cards). 
Dark frame via `data-theme="dark"` or `.theme-dark` — used for nav/footer only.

Design rationale: ShipOrSkip targets founders & vibecoders (not heavy developers).
Warm light activates "broad focus / divergent thinking" (Fredrickson 2004) optimal
for strategic ideation. Dark ink-900 creates an "authority frame" for nav/footer.

---

## Typography

| Style | Font | Weight | Size | Line Height | Use |
|-------|------|--------|------|-------------|-----|
| Hero | Inter | 800 | `clamp(48-72px)` | 1.1 | Landing hero |
| H1 | Inter | 700 | 48px (3rem) | 1.2 | Page titles |
| H2 | Inter | 600 | 36px (2.25rem) | 1.3 | Section headers |
| H3 | Inter | 600 | 30px (1.875rem) | 1.3 | Card titles |
| Body | Inter | 400 | 16px (1rem) | 1.5 | Paragraph text |
| Score XL | JetBrains Mono | 700 | 48px (3rem) | 1.0 | Large scores |
| Score | JetBrains Mono | 700 | 24px (1.5rem) | 1.0 | Inline scores |
| Label | Inter | 500 | 12px (0.75rem) | 1.25 | Badges, tags |

Max reading width: **65ch** (`--measure-base`)

---

## Spacing

8px grid system. Use tokens, never magic numbers.

| Token | Value | Common Use |
|-------|-------|-----------|
| `--space-1` | 4px | Tight gaps, icon–text |
| `--space-2` | 8px | Related items, tag gaps |
| `--space-3` | 12px | Inline spacing |
| `--space-4` | 16px | Default stack gap, card grid |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section content gaps |
| `--space-8` | 32px | Between sections |
| `--space-12` | 48px | Section padding |
| `--space-16` | 64px | Page sections |

---

## Component Patterns

### Verdict Badge
```
┌──────────────────────┐
│ ✓ SHIP  │  Score: 87 │    bg: green-700, text: white, radius: pill
├──────────────────────┤    icon + label + color = triple encoding
│ ✕ SKIP  │  Score: 23 │    bg: red-600, text: white, radius: pill
├──────────────────────┤
│ ⏸ WAIT  │  Score: 52 │    bg: amber-500, text: navy-900, radius: pill
└──────────────────────┘
```

### Score Ring
```
    ╭──────╮
   │  87   │    Monospace, bold, centered in circular progress ring
    ╰──────╯    Track: warm-300, Fill: ship-600 (70-100), wait-500 (40-69), skip-500 (0-39)
```

### Project Card
```
┌─────────────────────────────────────────┐
│  [Status dot + label]     [Verdict]     │    bg: white
│                                         │    border: warm-300
│  Project Name                           │    border-radius: 12px
│  Brief description text...              │    padding: 20px
│                                         │    hover: border → warm-500, shadow-md
│  TVL: $2.1M    Age: 4mo    Score: 72    │    shadow: glow-ship on ship verdict
└─────────────────────────────────────────┘
```

---

## Accessibility Rules

1. **Color is never the sole indicator** — always pair with icon + text label
2. **Text contrast ≥ 4.5:1** on all backgrounds (use 700 shades for text-on-light)
3. **Touch targets ≥ 24×24px** with 8px minimum spacing
4. **Focus rings visible** on all interactive elements (blue-400, 2px offset)
5. **Reduced motion respected** — all animations collapse to 0ms
6. **Semantic HTML** — proper headings, landmarks, ARIA labels

See [accessibility.md](accessibility.md) for full contrast tables and checklist.

---

## Naming Convention

| Layer | Pattern | Example |
|-------|---------|---------|
| Primitive | `--color-{scale}-{shade}` | `--color-green-500` |
| Semantic | `--{category}-{variant}` | `--verdict-ship`, `--text-primary` |
| Component | `--{component}-{property}-{variant}` | `--badge-ship-bg`, `--card-border` |
| Spacing | `--space-{multiplier}` | `--space-4` (16px) |
| Type | `--type-{style}` | `--type-h1`, `--type-score` |
| Radius | `--radius-{size}` | `--radius-xl` (12px) |
| Shadow | `--shadow-{size}` | `--shadow-lg` |
| Z-index | `--z-{layer}` | `--z-modal` |

---

## Validation Checklist

Before any UI ships:

- [ ] No hard-coded color values — all from tokens
- [ ] No hard-coded spacing — all from spacing scale
- [ ] No hard-coded font sizes — all from type scale
- [ ] Contrast checked against accessibility.md tables
- [ ] Color-blind accessible (icon + text + color)
- [ ] Focus states visible on keyboard navigation
- [ ] Reduced motion preference honored
- [ ] Touch targets meet 24px minimum
- [ ] Responsive typography scales properly
- [ ] Dark and light theme tokens validated

---

*Last updated: February 15, 2026 — Warm Editorial Light v2.0*
