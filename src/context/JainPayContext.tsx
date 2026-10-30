import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminVaultTab } from '../components/AdminVaultSection';
import { ENV_CONFIG } from '../config/envConfig';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AI_LOGS,
  INITIAL_AUTOPAY_MANDATES,
  INITIAL_CREDIT_SANCTIONS,
  INITIAL_DISPUTE_CHARGEBACKS,
  INITIAL_FX_TREASURY_VAULTS,
  INITIAL_KHATA_ENTRIES,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_LINKED_BANKS,
  INITIAL_MILESTONE_DEALS,
  INITIAL_SCRATCH_CARDS,
  INITIAL_SECURITY_AUDIT_LOGS,
  INITIAL_SQL_LOGS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from '../data/initialState';
import {
  BaselineAiId,
  CoreFeatureId,
  FeaturePipelineSpec,
  NextGenFeatureId,
  SingleFeatureId,
  getPipelineSpecById,
} from '../data/pipelineMetadata';
import { LedgerApiService } from '../services/api/ledgerApiService';
import {
  AccountRecord,
  AiToolCallLog,
  AutopayMandateRecord,
  BcnfTableName,
  CreditSanctionRecord,
  DisputeChargebackRecord,
  FcmPushToast,
  FxTreasuryVaultRecord,
  KhataEntryRecord,
  LedgerEntryRecord,
  LinkedBankAccountRecord,
  MilestoneDealRecord,
  SandboxOutcomeMode,
  ScratchCardItem,
  SecurityAuditLogRecord,
  SqlRlsLogEntry,
  StagedPaymentDraft,
  TopNavigationMode,
  TransactionRecord,
  UserRecord,
} from '../types/domain';
import {
  computeBehavioralFraudScore,
  computePBKDF2HashHex,
  formatInr,
  roundPaisa,
} from '../utils/ledgerEngine';

export interface FadAnomalyState {
  velocity15Min: number;
  hourOfDay: number;
  amountRatioVsBaseline: number;
  isNewCounterparty: boolean;
}

export type VoiceAgentSubfunctionId =
  | 'VOICE_CHAT_STAGE'
  | 'MULTI_TURN_CHATBOT'
  | 'LIVE_VOICE_SESSION'
  | 'SEARCH_GROUNDING'
  | 'TEN_PROMPT_MATRIX'
  | 'LIVE_DB_EXPLORER';

export type ThemeMode = 'dark' | 'light';

export interface JainPayStoreContextValue {
  // Theme Mode (Dark / Light)
  themeMode: ThemeMode;
  setThemeMode: (theme: ThemeMode) => void;
  toggleThemeMode: () => void;

  // Navigation & Functions -> Subfunctions State
  activeMode: TopNavigationMode;
  setActiveMode: (mode: TopNavigationMode) => void;
  activeCameraIndex: number;
  setActiveCameraIndex: (index: number) => void;
  isFullCanvasMode: boolean;
  setIsFullCanvasMode: React.Dispatch<React.SetStateAction<boolean>>;
  isArchitectureDrawerOpen: boolean;
  setIsArchitectureDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Subfunction Selectors
  selectedVoiceSubId: VoiceAgentSubfunctionId;
  setSelectedVoiceSubId: (id: VoiceAgentSubfunctionId) => void;
  selectedCoreId: CoreFeatureId;
  setSelectedCoreId: (id: CoreFeatureId) => void;
  selectedAiId: BaselineAiId;
  setSelectedAiId: (id: BaselineAiId) => void;
  selectedNextGenId: NextGenFeatureId;
  setSelectedNextGenId: (id: NextGenFeatureId) => void;
  activeFeatureSpec: FeaturePipelineSpec;
  handleLaunchSpecificFeature: (featureId: SingleFeatureId) => void;

  // Administrator Vault State
  isAdminVaultUnlocked: boolean;
  setIsAdminVaultUnlocked: (unlocked: boolean) => void;
  adminVaultTab: AdminVaultTab;
  setAdminVaultTab: (tab: AdminVaultTab) => void;
  activeBcnfTable: BcnfTableName;
  setActiveBcnfTable: (table: BcnfTableName) => void;

  // All 12 Enterprise BCNF Tables & Derived Projections
  users: UserRecord[];
  primaryUser: UserRecord;
  activePin: string;
  accounts: AccountRecord[];
  walletAccount: AccountRecord;
  linkedBanks: LinkedBankAccountRecord[];
  primaryBank: LinkedBankAccountRecord;
  transactions: TransactionRecord[];
  ledgerEntries: LedgerEntryRecord[];
  khataEntries: KhataEntryRecord[];
  setKhataEntries: React.Dispatch<React.SetStateAction<KhataEntryRecord[]>>;
  milestoneDeals: MilestoneDealRecord[];
  setMilestoneDeals: React.Dispatch<React.SetStateAction<MilestoneDealRecord[]>>;
  autopayMandates: AutopayMandateRecord[];
  creditSanctions: CreditSanctionRecord[];
  fxTreasuryVaults: FxTreasuryVaultRecord[];
  disputeChargebacks: DisputeChargebackRecord[];
  securityAuditLogs: SecurityAuditLogRecord[];
  scratchCards: ScratchCardItem[];

  // Audit Streams & Behavioral Risk
  sqlLogs: SqlRlsLogEntry[];
  aiLogs: AiToolCallLog[];
  fadState: FadAnomalyState;
  setFadState: React.Dispatch<React.SetStateAction<FadAnomalyState>>;
  stagedRisk: ReturnType<typeof computeBehavioralFraudScore>;
  sandboxOutcome: SandboxOutcomeMode;
  setSandboxOutcome: (mode: SandboxOutcomeMode) => void;
  lastPipelinePulse: string;
  setLastPipelinePulse: (msg: string) => void;
  runtimeErrorBanner: string | null;
  clearRuntimeErrorBanner: () => void;

  // Interactive Modals & Notifications
  isBalanceRevealed: boolean;
  setIsBalanceRevealed: (revealed: boolean) => void;
  isBalancePinModalOpen: boolean;
  setIsBalancePinModalOpen: (open: boolean) => void;
  stagedDraft: StagedPaymentDraft | null;
  setStagedDraft: (draft: StagedPaymentDraft | null) => void;
  activeReceiptTx: TransactionRecord | null;
  setActiveReceiptTx: (tx: TransactionRecord | null) => void;
  replayBannerNotice: string | null;
  setReplayBannerNotice: (notice: string | null) => void;
  scamInterceptPayload: { uri: string; chatMessage: string } | null;
  setScamInterceptPayload: (
    payload: { uri: string; chatMessage: string } | null
  ) => void;
  diagnosedTxId: string;
  setDiagnosedTxId: (txId: string) => void;
  fcmToasts: FcmPushToast[];
  dismissFcmToast: (id: string) => void;
  pushFcmToast: (title: string, redactedLockScreenBody: string) => void;

  // Decoupled Business Action Dispatchers
  appendSqlLog: (entry: SqlRlsLogEntry) => void;
  appendAiLog: (
    moduleCode: AiToolCallLog['moduleCode'],
    toolName: AiToolCallLog['toolName'],
    requestPayload: Record<string, unknown>,
    responsePayload: Record<string, unknown>
  ) => void;
  handleToggleAutopayMandate: (mandateId: string) => void;
  handleRepayCreditSanction: (amount: number) => void;
  handleBalancePinVerified: (pin: string, auditTrail: string) => void;
  handleUpdateUserPin: (
    newPin: string,
    newSaltHex: string,
    newHashHex: string
  ) => void;
  handleRecordOtpSessionVerified: (phone: string, otpCode: string) => void;
  handleStagePayment: (draft: StagedPaymentDraft) => void;
  handleExecuteStagedPayment: (
    pinInput: string,
    isDoubleTapReplayTest: boolean
  ) => void;
  handleTriggerRefund: (txId: string) => void;
  handleSimulateBankTimeout: () => void;
  handleAdjustDemoBalance: (delta: number) => void;
  handleClaimScratchCard: (cardId: string) => void;
  handleAddBankAccount: (
    bankName: string,
    ifscCode: string,
    maskedAcct: string
  ) => void;
  handleSetPrimaryBank: (bankAccountId: string) => void;
  handleResetPinToDefault: () => void;
  handleResetAllDemoData: () => void;
  handleRunSsiConcurrencySimulation: () => Extract<
    ReturnType<typeof LedgerApiService.runSsiConcurrencySimulationRpc>,
    { ok: true }
  >['data'];
}

const JainPayContext = createContext<JainPayStoreContextValue | null>(null);

export const JainPayProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeMode);
      document.body.setAttribute('data-theme', themeMode);
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [activeMode, setActiveMode] = useState<TopNavigationMode>('HOME_3D');
  const [activeCameraIndex, setActiveCameraIndex] = useState<number>(0);
  const [isFullCanvasMode, setIsFullCanvasMode] = useState<boolean>(false);
  const [isArchitectureDrawerOpen, setIsArchitectureDrawerOpen] =
    useState<boolean>(false);

  const [selectedVoiceSubId, setSelectedVoiceSubId] =
    useState<VoiceAgentSubfunctionId>('VOICE_CHAT_STAGE');
  const [selectedCoreId, setSelectedCoreId] = useState<CoreFeatureId>('CORE-B');
  const [selectedAiId, setSelectedAiId] = useState<BaselineAiId>('AI-01');
  const [selectedNextGenId, setSelectedNextGenId] =
    useState<NextGenFeatureId>('NEXT-01');

  const [isAdminVaultUnlocked, setIsAdminVaultUnlocked] = useState(false);
  const [adminVaultTab, setAdminVaultTab] =
    useState<AdminVaultTab>('BCNF_TABLES');
  const [activeBcnfTable, setActiveBcnfTable] =
    useState<BcnfTableName>('ledger_entries');

  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [activePin, setActivePin] = useState<string>(
    ENV_CONFIG.security.defaultDemoPin
  );
  const [accounts, setAccounts] = useState<AccountRecord[]>(INITIAL_ACCOUNTS);
  const [linkedBanks, setLinkedBanks] =
    useState<LinkedBankAccountRecord[]>(INITIAL_LINKED_BANKS);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(
    INITIAL_TRANSACTIONS
  );
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryRecord[]>(
    INITIAL_LEDGER_ENTRIES
  );
  const [khataEntries, setKhataEntries] = useState<KhataEntryRecord[]>(
    INITIAL_KHATA_ENTRIES
  );
  const [milestoneDeals, setMilestoneDeals] = useState<MilestoneDealRecord[]>(
    INITIAL_MILESTONE_DEALS
  );
  const [autopayMandates, setAutopayMandates] = useState<
    AutopayMandateRecord[]
  >(INITIAL_AUTOPAY_MANDATES);
  const [creditSanctions, setCreditSanctions] = useState<
    CreditSanctionRecord[]
  >(INITIAL_CREDIT_SANCTIONS);
  const [fxTreasuryVaults, setFxTreasuryVaults] = useState<
    FxTreasuryVaultRecord[]
  >(INITIAL_FX_TREASURY_VAULTS);
  const [disputeChargebacks, setDisputeChargebacks] = useState<
    DisputeChargebackRecord[]
  >(INITIAL_DISPUTE_CHARGEBACKS);
  const [securityAuditLogs, setSecurityAuditLogs] = useState<
    SecurityAuditLogRecord[]
  >(INITIAL_SECURITY_AUDIT_LOGS);
  const [scratchCards, setScratchCards] = useState<ScratchCardItem[]>(
    INITIAL_SCRATCH_CARDS
  );

  const [sqlLogs, setSqlLogs] = useState<SqlRlsLogEntry[]>(INITIAL_SQL_LOGS);
  const [aiLogs, setAiLogs] = useState<AiToolCallLog[]>(INITIAL_AI_LOGS);

  const [fadState, setFadState] = useState<FadAnomalyState>({
    velocity15Min: 2,
    hourOfDay: 14,
    amountRatioVsBaseline: 1.4,
    isNewCounterparty: false,
  });

  const [sandboxOutcome, setSandboxOutcome] =
    useState<SandboxOutcomeMode>('INSTANT_SUCCESS');
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [isBalancePinModalOpen, setIsBalancePinModalOpen] = useState(false);
  const [stagedDraft, setStagedDraft] = useState<StagedPaymentDraft | null>(
    null
  );
  const [activeReceiptTx, setActiveReceiptTx] =
    useState<TransactionRecord | null>(null);
  const [replayBannerNotice, setReplayBannerNotice] = useState<string | null>(
    null
  );
  const [scamInterceptPayload, setScamInterceptPayload] = useState<{
    uri: string;
    chatMessage: string;
  } | null>(null);
  const [diagnosedTxId, setDiagnosedTxId] = useState<string>('tx_908119');
  const [fcmToasts, setFcmToasts] = useState<FcmPushToast[]>([]);
  const [lastPipelinePulse, setLastPipelinePulse] = useState<string>(
    'PostgreSQL 16+ SSI Ready • 12 Enterprise BCNF Tables Online.'
  );
  const [runtimeErrorBanner, setRuntimeErrorBanner] = useState<string | null>(
    null
  );

  const primaryUser = users[0];
  const walletAccount =
    accounts.find(
      (a) => a.account_id === ENV_CONFIG.security.defaultWalletAccountId
    ) || accounts[0];
  const primaryBank =
    linkedBanks.find((b) => b.is_primary) || linkedBanks[0];

  const activeFeatureSpec: FeaturePipelineSpec =
    activeMode === 'CORE'
      ? getPipelineSpecById(selectedCoreId)
      : activeMode === 'AI_SUITE'
      ? getPipelineSpecById(selectedAiId)
      : getPipelineSpecById(selectedNextGenId);

  const stagedRisk = computeBehavioralFraudScore(fadState);

  const pushFcmToast = (title: string, redactedLockScreenBody: string) => {
    const id = `fcm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const toast: FcmPushToast = {
      id,
      title,
      redactedLockScreenBody,
      attestationStatus: 'Play Integrity / App Check Token Verified',
      timestamp: new Date().toLocaleTimeString(),
    };
    setFcmToasts((prev) => [toast, ...prev.slice(0, 2)]);
    window.setTimeout(() => {
      setFcmToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissFcmToast = (id: string) => {
    setFcmToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const appendSqlLog = (entry: SqlRlsLogEntry) => {
    setSqlLogs((prev) => [entry, ...prev]);
  };

  const appendAiLog = (
    moduleCode: AiToolCallLog['moduleCode'],
    toolName: AiToolCallLog['toolName'],
    requestPayload: Record<string, unknown>,
    responsePayload: Record<string, unknown>
  ) => {
    const newLog: AiToolCallLog = {
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      moduleCode,
      toolName,
      requestPayload,
      responsePayload,
      executionMs: 22 + Math.floor(Math.random() * 20),
    };
    setAiLogs((prev) => [newLog, ...prev]);
  };

  const handleToggleAutopayMandate = (mandateId: string) => {
    setAutopayMandates((prev) =>
      prev.map((m) => {
        if (m.mandate_id !== mandateId) return m;
        const nextStatus = m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return { ...m, status: nextStatus, isNew: true };
      })
    );
    const newAudit: SecurityAuditLogRecord = {
      audit_id: `aud_sec_${Date.now().toString().slice(-4)}`,
      user_id: ENV_CONFIG.security.defaultRlsTenantId,
      event_type: 'AUTOPAY_STATUS_CHANGE',
      isolation_mode: 'SERIALIZABLE',
      client_ip_cidr: '103.21.124.0/24',
      device_attestation: 'NPCI_UMN_MANDATE_SIGNED',
      metadata_json: JSON.stringify({ mandate_id: mandateId }),
      created_at: new Date().toISOString(),
      isNew: true,
    };
    setSecurityAuditLogs((prev) => [newAudit, ...prev]);
    setLastPipelinePulse(
      `Updated UPI AutoPay Mandate ${mandateId} in public.autopay_mandates.`
    );
  };

  const handleRepayCreditSanction = (amount: number) => {
    const repay = roundPaisa(amount);
    if (repay <= 0) return;
    setCreditSanctions((prev) =>
      prev.map((c, idx) => {
        if (idx !== 0) return c;
        const nextUtilized = Math.max(0, roundPaisa(c.utilized_amount - repay));
        const nextAvail = roundPaisa(c.sanctioned_limit - nextUtilized);
        return {
          ...c,
          utilized_amount: nextUtilized,
          available_credit: nextAvail,
          updated_at: new Date().toISOString(),
          isNew: true,
        };
      })
    );
    setLastPipelinePulse(
      `Repaid ${formatInr(repay)} toward public.credit_sanctions (BCNF available_credit recalculated).`
    );
  };

  const handleLaunchSpecificFeature = (featureId: SingleFeatureId) => {
    if (featureId.startsWith('CORE-')) {
      setActiveMode('CORE');
      setSelectedCoreId(featureId as CoreFeatureId);
    } else if (featureId.startsWith('AI-')) {
      setActiveMode('AI_SUITE');
      setSelectedAiId(featureId as BaselineAiId);
    } else {
      setActiveMode('NEXT_GEN');
      setSelectedNextGenId(featureId as NextGenFeatureId);
    }
    setLastPipelinePulse(`Launched ${featureId} Interactive Stage.`);
  };

  const handleBalancePinVerified = (_pin: string, auditTrail: string) => {
    setIsBalancePinModalOpen(false);
    setIsBalanceRevealed(true);
    appendSqlLog(LedgerApiService.buildBalanceUnlockSqlLog(auditTrail));
    setLastPipelinePulse(
      `Unlocked accounts.available_balance (${formatInr(
        walletAccount.available_balance
      )}) via PBKDF2-HMAC-SHA256.`
    );
  };

  const handleUpdateUserPin = (
    newPin: string,
    newSaltHex: string,
    newHashHex: string
  ) => {
    const result = LedgerApiService.rotateUserPinRpc(
      users,
      newPin,
      newSaltHex,
      newHashHex
    );
    if (!result.ok) {
      setRuntimeErrorBanner(result.error.message);
      return;
    }
    setActivePin(newPin);
    setUsers(result.data.updatedUsers);
    appendSqlLog(result.data.sqlLog);
    setLastPipelinePulse(result.data.pulseSummary);
    pushFcmToast(
      'Jain Pay Security: Wallet PIN Rotated',
      'Your 4-digit UPI/Wallet PIN was salted and updated in public.users.'
    );
  };

  const handleRecordOtpSessionVerified = (phone: string, _otpCode: string) => {
    const result = LedgerApiService.bindPhoneOtpSessionRpc(phone);
    if (!result.ok) {
      setRuntimeErrorBanner(result.error.message);
      return;
    }
    appendSqlLog(result.data.sqlLog);
    setLastPipelinePulse(result.data.pulseSummary);
    pushFcmToast(
      'Jain Pay Auth: Session Bound',
      `Verified ${phone} with Play Integrity & bound to UID ${ENV_CONFIG.security.defaultRlsTenantId}.`
    );
  };

  const handleStagePayment = (draft: StagedPaymentDraft) => {
    setStagedDraft(draft);
    appendAiLog(
      draft.sourceModule?.startsWith('NEXT-') ||
        draft.sourceModule?.startsWith('AI-')
        ? (draft.sourceModule as AiToolCallLog['moduleCode'])
        : 'AI-05',
      'stagePeerPayment',
      {
        recipientName: draft.recipientName,
        recipientVpa: draft.recipientVpa,
        amount_inr: draft.amount,
        idempotency_key: draft.idempotencyKey,
      },
      {
        status: 'STAGED_AWAITING_USER_PIN',
        mutated_balance: false,
      }
    );
    setLastPipelinePulse(
      `Staged ${formatInr(draft.amount)} to ${
        draft.recipientVpa
      } (UUID: ${draft.idempotencyKey.slice(0, 16)}...). Awaiting 4-digit PIN.`
    );
  };

  const handleExecuteStagedPayment = (
    pinInput: string,
    isDoubleTapReplayTest: boolean
  ) => {
    if (!stagedDraft) return;

    const result = LedgerApiService.executeStagedPaymentFlowRpc({
      stagedDraft,
      pinInput,
      isDoubleTapReplayTest,
      activePin,
      saltHex: primaryUser.pbkdf2_salt_hex,
      sandboxOutcome,
      accounts,
      transactions,
      ledgerEntries,
      scratchCards,
      khataEntries,
      milestoneDeals,
    });

    if (!result.ok) {
      setRuntimeErrorBanner(result.error.message);
      return;
    }

    const { data } = result;
    data.sqlLogsToAppend.forEach((log) => appendSqlLog(log));
    setAccounts(data.updatedAccounts);
    setTransactions(data.updatedTransactions);
    setLedgerEntries(data.updatedLedgerEntries);
    setScratchCards(data.updatedScratchCards);
    setKhataEntries(data.updatedKhataEntries);
    setMilestoneDeals(data.updatedMilestoneDeals);
    setReplayBannerNotice(data.replayBannerNotice);
    setLastPipelinePulse(data.pulseSummary);

    if (
      data.firstExec.outcome === 'COMMITTED' &&
      data.firstExec.transaction
    ) {
      pushFcmToast(
        'FCM Push • Authoritative Ledger Settlement',
        `Paid ${formatInr(stagedDraft.amount)} to ${
          stagedDraft.recipientVpa
        } • Ref: ${data.firstExec.transaction.transaction_id}`
      );
    }

    setStagedDraft(null);
    if (
      data.firstExec.outcome !== 'DECLINED_ERROR' &&
      data.firstExec.transaction
    ) {
      setActiveReceiptTx(data.firstExec.transaction);
    }
  };

  const handleTriggerRefund = (txId: string) => {
    const result = LedgerApiService.executeRefundRpc(
      { accounts, transactions, ledgerEntries },
      txId
    );
    if (!result.ok) {
      setRuntimeErrorBanner(result.error.message);
      return;
    }
    const res = result.data;
    appendSqlLog(res.sqlLog);
    if (res.success) {
      setAccounts(res.updatedAccounts);
      setTransactions(res.updatedTransactions);
      setLedgerEntries((prev) => [...res.newLedgerEntries, ...prev]);
      pushFcmToast(
        'FCM Push • Authoritative Server Refund',
        `Compensating double-entry reversal committed for ${txId}.`
      );
    }
    setLastPipelinePulse(res.message);
  };

  const handleSimulateBankTimeout = () => {
    const nowIso = new Date().toISOString();
    const timeoutTxId = `tx_timeout_${Date.now().toString().slice(-4)}`;
    const idemKey = `uuid-timeout-${Date.now()}`;
    const timeoutTx: TransactionRecord = {
      transaction_id: timeoutTxId,
      idempotency_key: idemKey,
      sender_account_id: ENV_CONFIG.security.defaultWalletAccountId,
      receiver_account_id: ENV_CONFIG.security.defaultSettlementAccountId,
      counterparty_name: 'Airtel Fiber Broadband',
      counterparty_vpa: 'airtel.fiber@bbps',
      tx_type: 'BILL_PAYMENT',
      category: 'Utilities',
      amount: 999.0,
      status: 'PROCESSING',
      note: 'Simulated NPCI 504 Gateway Timeout (Zero Ledger Debit Written)',
      reference_utr: `UTRTMO${Date.now().toString().slice(-7)}`,
      created_at: nowIso,
      isNew: true,
    };
    setTransactions((prev) => [timeoutTx, ...prev]);
    setLastPipelinePulse(
      `Simulated BANK_TIMEOUT (${timeoutTxId}) with 0 debit rows in ledger_entries.`
    );
  };

  const handleAdjustDemoBalance = (delta: number) => {
    const result = LedgerApiService.adjustDemoBalanceRpc(
      accounts,
      transactions,
      ledgerEntries,
      delta
    );
    if (!result.ok) {
      setRuntimeErrorBanner(result.error.message);
      return;
    }
    setAccounts(result.data.updatedAccounts);
    setTransactions((prev) => [result.data.newTransaction, ...prev]);
    setLedgerEntries((prev) => [result.data.newLedgerEntry, ...prev]);
    setIsBalanceRevealed(true);
    setLastPipelinePulse(result.data.pulseSummary);
  };

  const handleClaimScratchCard = (cardId: string) => {
    const card = scratchCards.find((c) => c.id === cardId);
    if (!card || card.isScratched) return;

    const nowIso = new Date().toISOString();
    const reward = roundPaisa(card.rewardAmount);
    const newBalance = roundPaisa(walletAccount.available_balance + reward);
    const txId = `tx_cb_${Date.now().toString().slice(-5)}`;

    const cbTx: TransactionRecord = {
      transaction_id: txId,
      idempotency_key: `uuid-cb-${card.id}`,
      sender_account_id: ENV_CONFIG.security.defaultTreasuryAccountId,
      receiver_account_id: walletAccount.account_id,
      counterparty_name: card.merchantSponsor,
      counterparty_vpa: 'treasury@jainpay',
      tx_type: 'CASHBACK',
      category: 'System / Credits',
      amount: reward,
      status: 'SUCCESS',
      note: `Scratch Card Cashback: ${card.title}`,
      reference_utr: `UTRCB${Date.now().toString().slice(-8)}`,
      created_at: nowIso,
      isNew: true,
    };

    const crEntry: LedgerEntryRecord = {
      entry_id: `le_cr_cb_${Date.now().toString().slice(-5)}`,
      transaction_id: txId,
      account_id: walletAccount.account_id,
      debit_amount: 0,
      credit_amount: reward,
      balance_after: newBalance,
      entry_narration: `CR Cashback • ${card.title}`,
      created_at: nowIso,
      isNew: true,
    };

    setScratchCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, isScratched: true, claimedAt: nowIso } : c
      )
    );
    setAccounts((prev) =>
      prev.map((a) =>
        a.account_id === walletAccount.account_id
          ? {
              ...a,
              available_balance: newBalance,
              version_seq: a.version_seq + 1,
              updated_at: nowIso,
              isNew: true,
            }
          : a
      )
    );
    setTransactions((prev) => [cbTx, ...prev]);
    setLedgerEntries((prev) => [crEntry, ...prev]);
    setIsBalanceRevealed(true);
    pushFcmToast(
      `FCM Push • +${formatInr(reward)} Cashback Credited`,
      `${card.title} credited atomically to yash@jainpay.`
    );
    setLastPipelinePulse(
      `Claimed Scratch Card ${card.id} (+${formatInr(reward)}).`
    );
  };

  const handleAddBankAccount = (
    bankName: string,
    ifscCode: string,
    maskedAcct: string
  ) => {
    const newBank: LinkedBankAccountRecord = {
      bank_account_id: `bnk_${Date.now().toString().slice(-4)}`,
      user_id: ENV_CONFIG.security.defaultRlsTenantId,
      bank_name: bankName,
      masked_account_number: maskedAcct,
      ifsc_code: ifscCode,
      account_holder_name: 'Yash Jain',
      is_primary: false,
      linked_at: new Date().toISOString(),
      isNew: true,
    };
    setLinkedBanks((prev) => [newBank, ...prev]);
    setLastPipelinePulse(
      `Linked ${bankName} (${ifscCode}) into public.linked_bank_accounts.`
    );
  };

  const handleSetPrimaryBank = (bankAccountId: string) => {
    setLinkedBanks((prev) =>
      prev.map((b) => ({
        ...b,
        is_primary: b.bank_account_id === bankAccountId,
      }))
    );
  };

  const handleResetPinToDefault = () => {
    const defaultPin = ENV_CONFIG.security.defaultDemoPin;
    const defaultSalt = ENV_CONFIG.security.defaultSaltHex;
    const defaultHash = computePBKDF2HashHex(defaultPin, defaultSalt);
    handleUpdateUserPin(defaultPin, defaultSalt, defaultHash);
  };

  const handleResetAllDemoData = () => {
    setUsers(INITIAL_USERS);
    setActivePin(ENV_CONFIG.security.defaultDemoPin);
    setAccounts(INITIAL_ACCOUNTS);
    setLinkedBanks(INITIAL_LINKED_BANKS);
    setTransactions(INITIAL_TRANSACTIONS);
    setLedgerEntries(INITIAL_LEDGER_ENTRIES);
    setKhataEntries(INITIAL_KHATA_ENTRIES);
    setMilestoneDeals(INITIAL_MILESTONE_DEALS);
    setAutopayMandates(INITIAL_AUTOPAY_MANDATES);
    setCreditSanctions(INITIAL_CREDIT_SANCTIONS);
    setFxTreasuryVaults(INITIAL_FX_TREASURY_VAULTS);
    setDisputeChargebacks(INITIAL_DISPUTE_CHARGEBACKS);
    setSecurityAuditLogs(INITIAL_SECURITY_AUDIT_LOGS);
    setScratchCards(INITIAL_SCRATCH_CARDS);
    setSqlLogs(INITIAL_SQL_LOGS);
    setAiLogs(INITIAL_AI_LOGS);
    setSandboxOutcome('INSTANT_SUCCESS');
    setIsBalanceRevealed(false);
    setRuntimeErrorBanner(null);
    setLastPipelinePulse('All 12 BCNF tables and demo state restored to seed.');
  };

  const handleRunSsiConcurrencySimulation = () => {
    const result = LedgerApiService.runSsiConcurrencySimulationRpc();
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    appendSqlLog(result.data.sqlLog);
    return result.data;
  };

  const value: JainPayStoreContextValue = {
    themeMode,
    setThemeMode,
    toggleThemeMode,
    activeMode,
    setActiveMode,
    activeCameraIndex,
    setActiveCameraIndex,
    isFullCanvasMode,
    setIsFullCanvasMode,
    isArchitectureDrawerOpen,
    setIsArchitectureDrawerOpen,
    selectedVoiceSubId,
    setSelectedVoiceSubId,
    selectedCoreId,
    setSelectedCoreId,
    selectedAiId,
    setSelectedAiId,
    selectedNextGenId,
    setSelectedNextGenId,
    activeFeatureSpec,
    handleLaunchSpecificFeature,
    isAdminVaultUnlocked,
    setIsAdminVaultUnlocked,
    adminVaultTab,
    setAdminVaultTab,
    activeBcnfTable,
    setActiveBcnfTable,
    users,
    primaryUser,
    activePin,
    accounts,
    walletAccount,
    linkedBanks,
    primaryBank,
    transactions,
    ledgerEntries,
    khataEntries,
    setKhataEntries,
    milestoneDeals,
    setMilestoneDeals,
    autopayMandates,
    creditSanctions,
    fxTreasuryVaults,
    disputeChargebacks,
    securityAuditLogs,
    scratchCards,
    sqlLogs,
    aiLogs,
    fadState,
    setFadState,
    stagedRisk,
    sandboxOutcome,
    setSandboxOutcome,
    lastPipelinePulse,
    setLastPipelinePulse,
    runtimeErrorBanner,
    clearRuntimeErrorBanner: () => setRuntimeErrorBanner(null),
    isBalanceRevealed,
    setIsBalanceRevealed,
    isBalancePinModalOpen,
    setIsBalancePinModalOpen,
    stagedDraft,
    setStagedDraft,
    activeReceiptTx,
    setActiveReceiptTx,
    replayBannerNotice,
    setReplayBannerNotice,
    scamInterceptPayload,
    setScamInterceptPayload,
    diagnosedTxId,
    setDiagnosedTxId,
    fcmToasts,
    dismissFcmToast,
    pushFcmToast,
    appendSqlLog,
    appendAiLog,
    handleToggleAutopayMandate,
    handleRepayCreditSanction,
    handleBalancePinVerified,
    handleUpdateUserPin,
    handleRecordOtpSessionVerified,
    handleStagePayment,
    handleExecuteStagedPayment,
    handleTriggerRefund,
    handleSimulateBankTimeout,
    handleAdjustDemoBalance,
    handleClaimScratchCard,
    handleAddBankAccount,
    handleSetPrimaryBank,
    handleResetPinToDefault,
    handleResetAllDemoData,
    handleRunSsiConcurrencySimulation,
  };

  return (
    <JainPayContext.Provider value={value}>{children}</JainPayContext.Provider>
  );
};

export function useJainPayStore(): JainPayStoreContextValue {
  const ctx = useContext(JainPayContext);
  if (!ctx) {
    throw new Error('useJainPayStore must be used inside <JainPayProvider />');
  }
  return ctx;
}
