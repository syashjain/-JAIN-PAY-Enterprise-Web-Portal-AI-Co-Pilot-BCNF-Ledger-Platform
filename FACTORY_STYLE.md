# FACTORY_STYLE.md — Enterprise Design System Specification

> **Terminal War Room at Midnight.**
> Factory is a stark black control surface (`#101010`) where a single bright Bone card (`#eeeeee`) lands like a flashlit dispatch — the only object in the room is the work itself.

---

## 1. Color Palette & Surface Hierarchy Constraints

All interfaces in the Jain Pay platform strictly adhere to the 10-token Factory palette. Additional accent colors, gradients, or decorative hues are prohibited.

### 1.1 Canonical Color Tokens

| Token Name | CSS Variable | Hex Value | Strict Architectural Role |
| :--- | :--- | :--- | :--- |
| **Obsidian Canvas** | `--color-obsidian-canvas` | `#101010` | **Level 0 Surface:** Full-bleed page background, main stage void, code wells, and footer base. |
| **Carbon Lift** | `--color-carbon-lift` | `#1d1a18` | **Level 1 Surface:** Raised dark surfaces, navigation wells, sub-cards (`.card-3d-sub`), and dark button fills. |
| **Bone** | `--color-bone` | `#eeeeee` | **Level 2 Surface & Primary Text:** Primary cards (`.factory-bone-card`, `.card-3d-orange`) floating on `#101010` canvas, and primary text on dark surfaces. |
| **Chalk** | `--color-chalk` | `#fafafa` | **Level 3 Surface:** High-emphasis light button fill (`.factory-btn-light`, `.btn-blaze-orange`) with `#101010` inverted text. |
| **Ash Stroke** | `--color-ash-stroke` | `#3d3a39` | `1px` hairline borders, ghost button outlines, and structural dividers. |
| **Graphite Mid** | `--color-graphite-mid` | `#4d4947` | Mid-tone fills for chart bodies, secondary copy inside `#eeeeee` Bone cards, and neutral data visualization. |
| **Warm Granite** | `--color-warm-granite` | `#8a8380` | Muted body text, secondary copy on dark surfaces, inactive labels, and trust bar wordmarks. |
| **Pale Stone** | `--color-pale-stone` | `#b8b3b0` | Tertiary text, section eyebrows, and subdued supporting copy. |
| **Signal Orange** | `--color-signal-orange` | `#ee6018` | **Reserved Exclusively for Status Indicators:** `6px` live status pulse dots (`.factory-status-pulse`) and negative/activity data sparklines. **Never** used as a button or card background fill. |
| **Metric Green** | `--color-metric-green` | `#a0ca92` | Positive metric trends, verified BCNF/SSI invariants, and sparkline strokes. **Never** used as a button or card background fill. |

### 1.2 Surface Stacking Rules
1. **Canvas (`#101010`):** Every page section and viewport background must remain `#101010` (`--surface-obsidian-canvas`).
2. **Primary Cards (`#eeeeee`):** Primary content dispatches (`.factory-bone-card`, `.card-3d-orange`) use `#eeeeee` (`--surface-bone-card`) with `#101010` dark typography inside to establish stark figure/ground contrast against the `#101010` canvas.
3. **Raised Sub-Surfaces (`#1d1a18`):** Interactive wells, sub-cards (`.card-3d-sub`), and form controls sit one step above canvas at `#1d1a18` (`--surface-carbon-lift`) with a `1px solid #3d3a39` border.
4. **Monochrome Chrome:** Buttons never use chromatic fills (`#ee6018` or `#a0ca92`). Primary actions use neutral Chalk (`#fafafa` fill / `#101010` text) or Carbon Lift (`#1d1a18` fill / `#eeeeee` text).

---

## 2. Geist & Geist Mono Typography Scale

Factory operates with two voices from a single typographic family:
- **`Geist` (`--font-geist`):** Carries all interface text — body, headings, buttons, navigation, and hero copy. Used at **weight `400`** almost universally (`500` reserved only for high-density emphasis). Headings **never** use bold (`600+`); authority is established through scale and tight negative letter-spacing.
- **`Geist Mono` (`--font-geist-mono`):** Carries all instrument labels, captions, status tags, SQL telemetry, and metric units — rendered at **`12px` uppercase** with `-0.02em` (`-0.24px`) tracking.

### 2.1 Strict Type Scale Specification

| Scale Token | Role | Font Family | Weight | Size | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `--text-display` | Hero Display | `Geist` | `400` | `72px` | `1.00` | `-0.0400em` (`-2.88px`) |
| `--text-heading-lg` | Section Headline | `Geist` | `400` | `44px` | `1.12` | `-0.0250em` (`-1.10px`) |
| `--text-heading` | Card / Panel Heading | `Geist` | `400` | `36px` | `1.10` | `-0.0310em` (`-1.12px`) |
| `--text-body` | Primary Body Copy | `Geist` | `400` | `16px` | `1.50` | `-0.0150em` |
| `--text-body-sm` | Compact UI / Controls | `Geist` | `400` | `14px` | `1.43` | `-0.0150em` |
| `--text-caption` | Eyebrows, Status Tags, Headers | `Geist Mono` | `400` | `12px` (Uppercase) | `1.00` | `-0.0200em` (`-0.24px`) |

---

## 3. Zero-Shadow / Zero-Blur Elevation Rule & Strict Radii

### 3.1 Zero-Shadow & Zero-Blur Rule
Depth in the Factory design system is earned strictly through **figure/ground contrast** (`#eeeeee` Bone cards on `#101010` Obsidian Canvas) and **`1px solid #3d3a39` hairline borders** — never through drop shadows, glows, or background blurs.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  box-shadow: none !important;
  text-shadow: none !important;
  backdrop-filter: none !important;
}
```

### 3.2 Strict `3px` / `10px` / `20px` Border-Radius Rules
Corners remain crisp and technical across all components:

| Element Category | CSS Token | Radius Value | Target Selectors |
| :--- | :--- | :--- | :--- |
| **Buttons, Nav & Inputs** | `--radius-sm` / `--radius-buttons` / `--radius-nav` | `3px` | `button`, `input`, `select`, `textarea`, nav items, inline status tags |
| **Cards & Sub-Cards** | `--radius-lg` / `--radius-cards` | `10px` | `.factory-bone-card`, `.card-3d-orange`, `.card-3d-sub` |
| **Large Panels & Frames** | `--radius-2xl` / `--radius-largepanels` | `20px` | `.factory-dashboard-frame`, `.factory-large-panel`, modal frames |
| **Status Indicator Dot** | — | `50%` (`6px` circle) | `.factory-status-pulse`, `.status-indicator-dot` |

---

## 4. Motion & Spacing Discipline

- **8px Base Spacing Unit:** `--spacing-8` (`8px`), `--spacing-16` (`16px`), `--spacing-24` (`24px` card padding & element gap), `--spacing-96` (`96px` section vertical rhythm).
- **Mechanical CLI Transitions:** All state transitions use `0.15s cubic-bezier(0.4, 0, 0.2, 1)` across `color`, `background-color`, `border-color`, and `stroke` simultaneously so interactive state changes feel instantaneous like a hardware switch.
