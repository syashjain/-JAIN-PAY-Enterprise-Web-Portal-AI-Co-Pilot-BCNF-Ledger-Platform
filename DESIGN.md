# JAIN PAY — 3D Obsidian Void & Blaze Vermilion Orange Design System (`/DESIGN.md`)

> **Spatial Theme:** 3D Obsidian Void & Blaze Vermilion Orange (Corporate Fintech 3D Spatial Mesh)

---

## 1. Brand & Spatial Aesthetic Tokens

| Token Name | CSS Variable | Value | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-void` | `#050507` | Deep obsidian base canvas beneath the persistent `<FintechSpatialBackdrop />` 3D mesh |
| **Elevated Surface** | `--bg-carbon` | `#0C0C12` | Secondary structural containers, header bar, and modal chrome |
| **Glassmorphic Stage Card** | `--bg-glass` | `rgba(12, 12, 18, 0.84)` | Primary 3D stage cards (`backdrop-filter: blur(20px)`) letting the 3D mesh glow through |
| **Nested Input / Panel Surface** | `--bg-obsidian` | `#12121A` | Interactive form inputs, SQL terminal blocks, and sub-cards |
| **Primary Brand Accent** | `--accent-orange` | `#FF5E00` | Primary interactive CTAs, active mode pills, and 3D ledger anchor nodes (`#FF5E00`) |
| **Secondary Brand Accent** | `--accent-vermilion` | `#E0231C` | Gradient stop for primary pill buttons and critical security callouts |
| **Highlight Accent** | `--accent-amber` | `#FF8800` | Monospace telemetry badges, `₹` currency highlights, and SQL invariants |
| **Primary Hairline Border** | `--border-orange` | `rgba(255, 94, 0, 0.26)` | Illuminated 1px border on all primary 3D stage cards |
| **Subtle Structural Border** | `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Hairline divider for nested panels and table rows |
| **Text Primary** | `--text-primary` | `#FFFFFF` | High-contrast display headings, active labels, and primary metrics |
| **Text Secondary** | `--text-secondary` | `#D4D4D8` | Body copy, presenter walkthrough guides, and architectural descriptions |
| **Text Muted** | `--text-muted` | `#8E8E99` | Metadata captions, timestamps, and secondary hints |
| **Semantic Success** | `--status-success` | `#10B981` | Verified session states, `COMMITTED` SSI transactions, and BCNF checks |
| **Semantic Warning** | `--status-warning` | `#F59E0B` | `MEDIUM` risk step-up biometric prompts and `PROCESSING` timeouts |
| **Semantic Danger** | `--status-danger` | `#EF4444` | `CRITICAL` collect-trap interceptions, `SQLSTATE 40001` aborts, and `RATE_LIMIT_429` lockouts |

---

## 2. Typography, Spacing & Component Rules

1. **Typography & Numeric Discipline**
   - **Headings:** `'Onest'`, `'Plus Jakarta Sans'`, sans-serif (`font-weight: 400–600`, `letter-spacing: -0.012em`).
   - **Body:** `'Onest'`, `'Plus Jakarta Sans'`, sans-serif (`font-weight: 300–400`).
   - **Monospace & Financial Figures:** `'JetBrains Mono'`, monospace with `font-variant-numeric: tabular-nums` enforced on all `₹` INR amounts, UUIDv4 idempotency keys, `PBKDF2-HMAC-SHA256` digests, and PostgreSQL 16+ metrics.

2. **Buttons**
   - **Shape:** Pill-shaped (`rounded-full`).
   - **Primary CTA (`.btn-blaze-orange`):** Linear gradient from `#FF5E00` to `#E0231C` (with `#FF8800` hover lift), `#FFFFFF` semibold text, and subtle orange glow (`0 8px 24px rgba(255, 94, 0, 0.3)`).
   - **Secondary CTA (`.btn-obsidian-secondary`):** `#12121A` fill with `1px solid rgba(255, 255, 255, 0.12)`.

3. **3D Stage Cards (`.card-3d-orange`)**
   - **Geometry:** `rounded-[24px]`, `p-8`, `1px solid rgba(255, 94, 0, 0.25)`, `backdrop-filter: blur(20px)`, and 3D perspective depth (`0 24px 60px rgba(0, 0, 0, 0.85)`).

4. **Custom Corporate Fintech 3D Spatial Mesh (`<FintechSpatialBackdrop />`)**
   - Rendered persistently at `fixed inset-0 z-0` using a lightweight 60fps 3D perspective projection canvas (`project3D`) with a subtle horizon wireframe wave and 40 sparse floating `#FF5E00` / `#FF8800` / `#D4D4D8` settlement nodes connected by faint geometric edges.

---

## 3. Strict Anti-Clutter Do's & Don'ts

- **DO NOT** render raw SQL tables, RLS logs, or multi-panel docks (`RightDock.tsx`) on the public user screens.
- **DO NOT** display more than **ONE** feature simulator on the public stage at a time.
- **DO** isolate all 7 live BCNF tables, parameterized SQL/RLS streams, AI JSON payloads, SSI `40001` concurrency labs, and sandbox controls inside the passkey-locked **`[ 🔒 Administrator Vault ]`** (`Key: ADMIN-2026`).
- **DO** keep generous whitespace and ensure zero button or text truncation at any viewport width.
