import React, { useState } from 'react';
import {
  AiToolCallLog,
  StagedPaymentDraft,
  TransactionCategory,
  TransactionRecord,
  TransactionType,
} from '../types/domain';
import { BaselineAiId, CoreFeatureId } from '../data/pipelineMetadata';
import {
  computeBehavioralFraudScore,
  computeLinUcbScores,
  formatInr,
  parseUpiUri,
  roundPaisa,
} from '../utils/ledgerEngine';
import { SAMPLE_OCR_BILLS } from '../data/initialState';
import {
  TrendingUp,
  Search,
  Sliders,
  CalendarClock,
  Bot,
  Camera,
  ShieldAlert,
  Award,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  BellOff,
  Edit3,
  QrCode,
  Sparkles,
  Compass,
  AlertTriangle,
} from 'lucide-react';

interface BaselineAiStageProps {
  selectedModule: BaselineAiId;
  transactions: TransactionRecord[];
  availableBalance: number;
  fadState: {
    velocity15Min: number;
    hourOfDay: number;
    amountRatioVsBaseline: number;
    isNewCounterparty: boolean;
  };
  onChangeFadState: React.Dispatch<
    React.SetStateAction<{
      velocity15Min: number;
      hourOfDay: number;
      amountRatioVsBaseline: number;
      isNewCounterparty: boolean;
    }>
  >;
  onStagePayment: (draft: StagedPaymentDraft) => void;
  onLogAiToolCall: (
    moduleCode: AiToolCallLog['moduleCode'],
    toolName: AiToolCallLog['toolName'],
    req: Record<string, unknown>,
    res: Record<string, unknown>
  ) => void;
  onOpenReceipt?: (tx: TransactionRecord) => void;
  onNavigateToCoreOption?: (coreId: CoreFeatureId) => void;
}

interface RecurringBillCandidate {
  id: string;
  title: string;
  counterpartyVpa: string;
  cycleLabel: string;
  dueInHours: number;
  amount: number;
  status: 'CONFIRMED' | 'PENDING_CONFIRM' | 'SNOOZED_24H' | 'DISABLED';
}

const INITIAL_RECURRING_CANDIDATES: RecurringBillCandidate[] = [
  {
    id: 'rec_rent',
    title: 'Hostel / Flat Rent Transfer',
    counterpartyVpa: 'warden.hostel@sbi',
    cycleLabel: 'Monthly (Detected on 25th)',
    dueInHours: 18,
    amount: 4500,
    status: 'CONFIRMED',
  },
  {
    id: 'rec_bescom',
    title: 'BESCOM Electricity Utility Bill',
    counterpartyVpa: 'bescom@bbps',
    cycleLabel: 'Monthly Cycle (#8841209921)',
    dueInHours: 36,
    amount: 1850,
    status: 'CONFIRMED',
  },
  {
    id: 'rec_jio5g',
    title: 'Jio True 5G Prepaid Pack',
    counterpartyVpa: 'jio.prepaid@bbps',
    cycleLabel: '84-Day Cycle Expiring',
    dueInHours: 42,
    amount: 666,
    status: 'PENDING_CONFIRM',
  },
  {
    id: 'rec_ott',
    title: 'Netflix / Spotify Student Bundle',
    counterpartyVpa: 'netflix.india@hdfcbank',
    cycleLabel: 'Monthly Subscription',
    dueInHours: 46,
    amount: 199,
    status: 'CONFIRMED',
  },
];

const PRD_NL_SEARCH_PRESETS = [
  {
    id: 'prd_above_500',
    label: '1. "Show payments above ₹500 last month" (PRD Exact)',
    queryText: 'Show payments above ₹500 last month',
    languageTag: 'English (PRD 1.2)',
    isAmbiguous: false,
    filterFn: (t: TransactionRecord) =>
      t.sender_account_id === 'acc_yash_wallet' && t.amount > 500,
    parsedAst: {
      timeRangeDays: 30,
      direction: 'DEBIT',
      minAmountInr: 500,
      status: 'ALL',
    },
  },
  {
    id: 'prd_electricity_quarter',
    label: '2. "How much did I spend on electricity bills this quarter?" (PRD Exact)',
    queryText: 'How much did I spend on electricity bills this quarter?',
    languageTag: 'English (PRD 1.2)',
    isAmbiguous: false,
    filterFn: (t: TransactionRecord) =>
      t.category === 'Utilities' ||
      t.counterparty_name.toLowerCase().includes('bescom'),
    parsedAst: {
      timeRangeDays: 90,
      category: 'Utilities',
      billerType: 'ELECTRICITY',
    },
  },
  {
    id: 'prd_failed_week',
    label: '3. "Show failed / timed-out payments from this week" (PRD Exact)',
    queryText: 'Show failed payments from this week',
    languageTag: 'English (PRD 1.2)',
    isAmbiguous: false,
    filterFn: (t: TransactionRecord) =>
      t.status === 'FAILED' || t.status === 'PROCESSING',
    parsedAst: {
      timeRangeDays: 7,
      statusIn: ['FAILED', 'PROCESSING'],
    },
  },
  {
    id: 'prd_hinglish_dining',
    label: '4. "500 se upar ke dining ya food payments dikhao" (Hinglish)',
    queryText: '500 se upar ke dining ya food payments dikhao',
    languageTag: 'Hinglish (PRD 1.2)',
    isAmbiguous: false,
    filterFn: (t: TransactionRecord) =>
      (t.category === 'Dining & Food' || t.category === 'Food & Dining') &&
      t.amount >= 300,
    parsedAst: {
      timeRangeDays: 30,
      category: 'Dining & Food',
      minAmountInr: 300,
    },
  },
  {
    id: 'prd_ambiguous_guardrail',
    label: '5. "Show my recent stuff" (Test Ambiguous Query Guardrail)',
    queryText: 'Show my recent stuff',
    languageTag: 'Ambiguity Guardrail',
    isAmbiguous: true,
    filterFn: () => false,
    parsedAst: {
      status: 'CLARIFICATION_REQUIRED',
      reason:
        'Ambiguous intent: Please specify a time range (e.g., 7d/30d), category (Utilities/Dining), or amount threshold.',
    },
  },
];

export const BaselineAiStage: React.FC<BaselineAiStageProps> = ({
  selectedModule,
  transactions,
  availableBalance,
  fadState,
  onChangeFadState,
  onStagePayment,
  onLogAiToolCall,
  onOpenReceipt,
  onNavigateToCoreOption,
}) => {
  // AI-02 State
  const [selectedChipId, setSelectedChipId] = useState(
    PRD_NL_SEARCH_PRESETS[0].id
  );
  const [customSearchText, setCustomSearchText] = useState('');

  // AI-03 State (Includes PRD Opt-In Toggle)
  const [budgetsOptIn, setBudgetsOptIn] = useState(true);
  const [foodBudgetCap, setFoodBudgetCap] = useState(1200);
  const [utilitiesBudgetCap, setUtilitiesBudgetCap] = useState(2000);
  const [p2pBudgetCap, setP2pBudgetCap] = useState(1500);

  // AI-04 State (Interactive Confirm / Edit / Snooze / Disable)
  const [recurringBills, setRecurringBills] = useState<RecurringBillCandidate[]>(
    INITIAL_RECURRING_CANDIDATES
  );
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editBillAmountStr, setEditBillAmountStr] = useState('1850');

  // AI-05 State (Voice & Text Co-Pilot + 5 Biller Categories + Sandbox Unavailable Test)
  const [selectedLedgerTxType, setSelectedLedgerTxType] = useState<
    'ALL' | TransactionType
  >('ALL');
  const [selectedBillerCategory, setSelectedBillerCategory] = useState<
    'ELECTRICITY' | 'WATER' | 'GAS' | 'BROADBAND' | 'FASTAG' | 'UNREGISTERED_SANDBOX'
  >('ELECTRICITY');
  const [coPilotOutput, setCoPilotOutput] = useState(
    'Ready: Select any English/Hindi/Hinglish voice prompt or invoke one of the 3 whitelisted tool contracts below.'
  );

  // AI-06 State (6-Field Structured Output Contract + QR Payload Explainer)
  const [selectedOcrIdx, setSelectedOcrIdx] = useState(0);
  const [editableBillerName, setEditableBillerName] = useState(
    SAMPLE_OCR_BILLS[0]?.billerName ?? 'BESCOM Electricity'
  );
  const [editableOcrAmount, setEditableOcrAmount] = useState(
    String(SAMPLE_OCR_BILLS[0]?.totalAmountDue ?? 1850)
  );
  const [editableOcrConsumer, setEditableOcrConsumer] = useState(
    SAMPLE_OCR_BILLS[0]?.consumerId ?? '8841209921'
  );
  const [editableDueDate, setEditableDueDate] = useState(
    SAMPLE_OCR_BILLS[0]?.dueDate ?? '2026-10-26'
  );
  const [editableBillPeriod, setEditableBillPeriod] = useState(
    SAMPLE_OCR_BILLS[0]?.billPeriod ?? '01 Sep 2026 - 30 Sep 2026 (248 kWh)'
  );
  const [qrExplainUri, setQrExplainUri] = useState(
    'upi://pay?pa=bluetokai@hdfcbank&pn=Blue%20Tokai%20Coffee&mc=5812&tr=BT90812&am=280.00&cu=INR'
  );

  // AI-07 State (Play Integrity / Device Attestation)
  const [deviceAttested, setDeviceAttested] = useState(true);

  // AI-08 State
  const [banditCategory, setBanditCategory] =
    useState<TransactionCategory>('Dining & Food');
  const [banditAmount, setBanditAmount] = useState(850);
  const [banditAlpha, setBanditAlpha] = useState(0.45);

  // Shared deterministic aggregations
  const settledDebits = transactions.filter(
    (t) => t.status === 'SUCCESS' && t.sender_account_id === 'acc_yash_wallet'
  );
  const totalOutflow = roundPaisa(
    settledDebits.reduce((acc, t) => acc + t.amount, 0)
  );
  const foodSpent = roundPaisa(
    settledDebits
      .filter(
        (t) => t.category === 'Food & Dining' || t.category === 'Dining & Food'
      )
      .reduce((a, b) => a + b.amount, 0)
  );
  const utilitiesSpent = roundPaisa(
    settledDebits
      .filter(
        (t) =>
          t.category === 'Utilities' || t.category === 'Telecom Recharge'
      )
      .reduce((a, b) => a + b.amount, 0)
  );
  const p2pSpent = roundPaisa(
    settledDebits
      .filter((t) => t.category === 'P2P Transfers')
      .reduce((a, b) => a + b.amount, 0)
  );

  // ============================================================================
  // AI-01: DETERMINISTIC SPENDING INSIGHTS & CASH-FLOW SUMMARIES
  // ============================================================================
  if (selectedModule === 'AI-01') {
    const topMerchants = [...settledDebits]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-01 • ZERO-HALLUCINATION PRE-AGGREGATED LEDGER ANALYTICS (P1)
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Deterministic Spending Insights &amp; Cash-Flow Summaries
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#121218] border border-[#FF6A00]/40 text-[11px] font-mono text-[#FF8800]">
            Coverage: 01 Oct – 25 Oct 2026 • Jain Pay Ledger Only
          </span>
        </div>

        {/* Top 4 Deterministic Metric Cards (Includes WoW & MoM from PRD 1.1) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              VERIFIED OUTFLOW
            </span>
            <span className="text-lg font-extrabold text-[#FF8800]">
              {formatInr(totalOutflow)}
            </span>
          </div>
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              WEEK-OVER-WEEK (WoW)
            </span>
            <span className="text-lg font-extrabold text-white">+14.2%</span>
          </div>
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              MONTH-OVER-MONTH (MoM)
            </span>
            <span className="text-lg font-extrabold text-[#FF8800]">-6.8%</span>
          </div>
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              AVG DAILY BURN
            </span>
            <span className="text-lg font-extrabold text-white">
              {formatInr(roundPaisa(totalOutflow / 7))}
            </span>
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <div className="space-y-2.5">
          {[
            { label: 'Utilities & Telecom BBPS', amount: utilitiesSpent },
            { label: 'Dining & Food Delivery', amount: foodSpent },
            { label: 'P2P Transfers', amount: p2pSpent },
          ].map((cat) => {
            const pct =
              totalOutflow > 0
                ? Math.round((cat.amount / totalOutflow) * 100)
                : 0;
            return (
              <div
                key={cat.label}
                className="card-3d-sub p-3.5 rounded-2xl space-y-1.5"
              >
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white">{cat.label}</span>
                  <span className="font-mono text-[#FF8800]">
                    {formatInr(cat.amount)} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#050507] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF5E00] to-[#FF8800]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Counterparties & Unusual Spend Spike Explanation (PRD 1.1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card-3d-sub p-4 rounded-2xl space-y-2">
            <div className="text-xs font-mono font-bold text-[#FF8800]">
              TOP COUNTERPARTIES (DETERMINISTIC RANK)
            </div>
            {topMerchants.map((m, idx) => (
              <div
                key={m.transaction_id}
                className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-1"
              >
                <span className="text-white truncate">
                  {idx + 1}. {m.counterparty_name}
                </span>
                <span className="text-[#FF8800] font-bold">
                  {formatInr(m.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="card-3d-sub p-4 rounded-2xl space-y-1.5">
            <div className="text-xs font-mono font-bold text-[#FF8800] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>UNUSUAL SPEND SPIKE EXPLANATION</span>
            </div>
            <p className="text-xs text-[#D8DAE0] leading-relaxed">
              Utilities spiked <strong>+14.2% WoW</strong> due to the{' '}
              <span className="font-mono text-[#FF8800]">₹1,640.00</span> BESCOM
              billing cycle on 22 Oct and{' '}
              <span className="font-mono text-[#FF8800]">₹666.00</span> Jio 5G
              84-day renewal.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onLogAiToolCall(
              'AI-01',
              'queryFinancialLedger',
              { timeRangeDays: 30, includeCounterparties: true },
              {
                dateCoverage: '2026-10-01 to 2026-10-25',
                totalOutflow,
                utilitiesSpent,
                foodSpent,
                p2pSpent,
              }
            );
            onStagePayment({
              recipientName: 'TruFFles Koramangala',
              recipientVpa: 'truffles@hdfcbank',
              amount: 650,
              note: 'AI-01 Live Spend Spike Demo',
              txType: 'SEND',
              category: 'Dining & Food',
              idempotencyKey: `uuid-ai01-${Date.now()}`,
              sourceModule: 'AI-01',
            });
          }}
          className="w-full py-3 px-5 rounded-full btn-blaze-orange text-xs flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            + Stage ₹650 Dining Payment to Watch Deterministic Totals Recalculate
          </span>
        </button>
      </div>
    );
  }

  // ============================================================================
  // AI-02: NATURAL-LANGUAGE TRANSACTION SEARCH (ENGLISH / HINDI / HINGLISH)
  // ============================================================================
  if (selectedModule === 'AI-02') {
    const activeChip =
      PRD_NL_SEARCH_PRESETS.find((c) => c.id === selectedChipId) ||
      PRD_NL_SEARCH_PRESETS[0];

    const matchedRows = transactions.filter((t) => {
      if (customSearchText.trim()) {
        const q = customSearchText.toLowerCase();
        return (
          t.counterparty_name.toLowerCase().includes(q) ||
          t.counterparty_vpa.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q)
        );
      }
      return activeChip.filterFn(t);
    });

    const matchedSum = roundPaisa(
      matchedRows.reduce((acc, r) => acc + r.amount, 0)
    );

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-02 • CONVERSATIONAL FILTER AST (ENGLISH / HINDI / HINGLISH)
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Natural-Language Transaction Search
            </h2>
          </div>
          {onNavigateToCoreOption && (
            <button
              type="button"
              onClick={() => onNavigateToCoreOption('CORE-D')}
              className="px-3.5 py-1.5 rounded-full bg-[#14141C] border border-[#FF6A00]/40 text-xs font-mono text-[#FF8800] hover:text-white"
            >
              Open Full ActivityHistoryScreen →
            </button>
          )}
        </div>

        {/* Exact PRD 1.2 Search Chips */}
        <div className="flex flex-wrap gap-2">
          {PRD_NL_SEARCH_PRESETS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setSelectedChipId(chip.id);
                setCustomSearchText('');
                onLogAiToolCall(
                  'AI-02',
                  'queryFinancialLedger',
                  {
                    naturalLanguageQuery: chip.queryText,
                    parsedAst: chip.parsedAst,
                  },
                  {
                    matchedRowCount: transactions.filter(chip.filterFn).length,
                    clarificationRequired: chip.isAmbiguous,
                  }
                );
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedChipId === chip.id && !customSearchText
                  ? 'btn-blaze-orange'
                  : 'bg-[#14141C] border border-[#FF6A00]/30 text-[#C8CAD0] hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={customSearchText}
          onChange={(e) => setCustomSearchText(e.target.value)}
          placeholder="Or type in English / Hindi / Hinglish (e.g., bescom, zomato, jio, 500)..."
          className="w-full bg-[#050507] border border-[#FF6A00]/35 rounded-2xl px-4 py-2.5 text-xs text-white"
        />

        {/* Schema-Validated JSON AST + Deterministic Sum */}
        <div className="p-3.5 rounded-2xl bg-[#050507] border border-[#FF6A00]/30 text-xs font-mono text-[#FF8800] space-y-1">
          <div className="flex items-center justify-between">
            <span>
              SCHEMA-VALIDATED FILTER AST (Zero Raw SQL Generation):
            </span>
            <span className="text-white font-bold">
              Matched Sum: {formatInr(matchedSum)} ({matchedRows.length} rows)
            </span>
          </div>
          <div className="text-[#D8DAE0] break-all">
            {JSON.stringify(
              customSearchText.trim()
                ? { textSearch: customSearchText.trim(), rlsScoped: true }
                : activeChip.parsedAst
            )}
          </div>
        </div>

        {/* Ambiguous Query Clarification Guardrail (PRD 1.2) */}
        {activeChip.isAmbiguous && !customSearchText.trim() ? (
          <div className="p-5 rounded-2xl bg-[#261207] border border-[#FF6A00] text-xs space-y-2">
            <div className="font-mono font-extrabold text-[#FF8800] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                PRD 1.2 AMBIGUOUS QUERY GUARDRAIL TRIGGERED — CLARIFICATION
                REQUESTED
              </span>
            </div>
            <p className="text-white leading-relaxed">
              &ldquo;Show my recent stuff&rdquo; is ambiguous. Rather than
              guessing arbitrary SQL/Firestore paths, Jain Pay Co-Pilot asks:
              <strong>
                {' '}
                Would you like to filter by Last 7 Days, Payments over ₹500, or
                a specific category (Utilities / Dining)?
              </strong>
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {matchedRows.map((tx) => (
              <div
                key={tx.transaction_id}
                className="card-3d-sub p-3.5 rounded-2xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{tx.counterparty_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#050507] border border-[#FF6A00]/30 text-[10px] font-mono text-[#FF8800]">
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#AEAEB7]">
                    {tx.transaction_id} • {tx.category} • {tx.note}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-extrabold text-[#FF8800]">
                    {formatInr(tx.amount)}
                  </span>
                  {onOpenReceipt && (
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(tx)}
                      className="px-3 py-1.5 rounded-full bg-[#14141C] border border-white/15 text-[11px] font-mono text-white flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-[#FF8800]" />
                      <span>Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // AI-03: SMART BUDGETS & PROACTIVE SPENDING ALERTS (WITH OPT-IN & NON-BLOCKING PROOF)
  // ============================================================================
  if (selectedModule === 'AI-03') {
    const budgetRows = [
      {
        label: 'Dining & Food Delivery',
        spent: foodSpent,
        cap: foodBudgetCap,
        setCap: setFoodBudgetCap,
      },
      {
        label: 'Utilities & Telecom BBPS',
        spent: utilitiesSpent,
        cap: utilitiesBudgetCap,
        setCap: setUtilitiesBudgetCap,
      },
      {
        label: 'P2P Transfers',
        spent: p2pSpent,
        cap: p2pBudgetCap,
        setCap: setP2pBudgetCap,
      },
    ];

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-03 • PROACTIVE CATEGORY CAPS &amp; MONTH-END VELOCITY (P2)
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Smart Budgets &amp; Proactive Spending Alerts
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setBudgetsOptIn((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
              budgetsOptIn
                ? 'btn-blaze-orange'
                : 'bg-[#14141C] border border-white/20 text-[#AEAEB7]'
            }`}
          >
            {budgetsOptIn
              ? '✓ User Opt-In: ACTIVE'
              : 'User Opt-In: PAUSED (Click to Enable)'}
          </button>
        </div>

        <div className="space-y-3.5">
          {budgetRows.map((b) => {
            const pct = Math.round((b.spent / b.cap) * 100);
            const projectedMonthEnd = roundPaisa(b.spent * 1.35);
            const alertState = !budgetsOptIn
              ? 'OPT_IN_PAUSED'
              : pct >= 95
              ? 'CRITICAL_95_ALERT'
              : pct >= 72
              ? 'PACE_WARNING_72'
              : 'ON_TRACK';
            return (
              <div
                key={b.label}
                className="card-3d-sub p-4 rounded-2xl space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    {b.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#050507] border border-[#FF6A00]/40 text-[10px] font-mono font-bold text-[#FF8800]">
                    {alertState} ({pct}% • Projected EOM:{' '}
                    {formatInr(projectedMonthEnd)})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#C8CAD0]">
                  <span>Spent: {formatInr(b.spent)}</span>
                  <span>Monthly Cap: {formatInr(b.cap)}</span>
                </div>

                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={b.cap}
                  onChange={(e) => b.setCap(Number(e.target.value))}
                  className="w-full accent-[#FF5E00]"
                />
              </div>
            );
          })}
        </div>

        {/* PRD 1.3 Guardrail Proof Button */}
        <div className="p-4 rounded-2xl bg-[#121218] border border-[#FF6A00]/30 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#D8DAE0]">
            <strong className="text-[#FF8800] font-mono">
              PRD 1.3 Non-Blocking Guardrail:
            </strong>{' '}
            Never freezes accounts or blocks payments when a cap is crossed.
          </div>
          <button
            type="button"
            onClick={() =>
              onStagePayment({
                recipientName: 'Mainland China Dining',
                recipientVpa: 'zomato@hdfcbank',
                amount: 950,
                note: 'AI-03 Over-Budget Non-Blocking Proof',
                txType: 'SEND',
                category: 'Dining & Food',
                idempotencyKey: `uuid-ai03-${Date.now()}`,
                sourceModule: 'AI-03',
              })
            }
            className="py-2 px-4 rounded-full btn-blaze-orange text-xs font-mono"
          >
            Test Over-Budget Payment (₹950) →
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AI-04: PREDICTIVE CASHFLOW & RECURRING PAYMENT DETECTION ENGINE
  // ============================================================================
  if (selectedModule === 'AI-04') {
    const active48hBillsSum = roundPaisa(
      recurringBills
        .filter(
          (b) => b.status === 'CONFIRMED' || b.status === 'PENDING_CONFIRM'
        )
        .reduce((acc, b) => acc + b.amount, 0)
    );
    const postBillLiquidity = roundPaisa(availableBalance - active48hBillsSum);

    const updateBillStatus = (
      id: string,
      status: RecurringBillCandidate['status']
    ) => {
      setRecurringBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    };

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-04 • RECURRING CYCLE DETECTOR &amp; 48H SHORTFALL ENGINE (P2)
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Predictive Cashflow &amp; Recurring Payment Detection
            </h2>
          </div>
          <CalendarClock className="w-6 h-6 text-[#FF8800]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              CURRENT WALLET BALANCE
            </span>
            <span className="text-lg font-extrabold text-white">
              {formatInr(availableBalance)}
            </span>
          </div>
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              ACTIVE 48H RECURRING BILLS
            </span>
            <span className="text-lg font-extrabold text-[#FF8800]">
              -{formatInr(active48hBillsSum)}
            </span>
          </div>
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              PROJECTED 48H SURPLUS
            </span>
            <span className="text-lg font-extrabold text-[#FF8800]">
              {formatInr(postBillLiquidity)}
            </span>
          </div>
        </div>

        {/* Interactive Confirm / Edit / Snooze / Disable Controls (PRD 1.4) */}
        <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
          {recurringBills.map((bill) => (
            <div
              key={bill.id}
              className="card-3d-sub p-4 rounded-2xl space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{bill.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#050507] border border-[#FF6A00]/40 text-[10px] font-mono text-[#FF8800]">
                      {bill.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#AEAEB7]">
                    {bill.cycleLabel} • Due in {bill.dueInHours}h •{' '}
                    {bill.counterpartyVpa}
                  </div>
                </div>

                <div className="text-sm font-mono font-extrabold text-[#FF8800]">
                  {formatInr(bill.amount)}
                </div>
              </div>

              {editingBillId === bill.id ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={editBillAmountStr}
                    onChange={(e) => setEditBillAmountStr(e.target.value)}
                    className="w-28 bg-[#050507] border border-[#FF6A00] rounded-xl px-3 py-1 text-xs font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const amt = roundPaisa(Number(editBillAmountStr) || 500);
                      setRecurringBills((prev) =>
                        prev.map((b) =>
                          b.id === bill.id
                            ? { ...b, amount: amt, status: 'CONFIRMED' }
                            : b
                        )
                      );
                      setEditingBillId(null);
                    }}
                    className="px-3 py-1 rounded-full btn-blaze-orange text-[11px] font-mono"
                  >
                    Save Amount
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateBillStatus(bill.id, 'CONFIRMED')}
                      className="px-2.5 py-1 rounded-full bg-[#14141C] border border-[#FF6A00]/40 text-[10px] font-mono text-white flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#FF8800]" />
                      <span>Confirm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBillId(bill.id);
                        setEditBillAmountStr(String(bill.amount));
                      }}
                      className="px-2.5 py-1 rounded-full bg-[#14141C] border border-white/15 text-[10px] font-mono text-[#C8CAD0] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBillStatus(bill.id, 'SNOOZED_24H')}
                      className="px-2.5 py-1 rounded-full bg-[#14141C] border border-white/15 text-[10px] font-mono text-[#C8CAD0] flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Snooze 24h</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBillStatus(bill.id, 'DISABLED')}
                      className="px-2.5 py-1 rounded-full bg-[#14141C] border border-white/15 text-[10px] font-mono text-[#AEAEB7] flex items-center gap-1"
                    >
                      <BellOff className="w-3 h-3" />
                      <span>Disable</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onStagePayment({
                        recipientName: bill.title,
                        recipientVpa: bill.counterpartyVpa,
                        amount: bill.amount,
                        note: `AI-04 Confirmed Recurring Obligation (${bill.cycleLabel})`,
                        txType: 'BILL_PAYMENT',
                        category: 'Utilities',
                        idempotencyKey: `uuid-ai04-${bill.id}-${Date.now()}`,
                        sourceModule: 'AI-04',
                      })
                    }
                    className="px-3 py-1 rounded-full btn-blaze-orange text-[11px] font-mono"
                  >
                    Stage Bill (PIN Required) →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // AI-05: VOICE & TEXT CO-PILOT & 3 CORE TOOL CONTRACTS
  // ============================================================================
  if (selectedModule === 'AI-05') {
    const billerLookupMap: Record<
      typeof selectedBillerCategory,
      { status: string; amountDue?: number; consumerNo: string; note: string }
    > = {
      ELECTRICITY: {
        status: 'AUTHORIZED_BBPS_ACTIVE',
        amountDue: 1850.0,
        consumerNo: '8841209921 (BESCOM)',
        note: 'Due 26 Oct 2026 • Verified BBPS Biller',
      },
      WATER: {
        status: 'AUTHORIZED_BBPS_ACTIVE',
        amountDue: 490.0,
        consumerNo: 'WTR-209184 (BWSSB)',
        note: 'Due 02 Nov 2026 • Verified BBPS Biller',
      },
      GAS: {
        status: 'AUTHORIZED_BBPS_ACTIVE',
        amountDue: 903.0,
        consumerNo: 'LPG-7748291 (Indane)',
        note: 'Cylinder Refill • Verified BBPS Biller',
      },
      BROADBAND: {
        status: 'AUTHORIZED_BBPS_ACTIVE',
        amountDue: 1178.82,
        consumerNo: '080-44918201 (JioFiber)',
        note: 'Due 29 Oct 2026 • Verified BBPS Biller',
      },
      FASTAG: {
        status: 'AUTHORIZED_BBPS_ACTIVE',
        amountDue: 500.0,
        consumerNo: 'KA-01-MJ-8820 (NHAI FASTag)',
        note: 'Low Tag Threshold • Verified BBPS Biller',
      },
      UNREGISTERED_SANDBOX: {
        status: 'SANDBOX_UNAVAILABLE_NO_FABRICATION',
        consumerNo: 'UNREG-990011',
        note: 'PRD 1.5 Guardrail: Clearly reports sandbox/unavailable status without fabricating bill amounts.',
      },
    };

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-05 • ENGLISH / HINDI / HINGLISH ASSISTANT &amp; 3 TOOL CONTRACTS
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Jain Pay Voice &amp; Text Co-Pilot
            </h2>
          </div>
          <Bot className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* Multilingual Voice/Text Quick Prompts (English, Hindi, Hinglish) */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              lang: 'English',
              text: '"Stage ₹500 to Rahul Verma for dinner"',
              action: () => {
                setCoPilotOutput(
                  '[English Prompt] Routed to stagePeerPayment(recipientIdentifier="rahul@okaxis", amount=500, paymentNote="Dinner Share"). Forbidden from calling createPayment() directly!'
                );
                onStagePayment({
                  recipientName: 'Rahul Verma',
                  recipientVpa: 'rahul@okaxis',
                  amount: 500,
                  note: 'Dinner Share (AI-05 English)',
                  txType: 'SEND',
                  category: 'P2P Transfers',
                  idempotencyKey: `uuid-ai05-en-${Date.now()}`,
                  sourceModule: 'AI-05',
                });
              },
            },
            {
              lang: 'Hindi',
              text: '"राहुल को ₹500 डिनर के लिए भेजो"',
              action: () => {
                setCoPilotOutput(
                  '[Hindi Prompt] "राहुल को ₹500 डिनर के लिए भेजो" -> stagePeerPayment("rahul@okaxis", 500.00) -> Pre-filled PaymentReviewScreen awaiting 4-digit PIN.'
                );
                onStagePayment({
                  recipientName: 'Rahul Verma',
                  recipientVpa: 'rahul@okaxis',
                  amount: 500,
                  note: 'डिनर शेयर (AI-05 Hindi)',
                  txType: 'SEND',
                  category: 'P2P Transfers',
                  idempotencyKey: `uuid-ai05-hi-${Date.now()}`,
                  sourceModule: 'AI-05',
                });
              },
            },
            {
              lang: 'Hinglish',
              text: '"Pooja ko ₹350 coffee ke liye stage karo"',
              action: () => {
                setCoPilotOutput(
                  '[Hinglish Prompt] "Pooja ko ₹350 coffee ke liye stage karo" -> stagePeerPayment("pooja@icici", 350.00) -> Pre-filled PaymentReviewScreen.'
                );
                onStagePayment({
                  recipientName: 'Pooja Sharma',
                  recipientVpa: 'pooja@icici',
                  amount: 350,
                  note: 'Coffee Share (AI-05 Hinglish)',
                  txType: 'SEND',
                  category: 'Dining & Food',
                  idempotencyKey: `uuid-ai05-hg-${Date.now()}`,
                  sourceModule: 'AI-05',
                });
              },
            },
          ].map((p) => (
            <button
              key={p.lang}
              type="button"
              onClick={p.action}
              className="px-3.5 py-2 rounded-full bg-[#14141C] border border-[#FF6A00]/40 hover:border-[#FF6A00] text-xs text-white flex items-center gap-1.5"
            >
              <span className="px-2 py-0.5 rounded-full bg-[#FF5E00] text-[#050507] font-mono font-bold text-[10px]">
                {p.lang}
              </span>
              <span>{p.text}</span>
            </button>
          ))}
        </div>

        {/* 3 Core Tool Contracts (PRD 1.5) */}
        <div className="space-y-3">
          {/* Contract 1: queryFinancialLedger */}
          <div className="card-3d-sub p-4 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono font-bold text-[#FF8800]">
                Contract 2: queryFinancialLedger(timeRangeDays: 30,
                transactionType)
              </div>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    'ALL',
                    'SEND',
                    'RECEIVE',
                    'BILL_PAYMENT',
                    'RECHARGE',
                  ] as const
                ).map((tType) => (
                  <button
                    key={tType}
                    type="button"
                    onClick={() => {
                      setSelectedLedgerTxType(tType);
                      const rows =
                        tType === 'ALL'
                          ? transactions
                          : transactions.filter((t) => t.tx_type === tType);
                      const sum = roundPaisa(
                        rows.reduce((a, b) => a + b.amount, 0)
                      );
                      const res = {
                        timeRangeDays: 30,
                        transactionType: tType,
                        matchedCount: rows.length,
                        deterministicSumInr: sum,
                      };
                      onLogAiToolCall(
                        'AI-05',
                        'queryFinancialLedger',
                        { timeRangeDays: 30, transactionType: tType },
                        res
                      );
                      setCoPilotOutput(
                        `Executed queryFinancialLedger(30, "${tType}") -> ${JSON.stringify(
                          res
                        )}`
                      );
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      selectedLedgerTxType === tType
                        ? 'btn-blaze-orange'
                        : 'bg-[#050507] border border-white/15 text-[#C8CAD0]'
                    }`}
                  >
                    {tType}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contract 3: fetchBillDueStatus across all 5 PRD categories + Sandbox Unavailable */}
          <div className="card-3d-sub p-4 rounded-2xl space-y-2.5">
            <div className="text-xs font-mono font-bold text-[#FF8800]">
              Contract 3: fetchBillDueStatus(billerCategory, consumerNumber)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'ELECTRICITY',
                  'WATER',
                  'GAS',
                  'BROADBAND',
                  'FASTAG',
                  'UNREGISTERED_SANDBOX',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedBillerCategory(cat);
                    const info = billerLookupMap[cat];
                    onLogAiToolCall(
                      'AI-05',
                      'fetchBillDueStatus',
                      { billerCategory: cat, consumerNumber: info.consumerNo },
                      info
                    );
                    setCoPilotOutput(
                      `Executed fetchBillDueStatus("${cat}", "${
                        info.consumerNo
                      }") -> ${JSON.stringify(info)}`
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                    selectedBillerCategory === cat
                      ? 'btn-blaze-orange'
                      : 'bg-[#050507] border border-white/15 text-[#C8CAD0]'
                  }`}
                >
                  {cat === 'UNREGISTERED_SANDBOX'
                    ? '⚠️ Test Unregistered Biller (No-Fabrication Guardrail)'
                    : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#050507] border border-[#FF6A00]/40 text-xs font-mono text-[#FF8800] break-all">
          {coPilotOutput}
        </div>
      </div>
    );
  }

  // ============================================================================
  // AI-06: MULTIMODAL BILL, RECEIPT & QR ASSISTANCE
  // ============================================================================
  if (selectedModule === 'AI-06') {
    const activeBill = SAMPLE_OCR_BILLS[selectedOcrIdx];
    const parsedOcrAmt = roundPaisa(
      Number(editableOcrAmount) || activeBill.totalAmountDue
    );
    const parsedQr = parseUpiUri(qrExplainUri);

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-06 • 6-FIELD STRUCTURED OCR CONTRACT &amp; QR EXPLAINER
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Multimodal Bill, Receipt &amp; QR Assistance
            </h2>
          </div>
          <Camera className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* 3 Sample Bills Selector */}
        <div className="flex flex-wrap gap-2">
          {SAMPLE_OCR_BILLS.map((bill, idx) => (
            <button
              key={bill.id}
              type="button"
              onClick={() => {
                setSelectedOcrIdx(idx);
                setEditableBillerName(bill.billerName);
                setEditableOcrAmount(String(bill.totalAmountDue));
                setEditableOcrConsumer(bill.consumerId);
                setEditableDueDate(bill.dueDate);
                setEditableBillPeriod(bill.billPeriod);
                onLogAiToolCall(
                  'AI-06',
                  'fetchBillDueStatus',
                  { sampleInvoiceId: bill.id },
                  bill as unknown as Record<string, unknown>
                );
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedOcrIdx === idx
                  ? 'btn-blaze-orange'
                  : 'bg-[#14141C] border border-[#FF6A00]/30 text-[#C8CAD0]'
              }`}
            >
              {bill.label}
            </button>
          ))}
        </div>

        {/* Full 6-Field Editable Confirmation Form (PRD 1.6 Guardrail) */}
        <div className="card-3d-sub p-4 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#FF8800] font-bold">
              UNTURSTED OCR SUGGESTION FORM (ALL 6 PRD FIELDS EDITABLE):
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#050507] border border-[#FF6A00]/40 text-[#FF8800]">
              confidenceScore: {(activeBill.confidenceScore * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-[#AEAEB7] mb-1">
                1. billerName
              </label>
              <input
                type="text"
                value={editableBillerName}
                onChange={(e) => setEditableBillerName(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AEAEB7] mb-1">
                2. consumerId
              </label>
              <input
                type="text"
                value={editableOcrConsumer}
                onChange={(e) => setEditableOcrConsumer(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AEAEB7] mb-1">
                3. dueDate
              </label>
              <input
                type="text"
                value={editableDueDate}
                onChange={(e) => setEditableDueDate(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AEAEB7] mb-1">
                4. totalAmountDue (INR)
              </label>
              <input
                type="number"
                step="0.01"
                value={editableOcrAmount}
                onChange={(e) => setEditableOcrAmount(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#FF8800]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-[#AEAEB7] mb-1">
                5. billPeriod
              </label>
              <input
                type="text"
                value={editableBillPeriod}
                onChange={(e) => setEditableBillPeriod(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onStagePayment({
                recipientName: editableBillerName,
                recipientVpa: activeBill.billerVpa,
                amount: parsedOcrAmt,
                note: `AI-06 OCR Bill #${editableOcrConsumer} (${editableBillPeriod})`,
                txType: 'BILL_PAYMENT',
                category: 'Utilities',
                idempotencyKey: `uuid-ocr-${activeBill.id}-${Date.now()}`,
                sourceModule: 'AI-06',
              })
            }
            className="w-full py-2.5 px-5 rounded-full btn-blaze-orange text-xs"
          >
            Stage User-Confirmed Bill ({formatInr(parsedOcrAmt)}) → Review &amp;
            4-Digit PIN
          </button>
        </div>

        {/* Deterministic UPIParser QR Payload Explainer (PRD 1.6) */}
        <div className="card-3d-sub p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#FF8800] font-bold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>DETERMINISTIC UPIParser QR PAYLOAD EXPLAINER:</span>
            </span>
            <span className="text-white">
              {parsedQr.isValid ? '✓ VALID NPCI URI' : '✗ INVALID URI'}
            </span>
          </div>
          <input
            type="text"
            value={qrExplainUri}
            onChange={(e) => setQrExplainUri(e.target.value)}
            className="w-full bg-[#050507] border border-white/15 rounded-xl px-3 py-1.5 text-[11px] font-mono text-[#FF8800]"
          />
          <div className="text-[11px] font-mono text-[#D8DAE0]">
            {parsedQr.isValid
              ? `Explained: Pays ₹${parsedQr.am?.toFixed(2) ?? 'Open'} (${
                  parsedQr.cu
                }) to "${parsedQr.pn}" (pa=${parsedQr.pa}, mc=${
                  parsedQr.mc || '0000'
                }, tr=${parsedQr.tr || 'N/A'}).`
              : `Blocked by UPIParser: ${parsedQr.errorReason}`}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AI-07: BEHAVIORAL FRAUD & ANOMALY DETECTION SIGNALS (HIGH GOVERNANCE)
  // ============================================================================
  if (selectedModule === 'AI-07') {
    const baseRisk = computeBehavioralFraudScore(fadState);
    const attestationPenalty = deviceAttested ? 0 : 25;
    const finalScore = Math.min(100, baseRisk.score + attestationPenalty);
    const finalTier =
      finalScore >= 70
        ? 'CRITICAL'
        : finalScore >= 35
        ? 'MEDIUM'
        : 'LOW';

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              AI-07 • PRE-AUTHORIZATION BEHAVIORAL RISK TELEMETRY (P3)
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Behavioral Fraud &amp; Anomaly Detection Lab
            </h2>
          </div>
          <ShieldAlert className="w-6 h-6 text-[#FF8800]" />
        </div>

        <div className="card-3d-sub p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#AEAEB7] block">
              COMPOSITE RISK SCORE &amp; PRD TIER
            </span>
            <span className="text-2xl font-mono font-extrabold text-[#FF8800]">
              {finalScore} / 100 ({finalTier} RISK)
            </span>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800]">
            {finalTier === 'LOW'
              ? 'Low Risk: Standard 4-Digit PIN Flow'
              : finalTier === 'MEDIUM'
              ? 'Medium Risk: Step-Up Biometric / Secondary Prompt'
              : 'Critical Risk: Deterministic Soft-Hold + Challenge'}
          </span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div>
            <div className="flex justify-between mb-1">
              <span>1. 15-Minute Trailing Velocity:</span>
              <span className="text-[#FF8800]">
                {fadState.velocity15Min} txns / 15m
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={fadState.velocity15Min}
              onChange={(e) =>
                onChangeFadState((s) => ({
                  ...s,
                  velocity15Min: Number(e.target.value),
                }))
              }
              className="w-full accent-[#FF5E00]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>2. Transaction Hour (IST — 01:00–04:59 is Nocturnal):</span>
              <span className="text-[#FF8800]">
                {String(fadState.hourOfDay).padStart(2, '0')}:00 IST
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={fadState.hourOfDay}
              onChange={(e) =>
                onChangeFadState((s) => ({
                  ...s,
                  hourOfDay: Number(e.target.value),
                }))
              }
              className="w-full accent-[#FF5E00]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>3. Amount Ratio vs. User Baseline:</span>
              <span className="text-[#FF8800]">
                {fadState.amountRatioVsBaseline.toFixed(1)}x Avg
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={fadState.amountRatioVsBaseline}
              onChange={(e) =>
                onChangeFadState((s) => ({
                  ...s,
                  amountRatioVsBaseline: Number(e.target.value),
                }))
              }
              className="w-full accent-[#FF5E00]"
            />
          </div>

          {/* Toggles for First-Time Counterparty & Play Integrity Attestation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer card-3d-sub p-3 rounded-xl">
              <input
                type="checkbox"
                checked={fadState.isNewCounterparty}
                onChange={(e) =>
                  onChangeFadState((s) => ({
                    ...s,
                    isNewCounterparty: e.target.checked,
                  }))
                }
                className="accent-[#FF5E00]"
              />
              <span>4. First-Time Unverified VPA</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer card-3d-sub p-3 rounded-xl">
              <input
                type="checkbox"
                checked={deviceAttested}
                onChange={(e) => setDeviceAttested(e.target.checked)}
                className="accent-[#FF5E00]"
              />
              <span>
                5. Play Integrity / App Check:{' '}
                {deviceAttested ? 'VERIFIED' : 'UNATTESTED (+25 Risk)'}
              </span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onStagePayment({
              recipientName: 'Unknown Night Merchant',
              recipientVpa: 'unknown.night@ybl',
              amount: 4500,
              note: `AI-07 Risk Tier Test (${finalTier} • Score ${finalScore}/100)`,
              txType: 'SEND',
              category: 'P2P Transfers',
              idempotencyKey: `uuid-ai07-${Date.now()}`,
              sourceModule: 'AI-07',
            })
          }
          className="w-full py-3 px-5 rounded-full btn-blaze-orange text-xs font-mono"
        >
          Stage Test Payment Under {finalTier} Risk Tier → Inspect Step-Up Gate
        </button>
      </div>
    );
  }

  // ============================================================================
  // AI-08: CONTEXTUAL-BANDIT (LINUCB) REWARDS & SMART WORKFLOW DISCOVERY
  // ============================================================================
  const arms = computeLinUcbScores({
    category: banditCategory,
    amount: banditAmount,
    alpha: banditAlpha,
  });

  return (
    <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
      <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
            AI-08 • CONTEXTUAL-BANDIT (LINUCB) &amp; SMART WORKFLOW DISCOVERY
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Contextual-Bandit Rewards &amp; Smart Discovery
          </h2>
        </div>
        <Award className="w-6 h-6 text-[#FF8800]" />
      </div>

      {/* Smart Discovery Workflow Guidance (PRD 1.8: Recharge, Bills, Receive QR, Activity) */}
      <div className="card-3d-sub p-4 rounded-2xl space-y-2.5">
        <div className="text-xs font-mono font-bold text-[#FF8800] flex items-center gap-1.5">
          <Compass className="w-4 h-4" />
          <span>
            SMART WORKFLOW DISCOVERY (PRD 1.8 — CONTEXTUAL NEXT-ACTION ROUTING):
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              label: '1. 5G Recharge',
              sub: '84d Cycle Due Soon',
              coreId: 'CORE-E' as CoreFeatureId,
            },
            {
              label: '2. BBPS Bills',
              sub: 'BESCOM Due in 36h',
              coreId: 'CORE-E' as CoreFeatureId,
            },
            {
              label: '3. Receive QR',
              sub: 'Dynamic UPI 2.0 URI',
              coreId: 'CORE-C' as CoreFeatureId,
            },
            {
              label: '4. Activity Log',
              sub: 'Audit & Refunds',
              coreId: 'CORE-D' as CoreFeatureId,
            },
          ].map((wf) => (
            <button
              key={wf.label}
              type="button"
              onClick={() =>
                onNavigateToCoreOption && onNavigateToCoreOption(wf.coreId)
              }
              className="p-2.5 rounded-xl bg-[#050507] border border-[#FF6A00]/35 hover:border-[#FF6A00] text-left transition-all"
            >
              <div className="text-xs font-bold text-white">{wf.label}</div>
              <div className="text-[10px] font-mono text-[#FF8800]">
                {wf.sub} →
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="block text-[#C8CAD0] mb-1">
            Transaction Context Category
          </label>
          <select
            value={banditCategory}
            onChange={(e) =>
              setBanditCategory(e.target.value as TransactionCategory)
            }
            className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-2 text-white"
          >
            <option value="Dining & Food">Dining &amp; Food</option>
            <option value="Utilities">Utilities &amp; Bills</option>
            <option value="Telecom Recharge">Telecom 5G Recharge</option>
            <option value="P2P Transfers">P2P Transfers</option>
          </select>
        </div>

        <div>
          <label className="block text-[#C8CAD0] mb-1">
            Exploration Alpha (α): {banditAlpha.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.1}
            max={1.2}
            step={0.05}
            value={banditAlpha}
            onChange={(e) => setBanditAlpha(Number(e.target.value))}
            className="w-full accent-[#FF5E00] mt-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        {arms.map((arm, idx) => (
          <div
            key={arm.armId}
            className={`card-3d-sub p-3.5 rounded-2xl flex items-center justify-between ${
              idx === 0 ? 'border-[#FF6A00]' : ''
            }`}
          >
            <div>
              <div className="text-xs font-bold text-white">
                #{idx + 1} {arm.merchantTitle} ({arm.rewardLabel})
              </div>
              <div className="text-[11px] font-mono text-[#AEAEB7]">
                Empirical Mean: {arm.empiricalMean.toFixed(3)} + Exploration:{' '}
                {arm.uncertaintyBonus.toFixed(3)}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FF5E00]/20 text-xs font-mono font-extrabold text-[#FF8800]">
              UCB: {arm.ucbScore.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
