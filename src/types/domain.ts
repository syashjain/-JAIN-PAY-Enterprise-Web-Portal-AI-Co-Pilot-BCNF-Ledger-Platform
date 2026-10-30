export type SandboxOutcomeMode =
  | 'INSTANT_SUCCESS'
  | 'BANK_TIMEOUT'
  | 'SYSTEM_DECLINE'
  | 'INSUFFICIENT_BALANCE';

export type TopNavigationMode =
  | 'HOME_3D'
  | 'AI_VOICE_AGENT'
  | 'CORE'
  | 'AI_SUITE'
  | 'NEXT_GEN'
  | 'ADMIN_VAULT';

export type PortalSectionId =
  | 'dashboard'
  | 'chat'
  | 'ai_hub'
  | 'activity'
  | 'services'
  | 'postgres';

export type RightDockTab = 'TABLES' | 'SQL_RLS' | 'AI_JSON';

export type BcnfTableName =
  | 'ledger_entries'
  | 'transactions'
  | 'accounts'
  | 'linked_bank_accounts'
  | 'users'
  | 'khata_entries'
  | 'milestone_deals'
  | 'autopay_mandates'
  | 'credit_sanctions'
  | 'fx_treasury_vaults'
  | 'dispute_chargebacks'
  | 'security_audit_logs';

export type TransactionType =
  | 'SEND'
  | 'RECEIVE'
  | 'BILL_PAYMENT'
  | 'RECHARGE'
  | 'CASHBACK'
  | 'REFUND'
  | 'BALANCE_ADJUSTMENT';

export type TransactionStatus =
  | 'SUCCESS'
  | 'PROCESSING'
  | 'FAILED'
  | 'REFUNDED';

export type SpendCategory =
  | 'Utilities'
  | 'Dining & Food'
  | 'Food & Dining'
  | 'P2P Transfers'
  | 'Telecom Recharge'
  | 'Shopping'
  | 'System / Credits';

export type TransactionCategory = SpendCategory;

export interface UserRecord {
  user_id: string;
  full_name: string;
  vpa_handle: string;
  phone_number: string;
  pbkdf2_pin_hash: string;
  pbkdf2_salt_hex: string;
  kyc_tier: 'FULL_KYC_BIOMETRIC' | 'MIN_KYC';
  rls_tenant_scope: string;
  created_at: string;
  isNew?: boolean;
}

export interface AccountRecord {
  account_id: string;
  user_id: string;
  account_type: 'USER_WALLET' | 'COUNTERPARTY_SETTLEMENT' | 'SYSTEM_TREASURY';
  vpa_address: string;
  available_balance: number;
  currency: 'INR';
  version_seq: number;
  updated_at: string;
  isNew?: boolean;
}

export interface LinkedBankAccountRecord {
  bank_account_id: string;
  user_id: string;
  bank_name: string;
  masked_account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  is_primary: boolean;
  linked_at: string;
  isNew?: boolean;
}

export interface TransactionRecord {
  transaction_id: string;
  idempotency_key: string;
  sender_account_id: string;
  receiver_account_id: string;
  counterparty_name: string;
  counterparty_vpa: string;
  tx_type: TransactionType;
  category: SpendCategory;
  amount: number;
  status: TransactionStatus;
  note: string;
  reference_utr: string;
  created_at: string;
  isNew?: boolean;
}

export interface LedgerEntryRecord {
  entry_id: string;
  transaction_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  balance_after: number;
  entry_narration: string;
  created_at: string;
  isNew?: boolean;
}

export type KhataStatus =
  | 'PENDING_PEER_ACK'
  | 'PENDING_ACK'
  | 'ACKNOWLEDGED'
  | 'SETTLED_BY_TXN'
  | 'SETTLED';

export interface KhataEntryRecord {
  khata_id: string;
  creator_user_id: string;
  peer_user_id: string;
  peer_name: string;
  peer_vpa: string;
  direction: 'PEER_OWES_USER' | 'USER_OWES_PEER';
  amount: number;
  description: string;
  status: KhataStatus;
  linked_tx_id: string | null;
  created_at: string;
  isNew?: boolean;
}

export interface MilestoneDealRecord {
  deal_id: string;
  buyer_user_id: string;
  seller_name: string;
  seller_vpa: string;
  item_title: string;
  total_amount: number;
  advance_amount: number;
  final_amount: number;
  status: 'CREATED' | 'ADVANCE_PAID' | 'HANDOVER_CONFIRMED' | 'SETTLED';
  advance_tx_id: string | null;
  final_tx_id: string | null;
  created_at?: string;
  updated_at: string;
  isNew?: boolean;
}

// ============================================================================
// EXPANDED ENTERPRISE BCNF TABLES (TABLES 8 TO 12)
// ============================================================================

export interface AutopayMandateRecord {
  mandate_id: string;
  umn_reference: string;
  user_id: string;
  merchant_name: string;
  merchant_vpa: string;
  category: SpendCategory;
  max_debit_amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'AS_PRESENTED';
  next_debit_date: string;
  status: 'ACTIVE' | 'PAUSED' | 'REVOKED';
  created_at: string;
  isNew?: boolean;
}

export interface CreditSanctionRecord {
  facility_id: string;
  user_id: string;
  lender_partner: string;
  sanctioned_limit: number;
  utilized_amount: number;
  available_credit: number;
  annual_eir_percent: number;
  cibil_score_band: string;
  billing_cycle_day: number;
  status: 'ACTIVE_GOOD_STANDING' | 'FROZEN' | 'CLOSED';
  updated_at: string;
  isNew?: boolean;
}

export interface FxTreasuryVaultRecord {
  vault_id: string;
  corridor_code: 'UPI_GLOBAL_SG' | 'UPI_GLOBAL_AE' | 'UPI_GLOBAL_US' | 'UPI_GLOBAL_EU';
  base_currency: 'INR';
  quote_currency: 'SGD' | 'AED' | 'USD' | 'EUR';
  spot_rate_inr: number;
  spread_bps: number;
  pool_liquidity_quote: number;
  settlement_rail: string;
  updated_at: string;
  isNew?: boolean;
}

export interface DisputeChargebackRecord {
  dispute_id: string;
  transaction_id: string;
  user_id: string;
  npci_udir_ticket: string;
  reason_code: 'UDIR_504_TIMEOUT' | 'DUPLICATE_DEBIT' | 'GOODS_NOT_RECEIVED' | 'COLLECT_TRAP_REPORT';
  disputed_amount: number;
  status: 'OPEN_INVESTIGATION' | 'AUTO_RESOLVED_CREDIT' | 'ESCALATED_NPCI' | 'CLOSED';
  sla_deadline: string;
  evidence_sha256: string;
  created_at: string;
  isNew?: boolean;
}

export interface SecurityAuditLogRecord {
  audit_id: string;
  user_id: string;
  event_type:
    | 'PBKDF2_PIN_VERIFIED'
    | 'RLS_TENANT_BIND'
    | 'SSI_40001_RETRY_GUARD'
    | 'SCAM_SHIELD_INTERCEPT'
    | 'AI_ZERO_TRUST_READ'
    | 'AUTOPAY_STATUS_CHANGE';
  isolation_mode: 'SERIALIZABLE' | 'READ COMMITTED';
  client_ip_cidr: string;
  device_attestation: string;
  metadata_json: string;
  created_at: string;
  isNew?: boolean;
}

export interface AiVoiceChatOption {
  id: string;
  numberLabel: string;
  category: string;
  title: string;
  promptText: string;
  targetTables: BcnfTableName[];
  sqlPreview: string;
}

export interface AiVoiceConversationTurn {
  id: string;
  optionId?: string;
  question: string;
  answerText: string;
  spokenSummary: string;
  sqlExecuted: string;
  tablesQueried: BcnfTableName[];
  keyMetrics: Array<{ label: string; value: string }>;
  sourceEngine: 'GEMINI_LIVE_API' | 'DETERMINISTIC_BCNF_ENGINE';
  timestamp: string;
}

export interface SqlRlsLogEntry {
  id: string;
  timestamp: string;
  cloudFunction:
    | 'createPayment'
    | 'processRefund'
    | 'adjustDemoBalance'
    | 'updatePins'
    | 'getPaymentStatus'
    | 'verifyBalancePin'
    | 'claimScratchCard'
    | 'ssiConcurrencyCheck'
    | 'verifyPhoneOtpSession';
  isolationLevel: 'SERIALIZABLE' | 'READ COMMITTED';
  rlsTenant: string;
  sqlStatements: string[];
  securityAudit: string;
  status:
    | 'COMMITTED'
    | 'ROLLBACK_SERIALIZATION_40001'
    | 'IDEMPOTENT_REPLAY_CACHED'
    | 'DECLINED';
}

export interface AiToolCallLog {
  id: string;
  timestamp: string;
  moduleCode:
    | 'AI-01'
    | 'AI-02'
    | 'AI-03'
    | 'AI-04'
    | 'AI-05'
    | 'AI-06'
    | 'AI-07'
    | 'AI-08'
    | 'NEXT-01'
    | 'NEXT-02'
    | 'NEXT-03'
    | 'NEXT-04'
    | 'NEXT-05'
    | 'NEXT-06'
    | 'NEXT-07';
  toolName:
    | 'stagePeerPayment'
    | 'queryFinancialLedger'
    | 'fetchBillDueStatus'
    | 'parseAndSplitReceipt'
    | 'proposeChatKhataEntry'
    | 'stageKhataSettlement'
    | 'inspectPaymentSafety'
    | 'extractPaymentIntentFromMedia'
    | 'simulateSafeToSpend'
    | 'createMilestoneTrustCard'
    | 'diagnoseTransactionState';
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  executionMs: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  claimedBy: ('Yash' | 'Pooja' | 'Rahul')[];
}

export interface SplitReceiptPayload {
  merchantName: string;
  orderReference?: string;
  items: ReceiptItem[];
  gstPercent: number;
  discountAmount: number;
}

export interface ThreatAnalysisResult {
  scenarioId?: string;
  scenarioTitle?: string;
  riskLevel: 'CRITICAL' | 'MEDIUM' | 'LOW';
  riskScore: number;
  linguisticUrgencyScore: number;
  isCollectTrap: boolean;
  englishExplanation: string;
  hinglishExplanation: string;
  detectedFlags: string[];
  parsedVpa: string;
  parsedName: string;
  parsedMc: string;
  parsedMode: string;
  parsedAmount: number;
  blockedByDefault: boolean;
}

export interface MediaIntentPayload {
  sourceTitle: string;
  recipientIdentifier: string;
  recipientName: string;
  amount: number;
  note: string;
  duplicateTxFound: boolean;
  duplicateTxId: string | null;
  duplicateTxDate: string | null;
}

export interface SafeToSpendResult {
  availableBalance: number;
  impulseAmount: number;
  upcomingBillsTotal: number;
  budgetReserve: number;
  surplusBefore: number;
  surplusAfter: number;
  runwayDaysBefore: number;
  runwayDaysAfter: number;
  verdict: 'SAFE_COMFORTABLE' | 'TIGHT_BUFFER' | 'SHORTFALL_RISK';
  verdictBadgeLabel:
    | 'SAFE TO SPEND'
    | 'TIGHT BUFFER WARNING'
    | 'SHORTFALL RISK FOR UPCOMING BILLS';
  recommendation: string;
}

export interface DiagnosticReport {
  transactionId: string;
  idempotencyKey: string;
  currentStatus: TransactionStatus;
  amount: number;
  counterparty: string;
  ledgerDebitWritten: boolean;
  ledgerRowCount: number;
  safeToRetry: boolean;
  definitiveRecommendation:
    | 'SAFE TO RETRY WITH NEW KEY'
    | 'DO NOT RETRY — IDEMPOTENCY LOCK ACTIVE'
    | 'SETTLED — SHARE AUTHORITATIVE RECEIPT';
  englishSummary: string;
  hinglishSummary: string;
  recommendedAction: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  sender: 'yash' | 'ai_copilot' | 'rahul' | 'pooja' | 'vikram';
  senderName: string;
  timestamp: string;
  text: string;
  widgetType?:
    | 'SPLIT_RECEIPT_NEXT01'
    | 'KHATA_ENTRY_NEXT02'
    | 'SCAM_SHIELD_NEXT03'
    | 'MEDIA_INTENT_NEXT04'
    | 'SAFE_TO_SPEND_NEXT05'
    | 'MILESTONE_CARD_NEXT06'
    | 'DIAGNOSTICIAN_NEXT07';
  splitPayload?: SplitReceiptPayload;
  khataId?: string;
  threatPayload?: ThreatAnalysisResult;
  mediaIntentPayload?: MediaIntentPayload;
  safeToSpendInitialAmount?: number;
  milestoneDealId?: string;
  diagnosticTxId?: string;
}

export interface ScratchCardItem {
  id: string;
  sourceTxId: string;
  rewardAmount: number;
  merchantSponsor: string;
  title: string;
  isScratched: boolean;
  claimedAt: string | null;
}

export interface StagedPaymentDraft {
  recipientName: string;
  recipientVpa: string;
  amount: number;
  note: string;
  txType: TransactionType;
  category: SpendCategory;
  idempotencyKey: string;
  sourceModule?: string;
  linkedKhataSettlementPeerId?: string;
  linkedMilestoneDeal?: {
    dealId: string;
    step: 'ADVANCE' | 'FINAL';
  };
}

export interface FcmPushToast {
  id: string;
  title: string;
  redactedBody?: string;
  redactedLockScreenBody?: string;
  appCheckBadge?: string;
  attestationStatus?: string;
  timestamp: string;
}
