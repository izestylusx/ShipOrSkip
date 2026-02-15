# ShipOrSkip — Accessibility & Contrast Guide

> All color pairs must pass WCAG 2.2 Level AA minimum.  
> Text: **4.5:1** (normal), **3:1** (18px+ or 14px bold). UI elements: **3:1**.

---

## 1. Contrast Ratio Matrix — Dark Theme (Default)

Background: `navy-900` (#0A1628)

| Foreground | Hex | Ratio (est.) | AA Text | AA Large | Use Case |
|------------|-----|-------------|---------|----------|----------|
| White | #FFFFFF | **17.4:1** | ✅ PASS | ✅ PASS | Primary text |
| Slate 400 | #94A3B8 | **6.2:1** | ✅ PASS | ✅ PASS | Secondary text |
| Slate 500 | #64748B | **4.1:1** | ⚠️ FAIL | ✅ PASS | Tertiary (large text only!) |
| Green 500 | #00D26A | **8.0:1** | ✅ PASS | ✅ PASS | Ship verdict |
| Green 400 | #34D985 | **9.5:1** | ✅ PASS | ✅ PASS | Ship text |
| Red 400 | #FF3B5C | **5.2:1** | ✅ PASS | ✅ PASS | Skip verdict |
| Red 300 | #FF9EAC | **8.0:1** | ✅ PASS | ✅ PASS | Skip text |
| Amber 500 | #FFB800 | **7.8:1** | ✅ PASS | ✅ PASS | Wait verdict |
| Amber 300 | #FCD34D | **11.2:1** | ✅ PASS | ✅ PASS | Wait text |
| Blue 400 | #60A5FA | **6.0:1** | ✅ PASS | ✅ PASS | Links, data |
| Purple 400 | #A78BFA | **5.2:1** | ✅ PASS | ✅ PASS | Whale signals |

### Key Findings — Dark Theme
- All verdict colors **pass** on the navy-900 background ✅
- `slate-500` tertiary text **fails at normal size** — use only for 18px+ text
- Verdict badges with white text: green-500 bg (2.7:1 ⚠️), red-400 bg (3.2:1 ⚠️) — see Badge section

---

## 2. Contrast Ratio Matrix — Light Theme

Background: `white` (#FFFFFF)

| Foreground | Hex | Ratio (est.) | AA Text | AA Large | Use Case |
|------------|-----|-------------|---------|----------|----------|
| Navy 900 | #0A1628 | **17.4:1** | ✅ PASS | ✅ PASS | Primary text |
| Slate 600 | #475569 | **5.9:1** | ✅ PASS | ✅ PASS | Secondary text |
| Green 500 | #00D26A | **2.5:1** | ❌ FAIL | ❌ FAIL | **Don't use for text!** |
| **Green 700** | **#008743** | **5.1:1** | ✅ PASS | ✅ PASS | Ship text on light |
| Red 400 | #FF3B5C | **3.4:1** | ❌ FAIL | ✅ PASS | Large text only |
| **Red 700** | **#A90C24** | **7.2:1** | ✅ PASS | ✅ PASS | Skip text on light |
| Amber 500 | #FFB800 | **2.1:1** | ❌ FAIL | ❌ FAIL | **Don't use for text!** |
| **Amber 700** | **#B17309** | **4.6:1** | ✅ PASS | ✅ PASS | Wait text on light |
| Blue 600 | #2563EB | **4.6:1** | ✅ PASS | ✅ PASS | Links on light |
| Purple 600 | #7C3AED | **4.6:1** | ✅ PASS | ✅ PASS | Whale on light |

### Key Findings — Light Theme
- **Green-500, Red-400, Amber-500 all FAIL on white** — use 700 shades for text
- This is why the token system defines separate `verdict-*-text` tokens per theme

---

## 3. Verdict Badge Accessibility

Badges use colored backgrounds with text. Inner contrast matters:

| Badge | Background | Text | Ratio | Status | Fix |
|-------|-----------|------|-------|--------|-----|
| SHIP | green-500 (#00D26A) | white (#FFF) | ~2.7:1 | ⚠️ FAIL text | Use **green-700** bg or add icon |
| SKIP | red-400 (#FF3B5C) | white (#FFF) | ~3.2:1 | ⚠️ MARGINAL | Use **red-600** bg or add icon |
| WAIT | amber-500 (#FFB800) | navy-900 | ~7.8:1 | ✅ PASS | Dark text on amber works |

### Recommended Badge Palette (Accessible)

```css
/* SHIP badge — darkened green for white text contrast */
--badge-ship-bg:   var(--color-green-700);  /* #008743 — 5.4:1 w/ white */
--badge-ship-text:  white;

/* SKIP badge — darkened red for white text contrast */
--badge-skip-bg:   var(--color-red-600);   /* #D0072A — 5.6:1 w/ white */
--badge-skip-text:  white;

/* WAIT badge — amber with dark text (already passes) */
--badge-wait-bg:   var(--color-amber-500);  /* #FFB800 — 7.8:1 w/ navy */
--badge-wait-text:  var(--color-navy-900);
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
              0 0 0 4px var(--color-blue-400);
}

/* Ensure focus ring has 3:1 contrast against adjacent colors */
/* blue-400 (#60A5FA) on navy-900 (#0A1628) = ~6:1 ✅ */
/* blue-500 (#3B82F6) on white (#FFFFFF) = ~4.5:1 ✅ */
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
