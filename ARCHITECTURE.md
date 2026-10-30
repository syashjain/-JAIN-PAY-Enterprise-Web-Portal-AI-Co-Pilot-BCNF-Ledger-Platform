# JAIN PAY — Enterprise System & Codebase Architecture (`/ARCHITECTURE.md`)

> **Platform:** Jain Pay — 3D Architecture, Zero-Trust Payment Engine, Next-Gen AI Co-Pilot & PostgreSQL 16.4+ BCNF Ledger Showcase

---

## 1. Clean Directory Hierarchy

```text
/
├── DESIGN.md                                 # 3D Obsidian Void & Blaze Vermilion Orange design system tokens
├── ARCHITECTURE.md                           # Full-stack architectural documentation & RPC contracts
├── vite.config.ts                            # Vite bundler config (sourcemap: false)
└── src/
    ├── config/
    │   └── envConfig.ts                      # Centralized runtime env vars, PBKDF2 / RLS constants, PgBouncer & HikariCP sizing
    ├── types/
    │   └── domain.ts                         # Canonical TypeScript interfaces for all 7 BCNF tables, AI logs, and UI modes
    ├── data/
    │   ├── initialState.ts                   # Seed rows for all 7 BCNF tables + POSTGRES_16_PRODUCTION_DDL
    │   └── pipelineMetadata.ts               # 4-Node execution specs & presenter walkthroughs for all 20 modules
    ├── utils/
    │   ├── ledgerEngine.ts                   # Pure deterministic financial, cryptographic, and SSI simulation engine
    │   └── ledgerEngine.test.ts              # Automated Node test suite (BCNF invariants, 3D backdrop checks, RLS/BOLA checks)
    ├── engine/
    │   └── jainPayEngine.ts                  # Public barrel export for pure deterministic financial logic
    ├── services/
    │   └── api/
    │       ├── apiClient.ts                  # Standardized ApiResult<T> envelope, latency telemetry & fault normalization
    │       └── ledgerApiService.ts           # Decoupled RPC business logic layer (payments, refunds, PIN rotation, SSI lab)
    ├── context/
    │   └── JainPayContext.tsx                # Centralized React Context store & useJainPayStore() hook
    └── components/
        ├── common/
        │   └── ErrorBoundary.tsx             # Zero-trust React UI fault isolation boundary with 1-click recovery
        ├── layout/
        │   ├── FintechSpatialBackdrop.tsx    # Custom 60fps corporate fintech 3D mesh wave & floating node graph canvas
        │   ├── TopNavigationHeader.tsx       # 4-Mode navigation bar + Verified session badge + Admin Vault toggle
        │   └── FeatureSelectorBar.tsx        # Single-option horizontal feature selector for Modes 2, 3, and 4
        ├── Home3DShowcase.tsx                # Mode 1: 3D Titanium Wallet Card + 3D perspective selector + quick architecture portals
        ├── CoreFeaturesStage.tsx             # Mode 2: 5 Core Payment Engine simulators (CORE-01 to CORE-05)
        ├── BaselineAiStage.tsx               # Mode 3: 8 Baseline AI Co-Pilot simulators (AI-01 to AI-08)
        ├── NextGenChatStage.tsx              # Mode 4: 7 Next-Gen AI Chat Inventions (NEXT-01 to NEXT-07)
        ├── RightPipelineCard.tsx             # Right Stage: Presenter Walkthrough Guide + 4-Node 3D Execution Pipeline
        ├── AdminVaultSection.tsx             # Passkey-Locked Administrator Vault (5 technical inspection tabs)
        └── Modals.tsx                        # Balance PIN (3-strike rate limit), Payment Review, Receipt & Scam Shield modals
```

---

## 2. Separation of Concerns & State Management Flow

| Architectural Layer | Responsibility | Key Modules |
| :--- | :--- | :--- |
| **1. Pure Deterministic Engine** | Zero-side-effect financial math (paisa-exact rounding, proportional GST/discount bill splits, Net-Zero Khata aggregation, `PBKDF2-HMAC-SHA256`, UPI URI parsing, and BCNF double-entry transitions). | `src/utils/ledgerEngine.ts`, `src/engine/jainPayEngine.ts` |
| **2. Scalable API & RPC Service Layer** | Wraps engine transitions in a standardized `ApiResult<T>` envelope (`executeWithApiEnvelope`), enforces BOLA/IDOR ownership checks, redacts sensitive credentials in audit logs, and records execution latency. | `src/services/api/apiClient.ts`, `src/services/api/ledgerApiService.ts` |
| **3. Centralized Store (`JainPayContext`)** | Holds authoritative state for all 7 BCNF tables, SQL/RLS logs, AI tool-call logs, and modal workflows; exposes strongly-typed action dispatchers via `useJainPayStore()`. | `src/context/JainPayContext.tsx` |
| **4. Modular Presentation Layer** | Stateless/focused stage and layout components subscribing to `useJainPayStore()` and protected by `<ErrorBoundary>`. | `src/components/layout/*`, `src/components/*Stage.tsx` |

---

## 3. PostgreSQL 16.4+ BCNF Schema & Security Invariants

1. **Boyce-Codd Normal Form (BCNF) across 7 Core Tables:**
   - `users`, `accounts`, `linked_bank_accounts`, `transactions`, `ledger_entries`, `khata_entries`, and `milestone_deals`.
2. **Strict Double-Entry XOR Invariant (`ledger_entries`):**
   - Enforced via `CONSTRAINT chk_double_entry_xor CHECK ((debit_amount > 0.00 AND credit_amount = 0.00) OR (credit_amount > 0.00 AND debit_amount = 0.00))`.
3. **Serializable Snapshot Isolation (SSI — `SQLSTATE 40001`):**
   - Prevents concurrent double-spend overdrafts via `SIReadLock` predicate locks over PgBouncer transaction pooling (`port 6432`, `pool_mode = transaction`).
4. **Complete 7-Table Row-Level Security (RLS):**
   - Every table enforces `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` bound to `SELECT set_config('app.current_user_id', $1::text, true)`.
