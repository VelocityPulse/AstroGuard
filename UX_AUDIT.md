# AstroGuard — UX/UI Audit Report

**Auditor:** Senior UX/UI Auditor (Claude Sonnet 4.6)
**Date:** 2026-03-01
**Codebase:** `/root/AstroGuard/web-react/src/`
**Stack:** React 19, styled-components 6, Vite 6
**Scope:** Full interface audit — layout, visual design, data visualization, interactions, responsiveness, accessibility, cognitive load, missing patterns

---

## Table of Contents

1. [Layout & Information Architecture](#layout--information-architecture)
2. [Visual Design & Color](#visual-design--color)
3. [Data Visualization](#data-visualization)
4. [Interactions & Micro-interactions](#interactions--micro-interactions)
5. [Responsiveness](#responsiveness)
6. [Accessibility](#accessibility)
7. [Cognitive Load](#cognitive-load)
8. [Missing UX Patterns](#missing-ux-patterns)
9. [Executive Summary](#executive-summary)
10. [Quick Wins](#quick-wins)
11. [Effort / Impact Matrix](#effort--impact-matrix)

---

## Layout & Information Architecture

---

### [P0] No immediate "tonight" verdict — primary user question is unanswered on load

**Current:** `src/App.jsx:39–61` — After loading, the interface shows a sidebar summary and a large scrollable table. The user must scan the sidebar, decode the icon system, then scroll to find tonight's astronomical night hours in the table.

**Problem:** The primary user question for any weather app in the astronomy domain is "Is tonight good for observing?" The current layout forces a 3–5 step cognitive sequence to answer this. In field conditions (dark-adapted eyes, outdoors), this friction is compounded. There is no hero element that immediately surfaces the go/no-go answer.

**Recommendation:** Add a `TonightBanner` component rendered above `.content-area`, displaying the go/no-go verdict for tonight, the worst metric, moon illumination, and best observation window:

```jsx
// src/components/TonightBanner.jsx — new component
import styled from 'styled-components';

const Banner = styled.div`
  background: ${({ $verdict }) =>
    $verdict === 'go' ? 'rgba(105,240,174,0.08)' :
    $verdict === 'maybe' ? 'rgba(255,213,79,0.08)' :
    'rgba(239,83,80,0.08)'};
  border-bottom: 2px solid ${({ $verdict }) =>
    $verdict === 'go' ? '#69f0ae' :
    $verdict === 'maybe' ? '#ffd54f' : '#ef5350'};
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Verdict = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ $verdict }) =>
    $verdict === 'go' ? '#69f0ae' :
    $verdict === 'maybe' ? '#ffd54f' : '#ef5350'};
`;
```

**Impact:** User can answer "can I observe tonight?" within 1 second of page load instead of 10–30 seconds.

---

### [P1] Sticky sidebar top offset hardcoded — misaligns with dynamic header height

**Current:** `src/components/Sidebar.jsx:8` — `top: 58px` is hardcoded.

**Problem:** `src/App.jsx:17–22` correctly measures the real header height and stores it in `--header-h` CSS variable, but the Sidebar ignores it entirely. If the header grows (e.g., wraps to two lines on a narrow viewport), the sidebar will overlap the header, causing content to be hidden behind the sticky bar.

**Recommendation:**
```css
/* src/components/Sidebar.jsx — SidebarWrap styled component */
position: sticky;
top: var(--header-h, 58px);   /* use measured height, fall back to 58px */
max-height: calc(100vh - var(--header-h, 58px) - 8px);
```

**Impact:** Sidebar always aligns precisely with header regardless of content reflow.

---

### [P1] Scroll offset hardcoded separately from --header-h variable

**Current:** `src/App.jsx:31` — `const y = el.getBoundingClientRect().top + window.scrollY - 90;`

**Problem:** The magic number `90` is an approximation of header height plus some padding. It is unrelated to the `--header-h` CSS variable computed at lines 17–22. These two values will diverge whenever header height changes, causing the scrolled-to section to be partially hidden under the header.

**Recommendation:**
```js
// src/App.jsx:31 — replace magic number with live measurement
const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 90;
const y = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
```

**Impact:** Day sections always scroll into view correctly when clicked in the sidebar.

---

### [P2] No `<main>` or `<nav>` semantic landmarks

**Current:** `src/App.jsx:48` — content area is `<div className="content-area">`. `src/components/Sidebar.jsx:43` — sidebar is `<SidebarWrap>` (a `<div>`).

**Problem:** Without semantic landmarks, screen readers and browser tools cannot identify the primary content region or navigation. WCAG 2.4.1 requires bypass mechanisms; landmarks are the standard implementation.

**Recommendation:**
```jsx
// src/App.jsx
<main className="content-area">
  <nav aria-label="Navigation par nuit">
    <Sidebar ... />
  </nav>
  <ForecastTable ... />
</main>
```

**Impact:** Screen readers announce regions, users can jump directly to main content.

---

### [P2] Table section sub-headers duplicated on every day group — causes scanning fatigue

**Current:** `src/components/DaySection.jsx:4–16` and `src/components/ForecastTable.jsx:11–23` — identical column headers (`✓`, `H`, `Bas`, `Moy`, `Haut`, `Total`, `Humid.`, `Vent`, `Seeing`, `Transp.`, moon) appear both as a sticky `<thead>` AND as a `<tr className="sub-header">` row repeated for every day group.

**Problem:** The `<thead>` is already sticky (`background: #0a0a14`). Repeating column labels for every day section adds visual clutter and vertical space consumption without user benefit. It also creates an inconsistency — the `<thead>` and the sub-header rows have slightly different label capitalization (e.g. `Humid.` vs `Humidité`).

**Recommendation:** Remove the per-day `<tr className="sub-header">` rows from `DaySection.jsx`. Ensure the `<thead>` is truly sticky and visible at all times via `position: sticky; top: var(--header-h, 58px)`. The sticky header provides the column context.

**Impact:** Cleaner table, less vertical scrolling required, consistent labeling.

---

### [P3] "Sommaire" sidebar title is language-locked to French with no token

**Current:** `src/components/Sidebar.jsx:44` — `<Title>Sommaire</Title>`, a hardcoded French string.

**Problem:** All UI strings are hardcoded French with no i18n infrastructure, limiting international user adoption. The cloud layer labels `B:`, `M:`, `H:` in `SidebarItem.jsx:90–92` are also French abbreviations (`Bas`, `Moyen`, `Haut`) that will confuse non-French speakers.

**Recommendation:** Define a constants or i18n file. As a minimum, use descriptive English that is internationally understood in the astronomy community, or add a `lang` prop to the root and CSS `:lang()` selectors.

**Impact:** Broader adoption; cleaner separation of content from presentation.

---

## Visual Design & Color

---

### [P0] `score-no` color is invisible — contrast ratio 1.51:1

**Current:** `src/GlobalStyle.js:91` — `.score-no { color: #263238; }` used on background `#090912` (night rows) and `#0c0c1a` (day rows).

**Problem:** Measured contrast ratio: **1.51:1** against night background, **1.47:1** against day background. WCAG AA requires 4.5:1 for normal text and 3:1 for large text. The `.score-no` class renders the "not observable" dots (·) as nearly invisible dark marks. Users cannot confirm that a time slot is rated as "not observable" — it just appears empty. This also applies to the red circle emoji (🔴) row scores when clouds > 50% during nighttime, which uses `.score-no` class on a daytime dot that is also nearly invisible.

**Recommendation:**
```css
/* src/GlobalStyle.js:91 */
/* Before: .score-no { color: #263238; } */
/* After: */
.score-no { color: #37474f; }   /* contrast 2.44:1 — still low, but distinguishable */
/* Better: */
.score-no { color: #546e7a; }   /* contrast 3.61:1 — acceptable for decorative dot */
```
For the actual red score icons in night rows, ensure the 🔴 emoji is explicitly visible — it should never use `.score-no`. Audit `DataRow.jsx:19` — the `scoreHtml` for clouds > 50 uses class `score-no` incorrectly; it should use a distinct class.

**Impact:** Users can visually distinguish "no data" from "bad conditions" from "good conditions."

---

### [P0] Six color pairs fail WCAG AA contrast — measured ratios

**Current:** Multiple components. Measured contrast ratios:

| Location | Element | Foreground | Background | Ratio | Required |
|---|---|---|---|---|---|
| `GlobalStyle.js:19` | `thead th` text | `#546e7a` | `#0a0a14` | **3.65:1** | 4.5:1 |
| `GlobalStyle.js:47` | `sub-header` text | `#455a64` | `#0d0d1e` | **2.65:1** | 4.5:1 |
| `Sidebar.jsx:27` | Sidebar section title | `#37474f` | `#0c0c1c` | **2.01:1** | 4.5:1 |
| `SidebarItem.jsx:40` | Pct percentage text | `#546e7a` | `#0c0c1c` | **3.58:1** | 4.5:1 |
| `LocationSearch.jsx:10` | Input typed text | `#5c6bc0` | `#14142a` | **3.71:1** | 4.5:1 |
| `Loader.jsx:6` | Loading state text | `#3949ab` | `#0d0d18` | **2.50:1** | 4.5:1 |

**Problem:** These six pairs all fail WCAG AA (4.5:1 for text). Users with low vision, or anyone viewing in suboptimal conditions (tablet outdoors, slight ambient light), cannot read these elements. The sub-header row is practically unreadable at 2.65:1.

**Recommendation:** Increase lightness values to meet 4.5:1:

```css
/* GlobalStyle.js — thead th */
color: #78909c;   /* contrast ~5.1:1 on #0a0a14 */

/* GlobalStyle.js — sub-header td */
color: #607d8b;   /* contrast ~4.6:1 on #0d0d1e */

/* Sidebar.jsx — Title */
color: #546e7a;   /* contrast ~4.0:1 — use 0.65rem uppercase as non-text, 3:1 OK */
/* Or increase: */
color: #607d8b;   /* contrast ~4.6:1 */

/* SidebarItem.jsx — Pct */
color: #78909c;   /* contrast ~5.1:1 on #0c0c1c */

/* LocationSearch.jsx — Input color */
color: #7986cb;   /* contrast ~5.7:1 on #14142a */

/* Loader.jsx — loading color */
color: #7986cb;   /* contrast ~5.7:1 on #0d0d18 */
```

**Impact:** All text readable under WCAG AA; users with low vision and outdoor users can read the interface.

---

### [P1] Day rows use `opacity: 0.5` — destroys contrast of all daytime content

**Current:** `src/GlobalStyle.js:87` — `tr.is-day td { background-color: #0c0c1a; opacity: 0.5; }`

**Problem:** Applying `opacity: 0.5` to the entire `<tr>` reduces the effective contrast of every text element in that row by approximately half. Body text that passes at 12.58:1 becomes effectively ~3–4:1. Heatmap cell text that margionally passes at 4.0:1 becomes ~2:1. While daytime rows are intentionally de-emphasized, `opacity: 0.5` is too aggressive and makes daytime data completely unreadable for any user who might want to check conditions during civil or nautical twilight periods.

**Recommendation:** Use `opacity: 0.65` as a minimum, or preferably de-emphasize via a darker background color without touching opacity:
```css
/* GlobalStyle.js:87 */
tr.is-day td {
  background-color: #09090f;
  /* Remove opacity: 0.5 — use color alone to differentiate */
}
/* Optionally reduce text brightness of day rows with a specific class */
tr.is-day td:not(.hour):not(.score-cell) {
  filter: brightness(0.7);  /* less destructive than opacity on the whole tr */
}
```

**Impact:** Daytime data becomes readable when needed (dawn/dusk planning). Twilight observation planning is a legitimate use case.

---

### [P1] Heatmap color scale is inaccessible to red-green colorblind users

**Current:** `src/utils/colors.js:4` — `heatCell()` generates a hue from 0° (red = bad) to 120° (green = good). `cloudColor()` at line 14 uses the same hue axis.

**Problem:** Deuteranopia and protanopia affect approximately 8% of men and 0.5% of women. The red-to-green color ramp is the canonical "colorblind unfriendly" pattern. For these users, red cloud cover values and green clear sky values appear nearly identical (both appear as shades of brownish-yellow). The heatmap becomes meaningless.

**Recommendation:** Shift the hue axis to avoid red-green confusion. Use blue-to-yellow (accessible for deuteranopes), or add a secondary visual encoding:

```js
// src/utils/colors.js:4 — replace hue calculation in heatCell()
// Option A: shift to a blue(220°)→yellow(60°) scale
const hue = c < 0.5 ? 220 - c * 2 * 160 : 60 - (c - 0.5) * 2 * 60;
// t=0 bad → hue 220 (blue)  t=0.5 → hue 60 (yellow)  t=1 good → hue 0... 
// Better: use a perceptually uniform ramp

// Option B: Keep red-green but add a pattern/border indicator for high-contrast mode
// Option C: Add a subtle diagonal stripe to cells at extremes
// Option D: Use the --prefers-color-scheme or a user preference toggle
```

The simplest viable fix is to shift the "good" end from green (120°) to blue-green (160°) and keep red at 0°, which improves legibility for protanopia without redesigning the scale entirely.

**Impact:** 8% of male users gain meaningful access to the core data visualization.

---

### [P2] Heatmap cells in night rows fail WCAG AA at extreme values (t=0 and t=1)

**Current:** `src/utils/colors.js:1–12` — `heatCell(t, night=true)` at `t=0.0` produces contrast **4.01:1** and at `t=1.0` produces **2.96:1**. Both are below 4.5:1.

**Problem:** The night row background luminosity (`lig: 12 + c * 20`) is too low at the extremes, making the text dim. At `t=1.0` (best conditions, green hue 120°, bg lightness 32%, text lightness 85%) the near-white text on a bright green background reads at only 2.96:1 — paradoxically, the "best" cells are the least readable.

**Recommendation:**
```js
// src/utils/colors.js:6–7 — adjust lightness ranges
const lig = night ? 10 + c * 16 : 6 + c * 8;   // compress background lightness
const textLig = 65 + c * 20;                      // raise text lightness floor
```
This increases night cell contrast at t=1 to approximately 4.6:1 while keeping the visual heatmap effect.

**Impact:** Data values in "good" cells become consistently readable.

---

### [P2] Spacing deviates from 4px/8px grid in multiple components

**Current:** Multiple files. Identified off-grid values:

| File | Property | Value | Grid-aligned alternative |
|---|---|---|---|
| `GlobalStyle.js:18` | `thead th padding` | `5px 8px` | `4px 8px` |
| `GlobalStyle.js:44` | `sub-header padding` | `3px 8px` | `4px 8px` |
| `GlobalStyle.js:59` | `td padding` | `3px 8px` | `4px 8px` |
| `GlobalStyle.js:65` | `td height` | `26px` | `24px` or `28px` |
| `Sidebar.jsx:13` | `border-radius` | `14px` | `12px` or `16px` |
| `Sidebar.jsx:27` | `Title padding` | `12px 12px 7px` | `12px 12px 8px` |
| `SidebarItem.jsx:8` | `padding` | `9px 12px` | `8px 12px` |
| `Header.jsx:10` | `gap` | `10px` | `8px` or `12px` |
| `Header.jsx:9` | `padding` | `10px 16px` | `8px 16px` or `12px 16px` |
| `Loader.jsx` | `padding` | `60px` | `64px` |

**Problem:** Inconsistent spacing creates visual rhythm disruption. The 4px/8px grid is the de facto standard for modern UI systems (Material Design, Apple HIG, Radix UI). Off-grid values result in subtle visual noise that experienced users perceive as "something feels off" without identifying the cause.

**Recommendation:** Sweep all components and align to a strict 4px grid. Establish CSS custom properties:
```css
/* Add to GlobalStyle.js */
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
}
```

**Impact:** Visual consistency; easier future maintenance; less "off" feeling for experienced users.

---

### [P3] Pure black body background — reduces perceived elevation contrast

**Current:** `src/GlobalStyle.js:7` — `background: #0d0d18` for body. Night rows use `#090912`, nearly pure black.

**Problem:** While `#0d0d18` is not pure black (#000000), the system lacks a clear elevation model. The night rows (`#090912`) and the thead background (`#0a0a14`) are darker than the body background, which inverts the expected elevation hierarchy (content should be elevated above background, not recessed). Elevation in dark themes is typically achieved by lightening, not darkening.

**Recommendation:** Establish an elevation system with clear steps:
```css
/* Elevation tiers (lightest = most elevated) */
--surface-0: #080810;   /* app background */
--surface-1: #0d0d1c;   /* table base */
--surface-2: #111126;   /* row hover, sidebar */
--surface-3: #161630;   /* dropdown, active states */
```
Night rows should be at elevation 0 (darkest, recessed) while the sidebar and header use elevation 2–3 (most elevated).

**Impact:** Clear visual depth hierarchy; more polished dark-theme execution.

---

## Data Visualization

---

### [P1] Wind column has no unit — ambiguous data

**Current:** `src/components/ForecastTable.jsx:19` — header label is `'Vent'` (French for "wind"). `src/components/DataRow.jsx:39` — value rendered as plain number `{wind}`. `src/hooks/useWeatherData.js:51` — raw value from Open-Meteo `windspeed_10m` field.

**Problem:** Open-Meteo's `windspeed_10m` field defaults to km/h. There is no unit shown in any column header or tooltip. A user cannot know if "15" means 15 km/h (light breeze, fine for observing) or 15 m/s (gale force, impossible). For astronomy, the critical threshold for wind-induced telescope shake is typically ~20–25 km/h.

**Recommendation:**
```jsx
// src/components/ForecastTable.jsx:19
{ label: 'Vent km/h', sep: false },

// Also update DaySection.jsx:11
{ label: 'Vent km/h', sep: false },

// Or use a tooltip approach — add title attribute to th elements
<th title="Vitesse du vent (km/h)" className={h.sep ? 'sep' : ''}>Vent</th>
```

**Impact:** Users can immediately assess wind impact without referring to external documentation.

---

### [P1] Seeing and Transparency scales are unexplained — 1/8 format is opaque to newcomers

**Current:** `src/components/DataRow.jsx:40–41` — values rendered as `{seeing}/8` and `{transparency}/8`. There is no legend, tooltip, or explanation anywhere in the interface.

**Problem:** The 1/8 to 8/8 seeing and transparency scales come from the 7timer! API and follow the International Seeing scale (1=terrible, 8=perfect). New users will not know this. There is no legend, no tooltip, no link to explanation. The values also show `—` when seeing/transparency data is unavailable (which happens frequently), with no explanation of why.

**Recommendation:**
```jsx
// Add a legend row at the bottom of the table, or a tooltip on the column headers
// Quick fix: add title attributes to the th elements in ForecastTable.jsx
{ label: 'Seeing', title: 'Seeing atmosphérique 1 (mauvais) → 8 (excellent)', sep: true },
{ label: 'Transp.', title: 'Transparence 1 (mauvais) → 8 (excellent)', sep: false },

// In the th rendering:
<th key={i} className={h.sep ? 'sep' : ''} title={h.title}>{h.label}</th>
```

**Impact:** New astronomy users understand the scale without leaving the page.

---

### [P2] Moon metric inconsistency — cycle % in header, illumination % in table

**Current:** `src/components/MoonBadge.jsx:13` — displays moon cycle percentage (`pct` from `moonPhase()`). `src/components/DataRow.jsx:24,42` — displays illumination percentage (`illum` from `moonIllumination()`). These are different values — cycle % is linear (0% = new moon, 100% = end of cycle), while illumination % follows a cosine curve.

**Problem:** At 50% of the lunar cycle (half-moon), illumination is approximately 50%, so values are similar at first glance. But at 25% cycle (crescent), illumination is only ~15%, while the header would show "25% du cycle." Users comparing the header to table cells will get inconsistent mental models of moon impact.

**Recommendation:** Standardize on illumination percentage throughout:
```js
// src/components/MoonBadge.jsx — replace moonPhase() with moonIllumination()
import { moonIllumination, moonPhase } from '../utils/astronomy.js';

export default function MoonBadge() {
  const now = new Date();
  const phase = moonPhase(now);
  const illum = moonIllumination(now);
  return (
    <Badge>
      {phase.emoji} {illum}% illuminé · seuil nuages ≤{THR_CLOUD}%
    </Badge>
  );
}
```

**Impact:** Consistent mental model; users understand moon impact uniformly across the interface.

---

### [P2] `THR_CLOUD` constant duplicated across files — maintenance risk

**Current:** `src/components/MoonBadge.jsx:10` — `const THR_CLOUD = 20;` and `src/components/DataRow.jsx:4` — `const THR_CLOUD = 20;`

**Problem:** The cloud threshold value is defined in two separate files. If it needs to change (e.g., to accommodate high-altitude sites where 30% cloud cover is tolerable), a developer must update two files, risking one being missed. This is a classic single-source-of-truth violation.

**Recommendation:**
```js
// src/utils/constants.js — new file
export const THR_CLOUD = 20;   // % cloud cover threshold for "go" observation

// src/components/DataRow.jsx:4 — replace with import
import { THR_CLOUD } from '../utils/constants.js';

// src/components/MoonBadge.jsx:10 — replace with import
import { THR_CLOUD } from '../utils/constants.js';
```

**Impact:** Single edit point for threshold changes; future config UI can drive this constant.

---

### [P2] "H" column header is critically ambiguous

**Current:** `src/components/ForecastTable.jsx:13` — `{ label: 'H', sep: false }`. This column is positioned immediately after the score column (✓) and before the cloud layers.

**Problem:** "H" could reasonably be interpreted as "Hour" (the time column that follows), "Humidity" (a later column labeled "Humid."), "High clouds" (a different later column labeled "Haut"), or simply a row number. The actual column renders the hour label (`00h`, `01h`, etc.) in `DataRow.jsx:25`. The column header should be self-evident.

**Recommendation:**
```js
// src/components/ForecastTable.jsx:13
{ label: 'Heure', sep: false },
// or
{ label: 'h', sep: false },  // lowercase to suggest it's unit abbreviation

// And update DaySection.jsx:6 consistently
{ label: 'Heure', sep: false },
```

**Impact:** Eliminates ambiguity; users immediately understand the column structure.

---

### [P3] Heatmap color scale direction is inconsistent with astronomy convention

**Current:** `src/utils/colors.js:4` — `t=0` is red (bad), `t=1` is green (good). For clouds, `tCloud(v) = 1 - v/100` inverts so 0% cloud = green = good.

**Problem:** In the astronomical community, color conventions for sky quality maps (Clear Outside, Astroplanner, SkySafari) typically use blue for excellent conditions and red/orange for poor conditions. The green "go" color also competes visually with the score-go green emoji (✅), making the interface feel redundant and potentially creating ambiguity about which green matters.

**Recommendation:** This is a stylistic suggestion — the current convention is not wrong, just non-standard. If redesigning, consider a blue-to-orange scale that aligns with sky quality map conventions and resolves colorblind accessibility simultaneously.

**Impact:** Familiarity for experienced astronomers; differentiation from score indicators.

---

## Interactions & Micro-interactions

---

### [P1] LocationSearch input lacks keyboard navigation in dropdown

**Current:** `src/components/LocationSearch.jsx:52–129` — dropdown opens on type, items respond to `onClick` only. No `onKeyDown` handler exists on the input or dropdown items.

**Problem:** Users who type a location name and expect to select from results using arrow keys + Enter cannot do so. They must remove their hand from the keyboard to click. This is especially problematic on laptop trackpads and is a standard expectation for all autocomplete inputs since 2010.

**Recommendation:**
```jsx
// src/components/LocationSearch.jsx — add keyboard handler to Input
const [focusedIndex, setFocusedIndex] = useState(-1);

const handleKeyDown = (e) => {
  if (!open || results.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setFocusedIndex(i => Math.min(i + 1, results.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setFocusedIndex(i => Math.max(i - 1, 0));
  } else if (e.key === 'Enter' && focusedIndex >= 0) {
    e.preventDefault();
    handleSelect(results[focusedIndex]);
  } else if (e.key === 'Escape') {
    setOpen(false);
  }
};

// Add to Input component:
<Input onKeyDown={handleKeyDown} aria-autocomplete="list" aria-expanded={open} />
```

**Impact:** Keyboard users and power users can select locations without mouse interaction.

---

### [P1] `outline: none` on LocationSearch input removes focus indicator

**Current:** `src/components/LocationSearch.jsx:18` — `outline: none;` on the `Input` styled component. No custom focus indicator replaces it.

**Problem:** Removing the outline without providing a visible replacement violates WCAG 2.4.7 (Focus Visible). Keyboard users cannot see where focus is on the page. The `&:focus { border-color: #3949ab; }` at line 19 provides a border color change, but the 1px indigo border on a dark background at contrast ratio ~2.37:1 is below the WCAG 2.4.11 minimum for focus indicators.

**Recommendation:**
```css
/* src/components/LocationSearch.jsx — Input styled component */
outline: none;
&:focus {
  border-color: #7986cb;
  box-shadow: 0 0 0 2px rgba(121, 134, 203, 0.35);  /* visible glow */
}
```

**Impact:** Keyboard users can track focus; WCAG 2.4.7 compliance.

---

### [P2] SidebarItem is a `<div>` with `onClick` — not keyboard accessible

**Current:** `src/components/SidebarItem.jsx:82` — `<Item ... onClick={onClick}>` where `Item` is a `styled.div`.

**Problem:** A `<div>` with an `onClick` is not focusable by default and is not in the tab order. Keyboard users cannot navigate the sidebar day list. Screen readers will not announce it as interactive. This violates WCAG 2.1.1 (Keyboard) and 4.1.2 (Name, Role, Value).

**Recommendation:**
```jsx
// src/components/SidebarItem.jsx:82
// Option A: Use a button element
const Item = styled.button`
  /* ... same styles ... */
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
`;

// Option B: Add ARIA and keyboard handler to div
<Item
  role="button"
  tabIndex={0}
  aria-current={active ? 'true' : undefined}
  onClick={onClick}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
>
```

**Impact:** Keyboard users can navigate between nights using Tab and Enter.

---

### [P2] No debounce feedback during LocationSearch network request

**Current:** `src/components/LocationSearch.jsx:64–85` — a 300ms debounce is implemented correctly, but there is no loading indicator during the fetch. The user sees nothing between typing (>2 chars) and results appearing.

**Problem:** If the Open-Meteo geocoding API is slow (>500ms), the user has no feedback that their query is being processed. They may retype or believe the search is broken. The 300ms debounce is good practice but the network request itself has no feedback state.

**Recommendation:**
```jsx
// src/components/LocationSearch.jsx — add loading state
const [searching, setSearching] = useState(false);

// In handleInput, before the setTimeout:
setSearching(true);

// In the fetch .then():
setSearching(false);

// In .catch():
setSearching(false);

// In render, add to Input:
<Input placeholder={searching ? 'Recherche...' : 'Rechercher une ville...'} />
// Or add a spinner icon inside the Wrap
```

**Impact:** Users know their query is processing; reduces perceived latency and false error assumptions.

---

### [P2] Row hover state uses `filter: brightness(1.2)` — affects all colors uniformly

**Current:** `src/GlobalStyle.js:56` — `tbody tr.data-row:hover { filter: brightness(1.2); }`

**Problem:** `filter: brightness(1.2)` affects the entire row, including all heatmap cells, text colors, and backgrounds. This creates an inconsistent visual effect — green cells become brighter green, red cells become brighter red, which changes the perceived data meaning. It also affects the separating borders, causing them to appear lighter and blending with content. A proper hover state should highlight the row without altering data-encoding colors.

**Recommendation:**
```css
/* GlobalStyle.js:56 */
tbody tr.data-row:hover > td {
  box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.05);
}
/* Or use a different property that doesn't alter child filter */
tbody tr.data-row { position: relative; }
tbody tr.data-row:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.04);
  pointer-events: none;
}
```

**Impact:** Row highlighting no longer distorts color-encoded data values.

---

### [P3] `window.scrollTo` smooth behavior not gated on `prefers-reduced-motion`

**Current:** `src/App.jsx:32` — `window.scrollTo({ top: y, behavior: 'smooth' });`

**Problem:** Users who have enabled "Reduce Motion" in their OS settings (approximately 26% of users based on accessibility surveys) will still experience smooth scrolling, which can trigger nausea or disorientation in users with vestibular disorders. This violates WCAG 2.3.3 (Animation from Interactions — AAA, but strongly recommended).

**Recommendation:**
```js
// src/App.jsx:32
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.scrollTo({
  top: y,
  behavior: prefersReducedMotion ? 'instant' : 'smooth',
});
```

**Impact:** Users with vestibular sensitivities are not harmed by unexpected motion.

---

## Responsiveness

---

### [P0] Zero media queries — interface completely breaks on mobile

**Current:** No media queries exist in any component or `GlobalStyle.js`. The viewport meta is correctly set in `index.html:5`.

**Problem:** The layout depends on `display: flex` in `.content-area` (row direction, no wrap). A 230px sidebar plus a table that is `width: fit-content` (can easily exceed 600px for 10 columns) will overflow a 375px mobile viewport. On mobile:
- The sidebar and table render side by side and overflow the screen
- The table cannot be scrolled independently — the whole page must be scrolled horizontally
- The header does not reflow — the title, subtitle, 220px search input, and moon badge will not fit on one line
- The LocationSearch dropdown is 300px wide and may overflow the viewport

**Recommendation:** Implement a two-breakpoint responsive strategy:

```css
/* Add to GlobalStyle.js */
@media (max-width: 768px) {
  .content-area {
    flex-direction: column;
    padding: 8px;
    gap: 12px;
  }
}

/* Hide sidebar on mobile, convert to a horizontal scrollable tab row */
@media (max-width: 768px) {
  /* Sidebar becomes horizontal strip at top */
}
```

At minimum, add `overflow-x: auto` to the table wrapper and make `.content-area` column-stacking on small screens. The sidebar should collapse to a horizontally scrolling strip or a dropdown selector on mobile.

**Impact:** The application becomes usable on mobile devices — critical given that many astronomers check conditions from their phone at the telescope.

---

### [P1] LocationSearch input fixed at 220px — consumes too much header space on small screens

**Current:** `src/components/LocationSearch.jsx:15` — `width: 220px;` fixed.

**Problem:** On a 375px mobile screen, a 220px input leaves almost no room for the title, moon badge, and pin icon. Even on tablet (768px), the header will feel cramped. The `margin-left: 6px` on the `Wrap` is cosmetic and not enough.

**Recommendation:**
```css
/* src/components/LocationSearch.jsx — Input */
width: 220px;

@media (max-width: 600px) {
  width: 100%;
  max-width: 300px;
}

/* Make dropdown position aware to avoid off-screen */
@media (max-width: 600px) {
  /* Dropdown */
  width: 100vw;
  left: 50%;
  transform: translateX(-50%);
}
```

**Impact:** Search input usable on all screen sizes.

---

### [P1] Table cells at `height: 26px` — unusable tap targets on touch devices

**Current:** `src/GlobalStyle.js:65` — `height: 26px` on `td`.

**Problem:** 26px is well below the 44px minimum recommended by Apple HIG and Google Material Design for touch targets. While table data cells are not typically tappable, users on touch devices may attempt to long-press for tooltips or selection, and the small size makes the entire table feel cramped and unnavigable on touch screens.

**Recommendation:** For the table in its current form, increase row height to 32px minimum (acceptable for dense data tables, per Material Design data table guidelines which allow 32px for dense tables). For a mobile-specific view, consider a card-based layout rather than a dense table.

```css
/* GlobalStyle.js:65 */
td { height: 32px; }  /* dense but acceptable */

@media (max-width: 768px) {
  td { height: 40px; }  /* closer to touch target minimum */
}
```

**Impact:** Improved touch ergonomics; fewer mis-taps.

---

## Accessibility

---

### [P0] LocationSearch has no ARIA — fails automated accessibility audits

**Current:** `src/components/LocationSearch.jsx:104–128` — the combobox pattern (input + dropdown list) has no ARIA markup whatsoever.

**Problem:** This violates WCAG 4.1.2 (Name, Role, Value) and the WAI-ARIA Authoring Practices for combobox. Screen readers will announce the input as a plain text field, will not announce results, and cannot navigate the dropdown. The pattern implemented here is a combobox and must follow the WAI-ARIA combobox pattern.

**Recommendation:**
```jsx
// src/components/LocationSearch.jsx
<Wrap ref={wrapRef} role="combobox" aria-expanded={open} aria-haspopup="listbox">
  <Input
    type="text"
    aria-label="Rechercher une ville"
    aria-autocomplete="list"
    aria-controls="location-listbox"
    aria-activedescendant={focusedIndex >= 0 ? `loc-option-${focusedIndex}` : undefined}
    placeholder="Rechercher une ville..."
    value={query}
    onChange={handleInput}
    onKeyDown={handleKeyDown}
    autoComplete="off"
  />
  {open && results.length > 0 && (
    <Dropdown id="location-listbox" role="listbox" aria-label="Villes trouvées">
      {results.map((r, idx) => (
        <LocItem
          key={`${r.latitude}-${r.longitude}-${r.name}`}
          role="option"
          id={`loc-option-${idx}`}
          aria-selected={focusedIndex === idx}
          onClick={() => handleSelect(r)}
        >
          {r.name}
          <LocSub>{sub}</LocSub>
        </LocItem>
      ))}
    </Dropdown>
  )}
</Wrap>
```

**Impact:** Screen reader users can search for locations; automated accessibility audits pass.

---

### [P0] Data table missing `scope` attributes and accessible structure

**Current:** `src/components/ForecastTable.jsx:42–46` — `<th>` elements rendered without `scope` attribute. `src/components/DaySection.jsx:31` — day header `<td colSpan={11}>` is a presentational row masquerading as a section header.

**Problem:** Without `scope="col"` on column headers, screen readers cannot associate header cells with data cells in complex tables. The day header row uses `<td>` instead of a semantic section boundary. The table also has no `<caption>` or `aria-label`. This fails WCAG 1.3.1 (Info and Relationships).

**Recommendation:**
```jsx
// src/components/ForecastTable.jsx:42–46
<th key={i} scope="col" className={h.sep ? 'sep' : ''}>
  {h.label}
</th>

// Add table caption
<Table aria-label="Prévisions météo astronomiques">

// src/components/DaySection.jsx:31 — use th with correct scope
<tr className="day-header" data-day={day} id={`day-${day}`} ref={ref}>
  <th scope="rowgroup" colSpan={11}>{'\uD83D\uDCC5'} {buildDayLabel(day)}</th>
</tr>
```

**Impact:** Screen readers correctly announce column headers for every data cell; table navigation works for assistive technology users.

---

### [P1] Loader component has no ARIA live region

**Current:** `src/components/Loader.jsx:9–11` — renders a div with emoji and text. No ARIA attributes.

**Problem:** When the page transitions from loader to content, screen readers are not notified. Users who navigated to the page and waited will not know when data is available. The error state also has no `role="alert"` to trigger immediate announcement.

**Recommendation:**
```jsx
// src/components/Loader.jsx
export default function Loader({ error }) {
  if (error) {
    return (
      <Wrapper $error role="alert" aria-live="assertive">
        {'\u274C'} {error}
      </Wrapper>
    );
  }
  return (
    <Wrapper role="status" aria-live="polite" aria-label="Chargement des prévisions en cours">
      {'\u23F3'} Chargement...
    </Wrapper>
  );
}
```

**Impact:** Screen reader users are informed when content loads or errors occur.

---

### [P1] SidebarItem `onClick` only — fails WCAG 2.1.1 (Keyboard)

**Current:** `src/components/SidebarItem.jsx:83` — `<Item ... onClick={onClick}>` on a `styled.div`. No `tabIndex`, no `onKeyDown`.

**Problem:** A `<div>` with `onClick` is not focusable and not keyboard accessible. Keyboard-only users cannot interact with the sidebar navigation. This fails WCAG 2.1.1 (Keyboard) at Level A — the most fundamental accessibility requirement.

**Recommendation:** Convert to `styled.button` or add `tabIndex={0}`, `role="button"`, and `onKeyDown` — detailed in Interactions section above.

**Impact:** WCAG 2.1.1 Level A compliance; keyboard users can navigate the sidebar.

---

### [P2] Emoji used as sole communication medium for scores — no text alternative

**Current:** `src/components/DataRow.jsx:15–20` — score indicators are raw Unicode emoji (`✅`, `▲`, `🔴`). `src/components/SidebarItem.jsx:65–67` — same pattern.

**Problem:** While emoji have Unicode names, screen readers announce them differently across platforms (NVDA says "check mark button emoji", VoiceOver says "white heavy check mark"). The intent ("good for observing", "marginal", "poor") is not communicated. Additionally, emoji rendering varies across operating systems and may appear as colored squares on some systems.

**Recommendation:**
```jsx
// src/components/DataRow.jsx — wrap score emoji in span with aria-label
<span className="score-go" aria-label="Bonne nuit d'observation">
  {'\u2705'}
</span>
<span className="score-maybe" aria-label="Observation marginale">
  {'\u25B2'}
</span>
<span className="score-no" aria-label="Mauvaises conditions">
  {'\uD83D\uDD34'}
</span>
```

**Impact:** Screen reader users understand the observation quality without interpreting emoji.

---

### [P2] No `prefers-reduced-motion` support anywhere in the codebase

**Current:** `src/components/SidebarItem.jsx:8` — `transition: background 0.15s;`. `src/App.jsx:32` — smooth scroll. No `@media (prefers-reduced-motion: reduce)` in any file.

**Problem:** Users who have enabled reduced motion in their OS (a growing accessibility feature used by people with vestibular disorders, ADHD, and migraines) will experience all animations and transitions. While 0.15s transitions are brief, the pattern of ignoring reduced motion preferences is a systemic issue.

**Recommendation:**
```css
/* Add to GlobalStyle.js */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

**Impact:** Respects OS-level accessibility preferences; protects users with vestibular disorders.

---

## Cognitive Load

---

### [P1] No visual distinction for "tonight" — all nights appear equal in sidebar

**Current:** `src/components/SidebarItem.jsx:60–96` — all sidebar items render identically except for the active state (blue left border via `&.active`). The active state is scroll-driven, not date-driven — "tonight" has no persistent visual identity.

**Problem:** The core use case — "check tonight's conditions" — requires the user to know which sidebar entry corresponds to tonight. There is no "TONIGHT" badge, no date highlight, no visual distinction. Users must mentally calculate which entry is tonight from the `dim-dim+1` date label format.

**Recommendation:**
```jsx
// src/components/SidebarItem.jsx — add tonight detection
const isToday = day === new Date().toISOString().slice(0, 10);

// Add badge to Top row
{isToday && (
  <span style={{
    background: '#1a1a4a',
    color: '#7986cb',
    fontSize: '0.55rem',
    padding: '1px 4px',
    borderRadius: '3px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }}>
    Ce soir
  </span>
)}
```

**Impact:** Users instantly identify tonight's entry; primary question answered in under 2 seconds.

---

### [P2] Day section label format is dense and hard to parse quickly

**Current:** `src/components/DaySection.jsx:23–26` — `buildDayLabel()` produces e.g. `"jeudi-vendredi 14 mars 2026"`. `src/components/SidebarItem.jsx:74–76` — sidebar produces e.g. `"jeu-ven 14 mars"`.

**Problem:** The `weekdayPrev-weekdayCurr date` format (night spans two calendar days) is technically correct but cognitively taxing. Users must parse "this is the night of Thursday going into Friday." The dash-concatenated format is not a standard date representation. The full date label in the table header (`jeudi-vendredi 14 mars 2026`) takes significant reading effort compared to a clearer "Nuit du jeu 13 → ven 14 mars."

**Recommendation:**
```js
// src/components/DaySection.jsx:buildDayLabel()
function buildDayLabel(day) {
  const t = new Date(day + 'T12:00:00');
  const prev = new Date(t);
  prev.setDate(prev.getDate() - 1);
  const prevLabel = prev.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const currLabel = t.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  return `Nuit du ${prevLabel} → ${currLabel}`;
}
```
Result: `"Nuit du jeu. 13 mars → ven. 14"` — immediately parseable as an overnight span.

**Impact:** Users understand the time span of each section at a glance.

---

### [P2] API fetch error message is raw JavaScript exception text

**Current:** `src/hooks/useWeatherData.js:106–109` — `setError(e.message)` stores the raw JavaScript `Error.message`. `src/components/Loader.jsx:10` renders it with `❌ {error}`.

**Problem:** JavaScript network errors produce messages like `"Failed to fetch"`, `"NetworkError when attempting to fetch resource"`, or `"The operation was aborted"`. These are developer-facing error messages, not user-facing copy. Users do not understand what action to take.

**Recommendation:**
```js
// src/hooks/useWeatherData.js:106–109
.catch((e) => {
  if (cancelled) return;
  const isNetwork = e instanceof TypeError && e.message.includes('fetch');
  const userMessage = isNetwork
    ? 'Impossible de charger les prévisions. Vérifiez votre connexion internet.'
    : 'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
  setError(userMessage);
  setLoading(false);
});
```

**Impact:** Users understand what happened and what to do next; reduced support burden.

---

### [P3] Timezone hardcoded to `Europe/Paris` in API call

**Current:** `src/utils/api.js:4` — `&timezone=Europe/Paris` hardcoded in the Open-Meteo URL.

**Problem:** A user in Tokyo or New York using the location search to find a city outside Europe will receive data keyed to Paris time zones. Sunrise/sunset calculations will be wrong, night detection will be wrong, and the table hours will be Paris-local time even when the selected location is in a different timezone. This is a data correctness issue.

**Recommendation:**
```js
// src/utils/api.js:1–6 — use auto timezone detection
export async function fetchOpenMeteo(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,relativehumidity_2m,windspeed_10m` +
    `&daily=sunset,sunrise&timezone=auto&forecast_days=8`  // 'auto' = location's local timezone
  );
  return r.json();
}
```

Open-Meteo supports `timezone=auto` which returns times in the location's local timezone. This is a one-word fix with significant data correctness impact.

**Impact:** Correct times for all global locations; international usability.

---

## Missing UX Patterns

---

### [P1] No loading skeleton — single spinner emoji is inadequate for a data-dense app

**Current:** `src/components/Loader.jsx:10` — `{'\u23F3'} Chargement...`

**Problem:** A single hourglass emoji with text provides no layout context. Users do not know if they are waiting for a table, a chart, a form, or any other type of content. Modern research (Facebook 2014, Lincoln Loop 2017) shows skeleton screens reduce perceived wait time and improve user satisfaction compared to spinners. The loading state here is also the error state container — conflating them makes the component harder to reason about.

**Recommendation:** Create a `LoadingSkeleton` component that mirrors the actual layout:
```jsx
// src/components/LoadingSkeleton.jsx — new component
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
`;

const SkeletonRow = styled.div`
  height: 26px;
  background: linear-gradient(90deg, #0d0d1c 25%, #111128 50%, #0d0d1c 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 3px;
  margin-bottom: 2px;
`;

export default function LoadingSkeleton() {
  return (
    <div className="content-area" aria-busy="true" aria-label="Chargement des prévisions">
      {/* Skeleton sidebar */}
      <div style={{ width: 230 }}>
        {[...Array(7)].map((_, i) => <SkeletonRow key={i} style={{ height: 60, marginBottom: 4 }} />)}
      </div>
      {/* Skeleton table */}
      <div style={{ flex: 1 }}>
        {[...Array(20)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
```

**Impact:** Users understand layout context during loading; perceived performance improves.

---

### [P1] No empty state for LocationSearch with no results

**Current:** `src/components/LocationSearch.jsx:76–79` — when geocoding returns no results, `setOpen(false)` is called silently. The input remains populated with the query, and nothing happens.

**Problem:** Users who type a valid-seeming but unrecognized location name get zero feedback. They do not know if the search failed, is still processing, or if the location does not exist. "Search returned no results" is one of the most important states in any search UI.

**Recommendation:**
```jsx
// src/components/LocationSearch.jsx:76–79 — show empty state
.then((data) => {
  if (data.results && data.results.length) {
    setResults(data.results);
    setOpen(true);
    setNoResults(false);
  } else {
    setResults([]);
    setNoResults(true);
    setOpen(true);
  }
})

// In Dropdown render:
{open && noResults && (
  <Dropdown>
    <LocItem style={{ color: '#546e7a', cursor: 'default' }}>
      Aucune ville trouvée pour "{query}"
    </LocItem>
  </Dropdown>
)}
```

**Impact:** Users understand why their search produced no action; reduced confusion and repeated input.

---

### [P2] No data freshness indicator — users cannot tell if data is stale

**Current:** No timestamp or freshness indicator anywhere in the interface. Open-Meteo updates forecast data approximately every hour. 7timer! updates every 3 hours.

**Problem:** Astronomy planning is time-sensitive. A user who loaded the page 4 hours ago and walks out to set up their telescope may be looking at data that is no longer accurate. There is no way to know when the data was fetched. "Last updated X minutes ago" is a standard pattern for all real-time weather applications.

**Recommendation:**
```js
// src/hooks/useWeatherData.js — add fetchedAt timestamp
setData({ dayGroups, nightStats, sunMap, fetchedAt: new Date() });

// src/components/Header.jsx or a new component — display relative time
import { useEffect, useState } from 'react';
function FreshnessBadge({ fetchedAt }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const mins = Math.floor((Date.now() - fetchedAt) / 60000);
      setLabel(mins < 1 ? 'À l\'instant' : `Il y a ${mins} min`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [fetchedAt]);
  return <span style={{ fontSize: '0.65rem', color: '#37474f' }}>{label}</span>;
}
```

**Impact:** Users know if they need to refresh; trust in data accuracy increases.

---

### [P2] No retry mechanism on error — user must manually refresh browser

**Current:** `src/components/Loader.jsx:10` — error state shows message with no action. `src/hooks/useWeatherData.js` has no retry logic.

**Problem:** Network errors are transient. A user who gets a "Failed to fetch" error must manually hit browser refresh, losing their location selection if the page wasn't cached. A simple "Réessayer" button reduces recovery friction dramatically.

**Recommendation:**
```jsx
// src/components/Loader.jsx — add retry button
export default function Loader({ error, onRetry }) {
  if (error) return (
    <Wrapper $error role="alert">
      {'\u274C'} {error}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginLeft: 12, padding: '4px 12px', cursor: 'pointer',
                   background: '#1a1a3a', border: '1px solid #3949ab',
                   borderRadius: 4, color: '#7986cb' }}
        >
          Réessayer
        </button>
      )}
    </Wrapper>
  );
  return <Wrapper role="status">{'\u23F3'} Chargement...</Wrapper>;
}

// src/App.jsx — pass retry handler
const [retryKey, setRetryKey] = useState(0);
// Pass retryKey to useWeatherData as a dependency trigger
```

**Impact:** Users can recover from transient network errors without manual browser refresh.

---

### [P3] No first-use onboarding — the seeing/transparency scale is unexplained

**Current:** No onboarding, tooltip system, or help documentation exists anywhere in the codebase.

**Problem:** New users encounter a dense table with unlabeled columns (`✓`, `H`, `Bas`, `Moy`, `Haut`), unexplained scales (`1/8` to `8/8`), no wind units, and French-only labels. The cognitive overhead of interpreting this table without guidance is high. The astronomy context (clear skies, seeing conditions, transparency) requires domain knowledge that not all users will bring.

**Recommendation:** Add a collapsible legend below the table or a `?` help icon in the header that opens a modal with:
- Column definitions (what each header means)
- Seeing scale explanation (1=terrible, 8=perfect atmospheric stability)  
- Transparency scale explanation  
- Threshold explanation (why 20% cloud cover is the threshold)
- Color scale explanation (green=good, red=poor)

**Impact:** New users become productive immediately; reduced cognitive barrier for entry-level amateur astronomers.

---

## Executive Summary

The five highest-impact improvements for AstroGuard, in priority order:

**1. Add a "Tonight" hero verdict banner (P0 — Information Architecture)**
The app's core purpose is to answer "can I observe tonight?" in seconds. Currently this takes 30+ seconds of scanning. A single banner above the table with a go/no-go verdict, tonight's best observation window, and moon illumination would transform the first-use experience. File: new `TonightBanner.jsx`, data from `useWeatherData.js`.

**2. Fix the six failing contrast ratios (P0 — Accessibility/Visual Design)**
Six text color pairs fail WCAG AA: `sub-header` text (2.65:1), Sidebar title (2.01:1), loading state (2.50:1), and three others. These fail basic readability for users with low vision and in outdoor conditions. All fixes are 1-line CSS color changes. Files: `GlobalStyle.js`, `Sidebar.jsx`, `SidebarItem.jsx`, `LocationSearch.jsx`, `Loader.jsx`.

**3. Fix `score-no` invisible color — 1.51:1 contrast ratio (P0 — Visual Design)**
The "poor conditions" indicator is effectively invisible against its background. Users cannot distinguish "no data" from "bad conditions." One-line fix in `GlobalStyle.js:91`.

**4. Implement responsive layout with media queries (P0 — Responsiveness)**
Zero media queries exist. The app is completely unusable on mobile. Astronomers commonly check conditions on phones at the telescope. Minimum fix: make `.content-area` flex-column below 768px and add `overflow-x: auto` to the table wrapper. File: `GlobalStyle.js`.

**5. Fix LocationSearch ARIA and keyboard navigation (P0 — Accessibility)**
The location search is the only interactive input on the page, but it has no ARIA markup and no keyboard navigation. Screen reader users cannot use the app at all. Keyboard users cannot select from search results. Files: `LocationSearch.jsx`.

---

## Quick Wins

Changes achievable in under 30 minutes each, requiring only 1–5 lines of code:

| # | Change | File | Lines | Time |
|---|---|---|---|---|
| 1 | Fix `score-no` color from `#263238` to `#546e7a` | `GlobalStyle.js:91` | 1 | 2 min |
| 2 | Fix `sub-header` color from `#455a64` to `#607d8b` | `GlobalStyle.js:47` | 1 | 2 min |
| 3 | Fix Sidebar title color from `#37474f` to `#607d8b` | `Sidebar.jsx:27` | 1 | 2 min |
| 4 | Fix Loader color from `#3949ab` to `#7986cb` | `Loader.jsx:6` | 1 | 2 min |
| 5 | Fix input text color from `#5c6bc0` to `#7986cb` | `LocationSearch.jsx:12` | 1 | 2 min |
| 6 | Add `var(--header-h, 58px)` to Sidebar top | `Sidebar.jsx:8` | 1 | 2 min |
| 7 | Fix scroll offset to use `headerRef.current.offsetHeight` | `App.jsx:31` | 2 | 5 min |
| 8 | Change API timezone from `Europe/Paris` to `auto` | `api.js:4` | 1 | 2 min |
| 9 | Add `prefers-reduced-motion` CSS block | `GlobalStyle.js` | 5 | 5 min |
| 10 | Add `role="status"` to Loader, `role="alert"` to error | `Loader.jsx` | 2 | 5 min |
| 11 | Add `scope="col"` to all `<th>` in ForecastTable | `ForecastTable.jsx:43` | 1 | 5 min |
| 12 | Add `wind unit` to column header (km/h) | `ForecastTable.jsx:19`, `DaySection.jsx:11` | 2 | 5 min |
| 13 | Extract `THR_CLOUD` to `utils/constants.js` | New file + 2 imports | 8 | 10 min |
| 14 | Add "Ce soir" badge to today's SidebarItem | `SidebarItem.jsx:60` | 8 | 15 min |
| 15 | Replace day row `opacity: 0.5` with `opacity: 0.65` | `GlobalStyle.js:87` | 1 | 2 min |
| 16 | Add `aria-label` to Location input | `LocationSearch.jsx:107` | 1 | 2 min |
| 17 | Add `<main>` wrapper in App layout | `App.jsx:48` | 2 | 5 min |
| 18 | Add `onKeyDown` to SidebarItem for Enter key | `SidebarItem.jsx:83` | 3 | 5 min |
| 19 | Add focus ring glow to LocationSearch input | `LocationSearch.jsx:19` | 2 | 5 min |
| 20 | Fix heatmap cell hover from `filter: brightness` to `box-shadow inset` | `GlobalStyle.js:56` | 2 | 5 min |

---

## Effort / Impact Matrix

```
HIGH IMPACT
│
│  [P0] Fix contrast ratios (6 pairs)         [P0] Tonight hero banner
│  [P0] Fix score-no visibility               [P0] Mobile responsive layout
│  [P0] LocationSearch ARIA + keyboard        [P1] Loading skeleton
│  [P1] Add keyboard nav to sidebar           [P1] Today badge in sidebar
│  [P1] Timezone auto                         [P1] No empty state for search
│
├────────────────────────────────────────────────────────────
│                                             LOW EFFORT │ HIGH EFFORT
│  LOW EFFORT                                            │
│  [P1] Day row opacity fix                  [P1] Colorblind-safe heatmap scale
│  [P1] Loader ARIA roles                    [P1] Full mobile layout redesign
│  [P1] Wind unit label                      [P2] Skeleton screens
│  [P1] scope="col" on th                    [P2] Retry mechanism
│  [P2] Hover state fix (filter→shadow)      [P2] Data freshness badge
│  [P2] Sidebar top: var(--header-h)         [P3] Onboarding / help modal
│  [P2] Scroll offset fix                    [P3] i18n infrastructure
│  [P2] prefers-reduced-motion               [P3] Elevation system redesign
│  [P2] THR_CLOUD constant extraction
│  [P2] Moon metric consistency
│
LOW IMPACT
```

---

*Audit generated by Claude Sonnet 4.6 — 2026-03-01*
*Based on full source code analysis of `/root/AstroGuard/web-react/src/`*
*Contrast ratios calculated using WCAG 2.1 relative luminance formula*
*Standards referenced: WCAG 2.1, WAI-ARIA 1.2, Material Design 3, Apple HIG, 7timer! API docs*
