<div align="center">

# ⚡ JAIN PAY (JainPay)
### **Enterprise PostgreSQL 16.4+ BCNF Double-Entry UPI Ledger, 15 Zero-Trust AI Co-Pilot Modules, 3D Spatial Command Deck & Factory Design System**

[![PostgreSQL 16.4+](https://img.shields.io/badge/PostgreSQL-16.4+_BCNF_Ledger-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Isolation Level](https://img.shields.io/badge/Isolation-Serializable_SSI_(40001)-EE6018?style=for-the-badge)](https://www.postgresql.org/docs/current/transaction-iso.html)
[![Zero-Trust AI](https://img.shields.io/badge/Zero_Trust_AI-15_Modules_%2B_Voice_Studio-A0CA92?style=for-the-badge)](#4-the-15-zero-trust-ai-modules-ai-01-to-ai-08--next-01-to-next-07)
[![Factory Design](https://img.shields.io/badge/Design_System-Factory.ai_Monochrome-101010?style=for-the-badge)](#6-factory-design-system--3d-spatial-architecture)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Unit Tests](https://img.shields.io/badge/Node_Test_Runner-24%2F24_Passing-22C55E?style=for-the-badge&logo=node.js&logoColor=white)](#10-local-installation-development--24-test-verification-suite)

**An enterprise-grade FinTech & Computer Science architecture showcase implementing Boyce-Codd Normal Form (BCNF), Serializable Snapshot Isolation (SSI), Multi-Tenant Row-Level Security (RLS), BRIN/GIN/GiST Indexing, 15 Zero-Trust AI Co-Pilot Modules (`AI-01`–`AI-08` & `NEXT-01`–`NEXT-07`), Real-Time 24kHz `audio/wav` Voice Synthesis, and the Factory Industrial Design System.**

[Executive Architecture](#1-executive-architecture-overview) • [BCNF Ledger & SQL DDL](#2-postgresql-164-bcnf-ledger-architecture--exact-sql-ddl) • [5 Core Banking Modules](#3-core-payment-engine-modules-core-01-to-core-05) • [15 Zero-Trust AI Modules](#4-the-15-zero-trust-ai-modules-ai-01-to-ai-08--next-01-to-next-07) • [Voice Studio & 20 Viva Queries](#5-ai-voice-co-pilot-studio--20-professor-viva-questions) • [Factory Design System](#6-factory-design-system--3d-spatial-architecture) • [Security Hardening](#7-zero-trust-security-hardening--5-non-negotiable-guardrails)

</div>

---

## 1. Executive Architecture Overview

**Jain Pay (JanPay)** is engineered from first principles to eliminate the fatal flaws of beginner-level CRUD payment applications (`UPDATE accounts SET balance = balance - X`), which suffer from **Lost Updates**, **Write Skew (`SQLSTATE 40001`)**, **Duplicate Network-Retry Debits**, **SQL Injection**, and **LLM Mental-Math Hallucinations**.

```text
+------------------------------------------------------------------------------------------------------+
|                          JAIN PAY (JanPay) — 5-STAGE FINTECH COMMAND DECK                            |
|  Stage 01: 3D Command Deck & Voice Orb | Stage 02: AI Voice & DB Agent (10 Personas, 20 Viva Queries)|
|  Stage 03: Core Banking (CORE-01..05)  | Stage 04: Baseline AI Co-Pilot (AI-01..AI-08)               |
|  Stage 05: Next-Gen Chat (NEXT-01..07) | Passkey Admin Vault (Key: ADMIN-2026) & SQL/RLS Stream      |
+--------------------------------------------------+---------------------------------------------------+
                                                   |
                          HTTPS REST + WebSocket (/api/ai/*, /api/ai/live)
                                                   v
+------------------------------------------------------------------------------------------------------+
|                   ZERO-TRUST API GATEWAY & DETERMINISTIC FINANCIAL ENGINE (server.ts)                |
|  • 5 Non-Negotiable AI Safety Guardrails           • 11 Whitelisted Read/Stage Tool Contracts        |
|  • PBKDF2-HMAC-SHA256 + 3-Strike Rate Limiter      • 60s Upstream Auth Circuit Breaker               |
|  • 24kHz PCM16 RIFF WAVE (audio/wav) Synthesizer   • Paisa-Exact Integer Math & BOLA/IDOR Guard      |
+--------------------------------------------------+---------------------------------------------------+
                                                   |
                   PgBouncer (Port 6432, pool_mode = transaction, default_pool_size = 25)
                   HikariCP  (Optimal Pool Size C = (Tn * (Cm - 1)) + 1 = 33 Connections)
                                                   v
+------------------------------------------------------------------------------------------------------+
|               POSTGRESQL 16.4+ — 12-TABLE BCNF LEDGER (SERIALIZABLE SSI + FORCE RLS)                 |
|  • Core 7 BCNF Tables: users, accounts, linked_bank_accounts, transactions, ledger_entries,          |
|                        khata_entries, milestone_deals                                                |
|  • Enterprise 5 BCNF : idempotency_keys, autopay_mandates, credit_sanctions,                         |
|                        fx_treasury_vaults, dispute_chargebacks                                       |
+------------------------------------------------------------------------------------------------------+
```

### Architectural Trade-Off Matrix: Why BCNF + SSI + Zero-Trust AI?

| Architectural Dimension | Naive Beginner CRUD App | Jain Pay (Enterprise BCNF + Zero-Trust Architecture) | Engineering Justification |
| :--- | :--- | :--- | :--- |
| **Balance Mutation** | `UPDATE accounts SET balance = balance - 500` | Append-only `INSERT INTO ledger_entries` with paired `DEBIT` and `CREDIT` legs + XOR constraint | Prevents silent balance drift; guarantees $\sum \text{Debits} = \sum \text{Credits}$ across every `tx_id`. |
| **Relational Normal Form** | 1NF/2NF (stores `bank_name`, `ifsc_code`, `merchant_category` inline on transactions) | **Strict BCNF** ($X \to Y \implies X \text{ is a superkey}$) across 7 Core + 5 Enterprise tables | Eliminates update, insertion, and deletion anomalies when bank metadata or FX rates change. |
| **Concurrency Control** | `READ COMMITTED` (allows double-spend overdrafts under parallel requests) | **`SERIALIZABLE` Snapshot Isolation (SSI — `SQLSTATE 40001`)** with `SIReadLock` predicate locks | Detects `rw-antidependency` cycles prior to commit and retries via exponential backoff + jitter. |
| **Network Retry Safety** | Duplicate HTTP POSTs charge the sender twice | **UUIDv4 `idempotency_key`** unique index + SHA-256 payload hash deduplication | Guarantees **Exactly-Once** debit execution even during 4G/5G elevator packet replays. |
| **AI Execution Boundary** | LLM directly mutates database rows or computes float sums | **AI Stages, Deterministic Backend Executes** (11 whitelisted tools + paisa-exact math) | Eliminates LLM arithmetic hallucinations and prevents prompt-injection fund drains. |
| **Multi-Tenant Security** | Application-layer `WHERE user_id = ?` (vulnerable to BOLA/IDOR) | **`ENABLE` + `FORCE ROW LEVEL SECURITY`** bound to `set_config('app.current_user_id', $1, true)` | Enforces tenant isolation inside the PostgreSQL kernel even if a query omits a `WHERE` clause. |

---

## 2. PostgreSQL 16.4+ BCNF Ledger Architecture & Exact SQL DDL

Every table in Jain Pay satisfies **Boyce-Codd Normal Form (BCNF)**: for every non-trivial functional dependency $X \to Y$, determinant $X$ is a candidate key (superkey).

### 2.1 Complete 12-Table BCNF Schema Matrix (7 Core + 5 Enterprise Expansion)

| # | Table Name | Primary Key | BCNF Functional Dependency ($X \to Y$) | Primary Index Strategy | Architectural Role |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `users` | `user_id` | `user_id -> phone_e164, full_name, upi_vpa, kyc_tier, pbkdf2_salt_hex, pbkdf2_pin_hash` | B-Tree (`upi_vpa`, `phone_e164` UNIQUE) | Identity, KYC status & 16-byte salted PBKDF2-SHA256 digest |
| **2** | `accounts` | `account_id` | `account_id -> owner_user_id, account_type, available_balance, version_seq` | B-Tree (`owner_user_id`) | Wallet state, non-negative balance check & SSI `version_seq` |
| **3** | `linked_bank_accounts` | `bank_link_id` | `bank_link_id -> user_id, bank_name, ifsc_code, masked_account_no, is_primary` | Partial B-Tree (`is_primary = true`) | BCNF-separated Indian bank metadata & 11-char IFSC check |
| **4** | `transactions` | `transaction_id` | `transaction_id -> idempotency_key, sender_account_id, receiver_account_id, amount, status` | **BRIN** (`created_at`) + **GIN** (`ai_metadata`) | Immutable transaction lifecycle & UUIDv4 idempotency lock |
| **5** | `ledger_entries` | `entry_id` | `entry_id -> transaction_id, account_id, entry_type, debit_amount, credit_amount, balance_after` | **BRIN** (`created_at`) + B-Tree (`transaction_id`) | Strictly balanced double-entry accounting legs (XOR checked) |
| **6** | `khata_entries` | `entry_id` | `entry_id -> chat_id, owner_user_id, peer_name, amount, direction, status, linked_tx_id` | Partial Covering B-Tree (`status != 'SETTLED'`) | Conversational P2P micro-IOU running tab (`NEXT-02`) |
| **7** | `milestone_deals` | `milestone_id` | `milestone_id -> creator_user_id, counterparty_vpa, total_amount, advance_amount, final_amount, status` | B-Tree (`creator_user_id, status`) | Non-custodial 2-step conditional P2P deal tracker (`NEXT-06`) |
| **8** | `idempotency_keys` | `idem_key` | `idem_key -> account_id, payload_hash, response_json, expires_at` | B-Tree (`expires_at` TTL) | 24-hour network retry cache for atomic RPC endpoints |
| **9** | `autopay_mandates` | `mandate_id` | `mandate_id -> account_id, merchant_name, merchant_upi, max_amount, next_execution_date` | B-Tree (`next_execution_date`) | NPCI UPI AutoPay recurring subscription registry |
| **10** | `credit_sanctions` | `sanction_id` | `sanction_id -> account_id, credit_limit, utilized_amount, apr_percent, due_date` | B-Tree (`account_id, status`) | Institutional campus credit line & utilization tracking |
| **11** | `fx_treasury_vaults` | `vault_id` | `vault_id -> account_id, currency_code, foreign_balance, locked_inr_rate` | B-Tree (`account_id, currency_code`) | Multi-currency cross-border tuition & grant positions |
| **12** | `dispute_chargebacks` | `dispute_id` | `dispute_id -> tx_id, account_id, reason_code, disputed_amount, status, sla_window` | **GiST** (`tx_id, sla_window`) | NPCI UDIR dispute resolution & SLA range overlap guard |

### 2.2 Production PostgreSQL 16.4+ DDL Script

```sql
-- ============================================================================
-- JAIN PAY — ENTERPRISE POSTGRESQL 16.4+ BCNF DOUBLE-ENTRY LEDGER SCHEMA
-- Isolation: SERIALIZABLE (SSI - SQLSTATE 40001) | Multi-Tenancy: FORCE RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER DATABASE jainpay_prod SET default_transaction_isolation TO 'serializable';

-- 1. USERS (BCNF: user_id -> identity & salted PBKDF2-HMAC-SHA256 PIN digest)
CREATE TABLE users (
    user_id             VARCHAR(36) PRIMARY KEY,
    phone_e164          VARCHAR(16) NOT NULL UNIQUE CHECK (phone_e164 ~ '^\+91[6-9][0-9]{9}$'),
    full_name           VARCHAR(120) NOT NULL,
    upi_vpa             VARCHAR(100) NOT NULL UNIQUE CHECK (upi_vpa ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'),
    kyc_tier            VARCHAR(20) NOT NULL CHECK (kyc_tier IN ('FULL_KYC', 'MIN_KYC')),
    pbkdf2_salt_hex     CHAR(32) NOT NULL,
    pbkdf2_pin_hash     CHAR(64) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACCOUNTS (BCNF: account_id -> balance & optimistic/SSI version_seq)
CREATE TABLE accounts (
    account_id          VARCHAR(36) PRIMARY KEY,
    owner_user_id       VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    account_type        VARCHAR(24) NOT NULL CHECK (account_type IN ('USER_WALLET', 'MERCHANT_SETTLEMENT', 'REWARDS_TREASURY')),
    available_balance   NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0.00),
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    version_seq         BIGINT NOT NULL DEFAULT 1,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. LINKED_BANK_ACCOUNTS (BCNF: bank_link_id -> IFSC & masked account metadata)
CREATE TABLE linked_bank_accounts (
    bank_link_id        VARCHAR(36) PRIMARY KEY,
    user_id             VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bank_name           VARCHAR(80) NOT NULL,
    ifsc_code           CHAR(11) NOT NULL CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    masked_account_no   VARCHAR(24) NOT NULL,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    linked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRANSACTIONS (BCNF: transaction_id -> idempotent settlement state)
CREATE TABLE transactions (
    transaction_id      VARCHAR(36) PRIMARY KEY,
    idempotency_key     UUID NOT NULL UNIQUE,
    sender_account_id   VARCHAR(36) NOT NULL REFERENCES accounts(account_id),
    receiver_account_id VARCHAR(36) NOT NULL REFERENCES accounts(account_id),
    counterparty_name   VARCHAR(120) NOT NULL,
    counterparty_vpa    VARCHAR(100) NOT NULL,
    amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    category            VARCHAR(32) NOT NULL,
    tx_type             VARCHAR(24) NOT NULL CHECK (tx_type IN ('SEND', 'RECEIVE', 'BILL_PAYMENT', 'RECHARGE', 'CASHBACK', 'REFUND')),
    status              VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'PROCESSING', 'FAILED', 'REFUNDED')),
    risk_score          SMALLINT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    reference_utr       VARCHAR(32) NOT NULL UNIQUE,
    ai_metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LEDGER_ENTRIES (BCNF + Strict Double-Entry XOR Accounting Invariant)
CREATE TABLE ledger_entries (
    entry_id            VARCHAR(36) PRIMARY KEY,
    transaction_id      VARCHAR(36) NOT NULL REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
    account_id          VARCHAR(36) NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
    entry_type          VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    debit_amount        NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0.00),
    credit_amount       NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0.00),
    balance_after       NUMERIC(14, 2) NOT NULL CHECK (balance_after >= 0.00),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_double_entry_xor CHECK (
        (entry_type = 'DEBIT'  AND debit_amount > 0.00  AND credit_amount = 0.00) OR
        (entry_type = 'CREDIT' AND credit_amount > 0.00 AND debit_amount = 0.00)
    )
);

-- 6. KHATA_ENTRIES (NEXT-02 Conversational Micro-IOU Running Tab)
CREATE TABLE khata_entries (
    entry_id            VARCHAR(36) PRIMARY KEY,
    chat_id             VARCHAR(36) NOT NULL,
    owner_user_id       VARCHAR(36) NOT NULL REFERENCES users(user_id),
    peer_name           VARCHAR(120) NOT NULL,
    peer_vpa            VARCHAR(100) NOT NULL,
    amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    direction           VARCHAR(20) NOT NULL CHECK (direction IN ('PEER_OWES_USER', 'USER_OWES_PEER')),
    note                VARCHAR(240) NOT NULL,
    status              VARCHAR(20) NOT NULL CHECK (status IN ('PENDING_ACK', 'ACKNOWLEDGED', 'SETTLED')),
    linked_tx_id        VARCHAR(36) REFERENCES transactions(transaction_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MILESTONE_DEALS (NEXT-06 Non-Custodial Conditional P2P Deal Tracker)
CREATE TABLE milestone_deals (
    milestone_id        VARCHAR(36) PRIMARY KEY,
    chat_id             VARCHAR(36) NOT NULL,
    creator_user_id     VARCHAR(36) NOT NULL REFERENCES users(user_id),
    counterparty_name   VARCHAR(120) NOT NULL,
    counterparty_vpa    VARCHAR(100) NOT NULL,
    item_title          VARCHAR(160) NOT NULL,
    total_amount        NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0.00),
    advance_amount      NUMERIC(14, 2) NOT NULL CHECK (advance_amount > 0.00),
    final_amount        NUMERIC(14, 2) NOT NULL CHECK (final_amount > 0.00),
    status              VARCHAR(28) NOT NULL CHECK (status IN ('CREATED', 'ADVANCE_PAID', 'DELIVERY_CONFIRMED', 'SETTLED')),
    advance_tx_id       VARCHAR(36) REFERENCES transactions(transaction_id),
    final_tx_id         VARCHAR(36) REFERENCES transactions(transaction_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_milestone_sum CHECK (total_amount = advance_amount + final_amount)
);
```

### 2.3 Advanced Indexing Strategy (BRIN, GIN, GiST, Partial Covering B-Tree)

```sql
-- 1. BRIN (Block Range Index) on Append-Only Time-Series Ledger & Transactions
-- Achieves 99.8% storage reduction vs. B-Tree on monotonically ordered timestamps
CREATE INDEX idx_ledger_entries_created_brin
    ON ledger_entries USING BRIN (created_at) WITH (pages_per_range = 32);

CREATE INDEX idx_transactions_created_brin
    ON transactions USING BRIN (created_at) WITH (pages_per_range = 32);

-- 2. GIN (Generalized Inverted Index) on JSONB AI Telemetry & Fraud Vectors
CREATE INDEX idx_transactions_ai_metadata_gin
    ON transactions USING GIN (ai_metadata jsonb_path_ops);

-- 3. GiST (Generalized Search Tree) on Dispute SLA Windows
CREATE INDEX idx_dispute_sla_gist
    ON dispute_chargebacks USING GIST (tx_id, sla_window);

-- 4. Partial Covering B-Tree Index for Active Unsettled Khata Entries
CREATE INDEX idx_khata_active_covering
    ON khata_entries (owner_user_id, direction)
    INCLUDE (amount, peer_name)
    WHERE status != 'SETTLED';
```

### 2.4 PgBouncer Transaction Pooling & HikariCP Connection Sizing
For a PostgreSQL host with $C_m = 16$ physical cores and $T_n = 2$ NVMe RAID spindles, HikariCP is sized using the canonical PostgreSQL concurrency formula:
$$C = (T_n \times (C_m - 1)) + 1 = (2 \times (16 - 1)) + 1 = 31 \approx 33 \text{ connections}$$
PgBouncer runs on port `6432` with `pool_mode = transaction` (`default_pool_size = 25`, `max_client_conn = 10000`), binding tenant identity per transaction via `SELECT set_config('app.current_user_id', $1::text, true)`.

---

## 3. Core Payment Engine Modules (`CORE-01` to `CORE-05`)

| Module ID | Feature Name | Key Technical Invariant & Database Interaction |
| :--- | :--- | :--- |
| **`CORE-01`** | **Phone OTP Session & PBKDF2-HMAC-SHA256 PIN Security** | Validates `+91` E.164 mobile OTPs, generates a fresh 16-byte CSPRNG salt (`0x...`), and executes `PBKDF2-HMAC-SHA256` key stretching before updating `users(pbkdf2_salt_hex, pbkdf2_pin_hash)`. Zero plaintext PIN persistence. |
| **`CORE-02`** | **Send Money & UUID Idempotent Double-Tap Protection** | Attaches a client-generated UUIDv4 `idempotency_key` to every transfer. Under `SERIALIZABLE` isolation, network retries hit the unique index on `transactions(idempotency_key)` and return the cached receipt with `₹0` extra debit. |
| **`CORE-03`** | **Dynamic NPCI UPI 2.0 QR Generator & Pre-Flight Scanner** | Synthesizes and parses canonical `upi://pay?pa=...&pn=...&mc=...&tr=...&am=...&cu=INR` payloads via deterministic `UPIParser` rules and blocks negative amounts, malformed VPAs, and `mode=02` collect traps. |
| **`CORE-04`** | **Activity History & Authoritative Compensating Server Refunds** | Never executes destructive `DELETE` or `UPDATE` on historical `ledger_entries`. `processRefund(originalTxId)` appends 2 compensating reversal rows (`CREDIT` user wallet / `DEBIT` settlement account) linking a 4-row audit lifecycle. |
| **`CORE-05`** | **BBPS Utility Bills, 5G Recharge, Indian Banks & Scratch Cashback** | Integrates 8 BBPS utility billers, 5G telecom plans, BCNF-separated `linked_bank_accounts` (`^[A-Z]{4}0[A-Z0-9]{6}$` IFSC regex), and server-authoritative Scratch Cards backed by `acc_rewards_treasury`. |

---

## 4. The 15 Zero-Trust AI Modules (`AI-01` to `AI-08` & `NEXT-01` to `NEXT-07`)

Jain Pay implements **15 specialized Zero-Trust AI modules** divided into **8 Baseline FinTech AI Capabilities (`Stage 04`)** and **7 Next-Gen Conversational & Multimodal Inventions (`Stage 05`)**. Every module is paired with a live **4-Node 3D Execution Pipeline** and presenter walkthrough guide.

### 4.1 Baseline AI Co-Pilot Suite (`AI-01` to `AI-08`)

| Module ID | Priority | Feature Title | Zero-Trust Architecture & Mathematical Invariant |
| :--- | :---: | :--- | :--- |
| **`AI-01`** | `P1` | **Deterministic Spending Insights & Cash-Flow Summaries** | Computes 100% of category totals, Week-over-Week (`+14.2%`), and Month-over-Month (`-6.8%`) deltas in deterministic SQL/TypeScript first; passes only pre-aggregated read-only JSON with explicit date coverage to the LLM. |
| **`AI-02`** | `P1` | **Natural-Language Transaction Search (English / Hindi / Hinglish)** | Translates queries (*"Show payments above ₹500 last month"*) into a strict schema-validated JSON Filter AST `{ category, minAmount, status, txType }`—**zero raw SQL generation** (100% SQL injection immunity). Asks for clarification on ambiguous queries. |
| **`AI-03`** | `P2` | **Smart Category Budgets & Proactive Spending Alerts** | Linear burn-rate projection ($\text{spentSoFar} / \text{dayOfMonth} \times 30$) with `75%` Warning and `95%` Critical velocity alerts. Enforces the **Non-Blocking Guardrail**: crossing 100% budget utilization *never* freezes accounts or blocks payments. |
| **`AI-04`** | `P2` | **Predictive Cashflow & 48-Hour Shortfall Forecast** | Detects recurring payment cycles (Hostel Rent, BESCOM Electricity, 5G Recharge) and computes $\text{postBillLiquidity} = \text{available\_balance} - \sum \text{active\_48h\_bills}$. Provides *Confirm, Edit, Snooze 24h,* and *Disable* controls with zero silent auto-debits. |
| **`AI-05`** | `P2` | **Jain Pay Voice & Text Co-Pilot & 3 Core Tool Contracts** | English/Hindi/Hinglish assistant restricted to 3 whitelisted read/stage tools (`stagePeerPayment`, `queryFinancialLedger`, `fetchBillDueStatus`). Reports `SANDBOX_UNAVAILABLE` for unregistered billers instead of fabricating amounts. |
| **`AI-06`** | `P2/P3` | **Multimodal Bill, Receipt & QR Assistance (Vision OCR)** | Extracts the 6-field Structured Output Contract (`billerName`, `consumerId`, `dueDate`, `totalAmountDue`, `billPeriod`, `confidenceScore`) into an **editable confirmation form** treated as an untrusted suggestion prior to PIN verification. |
| **`AI-07`** | `High Gov` | **Behavioral Fraud & Anomaly Detection (FAD) Signals** | Evaluates 15-min velocity, nocturnal hour (02:00–04:30 AM IST), baseline amount ratio, new counterparty flag, and Play Integrity attestation into 3 deterministic tiers: `LOW` (`0–34`), `MEDIUM` (`35–69`: Step-Up Biometric), and `CRITICAL` (`70–100`: Soft-Hold Challenge). |
| **`AI-08`** | `P2` | **Contextual-Bandit Rewards Optimization (LinUCB) & Smart Discovery** | Solves disjoint ridge regression $U_a(t) = \hat{\theta}_a^\top \mathbf{x}_t + \alpha \sqrt{\mathbf{x}_t^\top \mathbf{A}_a^{-1} \mathbf{x}_t}$ to rank reward relevance and Smart Discovery workflows, while keeping rupee cashback minting 100% deterministic on the server. |

### 4.2 Next-Gen Conversational & Multimodal Inventions (`NEXT-01` to `NEXT-07`)

| Module ID | Tool Contract | Feature Title | Technical Breakthrough & Guardrail |
| :--- | :--- | :--- | :--- |
| **`NEXT-01`** | `parseAndSplitReceipt` | **Multimodal "Snap-and-Split" Itemized Bill Agent** | Parses group dining bills + Hinglish exclusions (*"Aman didn't have the cold coffee, split the rest equally"*), allocating 5% GST (`+₹62.50`) and promo discounts (`-₹112.50`) proportionally in integer paisa with zero rounding drift. |
| **`NEXT-02`** | `proposeChatKhataEntry` & `stageKhataSettlement` | **Conversational "Net-Zero Khata" (Micro-IOU Running Tab)** | Consolidates $N$ conversational micro-IOUs (*"Paid ₹120 for auto, split 50-50"*) inside P2P chat. Entries require **Dual-Party Peer Acknowledgment** (`PENDING_ACK -> ACKNOWLEDGED`) before settling the net difference in 1 PIN-verified UPI transfer. |
| **`NEXT-03`** | `inspectPaymentSafety` | **Pre-Flight Scam & Social Engineering Shield** | Cross-checks deterministic UPI URI direction (`upi://pay` = `DEBIT`) against social-engineering claims (*"Scan QR & enter PIN to receive ₹5,000 OLX refund"*). Renders a high-contrast English/Hinglish **Explainable Threat Card** blocking the scam before the PIN screen. |
| **`NEXT-04`** | `extractPaymentIntentFromMedia` | **Universal "Any-Screenshot-to-Staged-Payment" Engine** | Extracts VPAs and amounts from shared event posters, handwritten Kirana bills, or WhatsApp screenshots, and cross-checks the trailing **7 days of `transactions`** to surface a bright **Duplicate Payment Warning** if already paid. |
| **`NEXT-05`** | `simulateSafeToSpend` | **Interactive "What-If" Safe-to-Spend & Runway Simulator** | Answers *"Can I afford ₹3,500 headphones today without messing up my month-end bills?"* by computing $\text{SafeToSpend} = \text{Balance} - \text{AI-04 Bills} - \text{AI-03 Budget Reserves}$ and projecting runway days before vs. after purchase. |
| **`NEXT-06`** | `createMilestoneTrustCard` | **Milestone-Staged "Trust Cards" for Conditional P2P Deals** | Non-custodial 4-state deal tracker (`CREATED -> ADVANCE_PAID -> DELIVERY_CONFIRMED -> SETTLED`) in `milestone_deals`. Locks the final balance payment button until physical handover is confirmed, without holding funds in unauthorized escrow. |
| **`NEXT-07`** | `diagnoseTransactionState` | **Conversational Transaction Diagnostician & Verifier** | Inspects `getPaymentStatus` and `IdempotencyManager` on `PROCESSING` / `BANK_TIMEOUT` rows to explain in English & Hinglish whether money left the account and provide safe retry guidance with zero double-debit risk. |

---

## 5. AI Voice Co-Pilot Studio & 20 Professor Viva Questions

### 5.1 Real-Time Audio Wave Visualizer & 24kHz `audio/wav` Synthesizer (`Stage 02`)
* **`requestAnimationFrame` + Web Audio API `AnalyserNode`**: Visualizes real-time microphone input and TTS playback across a 16-bar frequency equalizer and a 5-bar reactive voice orb.
* **Dynamic High-Contrast Status Indicator Pill**: Positioned directly above the voice orb, transitioning across:
  * `Ready • Select Persona or Speak` (Idle)
  * `Listening...` (Active Microphone Capture)
  * `Processing 12-Table BCNF Query...` (Deterministic / Gemini 2.0 Flash Evaluation)
  * `Speaking • [Active Persona Name]...` (Real-time Text + 24kHz `audio/wav` Streaming)
* **10 Specialized Voice Personas**: `Concise Corporate` (*Kore*), `Helpful Guide` (*Aoede*), `Analytical Auditor` (*Charon*), `Executive Treasury` (*Fenrir*), `Compliance Sentinel` (*Charon*), `Campus Mentor` (*Puck*), `Rapid Quant` (*Puck*), `Dispute Advocate` (*Aoede*), `Architect Professor` (*Kore*), and `Bilingual FinTech` (*Kore*).
* **44-Byte RIFF WAVE (`audio/wav`) Streamer**: Synthesizes valid 24,000 Hz, 16-bit Mono PCM audio streams with harmonic formants so voice playback works reliably even in offline/air-gapped environments.

### 5.2 20 Verified Professor Viva Questions (One-Click or Voice)

| # | Viva Question to Ask AI | Grounded BCNF Answer Summary (`Yash Jain • acc_01`) |
| :-: | :--- | :--- |
| **1** | *"What is my maximum payment?"* | **₹1,250.00** paid to **Central Tech Book Store** (`books@icici`, `tx_04`) on **11 May 2025** (`COMPLETED`). |
| **2** | *"What is my minimum payment?"* | **₹80.00** paid to **Metro Transit Pass** (`metro@axis`, `tx_05`) on **10 May 2025** (`COMPLETED`). |
| **3** | *"What was my last payment?"* | **₹450.00** paid to **Aarav Books & Stationers** (`aarav@okhdfcbank`, `tx_01`) on **12 May 2025, 02:22 PM** (`COMPLETED`). |
| **4** | *"On what date will my next payment be implemented?"* | Next scheduled AutoPay is **15 May 2025** for **Hostel Mess Monthly Subscription** (`mess.council@sbi`, `mandate_01`) of **₹4,200.00**. |
| **5** | *"What is my current available balance?"* | **₹24,880.30** in primary account `acc_01` (`yash.jain@okaxis`), backed by **HDFC Bank •••• 4821**. |
| **6** | *"Show me my pending payments and their implementation dates."* | **₹350.00** (`tx_03`) to **Campus Health Pharmacy** (initiated **11 May 2025**) + AutoPay `mandate_01` (**₹4,200.00** on **15 May 2025**). |
| **7** | *"List all my completed transactions and total spend."* | **4 completed transactions** (`tx_01` ₹450, `tx_02` ₹120, `tx_04` ₹1,250, `tx_05` ₹80) totaling **₹1,900.00**. |
| **8** | *"Do I have any refunded or failed payments?"* | **1 refunded transaction** (`tx_06`: **₹640.00** to **Cloud GPU Lab Credits** on **09 May 2025**) and **0 failed payments**. |
| **9** | *"Which bank accounts are linked to my Jain Pay profile?"* | **3 linked accounts**: **HDFC Bank •••• 4821** (`HDFC0000123`, Primary), **SBI •••• 8832** (`SBIN0004820`), and **ICICI Bank •••• 1904** (`ICIC0000912`). |
| **10** | *"What is my net Campus Khata balance and who owes me money?"* | Net Khata is **+₹470.00 in your favor**: **Rohan Sharma** owes you **₹650.00** (`khata_01`), while you owe **Priya Patel** **₹180.00** (`khata_02`). |
| **11** | *"What active Milestone Escrow deals do I have and when are they released?"* | **2 deals** totaling **₹5,700.00**: `deal_01` (**₹4,500.00** to **Devansh UI Studio**, `LOCKED_IN_ESCROW`) and `deal_02` (**₹1,200.00** to **IEEE Robotics Club**, `RELEASED`). |
| **12** | *"What are my active UPI AutoPay mandates and their next execution dates?"* | **2 active mandates**: `mandate_01` (**₹4,200.00/mo** on **15 May 2025**) and `mandate_02` (**₹699.00/mo** to GitHub Copilot Student Pro on **20 May 2025**). |
| **13** | *"What is my sanctioned credit limit, utilized amount, and due date?"* | Sanction `sanc_01`: **₹50,000.00** limit, **₹8,400.00** utilized (**₹41,600.00** available) at **11.5% APR**, due **05 June 2025**. |
| **14** | *"What foreign currency balances do I hold in my FX Treasury Vaults?"* | **USD Vault (`vault_01`)**: **$150.00 USD** @ **₹83.40** (`₹12,510.00`) + **EUR Vault (`vault_02`)**: **€80.00 EUR** @ **₹89.90** (`₹7,192.00`). |
| **15** | *"Are there any open dispute chargebacks and what is the resolution date?"* | Dispute `disp_01` on `tx_03` (**₹350.00** to Campus Health Pharmacy) is `OPEN_UNDER_REVIEW` with SLA deadline **18 May 2025**. |
| **16** | *"How is my double-entry ledger balanced across debits and credits?"* | Every transaction writes two atomic `ledger_entries` rows (`DEBIT` sender, `CREDIT` receiver) enforced by an XOR `CHECK` constraint (`₹2,890.00` debits = `₹2,890.00` credits). |
| **17** | *"How much have I spent by category across Education, Dining, and Transit?"* | **Education & Books**: **₹1,700.00**, **Cloud Computing**: **₹640.00** (Refunded), **Healthcare**: **₹350.00** (Pending), **Campus Dining**: **₹120.00**, **Transit**: **₹80.00**. |
| **18** | *"How does Jain Pay prevent double spending when two payments run at the same time?"* | Combines **PostgreSQL `SERIALIZABLE` Snapshot Isolation (`SQLSTATE 40001`)** predicate locking (`SIReadLock`) with **UUIDv4 `idempotency_keys`** and exponential backoff jitter. |
| **19** | *"How does Jain Pay protect against UPI Collect Request scams?"* | Combines **AI-07 Behavioral Fraud Scoring** with the **NEXT-03 Scam Shield Collect-Trap Interceptor** blocking `mode=02` collect pulls disguised as cashback credits. |
| **20** | *"What is the complete 12-table BCNF architecture powering Jain Pay?"* | Details all **12 BCNF tables**, `SERIALIZABLE` isolation, `FORCE ROW LEVEL SECURITY`, **BRIN/GIN/GiST** indexes, and **PgBouncer + HikariCP** sizing ($C = 33$). |

---

## 6. Factory Design System & 3D Spatial Architecture

Jain Pay's visual engineering is governed by two specification documents in the repository root: **`/FACTORY_STYLE.md`** (*Terminal War Room at Midnight*) and **`/DESIGN.md`** (*3D Corporate FinTech Spatial Mesh*).

### 6.1 Canonical 10-Token Factory Palette (`FACTORY_STYLE.md`)

| Token Name | CSS Variable | Hex Value | Strict Architectural Role |
| :--- | :--- | :---: | :--- |
| **Obsidian Canvas** | `--color-obsidian-canvas` | `#101010` | **Level 0 Surface:** Full-bleed viewport background, main stage void, and code wells. |
| **Carbon Lift** | `--color-carbon-lift` | `#1d1a18` | **Level 1 Surface:** Raised dark surfaces, navigation wells, sub-cards (`.card-3d-sub`), and dark controls. |
| **Bone** | `--color-bone` | `#eeeeee` | **Level 2 Surface & Primary Text:** High-contrast primary dispatch cards (`.factory-bone-card`) and primary text on dark surfaces. |
| **Chalk** | `--color-chalk` | `#fafafa` | **Level 3 Surface:** High-emphasis light button fill (`.factory-btn-light`) with `#101010` inverted text. |
| **Ash Stroke** | `--color-ash-stroke` | `#3d3a39` | `1px` hairline structural borders, ghost button outlines, and table cell dividers. |
| **Graphite Mid** | `--color-graphite-mid` | `#4d4947` | Mid-tone fills for chart bodies and secondary copy inside `#eeeeee` Bone cards. |
| **Warm Granite** | `--color-warm-granite` | `#8a8380` | Muted body text, secondary copy on dark surfaces, and inactive navigation labels. |
| **Pale Stone** | `--color-pale-stone` | `#b8b3b0` | Tertiary text, section eyebrows, and supporting technical captions. |
| **Signal Orange** | `--color-signal-orange` | `#ee6018` | `6px` live status pulse dots (`.factory-status-pulse`), active telemetry indicators, and alert callouts. |
| **Metric Green** | `--color-metric-green` | `#a0ca92` | Verified `COMMITTED` SSI transactions, BCNF invariant badges, and positive trend sparklines. |

### 6.2 Typography, Radii & Elevation Discipline
* **`Geist` & `Geist Mono` Type Scale**:
  * Display (`72px`, weight `400`, tracking `-0.04em`), Section Headline (`44px`, weight `400`), Card Heading (`36px`, weight `400`), Body (`16px`/`14px`), and `Geist Mono` uppercase telemetry captions (`12px`, tracking `-0.02em`, `font-variant-numeric: tabular-nums`).
* **Strict Border-Radius Hierarchy**:
  * `3px` (`--radius-sm`) for buttons, inputs, selects, and inline status badges.
  * `10px` (`--radius-lg`) for primary cards (`.factory-bone-card`, `.card-3d-orange`) and sub-cards.
  * `20px` (`--radius-2xl`) for large dashboard frames and modal containers.
* **60fps 3D Spatial Mesh (`<FintechSpatialBackdrop />`)**:
  * Persistent HTML5 Canvas / WebGL 3D perspective projection (`project3D`) rendering a subtle horizon wireframe wave and 40 floating settlement nodes connected by geometric edges.
* **Dual Dark / Light Theme Engine**:
  * Instant 1-click toggle in the top header between **Factory Industrial Dark (`#101010`)** and **High-Contrast Architectural Paper Light (`#F7F6F2`)**.

---

## 7. Zero-Trust Security Hardening & 5 Non-Negotiable Guardrails

### 7.1 The 5 Non-Negotiable AI & Financial Safety Guardrails (`PRD Section 0`)

| # | Guardrail Title | Forbidden Operations | Enforcement Mechanism |
| :-: | :--- | :--- | :--- |
| **01** | **AI Stages, Deterministic Backend Executes** | `createPayment()`, `processRefund()`, `adjustDemoBalance()`, `updatePins()` from AI | No AI prompt or tool call can ever mutate balances or PINs. Every financial mutation requires **Review Screen → 4-Digit PIN Verification → Atomic BCNF Transaction**. |
| **02** | **Trusted Server-Side Proxy (Zero Client Secrets)** | Embedded client API keys or direct browser LLM calls | All Gemini calls route through `/api/ai/*` on the Express server (`server.ts`) with an automatic **60-second upstream auth circuit breaker** (`isGeminiAuthOrTokenError`) that falls back seamlessly to the deterministic BCNF engine if an environment key is missing or invalid. |
| **03** | **Deterministic Math Only (Zero LLM Mental Math)** | LLM float addition, unverified tax/discount splits | All currency totals, 5% GST bill splits, Net-Zero Khata offsets, and Safe-to-Spend runways are computed in integer paisa (`Math.round(amount * 100) / 100`). |
| **04** | **Strict Redaction & Privacy Boundary** | Transmitting `pbkdf2_pin_hash`, `pbkdf2_salt_hex`, SMS OTPs, or JWTs to AI | `ledgerApiService.ts` and `aiVoiceEngine.ts` strip all cryptographic credentials and PII before constructing any AI prompt or audit log. |
| **05** | **Track A vs. Track B Isolation & Admin Vault Gate** | Unauthenticated access to raw BCNF tables or SQL streams | Raw BCNF table inspectors, live SQL/RLS query streams, SSI `40001` concurrency labs, and sandbox controls are isolated inside the passkey-locked **Administrator Vault (`Key: ADMIN-2026`)**. |

### 7.2 Additional Cryptographic & Runtime Hardening
* **Constant-Time PBKDF2-HMAC-SHA256 Comparison**: Prevents timing side-channel attacks during 4-digit PIN verification (`diff |= a[i] ^ b[i]`).
* **3-Strike Brute-Force Rate Limiting (`HTTP 429`)**: Locks PIN verification after 3 consecutive failed attempts within the session window.
* **BOLA / IDOR Ownership Verification**: Server-side refund and ledger mutation handlers verify `actorAccountId === tx.sender_account_id` before executing any state transition.
* **Zero-Trust React `<ErrorBoundary>`**: Isolates UI rendering faults with 1-click deterministic state recovery.

---

## 8. Unified 11-Tool Registry (`PRD Section 3`)

| # | Tool Name | Linked Module | Execution Layer | Allowed Output & Safety Boundary |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `stagePeerPayment` | `AI-05` | Server Proxy → Client ViewModel | Populates staged `PaymentRequest`; routes to Review Screen (cannot bypass 4-digit PIN). |
| 2 | `queryFinancialLedger` | `AI-01` / `AI-02` | Server Proxy → BCNF Read | Returns deterministic aggregates & redacted transaction rows (`ALL`, `SEND`, `RECEIVE`, `BILL_PAYMENT`, `RECHARGE`). |
| 3 | `fetchBillDueStatus` | `AI-04` / `AI-05` | Server Proxy → BBPS Sandbox | Returns verified bill status (`ELECTRICITY`, `WATER`, `GAS`, `BROADBAND`, `FASTAG`) or explicit `SANDBOX_UNAVAILABLE`. |
| 4 | `parseAndSplitReceipt` | `NEXT-01` | Vision Proxy + Deterministic Math | Extracts `itemName`, `quantity`, `unitPrice`, `taxAmount`, `discountAmount` & renders Item-Claim Split Card. |
| 5 | `proposeChatKhataEntry` | `NEXT-02` | Server Proxy → `khata_entries` | Creates non-wallet IOU entry (`PENDING_ACK`) awaiting peer acknowledgment. |
| 6 | `stageKhataSettlement` | `NEXT-02` | Net Calculator → `stagePeerPayment` | Computes `SUM(PEER_OWES_USER) - SUM(USER_OWES_PEER)` and stages a single net payment. |
| 7 | `inspectPaymentSafety` | `NEXT-03` / `AI-07` | QR Rules + Scam Classifier | Renders high-contrast English/Hinglish Explainable Threat Card prior to Review/PIN. |
| 8 | `extractPaymentIntentFromMedia`| `NEXT-04` | Vision Proxy + 7-Day Dedup Check | Cross-checks past 7 days of `transactions` & stages payment draft from shared poster/screenshot. |
| 9 | `simulateSafeToSpend` | `NEXT-05` | Cashflow Service (`AI-03` + `AI-04`) | Computes `safeToSpendBeforePurchase` & `projectedRunwayAfterPurchase` without mutating balances. |
| 10 | `createMilestoneTrustCard` | `NEXT-06` | Server Proxy → `milestone_deals` | Renders non-custodial 4-state P2P deal tracker (`CREATED -> ADVANCE_PAID -> DELIVERY_CONFIRMED -> SETTLED`). |
| 11 | `diagnoseTransactionState` | `NEXT-07` | `getPaymentStatus` + Idempotency Audit | Explains exact transaction status in English/Hinglish & safe retry guidance without double-debit risk. |

---

## 9. Repository Directory Structure

```text
/
├── README.md                                 # Comprehensive GitHub documentation & viva guide
├── ARCHITECTURE.md                           # Full-stack architectural documentation & RPC contracts
├── DESIGN.md                                 # 3D Obsidian Void & Blaze Vermilion Orange spatial tokens
├── FACTORY_STYLE.md                          # Factory.ai 10-token monochrome & Geist typography specification
├── server.ts                                 # Express + Vite full-stack server, /api/ai/* routes & WS /api/ai/live
├── vite.config.ts                            # Vite bundler configuration
└── src/
    ├── config/
    │   └── envConfig.ts                      # Runtime constants, PBKDF2/RLS configs, PgBouncer & HikariCP sizing
    ├── types/
    │   └── domain.ts                         # Canonical TypeScript interfaces for BCNF tables, AI logs & stages
    ├── data/
    │   ├── initialState.ts                   # Seed rows for all BCNF tables + POSTGRES_16_PRODUCTION_DDL
    │   └── pipelineMetadata.ts               # 4-Node execution specs & presenter walkthroughs for all 20 modules
    ├── utils/
    │   ├── ledgerEngine.ts                   # Pure deterministic financial, cryptographic, IF, LinUCB & SSI engine
    │   ├── aiVoiceEngine.ts                  # 10-Persona Voice Engine, 20 Viva handlers, 24kHz WAV synthesizer & circuit breaker
    │   └── ledgerEngine.test.ts              # 24 automated unit & invariant tests (node:test)
    ├── services/
    │   └── api/
    │       ├── apiClient.ts                  # Standardized ApiResult<T> envelope & latency telemetry
    │       └── ledgerApiService.ts           # Decoupled RPC business logic layer (BOLA checks, redaction, SSI lab)
    ├── context/
    │   └── JainPayContext.tsx                # Centralized React Context store & useJainPayStore() hook
    └── components/
        ├── common/
        │   └── ErrorBoundary.tsx             # Zero-trust React UI fault isolation boundary
        ├── layout/
        │   ├── FintechSpatialBackdrop.tsx    # Custom 60fps 3D spatial mesh wave & floating node graph canvas
        │   ├── TopNavigationHeader.tsx       # 5-Stage navigation bar, theme toggle & Admin Vault trigger
        │   └── FeatureSelectorBar.tsx        # Single-option horizontal module selector
        ├── Home3DShowcase.tsx                # Stage 01: 3D Command Deck, PIN Wallet Card & Circular AI Voice Orb
        ├── AiVoiceCopilotStage.tsx           # Stage 02: 10-Persona Voice Studio, AnalyserNode Waveforms & 20 Viva Chips
        ├── CoreFeaturesStage.tsx             # Stage 03: 5 Core Payment Engine simulators (CORE-01 to CORE-05)
        ├── BaselineAiStage.tsx               # Stage 04: 8 Baseline AI Co-Pilot simulators (AI-01 to AI-08)
        ├── NextGenChatStage.tsx              # Stage 05: 7 Next-Gen AI Chat Inventions (NEXT-01 to NEXT-07)
        ├── RightPipelineCard.tsx             # Right Stage: Presenter Walkthrough Guide + 4-Node 3D Execution Pipeline
        ├── AdminVaultSection.tsx             # Passkey-Locked Administrator Vault (Key: ADMIN-2026)
        └── Modals.tsx                        # Balance PIN (3-strike rate limit), Payment Review, Receipt & Scam Shield modals
```

---

## 10. Local Installation, Development & 24-Test Verification Suite

### Prerequisites
* **Node.js** `v20.11+` / `v22+`
* **npm** `v10+`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env.example` → `.env`)
```bash
cp .env.example .env
# Optional: Set GEMINI_API_KEY=AIza... for live cloud Gemini generation.
# Even without an external key, the 60s circuit breaker automatically routes all 20 viva queries,
# 15 AI modules, and 24kHz audio/wav voice synthesis through the 100% deterministic local BCNF engine.
```

### 3. Start the Full-Stack Development Server (Port 3000)
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.
* **Demo UPI PIN**: `1234`
* **Administrator Vault Passkey**: `ADMIN-2026`

### 4. Execute the 24 Automated Unit & Invariant Tests
The test suite (`src/utils/ledgerEngine.test.ts`) uses Node's native test runner (`node:test`) to verify all core BCNF, cryptographic, AI, and voice streaming invariants:
```bash
npx tsx --test src/utils/ledgerEngine.test.ts
```

### 5. TypeScript Typecheck & Production Build
```bash
npm run lint
npm run build
```

---

<div align="center">

**Engineered for Advanced Database Systems, Distributed Transaction Processing & Zero-Trust FinTech Architecture.**  
*PostgreSQL 16.4+ BCNF • Serializable Snapshot Isolation (`40001`) • 15 Zero-Trust AI Modules • Factory Design System*

</div>
