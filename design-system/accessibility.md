# ShipOrSkip — Accessibility & Contrast Guide

> All color pairs must pass WCAG 2.2 Level AA minimum.  
> Text: **4.5:1** (normal), **3:1** (18px+ or 14px bold). UI elements: **3:1**.

---

## 1. Contrast Ratio Matrix — Warm Light Theme (Default)

Background: `warm-100` (#FAF9F6) — primary page surface

| Foreground | Hex | Ratio (est.) | AA Text | AA Large | Use Case |
|------------|-----|-------------|---------|----------|----------|
| Warm 900 | #2A2622 | **14.8:1** | ✅ PASS | ✅ PASS | Primary text |
| Warm 700 | #6B6560 | **4.6:1** | ✅ PASS | ✅ PASS | Secondary text |
| Warm 500 | #B5B0A6 | **2.6:1** | ❌ FAIL | ⚠️ FAIL | Decorative only |
| Stone 600 | #57534E | **5.4:1** | ✅ PASS | ✅ PASS | Tertiary text |
| **Ship 700** | **#047857** | **5.8:1** | ✅ PASS | ✅ PASS | Ship verdict text |
| Ship 600 | #0D9669 | **3.9:1** | ❌ FAIL | ✅ PASS | Large text/icons only |
| **Skip 700** | **#9B2C2C** | **7.3:1** | ✅ PASS | ✅ PASS | Skip verdict text |
| Skip 500 | #DC4A4A | **3.6:1** | ❌ FAIL | ✅ PASS | Large text/icons only |
| **Wait 700** | **#B45309** | **5.0:1** | ✅ PASS | ✅ PASS | Wait verdict text |
| Wait 600 | #D97C0A | **3.4:1** | ❌ FAIL | ✅ PASS | Large text/icons only |
| Data 600 | #2563EB | **4.6:1** | ✅ PASS | ✅ PASS | Links, data |
| Whale 600 | #7C3AED | **4.6:1** | ✅ PASS | ✅ PASS | Whale signals |

### Key Findings — Warm Light Theme
- **Ship-600, Skip-500, Wait-600 FAIL at normal text size** — use 700 shades for text
- This is why the token system defines `--verdict-*-text` at the 700 level for light mode
- Primary text (warm-900) passes with very high contrast ✅
- `warm-500` fails — use only for decorative/non-essential elements

Background: `white` (#FFFFFF) — card surfaces

| Foreground | Hex | Ratio (est.) | AA Text | AA Large | Use Case |
|------------|-----|-------------|---------|----------|----------|
| Warm 900 | #2A2622 | **15.6:1** | ✅ PASS | ✅ PASS | Primary text |
| Stone 600 | #57534E | **5.7:1** | ✅ PASS | ✅ PASS | Secondary text |
| Ship 700 | #047857 | **6.1:1** | ✅ PASS | ✅ PASS | Ship text |
| Skip 700 | #9B2C2C | **7.7:1** | ✅ PASS | ✅ PASS | Skip text |
| Wait 700 | #B45309 | **5.2:1** | ✅ PASS | ✅ PASS | Wait text |

---

## 2. Contrast Ratio Matrix — Dark Frame (Nav/Footer)

Background: `ink-900` (#1A1A1A) — navigation and footer only

| Foreground | Hex | Ratio (est.) | AA Text | AA Large | Use Case |
|------------|-----|-------------|---------|----------|----------|
| White | #FFFFFF | **16.0:1** | ✅ PASS | ✅ PASS | Nav text |
| Warm 300 | #EDEBE6 | **12.8:1** | ✅ PASS | ✅ PASS | Secondary nav text |
| Stone 400 | #A8A29E | **6.1:1** | ✅ PASS | ✅ PASS | Muted nav text |
| Ship 400 | #34D399 | **8.8:1** | ✅ PASS | ✅ PASS | Ship indicator |
| Skip 400 | #F87171 | **5.0:1** | ✅ PASS | ✅ PASS | Skip indicator |
| Wait 400 | #FBBF24 | **9.4:1** | ✅ PASS | ✅ PASS | Wait indicator |
| Data 400 | #60A5FA | **5.8:1** | ✅ PASS | ✅ PASS | Links in nav |

### Key Findings — Dark Frame
- All verdict colors at shade-400 **pass** on the ink-900 background ✅
- White + warm-300 provide excellent primary/secondary text contrast
- Dark frame is used ONLY for nav/footer — not for page content

---

## 3. Verdict Badge Accessibility

Badges use colored backgrounds with text. Inner contrast matters:

### On Warm Light Background (Page Content)

| Badge | Background | Text | Ratio | Status | Notes |
|-------|-----------|------|-------|--------|-------|
| SHIP | ship-100 (#D1FAE5) | ship-800 (#065F46) | ~10.2:1 | ✅ PASS | Soft green bg + dark text |
| SKIP | skip-100 (#FEE2E2) | skip-800 (#822727) | ~8.5:1 | ✅ PASS | Soft red bg + dark text |
| WAIT | wait-100 (#FEF3C7) | wait-800 (#92400E) | ~7.9:1 | ✅ PASS | Soft amber bg + dark text |

### Bold Badge Variant (High-emphasis)

| Badge | Background | Text | Ratio | Status | Notes |
|-------|-----------|------|-------|--------|-------|
| SHIP | ship-700 (#047857) | white (#FFF) | ~5.4:1 | ✅ PASS | Dark green bg + white |
| SKIP | skip-700 (#9B2C2C) | white (#FFF) | ~7.3:1 | ✅ PASS | Dark red bg + white |
| WAIT | wait-500 (#F59E0B) | warm-900 (#2A2622) | ~6.8:1 | ✅ PASS | Amber bg + dark text |

### Recommended Badge Palette (Accessible)

```css
/* Default — Soft badges on light background */
--badge-ship-bg:   var(--color-ship-100);   /* #D1FAE5 */
--badge-ship-text:  var(--color-ship-800);  /* #065F46 — 10.2:1 */

--badge-skip-bg:   var(--color-skip-100);   /* #FEE2E2 */
--badge-skip-text:  var(--color-skip-800);  /* #822727 — 8.5:1 */

--badge-wait-bg:   var(--color-wait-100);   /* #FEF3C7 */
--badge-wait-text:  var(--color-wait-800);  /* #92400E — 7.9:1 */

/* Bold — High-emphasis badges */
--badge-ship-bold-bg:   var(--color-ship-700);  /* #047857 — 5.4:1 w/ white */
--badge-ship-bold-text:  white;

--badge-skip-bold-bg:   var(--color-skip-700);  /* #9B2C2C — 7.3:1 w/ white */
--badge-skip-bold-text:  white;

--badge-wait-bold-bg:   var(--color-wait-500);  /* #F59E0B — 6.8:1 w/ dark */
--badge-wait-bold-text:  var(--color-warm-900);
```

### Always Pair Color with Icons
Color alone is never sufficient. Every verdict must include:
- **Text label** (SHIP / SKIP / WAIT)
- **Icon** (✓ checkmark / ✕ cross / ⏸ pause)
- **Color** (green / red / amber)

This triple-redundancy ensures accessibility for color-blind users (~8% of men).

---

## 4. Color-Blindness Safe Design

### The Problem
Red-green color blindness (deuteranopia/protanopia) makes the primary SHIP/SKIP distinction invisible through color alone.

### The Solution — Triple Encoding

| Signal | Color | Icon | Shape | Label |
|--------|-------|------|-------|-------|
| SHIP | Green | ✓ Checkmark / → Arrow | Rounded badge | "SHIP" |
| SKIP | Red | ✕ Cross / ⊘ Stop | Angular badge | "SKIP" |
| WAIT | Amber | ⏸ Pause / ◷ Clock | Diamond badge | "WAIT" |

### Additional Patterns
- Use **different saturation/brightness** (not just hue) — green is brighter, red is darker
- Add **hatching/patterns** to chart areas if red/green distinction matters
- Status dots: supplement with **shape** (● alive, ◆ zombie, ■ dead, ▲ pivoted)

---

## 5. Focus & Keyboard Accessibility

### Focus Ring Style
```css
/* Visible focus ring on all interactive elements */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--surface-base),
              0 0 0 4px var(--color-data-600);
}

/* Ensure focus ring has 3:1 contrast against adjacent colors */
/* data-600 (#2563EB) on warm-100 (#FAF9F6) = ~4.6:1 ✅ (light page) */
/* data-400 (#60A5FA) on ink-900 (#1A1A1A) = ~5.8:1 ✅ (dark frame) */
```

### Touch Target Sizing
All interactive elements must meet **WCAG 2.2 Success Criterion 2.5.8**:
- Minimum: **24×24px** (Level AA)  
- Recommended: **44×44px** (Level AAA)
- Spacing between targets: minimum **8px**

---

## 6. Motion Accessibility

### `prefers-reduced-motion`
All animations collapse to instant (0ms) when user prefers reduced motion.
This is implemented in [effects.css](tokens/effects.css).

### Rules
- Never use animation as the **only** way to convey information
- Provide static alternatives for animated charts/graphs
- Avoid parallax scrolling without opt-out
- No auto-playing animations that last >5 seconds without pause control

---

## 7. Quick Validation Checklist

Before shipping any component:

- [ ] Text contrast ≥ 4.5:1 (normal) or ≥ 3:1 (large text)
- [ ] UI element contrast ≥ 3:1 against adjacent colors
- [ ] Color is never the sole indicator of meaning
- [ ] All interactive elements have visible focus states
- [ ] Touch targets ≥ 24×24px with ≥ 8px spacing
- [ ] Reduced motion preference is respected
- [ ] Semantic HTML used (heading hierarchy, landmarks, labels)
- [ ] Screen reader announces dynamic content changes (verdict results)
- [ ] Keyboard navigable: Tab, Enter, Escape, Arrow keys work
- [ ] Skip-to-main-content link present

---

## 8. Tools for Validation

| Tool | What It Checks | URL |
|------|---------------|-----|
| WebAIM Contrast Checker | Color contrast ratios | https://webaim.org/resources/contrastchecker/ |
| Stark (Figma/Browser) | Contrast, color blindness sim | https://www.getstark.co/ |
| axe DevTools | Full WCAG audit | https://www.deque.com/axe/ |
| Lighthouse | Accessibility score | Built into Chrome DevTools |
| NVDA/VoiceOver | Screen reader testing | Free (Windows/macOS) |

---

*Validate every color pair with a contrast checker before implementation. The estimated ratios in this document should be confirmed with exact calculation using the tool above.*
