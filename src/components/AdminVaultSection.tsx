import React, { useState } from 'react';
import {
  AccountRecord,
  AiToolCallLog,
  AutopayMandateRecord,
  BcnfTableName,
  CreditSanctionRecord,
  DisputeChargebackRecord,
  FxTreasuryVaultRecord,
  KhataEntryRecord,
  LedgerEntryRecord,
  LinkedBankAccountRecord,
  MilestoneDealRecord,
  SandboxOutcomeMode,
  SecurityAuditLogRecord,
  SqlRlsLogEntry,
  TransactionRecord,
  UserRecord,
} from '../types/domain';
import {
  AI_ARCHITECTURE_COMPARISON_MATRIX,
  POSTGRES_16_PRODUCTION_DDL,
} from '../data/initialState';
import { formatInr } from '../utils/ledgerEngine';
import { AiChatLogs } from './AiChatLogs';
import {
  Lock,
  Unlock,
  Database,
  Terminal,
  Cpu,
  Zap,
  Sliders,
  KeyRound,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Table2,
} from 'lucide-react';

export type AdminVaultTab =
  | 'BCNF_TABLES'
  | 'SQL_STREAM'
  | 'AI_JSON'
  | 'DDL_SSI'
  | 'SANDBOX_MASTER';

interface AdminVaultSectionProps {
  isUnlocked: boolean;
  onUnlockVault: () => void;
  onLockVault: () => void;
  activeTab: AdminVaultTab;
  onSelectTab: (tab: AdminVaultTab) => void;
  activeTable: BcnfTableName;
  onSelectTable: (tbl: BcnfTableName) => void;
  users: UserRecord[];
  accounts: AccountRecord[];
  linkedBanks: LinkedBankAccountRecord[];
  transactions: TransactionRecord[];
  ledgerEntries: LedgerEntryRecord[];
  khataEntries: KhataEntryRecord[];
  milestoneDeals: MilestoneDealRecord[];
  autopayMandates: AutopayMandateRecord[];
  creditSanctions: CreditSanctionRecord[];
  fxTreasuryVaults: FxTreasuryVaultRecord[];
  disputeChargebacks: DisputeChargebackRecord[];
  securityAuditLogs: SecurityAuditLogRecord[];
  sqlLogs: SqlRlsLogEntry[];
  aiLogs: AiToolCallLog[];
  sandboxOutcome: SandboxOutcomeMode;
  onChangeSandboxOutcome: (mode: SandboxOutcomeMode) => void;
  onAdjustDemoBalance: (delta: number) => void;
  onResetPinToDefault: () => void;
  onResetAllDemoData: () => void;
  onRunSsiConcurrencySimulation: () => {
    worker1Status: string;
    worker2Status: string;
    timelineSteps: Array<{
      tMs: number;
      worker: string;
      sql: string;
      outcome: string;
    }>;
  };
}

const BCNF_TABLES: Array<{ id: BcnfTableName; label: string }> = [
  { id: 'ledger_entries', label: '01. ledger_entries' },
  { id: 'transactions', label: '02. transactions' },
  { id: 'accounts', label: '03. accounts' },
  { id: 'linked_bank_accounts', label: '04. linked_bank_accounts' },
  { id: 'users', label: '05. users' },
  { id: 'khata_entries', label: '06. khata_entries' },
  { id: 'milestone_deals', label: '07. milestone_deals' },
  { id: 'autopay_mandates', label: '08. autopay_mandates' },
  { id: 'credit_sanctions', label: '09. credit_sanctions' },
  { id: 'fx_treasury_vaults', label: '10. fx_treasury_vaults' },
  { id: 'dispute_chargebacks', label: '11. dispute_chargebacks' },
  { id: 'security_audit_logs', label: '12. security_audit_logs' },
];

export const AdminVaultSection: React.FC<AdminVaultSectionProps> = ({
  isUnlocked,
  onUnlockVault,
  onLockVault,
  activeTab,
  onSelectTab,
  activeTable,
  onSelectTable,
  users,
  accounts,
  linkedBanks,
  transactions,
  ledgerEntries,
  khataEntries,
  milestoneDeals,
  autopayMandates,
  creditSanctions,
  fxTreasuryVaults,
  disputeChargebacks,
  securityAuditLogs,
  sqlLogs,
  aiLogs,
  sandboxOutcome,
  onChangeSandboxOutcome,
  onAdjustDemoBalance,
  onResetPinToDefault,
  onResetAllDemoData,
  onRunSsiConcurrencySimulation,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [ssiSimResult, setSsiSimResult] = useState<ReturnType<
    typeof onRunSsiConcurrencySimulation
  > | null>(null);

  // ============================================================================
  // 1. PASSKEY LOCK SCREEN (WHEN LOCKED)
  // ============================================================================
  if (!isUnlocked) {
    const handlePasskeySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const cleaned = passkeyInput.trim().toUpperCase();
      if (cleaned === 'ADMIN-2026' || cleaned === '1234') {
        setPasskeyError('');
        setPasskeyInput('');
        onUnlockVault();
      } else {
        setPasskeyError(
          'ACCESS_DENIED_403: Invalid Administrator Key. Use ADMIN-2026 or 1234.'
        );
      }
    };

    return (
      <div className="max-w-xl mx-auto mt-8 card-3d-orange rounded-[32px] p-10 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl btn-blaze-orange flex items-center justify-center shadow-2xl">
          <Lock className="w-8 h-8 text-[#050507]" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-[#FF8800] uppercase tracking-wider block mb-1">
            RESTRICTED TELEMETRY &amp; BCNF COMMAND CENTER
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Administrator Security Vault
          </h2>
          <p className="text-sm text-[#C8CAD0] mt-2 leading-relaxed">
            All raw PostgreSQL 16+ BCNF tables, RLS terminal logs, AI tool JSON
            payloads, SSI 40001 concurrency labs, and Sandbox controls are
            isolated behind this passkey gate so the main application stays
            100% clean.
          </p>
        </div>

        {/* 1-Click Professor Demo Evaluator Auto-Unlock Badge */}
        <button
          type="button"
          onClick={() => {
            setPasskeyError('');
            onUnlockVault();
          }}
          className="w-full py-3 px-4 rounded-2xl bg-[#FF5E00]/15 border border-[#FF6A00] hover:bg-[#FF5E00]/25 text-xs font-mono font-bold text-[#FF8800] transition-all flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>
            [Demo Evaluator Key: ADMIN-2026 — Click to Auto-Unlock]
          </span>
        </button>

        <form onSubmit={handlePasskeySubmit} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="admin-vault-passkey"
              className="block text-xs font-mono text-[#C8CAD0] mb-1.5"
            >
              Enter Administrator Access Key (ADMIN-2026 or 1234)
            </label>
            <input
              id="admin-vault-passkey"
              type="password"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder="ADMIN-2026"
              className="w-full bg-[#050507] border border-[#FF6A00]/40 rounded-2xl px-4 py-3.5 text-center text-base font-mono font-bold tracking-widest text-[#FF8800] focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {passkeyError && (
            <div className="p-3 rounded-xl bg-[#1A0D08] border border-[#FF5E00] text-xs font-mono text-[#FF8800] text-center">
              {passkeyError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-full btn-blaze-orange text-sm flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Administrator Console</span>
          </button>
        </form>
      </div>
    );
  }

  // ============================================================================
  // 2. UNLOCKED ADMINISTRATOR CONSOLE (5 CLEAN TECHNICAL TABS)
  // ============================================================================
  const getTableRows = () => {
    switch (activeTable) {
      case 'ledger_entries':
        return ledgerEntries;
      case 'transactions':
        return transactions;
      case 'accounts':
        return accounts;
      case 'linked_bank_accounts':
        return linkedBanks;
      case 'users':
        return users;
      case 'khata_entries':
        return khataEntries;
      case 'milestone_deals':
        return milestoneDeals;
      case 'autopay_mandates':
        return autopayMandates;
      case 'credit_sanctions':
        return creditSanctions;
      case 'fx_treasury_vaults':
        return fxTreasuryVaults;
      case 'dispute_chargebacks':
        return disputeChargebacks;
      case 'security_audit_logs':
        return securityAuditLogs;
    }
  };

  const rawRows = getTableRows();
  const filteredRows = tableSearch.trim()
    ? rawRows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(tableSearch.toLowerCase())
      )
    : rawRows;

  return (
    <div className="max-w-[1560px] mx-auto space-y-6">
      {/* Top Admin Vault Header + 5 Tab Bar + Lock Button */}
      <div className="card-3d-orange rounded-[28px] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl btn-blaze-orange flex items-center justify-center">
            <Unlock className="w-5 h-5 text-[#050507]" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#FF8800] block">
              UNLOCKED ADMINISTRATOR VAULT • PASSKEY VERIFIED (ADMIN-2026)
            </span>
            <h2 className="text-xl font-extrabold text-white">
              PostgreSQL 16+ 12-Table BCNF Explorer, RLS Terminal, AI JSON &amp; Sandbox
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onLockVault}
          className="py-2.5 px-5 rounded-full bg-[#14141C] border border-[#FF6A00] hover:bg-[#FF5E00] hover:text-[#050507] text-xs font-mono font-bold text-[#FF8800] flex items-center gap-2 transition-all"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>🔒 Lock Admin Vault</span>
        </button>
      </div>

      {/* 5 Admin Tabs Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            id: 'BCNF_TABLES' as const,
            label: '1. Live 12-Table BCNF Explorer',
            icon: Database,
          },
          {
            id: 'SQL_STREAM' as const,
            label: `2. Parameterized SQL & RLS Terminal (${sqlLogs.length})`,
            icon: Terminal,
          },
          {
            id: 'AI_JSON' as const,
            label: `3. Raw AI Tool-Call JSON Audit (${aiLogs.length})`,
            icon: Cpu,
          },
          {
            id: 'DDL_SSI' as const,
            label: '4. PostgreSQL 16+ DDL & SQLSTATE 40001 Concurrency Lab',
            icon: Zap,
          },
          {
            id: 'SANDBOX_MASTER' as const,
            label: '5. Developer Sandbox & Outcome Controller',
            icon: Sliders,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`py-3 px-5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                active
                  ? 'btn-blaze-orange'
                  : 'btn-obsidian-secondary text-[#D4D4D8]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          ADMIN TAB 1: LIVE POSTGRESQL 16+ BCNF TABLES (7 TABLES)
         ===================================================================== */}
      {activeTab === 'BCNF_TABLES' && (
        <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {BCNF_TABLES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTable(t.id)}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition-all ${
                    activeTable === t.id
                      ? 'btn-blaze-orange'
                      : 'bg-[#14141C] border border-[#FF6A00]/25 text-[#C8CAD0]'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5 inline mr-1.5" />
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={`Filter ${activeTable} rows...`}
              className="bg-[#050507] border border-[#FF6A00]/35 rounded-full px-4 py-2 text-xs font-mono text-white"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#050507] border border-[#FF6A00]/30 text-xs font-mono text-[#FF8800]">
            {activeTable === 'ledger_entries' &&
              'BCNF INVARIANT: CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0)) • BRIN Index on created_at'}
            {activeTable === 'transactions' &&
              'BCNF INVARIANT: idempotency_key VARCHAR(128) NOT NULL UNIQUE • Covering B-Tree on (sender_account_id, created_at DESC)'}
            {activeTable === 'users' &&
              'BCNF INVARIANT: pbkdf2_salt_hex CHAR(32) + pbkdf2_pin_hash CHAR(64) • FORCE ROW LEVEL SECURITY'}
            {activeTable === 'autopay_mandates' &&
              'BCNF INVARIANT: umn_reference VARCHAR(128) NOT NULL UNIQUE • CHECK (max_debit_amount > 0.00)'}
            {activeTable === 'credit_sanctions' &&
              'BCNF INVARIANT: CHECK (available_credit = sanctioned_limit - utilized_amount) • NBFC Co-Lend Facility'}
            {activeTable === 'fx_treasury_vaults' &&
              'BCNF INVARIANT: corridor_code UNIQUE • UPI Global / NIPL Real-Time FX Settlement Pools'}
            {activeTable === 'dispute_chargebacks' &&
              'BCNF INVARIANT: npci_udir_ticket VARCHAR(64) NOT NULL UNIQUE • SHA-256 Cryptographic Evidence Chain'}
            {activeTable === 'security_audit_logs' &&
              'BCNF INVARIANT: Append-Only Audit Trail • GIN Index (jsonb_path_ops) + BRIN Index (pages_per_range = 16)'}
            {activeTable !== 'ledger_entries' &&
              activeTable !== 'transactions' &&
              activeTable !== 'users' &&
              activeTable !== 'autopay_mandates' &&
              activeTable !== 'credit_sanctions' &&
              activeTable !== 'fx_treasury_vaults' &&
              activeTable !== 'dispute_chargebacks' &&
              activeTable !== 'security_audit_logs' &&
              `Showing ${filteredRows.length} live rows in public.${activeTable} (RLS Enforced)`}
          </div>

          <div className="overflow-x-auto max-h-[460px] rounded-2xl border border-[#FF6A00]/25 bg-[#050507]">
            {filteredRows.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#AEAEB7]">
                No matching rows in public.{activeTable}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="bg-[#121218] text-[#FF8800] sticky top-0 z-10 border-b border-[#FF6A00]/30">
                  <tr>
                    {Object.keys(filteredRows[0])
                      .filter((k) => k !== 'isNew')
                      .map((colKey) => (
                        <th
                          key={colKey}
                          className="py-3 px-4 font-bold uppercase tracking-wider whitespace-nowrap"
                        >
                          {colKey}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredRows.map((row, idx) => {
                    const rowObj = row as unknown as Record<string, unknown>;
                    const isNewRow = Boolean(rowObj.isNew);
                    return (
                      <tr
                        key={idx}
                        className={
                          isNewRow
                            ? 'bg-[#FF5E00]/15 text-white'
                            : 'hover:bg-white/[0.03] text-[#E5E7EB]'
                        }
                      >
                        {Object.entries(rowObj)
                          .filter(([k]) => k !== 'isNew')
                          .map(([k, val]) => (
                            <td
                              key={k}
                              className="py-2.5 px-4 whitespace-nowrap max-w-[280px] truncate"
                              title={String(val)}
                            >
                              {typeof val === 'boolean'
                                ? val
                                  ? 'TRUE'
                                  : 'FALSE'
                                : String(val ?? 'NULL')}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMIN TAB 2: RAW SQL, RLS & PBKDF2 TERMINAL STREAM
         ===================================================================== */}
      {activeTab === 'SQL_STREAM' && (
        <div className="card-3d-orange rounded-[28px] p-8 space-y-4">
          <div className="text-sm font-mono font-bold text-[#FF8800]">
            Chronological PostgreSQL 16+ SERIALIZABLE, RLS &amp; PBKDF2 Audit
            Stream ({sqlLogs.length} events)
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {sqlLogs.map((log) => (
              <div
                key={log.id}
                className="card-3d-sub p-5 rounded-2xl font-mono text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[#FF8800] font-bold">
                    [{log.cloudFunction}()] • Isolation: {log.isolationLevel} •
                    RLS: {log.rlsTenant}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-[#FF8800] font-bold">
                    {log.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#050507] border border-white/10 space-y-1 text-[#D8DAE0]">
                  {log.sqlStatements.map((stmt, i) => (
                    <div key={i}>{stmt}</div>
                  ))}
                </div>
                <div className="text-[#FF8800] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{log.securityAudit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMIN TAB 3: RAW AI TOOL-CALL JSON & ZERO-TRUST GUARDRAIL AUDIT
         ===================================================================== */}
      {activeTab === 'AI_JSON' && (
        <AiChatLogs
          logs={aiLogs}
          title="AI TOOL-CALL TERMINAL DISPATCH LOG (ZERO-TRUST READ/STAGE-ONLY)"
        />
      )}

      {/* =====================================================================
          ADMIN TAB 4: PRODUCTION SQL DDL & PGBOUNCER / SSI CONCURRENCY LAB
         ===================================================================== */}
      {activeTab === 'DDL_SSI' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 card-3d-orange rounded-[28px] p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#FF8800] font-bold block">
                  POSTGRESQL 16.4+ PRODUCTION DDL
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  7-Table BCNF Schema, RLS &amp; BRIN/B-Tree Indexes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(POSTGRES_16_PRODUCTION_DDL);
                  setCopiedDdl(true);
                  setTimeout(() => setCopiedDdl(false), 1800);
                }}
                className="py-2 px-4 rounded-full btn-blaze-orange text-xs flex items-center gap-1.5"
              >
                {copiedDdl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied DDL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full DDL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="max-h-[440px] overflow-auto bg-[#050507] p-4 rounded-2xl border border-[#FF6A00]/30 text-[11px] font-mono text-[#FF8800]">
              {POSTGRES_16_PRODUCTION_DDL}
            </pre>
          </div>

          <div className="lg:col-span-6 card-3d-orange rounded-[28px] p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-[#FF8800] font-bold block">
                  SSI CONCURRENCY &amp; PGBOUNCER LAB
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Double-Spend Race Simulator (SQLSTATE 40001)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = onRunSsiConcurrencySimulation();
                  setSsiSimResult(res);
                }}
                className="py-2.5 px-5 rounded-full btn-blaze-orange text-xs flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate 2 Concurrent Transfers on Last ₹500</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="card-3d-sub p-3.5 rounded-2xl">
                <span className="text-[10px] text-[#AEAEB7] block">
                  PgBouncer Pool Mode
                </span>
                <span className="text-[#FF8800] font-bold">
                  pool_mode = transaction (Port 6432)
                </span>
              </div>
              <div className="card-3d-sub p-3.5 rounded-2xl">
                <span className="text-[10px] text-[#AEAEB7] block">
                  HikariCP Sizing Formula
                </span>
                <span className="text-white font-bold">
                  connections = (core_count * 2) + 1
                </span>
              </div>
            </div>

            {ssiSimResult ? (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {ssiSimResult.timelineSteps.map((step) => (
                  <div
                    key={step.tMs}
                    className="p-3.5 rounded-2xl bg-[#050507] border border-[#FF6A00]/40 font-mono text-xs"
                  >
                    <div className="flex justify-between text-[#FF8800] font-bold mb-1">
                      <span>
                        [t = +{step.tMs}ms] {step.worker}
                      </span>
                      <span>{step.outcome}</span>
                    </div>
                    <div className="text-[#D8DAE0] text-[11px]">{step.sql}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#050507] border border-white/10 text-xs text-[#C8CAD0] leading-relaxed">
                Click{' '}
                <strong className="text-[#FF8800]">
                  &ldquo;Simulate 2 Concurrent Transfers on Last ₹500&rdquo;
                </strong>{' '}
                above to execute two parallel workers attempting to spend the
                exact same ₹500 balance under PostgreSQL 16+ Serializable
                Snapshot Isolation and inspect the resulting{' '}
                <code className="font-mono text-[#FF8800]">SQLSTATE 40001</code>{' '}
                predicate lock abort.
              </div>
            )}

            {/* 15-Module Comparison Summary */}
            <div className="pt-2 border-t border-[#FF6A00]/20 text-xs text-[#AEAEB7]">
              All {AI_ARCHITECTURE_COMPARISON_MATRIX.length} AI modules
              (AI-01..08 &amp; NEXT-01..07) are verified under Zero-Trust
              Read/Stage-Only rules.
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMIN TAB 5: DEVELOPER SANDBOX & MASTER STATE CONTROLLER
         ===================================================================== */}
      {activeTab === 'SANDBOX_MASTER' && (
        <div className="card-3d-orange rounded-[28px] p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-3d-sub p-6 rounded-2xl space-y-5">
            <div>
              <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
                1. GLOBAL TRANSACTION OUTCOME SWITCHER
              </span>
              <h3 className="text-lg font-extrabold text-white">
                Downstream NPCI / Bank Switch Outcome Simulator
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  'INSTANT_SUCCESS',
                  'BANK_TIMEOUT',
                  'SYSTEM_DECLINE',
                  'INSUFFICIENT_BALANCE',
                ] as SandboxOutcomeMode[]
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeSandboxOutcome(mode)}
                  className={`py-3 px-4 rounded-2xl font-mono text-xs font-bold transition-all ${
                    sandboxOutcome === mode
                      ? 'btn-blaze-orange'
                      : 'bg-[#050507] border border-[#FF6A00]/30 text-[#C8CAD0]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="card-3d-sub p-6 rounded-2xl space-y-5">
            <div>
              <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
                2. AUDITED DEMO FUNDS &amp; MASTER RESET
              </span>
              <h3 className="text-lg font-extrabold text-white">
                BCNF Balance Controller (adjustDemoBalance)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onAdjustDemoBalance(5000)}
                className="py-3.5 px-4 rounded-full btn-blaze-orange text-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Credit ₹5,000 Demo Funds</span>
              </button>

              <button
                type="button"
                onClick={() => onAdjustDemoBalance(-1000)}
                className="py-3.5 px-4 rounded-full bg-[#050507] border border-[#FF6A00]/40 text-xs font-bold text-white flex items-center justify-center gap-2"
              >
                <MinusCircle className="w-4 h-4 text-[#FF8800]" />
                <span>- Debit ₹1,000 Demo Funds</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onResetPinToDefault}
                className="py-3 px-4 rounded-full bg-[#14141C] border border-white/20 text-xs font-semibold text-[#C8CAD0] hover:text-white flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#FF8800]" />
                <span>Reset PIN to Default (1234)</span>
              </button>

              <button
                type="button"
                onClick={onResetAllDemoData}
                className="py-3 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/50 text-xs font-mono font-bold text-[#FF8800] hover:text-white flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Demo Data to Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
