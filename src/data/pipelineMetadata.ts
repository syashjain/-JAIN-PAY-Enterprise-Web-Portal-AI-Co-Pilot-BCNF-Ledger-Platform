export type CoreFeatureId =
  | 'CORE-A'
  | 'CORE-B'
  | 'CORE-C'
  | 'CORE-D'
  | 'CORE-E';

export type BaselineAiId =
  | 'AI-01'
  | 'AI-02'
  | 'AI-03'
  | 'AI-04'
  | 'AI-05'
  | 'AI-06'
  | 'AI-07'
  | 'AI-08';

export type NextGenFeatureId =
  | 'NEXT-01'
  | 'NEXT-02'
  | 'NEXT-03'
  | 'NEXT-04'
  | 'NEXT-05'
  | 'NEXT-06'
  | 'NEXT-07';

export type SingleFeatureId =
  | CoreFeatureId
  | BaselineAiId
  | NextGenFeatureId;

export interface PipelineNodeSpec {
  stepNumber: string;
  layerTitle: string;
  componentBadge: string;
  technicalSummary: string;
  keyInvariant: string;
}

export interface PresenterWalkthroughGuide {
  audiencePitch: string;
  prdExactExample: string;
  stepByStepWalkthrough: [string, string, string];
  incumbentMarketGap: string;
}

export interface FeaturePipelineSpec {
  id: SingleFeatureId;
  shortLabel: string;
  title: string;
  subtitle: string;
  recommendedAdminTab: 'BCNF_TABLES' | 'SQL_STREAM' | 'AI_JSON' | 'DDL_SSI';
  recommendedBcnfTable?:
    | 'ledger_entries'
    | 'transactions'
    | 'accounts'
    | 'linked_bank_accounts'
    | 'users'
    | 'khata_entries'
    | 'milestone_deals';
  presenterGuide: PresenterWalkthroughGuide;
  nodes: [
    PipelineNodeSpec,
    PipelineNodeSpec,
    PipelineNodeSpec,
    PipelineNodeSpec
  ];
}

// ============================================================================
// PRD SECTION 0: 5 NON-NEGOTIABLE ARCHITECTURAL & SAFETY GUARDRAILS (PAGE 1)
// ============================================================================
export const PRD_SECTION_0_GUARDRAILS = [
  {
    number: '01',
    title: 'AI Stages, Deterministic Backend Executes',
    forbiddenFunctions: [
      'createPayment()',
      'processRefund()',
      'adjustDemoBalance()',
      'updatePins()',
    ],
    ruleSummary:
      'No AI model, prompt, or tool call may ever directly execute a money transfer, issue a refund, alter a balance, or modify a PIN. Every mutation routes through Jetpack Compose Review Screen → 4-Digit PIN Verification → Firebase Cloud Functions atomic ledger transaction.',
  },
  {
    number: '02',
    title: 'Trusted Server-Side Proxy (Zero Client Secrets)',
    forbiddenFunctions: ['Embedded APK Gemini Keys', 'Direct Client LLM Calls'],
    ruleSummary:
      'Hosted AI models (Gemini 2.5 Flash / Vision) are called exclusively through authenticated Firebase Cloud Functions (askJainPayCopilot). No API keys or privileged credentials are embedded in the client.',
  },
  {
    number: '03',
    title: 'Deterministic Math Only (Zero LLM Mental Math)',
    forbiddenFunctions: ['LLM Float Addition', 'Unverified Tax/Split Sums'],
    ruleSummary:
      'All currency totals, bill splits, tax proportions, budget thresholds, and cash-flow balances are computed by deterministic Kotlin/Node.js backend code using currency-safe paisa arithmetic—never by LLM mental math.',
  },
  {
    number: '04',
    title: 'Strict Redaction & Privacy Boundary',
    forbiddenFunctions: [
      'Raw PINs / pbkdf2_pin_hash',
      'SMS OTPs',
      'Firebase Auth / App Check JWTs',
    ],
    ruleSummary:
      'Never transmit raw PINs, PIN hashes/salts, OTPs, Firebase Auth tokens, App Check tokens, or full unmasked contact lists to any AI model.',
  },
  {
    number: '05',
    title: 'Separation of AI Tracks (Track A vs. Track B)',
    forbiddenFunctions: ['Cross-Track State Leakage'],
    ruleSummary:
      'Track A (developer local coding LLM for repository maintenance) remains strictly isolated from Track B (user-facing in-app AI features inside Jain Pay).',
  },
];

// ============================================================================
// PRD SECTION 3: UNIFIED 11-TOOL REGISTRY & ARCHITECTURE MATRIX (PAGES 7-8)
// ============================================================================
export const PRD_SECTION_3_TOOL_REGISTRY = [
  {
    toolName: 'stagePeerPayment',
    category: 'Baseline (AI-05)',
    executionLayer: 'Cloud Function Proxy → Client ViewModel',
    allowedOutput:
      'Populates staged PaymentRequest; routes to Review Screen (Forbidden from calling createPayment or bypassing PIN)',
    linkedFeatureId: 'AI-05' as SingleFeatureId,
  },
  {
    toolName: 'queryFinancialLedger',
    category: 'Baseline (AI-01 / AI-02 / AI-05)',
    executionLayer: 'Cloud Function Proxy → Firestore / BCNF Read',
    allowedOutput:
      'Returns deterministic aggregates & redacted transaction list (ALL, SEND, RECEIVE, BILL_PAYMENT, RECHARGE)',
    linkedFeatureId: 'AI-02' as SingleFeatureId,
  },
  {
    toolName: 'fetchBillDueStatus',
    category: 'Baseline (AI-04 / AI-05 / AI-06)',
    executionLayer: 'Cloud Function Proxy → Biller Sandbox',
    allowedOutput:
      'Returns bill status (ELECTRICITY, WATER, GAS, BROADBAND, FASTAG) or explicit sandbox/unavailable indicator without fabricating amounts',
    linkedFeatureId: 'AI-05' as SingleFeatureId,
  },
  {
    toolName: 'parseAndSplitReceipt',
    category: 'New (NEXT-01)',
    executionLayer: 'Gemini Vision Proxy + Deterministic Math',
    allowedOutput:
      'Extracts itemName, quantity, unitPrice, taxAmount, discountAmount & renders interactive Item-Claim Split Card in chat',
    linkedFeatureId: 'NEXT-01' as SingleFeatureId,
  },
  {
    toolName: 'proposeChatKhataEntry',
    category: 'New (NEXT-02)',
    executionLayer: 'Cloud Function → /chats/{id}/khataEntries',
    allowedOutput:
      'Creates non-wallet IOU entry (amount, splitMode, note, direction) awaiting peer acknowledgment',
    linkedFeatureId: 'NEXT-02' as SingleFeatureId,
  },
  {
    toolName: 'stageKhataSettlement',
    category: 'New (NEXT-02)',
    executionLayer: 'Deterministic Net Calculator → stagePeerPayment',
    allowedOutput:
      'Stages a single payment for the exact net IOU balance through the standard PIN flow',
    linkedFeatureId: 'NEXT-02' as SingleFeatureId,
  },
  {
    toolName: 'inspectPaymentSafety',
    category: 'New (NEXT-03 / AI-07)',
    executionLayer: 'Deterministic QR Rules + Scam Classifier',
    allowedOutput:
      'Renders high-contrast Explainable Threat Card in English/Hinglish prior to Review/PIN',
    linkedFeatureId: 'NEXT-03' as SingleFeatureId,
  },
  {
    toolName: 'extractPaymentIntentFromMedia',
    category: 'New (NEXT-04)',
    executionLayer: 'Gemini Vision Proxy + 7-Day Duplicate Check',
    allowedOutput:
      'Cross-checks queryFinancialLedger over past 7 days & stages payment card from shared screenshot/poster',
    linkedFeatureId: 'NEXT-04' as SingleFeatureId,
  },
  {
    toolName: 'simulateSafeToSpend',
    category: 'New (NEXT-05)',
    executionLayer: 'Deterministic Cashflow Service (AI-03 + AI-04)',
    allowedOutput:
      'Computes safeToSpendBeforePurchase & projectedRunwayAfterPurchase; renders Safe-to-Spend Runway Card',
    linkedFeatureId: 'NEXT-05' as SingleFeatureId,
  },
  {
    toolName: 'createMilestoneTrustCard',
    category: 'New (NEXT-06)',
    executionLayer: 'Cloud Function → /chats/{id}/milestones',
    allowedOutput:
      'Renders non-custodial stateful multi-step P2P deal tracker (CREATED → ADVANCE_PAID → DELIVERY_CONFIRMED → SETTLED)',
    linkedFeatureId: 'NEXT-06' as SingleFeatureId,
  },
  {
    toolName: 'diagnoseTransactionState',
    category: 'New (NEXT-07)',
    executionLayer: 'getPaymentStatus + IdempotencyManager Audit',
    allowedOutput:
      'Explains exact transaction status in English/Hinglish & safe retry guidance without double-debit risk',
    linkedFeatureId: 'NEXT-07' as SingleFeatureId,
  },
];

// ============================================================================
// PRD SECTION 4: STAGED IMPLEMENTATION ROADMAP (PAGE 8)
// ============================================================================
export const PRD_SECTION_4_ROADMAP = [
  {
    stage: 'Stage 0',
    title: 'Prerequisite Stabilization',
    modules: ['CORE-A', 'CORE-B'] as SingleFeatureId[],
    description:
      'Verify active runtime wiring of DESIGN.md command deck tokens, resolve BalancePinDialog signature/call-site audit, unify PBKDF2 PIN hashing across client and functions/index.js, and complete Firebase CLI deployment.',
  },
  {
    stage: 'Stage 1',
    title: 'Core Co-Pilot & Ledger Search',
    modules: ['AI-01', 'AI-02', 'AI-05', 'NEXT-07'] as SingleFeatureId[],
    description:
      'Implement server-side askJainPayCopilot Cloud Function proxy with queryFinancialLedger, stagePeerPayment, and diagnoseTransactionState.',
  },
  {
    stage: 'Stage 2',
    title: 'P2P Chat Intelligence',
    modules: ['NEXT-02', 'NEXT-06'] as SingleFeatureId[],
    description:
      'Launch Conversational Net-Zero Khata (NEXT-02) and Milestone-Staged Trust Cards (NEXT-06) inside P2P chat threads.',
  },
  {
    stage: 'Stage 3',
    title: 'Multimodal Vision & Safety Shield',
    modules: ['NEXT-01', 'NEXT-04', 'AI-06', 'NEXT-03'] as SingleFeatureId[],
    description:
      'Enable Snap-and-Split Receipt Agent (NEXT-01), Any-Screenshot-to-Staged-Payment (NEXT-04), Bill OCR (AI-06), and Pre-Flight Scam Shield (NEXT-03).',
  },
  {
    stage: 'Stage 4',
    title: 'Predictive & Behavioral Intelligence',
    modules: ['AI-03', 'AI-04', 'NEXT-05', 'AI-07', 'AI-08'] as SingleFeatureId[],
    description:
      'Roll out Safe-to-Spend Cashflow Simulator (AI-03, AI-04, NEXT-05), Behavioral Anomaly Signals (AI-07), and Contextual Bandit Rewards (AI-08).',
  },
];

export const CORE_FEATURE_SPECS: Record<CoreFeatureId, FeaturePipelineSpec> = {
  'CORE-A': {
    id: 'CORE-A',
    shortLabel: 'CORE-01: Phone OTP & PBKDF2 PIN',
    title: 'Phone OTP Session & PBKDF2-HMAC-SHA256 PIN Security',
    subtitle: 'E.164 Mobile OTP Binding + 10,000-Iteration Salted Key Derivation',
    recommendedAdminTab: 'SQL_STREAM',
    recommendedBcnfTable: 'users',
    presenterGuide: {
      audiencePitch:
        'Show the audience how Jain Pay never stores or transmits raw 4-digit PINs: every PIN change generates a fresh 16-byte cryptographic salt and computes 10,000 iterations of PBKDF2-HMAC-SHA256.',
      prdExactExample:
        'Stage 0 Prerequisite: Unify PBKDF2 PIN hashing across client and functions/index.js + Strict Redaction of OTPs/PINs.',
      stepByStepWalkthrough: [
        'Click "Generate 6-Digit SMS OTP" and then "Verify OTP & Bind UID" to show E.164 session binding to usr_yash_01.',
        'In Card 2, enter Current PIN (1234) and a New PIN (5678), then click "Rotate Salt & Update PBKDF2 PIN Hash".',
        'Click "Inspect Raw SQL & JSON in Admin Vault" below to show the new 32-char hex salt and 64-char SHA-256 hash in the BCNF users table.',
      ],
      incumbentMarketGap:
        'Beginner academic apps store plaintext PINs or unsalted MD5/SHA1 hashes vulnerable to rainbow tables.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'PhoneAuthScreen.kt & ChangePinSheet.kt',
        technicalSummary:
          'Captures +91 10-digit Indian mobile number, validates E.164 format locally, and collects the 6-digit SMS OTP or 4-digit security PIN inside a hardware-backed Compose sheet.',
        keyInvariant: 'Zero plaintext PIN persistence in SharedPreferences or Room.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Play Integrity + 16-Byte CSPRNG Salt',
        technicalSummary:
          'Verifies Play Integrity / App Check device attestation token and generates a fresh 16-byte cryptographic random salt (0x...) before key stretching.',
        keyInvariant: 'Blocks unattested emulators & expired 60s OTP windows (HTTP 410).',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'verifyPhoneOtpSession() & updatePins()',
        technicalSummary:
          'Executes PBKDF2-HMAC-SHA256 across 10,000 iterations on the server and binds the authenticated JWT session to RLS tenant UID usr_yash_01.',
        keyInvariant: 'PBKDF2-HMAC-SHA256(pin, salt_16B, iter=10000) == pbkdf2_pin_hash.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ users Table (RLS Scoped)',
        technicalSummary:
          'Commits updated pbkdf2_salt_hex and pbkdf2_pin_hash inside BEGIN ISOLATION LEVEL SERIALIZABLE and dispatches a redacted FCM security push.',
        keyInvariant: 'SET LOCAL app.current_user_id = \'usr_yash_01\'.',
      },
    ],
  },
  'CORE-B': {
    id: 'CORE-B',
    shortLabel: 'CORE-02: Send Money & Idempotency',
    title: 'Send Money & UUID Idempotent Double-Tap Protection',
    subtitle: 'Atomic Double-Entry Transfers with Zero Double-Debit Guarantee',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'ledger_entries',
    presenterGuide: {
      audiencePitch:
        'Demonstrate how Jain Pay prevents accidental double debits when a user double-taps "Pay" on a flaky 4G/5G elevator connection.',
      prdExactExample:
        'Section 0.1 Guardrail: Review Screen → 4-Digit PIN Verification → Cloud Functions createPayment() atomic double-entry ledger commit.',
      stepByStepWalkthrough: [
        'Select "Rahul Verma (rahul@okaxis)" for ₹500 and click "Stage & Review Payment".',
        'In the PIN modal, enter PIN 1234 and click "Simulate Double-Tap Network Replay (2x RPC Calls)".',
        'Show the audience that Call #1 commits 2 BCNF ledger rows (1 Debit + 1 Credit), while Call #2 hits the unique idempotency_key index and returns the cached receipt with ₹0 extra debit!',
      ],
      incumbentMarketGap:
        'Naive CRUD apps run UPDATE accounts SET balance = balance - 500 without idempotency locks, charging users twice on network retries.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'SendMoneyScreen.kt & PinConfirmSheet.kt',
        technicalSummary:
          'Validates recipient UPI VPA (handle@bank) or 10-digit mobile number, attaches a client-generated UUIDv4 idempotency_key, and prompts for the 4-digit UPI PIN.',
        keyInvariant: 'Deterministic paisa rounding: Math.round(amount * 100) / 100.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'AI-07 FAD Pre-Check + Idempotency Lock',
        technicalSummary:
          'Evaluates real-time Behavioral Fraud Score (0–100) for velocity/late-night anomalies and checks the unique index on transactions(idempotency_key).',
        keyInvariant: 'Duplicate network tap returns cached receipt with 0 extra debits.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'createPayment() • SERIALIZABLE',
        technicalSummary:
          'Verifies PBKDF2 PIN hash, locks sender and receiver account rows under SSI, decrements sender balance, increments receiver balance, and increments version_seq.',
        keyInvariant: 'CHECK (available_balance >= 0.00) & version_seq = version_seq + 1.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'transactions + 2x ledger_entries + Scratch Card',
        technicalSummary:
          'Appends 1 immutable DEBIT row and 1 immutable CREDIT row to ledger_entries, auto-mints a Scratch Card when amount > ₹50, and triggers an FCM push.',
        keyInvariant: 'SUM(debit_amount) == SUM(credit_amount) across every tx_id.',
      },
    ],
  },
  'CORE-C': {
    id: 'CORE-C',
    shortLabel: 'CORE-03: Dynamic UPI QR & Scanner',
    title: 'Dynamic NPCI UPI 2.0 QR Generator & Pre-Flight Scanner',
    subtitle: 'Deterministic UPIParser Validation & Collect-Trap Interception',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Show how Jain Pay validates raw NPCI UPI 2.0 URIs deterministically and intercepts social-engineered OLX "Scan QR to Receive Money" traps before the PIN screen.',
      prdExactExample:
        'AI-06 & NEXT-03 Guardrail: QR codes remain validated by deterministic UPIParser rules (pa, pn, mc, tr, cu, am) + inspectPaymentSafety.',
      stepByStepWalkthrough: [
        'Change the Request Amount in the top box to see the live upi://pay?pa=yash@jainpay... URI synthesize in real time.',
        'Click Preset #3 ("Malformed / Tampered QR URI") to show deterministic UPIParser blocking negative amounts and missing pa= handles.',
        'Click Preset #4 ("OLX Buyer Scam Trap am=4000") to trigger the high-contrast NEXT-03 Scam Shield modal!',
      ],
      incumbentMarketGap:
        'Users tricked by marketplace scammers scan debit QR codes thinking they will receive money.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'ReceiveQrScreen.kt & CameraXQrScanner.kt',
        technicalSummary:
          'Synthesizes canonical upi://pay?pa=yash@jainpay&pn=...&am=...&cu=INR URIs into vector QR matrices and scans incoming merchant/peer QR payloads.',
        keyInvariant: 'Strict URI encoding of pa, pn, mc, tr, am, and cu parameters.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'UPIParser.kt + NEXT-03 Scam Shield',
        technicalSummary:
          'Runs deterministic regex validation on pa (handle@bank) and positive amount am, then invokes inspectPaymentSafety() to detect fake "Scan to Receive" collect traps.',
        keyInvariant: 'Rejects malformed URIs, negative amounts, and non-INR currencies.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'stagePeerPayment() Pre-Fill Engine',
        technicalSummary:
          'Resolves verified merchant category codes (mc=5812 Dining, mc=4900 Utilities) and stages an untrusted payment draft into the Review & PIN modal.',
        keyInvariant: 'QR scan NEVER auto-executes a transfer without 4-digit PIN entry.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ BCNF Settlement',
        technicalSummary:
          'Once the user confirms the 4-digit PIN, commits the settlement across accounts, transactions, and ledger_entries with full UTR auditability.',
        keyInvariant: 'Immutable reference_utr logged for NPCI dispute resolution.',
      },
    ],
  },
  'CORE-D': {
    id: 'CORE-D',
    shortLabel: 'CORE-04: Activity Ledger & Refunds',
    title: 'Activity History & Authoritative Compensating Server Refunds',
    subtitle: 'Append-Only Ledger Audit Trail & Idempotent Reversal Pairs',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'ledger_entries',
    presenterGuide: {
      audiencePitch:
        'Show a professor why enterprise banks never run DELETE or UPDATE on historical ledger rows when issuing a refund—they append a compensating Credit/Debit reversal pair.',
      prdExactExample:
        'Section 0.1 & NEXT-07: processRefund() server-authoritative reversal + "Ask Co-Pilot about this transaction" (diagnoseTransactionState).',
      stepByStepWalkthrough: [
        'Click "Server Refund" on any settled payment row (e.g., BESCOM ₹1,640 or Zomato ₹845).',
        'Observe that the original transaction is marked REFUNDED, a new REFUND transaction is created, and 2 new compensating ledger_entries rows are appended.',
        'Click "Simulate Timed-Out Payment (BANK_TIMEOUT)" and then click "Diagnose (NEXT-07)" on the pending row to launch the AI Transaction Diagnostician!',
      ],
      incumbentMarketGap:
        'Deleting rows destroys audit trails; blind retries on PROCESSING transactions risk double debits.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'ActivityHistoryScreen.kt & ReceiptSheet.kt',
        technicalSummary:
          'Streams paginated transaction history with instant filtering (ALL, SEND, BILL_PAYMENT, CASHBACK, REFUND) and 1-click "Trigger Server Refund" or "Diagnose (NEXT-07)".',
        keyInvariant: 'Displays live ledger_entries row count per transaction.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Reversal Eligibility & Idempotency Guard',
        technicalSummary:
          'Verifies that original tx_id has status == SUCCESS and has not already been refunded, blocking duplicate refund clicks via unique reversal idempotency key.',
        keyInvariant: 'Historical ledger_entries rows are NEVER updated or deleted.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'processRefund(originalTxId) • SERIALIZABLE',
        technicalSummary:
          'Executes an atomic compensating transaction that credits the user wallet, debits the counterparty settlement account, and marks original tx status = REFUNDED.',
        keyInvariant: 'Compensating reversal preserves 100% chronological audit trail.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'BRIN-Indexed ledger_entries Audit Table',
        technicalSummary:
          'Appends 2 new compensating rows (CR acc_yash_wallet / DR acc_npci_settlement) indexed by BRIN(created_at) and B-Tree(sender_account_id, created_at DESC).',
        keyInvariant: '4 total ledger_entries rows link the original + refund lifecycle.',
      },
    ],
  },
  'CORE-E': {
    id: 'CORE-E',
    shortLabel: 'CORE-05: BBPS, 5G, Banks & Rewards',
    title: 'BBPS Utility Bills, 5G Recharge, Indian Banks & Scratch Cashback',
    subtitle: 'Bharat BillPay Integration, IFSC Validation & Treasury Cashback Credits',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'linked_bank_accounts',
    presenterGuide: {
      audiencePitch:
        'Show the complete Indian fintech ecosystem: Bharat BillPay (BBPS), 5G prepaid packs, BCNF-normalized Indian bank linking with IFSC regex validation, and server-authoritative Scratch Cards.',
      prdExactExample:
        'AI-08 Guardrail: All scratch-card generation (transactions > ₹50) and cashback ledger credits remain strictly deterministic, idempotent, and server-authoritative.',
      stepByStepWalkthrough: [
        'In Sub-Tab 1, click any 5G Recharge or BBPS Utility Biller to stage a bill payment into the 4-digit PIN modal.',
        'Switch to Sub-Tab 2 ("Linked Indian Banks") and add an ICICI or Axis Bank account with 11-char IFSC validation.',
        'Switch to Sub-Tab 3 ("Scratch Card Cashback") and click "Scratch & Credit" to watch a real CASHBACK double-entry credit hit your wallet balance!',
      ],
      incumbentMarketGap:
        'Client-side reward animations that credit balances without double-entry treasury accounting fail financial audits.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'RechargeScreen.kt, BankLinkSheet.kt & RewardsScreen.kt',
        technicalSummary:
          'Provides interactive flows for Jio/Airtel/Vi 5G plans, 8 BBPS utility billers, 7 Indian banks with IFSC validation, and interactive Scratch Cards.',
        keyInvariant: 'Strict IFSC regex: ^[A-Z]{4}0[A-Z0-9]{6}$ (11 characters).',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Biller Verification & Treasury Claim Lock',
        technicalSummary:
          'Validates BBPS consumer numbers and ensures each Scratch Card ID can only be scratched and credited once per user session.',
        keyInvariant: 'Prevents replay claiming of already-scratched reward cards.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'linkBankAccount() & claimScratchReward()',
        technicalSummary:
          'Stores normalized bank metadata in linked_bank_accounts and executes atomic treasury-to-wallet cashback transfers (acc_rewards_treasury -> acc_yash_wallet).',
        keyInvariant: '3NF/BCNF separation of linked_bank_accounts from accounts.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'linked_bank_accounts & ledger_entries',
        technicalSummary:
          'Records primary settlement bank flags and commits deterministic CASHBACK ledger rows with instant balance projection.',
        keyInvariant: 'Every ₹1 cashback is backed by a debit from acc_rewards_treasury.',
      },
    ],
  },
};

export const BASELINE_AI_SPECS: Record<BaselineAiId, FeaturePipelineSpec> = {
  'AI-01': {
    id: 'AI-01',
    shortLabel: 'AI-01: Spend Insights',
    title: 'AI-01 • Deterministic Spending Insights & Cash-Flow Summaries',
    subtitle: 'WoW/MoM Comparisons, Top Counterparties & Spike Explanations (Priority: P1)',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Explain Section 1.1 of the PRD: LLMs are terrible at mental math, so Jain Pay computes 100% of category sums, WoW/MoM deltas, and top merchants in deterministic Kotlin/SQL first, passing only redacted aggregates to the model.',
      prdExactExample:
        'PRD 1.1: Week-over-week & month-over-month comparisons, top categories/merchants, plain-language spike explanation, explicit date coverage (01 Oct – 25 Oct 2026).',
      stepByStepWalkthrough: [
        'Point out the explicit Date Coverage badge ("01 Oct 2026 – 25 Oct 2026 • Jain Pay Ledger Activity Only") and the WoW (+14.2%) / MoM (-6.8%) cards.',
        'Inspect the Top Counterparties & Unusual Spend Spike explanation grounded in deterministic SQL aggregates.',
        'Click "Simulate New ₹650 Dining Payment & Recompute Insights" to watch the deterministic math update live!',
      ],
      incumbentMarketGap:
        'GPay and PhonePe show static charts or raw transaction lists without explainable WoW/MoM spike narratives grounded in double-entry math.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'AiInsightsScreen.kt (Category Breakdown Cards)',
        technicalSummary:
          'Displays category-wise rupee totals, percentage shares, week-over-week (+14.2%) & month-over-month (-6.8%) deltas, and top counterparties.',
        keyInvariant: 'LLM is never allowed to sum or invent transaction numbers.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Deterministic Aggregation Pre-Processor',
        technicalSummary:
          'Computes exact SUM(amount) GROUP BY category in TypeScript/SQL first, passing only verified read-only aggregates with explicit date coverage.',
        keyInvariant: 'Zero-hallucination guarantee via pre-aggregated JSON input.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'queryFinancialLedger(windowDays: 30)',
        technicalSummary:
          'Executes read-only SQL aggregation over settled transactions scoped to usr_yash_01 and synthesizes grounded natural-language cash-flow commentary.',
        keyInvariant: 'Read-only execution scope: zero mutation permissions.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ transactions & ledger_entries',
        technicalSummary:
          'Reads directly from B-Tree composite index idx_transactions_sender_created_btree for sub-millisecond analytical rollups.',
        keyInvariant: 'Reconciles 100% with double-entry ledger_entries balances.',
      },
    ],
  },
  'AI-02': {
    id: 'AI-02',
    shortLabel: 'AI-02: NL Search',
    title: 'AI-02 • Natural-Language Transaction Search (English / Hindi / Hinglish)',
    subtitle: 'Schema-Validated Filter AST + Ambiguous Query Clarification (Priority: P1)',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Show Section 1.2 of the PRD: users can search in English, Hindi, or Hinglish, and the AI translates the query into a strict schema-validated JSON filter object—never raw SQL!',
      prdExactExample:
        'PRD 1.2 Examples: "Show payments above ₹500 last month", "How much did I spend on electricity bills this quarter?", "Show failed payments from this week".',
      stepByStepWalkthrough: [
        'Click the 3 exact PRD query chips ("Show payments above ₹500 last month", "Electricity bills this quarter", "Failed/Timed-out payments this week") and watch both the Schema-Validated Filter AST and matched rows update.',
        'Click the "Ambiguous Query Test" chip ("Show my recent stuff") to demonstrate the PRD Guardrail: the AI asks for clarification instead of guessing!',
        'Click "Receipt" on any matched transaction row to open the full cryptographic BCNF receipt modal.',
      ],
      incumbentMarketGap:
        'Paytm and GPay only support basic substring search on merchant names and cannot answer "payments above ₹500 last month".',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'NlSearchHeader.kt & ActivityFilterChips.kt',
        technicalSummary:
          'Accepts conversational queries ("Show payments above ₹500 last month", "Electricity bills this quarter") and renders matching rows + receipt links.',
        keyInvariant: 'Side-by-side display of parsed JSON AST and matched BCNF rows.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Strict JSON Filter Schema + Ambiguity Guard',
        technicalSummary:
          'Parses free-form text into a constrained filter AST { category, minAmount, status, txType } and prompts for clarification if a query is ambiguous.',
        keyInvariant: 'Zero raw SQL generation from user text (100% SQLi immunity).',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'queryFinancialLedger(filterAst)',
        technicalSummary:
          'Binds validated filter parameters to parameterized PostgreSQL 16+ queries under RLS policy rls_transactions_tenant_isolation.',
        keyInvariant: 'Enforces tenant isolation: user_id = current_setting(\'app.current_user_id\').',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ transactions Table',
        technicalSummary:
          'Returns matching transaction rows and deterministic rupee sum across the filtered result set.',
        keyInvariant: 'Deterministic count & sum across filtered ledger rows.',
      },
    ],
  },
  'AI-03': {
    id: 'AI-03',
    shortLabel: 'AI-03: Smart Budgets',
    title: 'AI-03 • Smart Category Budgets & Proactive Spending Alerts',
    subtitle: 'User Opt-In Caps, Month-End Velocity & Non-Blocking Guardrail (Priority: P2)',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 1.3 of the PRD: users opt in to category caps, see projected month-end velocity before overspending, and are guaranteed that crossing a budget cap NEVER freezes their account or blocks payments.',
      prdExactExample:
        'PRD 1.3 Guardrail: Requires user opt-in; never freezes accounts or blocks payments automatically when a budget threshold is crossed.',
      stepByStepWalkthrough: [
        'Drag the Utilities or Dining monthly cap slider down so utilization crosses 75% (WARNING) or 95% (CRITICAL PACE ALERT).',
        'Toggle the "User Opt-In Proactive Alerts" switch to see how opt-in consent governs notifications.',
        'Click "Test Payment Above Budget Cap (Prove Non-Blocking Guardrail)" to prove the user can still stage a payment even at >100% budget utilization!',
      ],
      incumbentMarketGap:
        'Most apps only alert users AFTER their monthly budget is already blown, or lock cards with rigid rules.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'SmartBudgetsCard.kt (Interactive Sliders)',
        technicalSummary:
          'Lets users opt in and adjust monthly category caps for Dining, Utilities, and P2P Transfers with live progress bars and pace badges.',
        keyInvariant: 'Interactive sliders recalculate utilization & month-end projection in 0ms.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Non-Blocking Advisory Guardrail',
        technicalSummary:
          'Enforces the PRD Section 1.3 guardrail: budget alerts are strictly advisory and require opt-in; crossing 100% NEVER freezes accounts or blocks payments.',
        keyInvariant: 'Budget alerts can never autonomously block a user payment.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'evaluateCategoryVelocity()',
        technicalSummary:
          'Calculates daily spend velocity (spentSoFar / dayOfMonth * 30) and triggers 75% Warning and 95% Critical pace notifications.',
        keyInvariant: 'Deterministic linear burn-rate projection.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'Live Ledger Category Aggregation',
        technicalSummary:
          'Reconciles category spend directly against settled debit transactions in the user wallet.',
        keyInvariant: 'Every settled payment immediately updates category utilization.',
      },
    ],
  },
  'AI-04': {
    id: 'AI-04',
    shortLabel: 'AI-04: 48h Cashflow',
    title: 'AI-04 • Predictive Cashflow & Recurring Payment Detection Engine',
    subtitle: '48-Hour Shortfall Forecast + Confirm / Edit / Snooze / Disable Controls (Priority: P2)',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'accounts',
    presenterGuide: {
      audiencePitch:
        'Show Section 1.4 of the PRD: Jain Pay detects recurring bills (rent, electricity, 5G recharge) from ledger history, forecasts 48-hour cash shortfalls, and lets users Confirm, Edit, Snooze, or Disable each reminder without risky silent auto-debits.',
      prdExactExample:
        'PRD 1.4 Capabilities: Detects candidate recurring payment cycles; prompts users to confirm, edit, snooze, or disable reminders; projects 48h cash depletion.',
      stepByStepWalkthrough: [
        'Inspect the 3 detected recurring obligations (Hostel Rent ₹4,500, BESCOM Electricity ₹1,850, Jio 5G Recharge ₹666) and their 48-hour liquidity impact.',
        'Click "Confirm", "Edit Amount", "Snooze 24h", or "Disable" on any recurring obligation to see the 48-hour Projected Surplus recalculate live!',
        'Click "Stage Confirmed Bill Now" to route a confirmed bill into the 4-digit PIN flow (proving zero autonomous auto-pay).',
      ],
      incumbentMarketGap:
        'UPI Autopay blindly hits low bank balances at midnight, causing ₹295–₹500 bank bounce penalties.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'CashflowForecastCard.kt',
        technicalSummary:
          'Visualizes current wallet balance against upcoming 48-hour recurring obligations with Confirm, Edit, Snooze, and Disable controls.',
        keyInvariant: 'Highlights projected 48-hour liquidity surplus or shortfall.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'No-Silent-Autopay Guardrail',
        technicalSummary:
          'Enforces PRD Section 1.4 guardrail: predictive cashflow reminders can only stage a draft payment; they never trigger silent auto-debits.',
        keyInvariant: 'Requires explicit user click + 4-digit PIN for bill settlement.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'fetchBillDueStatus() + Recurrence Detector',
        technicalSummary:
          'Queries historical bill payment intervals and BBPS due dates within the next 48 hours to compute net post-bill liquidity.',
        keyInvariant: 'postBillLiquidity = available_balance - sum(active_48h_bills).',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ accounts & transactions',
        technicalSummary:
          'Feeds verified upcoming obligation totals directly into the NEXT-05 Safe-to-Spend simulator.',
        keyInvariant: 'Shared state between AI-04 obligations and NEXT-05 runway.',
      },
    ],
  },
  'AI-05': {
    id: 'AI-05',
    shortLabel: 'AI-05: Voice/Text Co-Pilot',
    title: 'AI-05 • Jain Pay Voice & Text Co-Pilot & Core Tool Contracts',
    subtitle: 'English / Hindi / Hinglish Assistant + 3 Whitelisted Tool Contracts (Priority: P2)',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Show Section 1.5 of the PRD: the conversational assistant supports English, Hindi, and Hinglish and is restricted to 3 whitelisted read/stage tool contracts—and never fabricates bill amounts when a biller is in sandbox/unavailable mode.',
      prdExactExample:
        'PRD 1.5 Contracts: stagePeerPayment(recipientIdentifier, amount, paymentNote?), queryFinancialLedger(timeRangeDays, transactionType?, category?), fetchBillDueStatus(billerCategory, consumerNumber).',
      stepByStepWalkthrough: [
        'Click any of the English, Hindi, or Hinglish voice/text chips (e.g., "Rahul ko ₹500 bhejo dinner ke liye") to see askJainPayCopilot route to stagePeerPayment.',
        'Test fetchBillDueStatus across ELECTRICITY, WATER, GAS, BROADBAND, or FASTAG.',
        'Click "Test Unregistered Biller (Sandbox/Unavailable Guardrail)" to prove the PRD requirement: it clearly reports SANDBOX_UNAVAILABLE without fabricating a fake bill amount!',
      ],
      incumbentMarketGap:
        'Generic LLM wrappers hallucinate fake bill amounts or lack strict function-calling boundaries.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'VoiceCoPilotSheet.kt',
        technicalSummary:
          'Provides natural-language and voice command triggers in English, Hindi, and Hinglish for staging peer transfers, querying spend, or checking BBPS bills.',
        keyInvariant: 'Instant 1-click invocation of all 3 whitelisted AI-05 tools.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Strict 3-Tool Whitelist & Redaction Firewall',
        technicalSummary:
          'Restricts the assistant to stagePeerPayment, queryFinancialLedger, and fetchBillDueStatus while stripping all PII, OTPs, and PIN hashes.',
        keyInvariant: 'createPayment, processRefund, and updatePins are hard-blocked.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'askJainPayCopilot() Server Router',
        technicalSummary:
          'Executes the requested read/stage tool on the server and logs the full request/response JSON payload to the Admin AI Audit stream.',
        keyInvariant: 'Every tool invocation is logged with latency & guardrail status.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PaymentReviewModal -> BCNF Ledger',
        technicalSummary:
          'When stagePeerPayment is invoked, opens the deterministic Payment Review & 4-Digit PIN modal so the user retains 100% control.',
        keyInvariant: 'Human-in-the-loop cryptographic PIN signature required.',
      },
    ],
  },
  'AI-06': {
    id: 'AI-06',
    shortLabel: 'AI-06: Bill Vision OCR',
    title: 'AI-06 • Multimodal Bill, Receipt & QR Assistance',
    subtitle: '6-Field Structured Output Contract + Deterministic UPIParser Explainer (Priority: P2/P3)',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Show Section 1.6 of the PRD: Gemini 2.5 Flash Vision extracts the exact 6-field Structured Output Contract from utility bills into an editable confirmation form, and explains QR payloads via deterministic UPIParser rules.',
      prdExactExample:
        'PRD 1.6 Contract: Extracts billerName, consumerId, dueDate, totalAmountDue, billPeriod, and confidenceScore + explains QR (pa, pn, mc, tr, cu, am).',
      stepByStepWalkthrough: [
        'Switch between the 3 physical utility bills (BESCOM Electricity, JioFiber Broadband, Delhi Jal Board) to see all 6 extracted fields populate.',
        'Edit the Consumer ID or Extracted Amount in the form to demonstrate the PRD Guardrail: OCR outputs are treated as untrusted suggestions in an editable form.',
        'Test the bottom "QR Payload Explainer" to see deterministic UPIParser parameter breakdown (pa, pn, mc, tr, cu, am) before staging.',
      ],
      incumbentMarketGap:
        'Users have to manually type 10–12 digit consumer numbers from paper electricity and water bills.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'BillOcrScannerSheet.kt (Editable Form)',
        technicalSummary:
          'Renders extracted billerName, consumerId, dueDate, totalAmountDue, billPeriod, and confidenceScore inside an editable confirmation form.',
        keyInvariant: 'User can inspect and edit every OCR field before staging.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Untrusted OCR Suggestion Guardrail',
        technicalSummary:
          'Treats all vision OCR outputs as untrusted suggestions; validates extracted biller VPA against the authorized BBPS directory and UPIParser rules.',
        keyInvariant: 'Vision OCR never auto-submits a bill payment.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'Gemini 2.5 Flash Vision Proxy -> fetchBillDueStatus()',
        technicalSummary:
          'Extracts structured JSON fields from the utility invoice image and cross-verifies consumerId and due amount.',
        keyInvariant: 'Structured JSON output contract with confidenceScore.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'Staged BILL_PAYMENT -> BCNF Commit',
        technicalSummary:
          'Routes the user-verified bill amount into the standard 4-Digit PIN modal and commits a BILL_PAYMENT double-entry record.',
        keyInvariant: 'Full consumerId and billPeriod recorded in transaction note.',
      },
    ],
  },
  'AI-07': {
    id: 'AI-07',
    shortLabel: 'AI-07: Behavioral FAD',
    title: 'AI-07 • Behavioral Fraud & Anomaly Detection Signals (High Governance)',
    subtitle: 'Velocity, Nocturnal Hour, Baseline Ratio & Device Attestation -> 3 Risk Tiers',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Show Section 1.7 of the PRD: before payment authorization, Jain Pay evaluates 4 privacy-reviewed behavioral signals and classifies transactions into Low, Medium, or Critical risk tiers without ever logging raw PIN keystrokes.',
      prdExactExample:
        'PRD 1.7 Risk Tiering: Low Risk (Standard PIN) • Medium Risk (Step-up biometric/confirmation) • Critical Risk (Deterministic soft-hold + explainable challenge).',
      stepByStepWalkthrough: [
        'Drag the 15-Minute Velocity slider to 8 txns and Transaction Hour to 03:00 AM (Nocturnal Window).',
        'Toggle "New Counterparty" and "Play Integrity Attestation" to watch the composite score cross into MEDIUM (35–69) and CRITICAL (70–100).',
        'Click "Stage Test Payment Under Current Risk Tier" to see the step-up verification challenge inside the Payment Review Modal!',
      ],
      incumbentMarketGap:
        'Banks either silently block legitimate transfers with opaque rules or let social-engineered nocturnal drains through without warning.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'FraudTelemetryLab.kt & StepUpWarningBanner.kt',
        technicalSummary:
          'Provides interactive sliders for 15-min velocity, hour of day (IST), amount ratio vs. baseline, new counterparty status, and Play Integrity attestation.',
        keyInvariant: 'Real-time 0–100 risk score with explainable signal breakdown.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Deterministic 3-Tier Risk Engine (LOW/MED/CRIT)',
        technicalSummary:
          'Maps scores into LOW (0–34: Standard PIN), MEDIUM (35–69: Step-Up Biometric), and CRITICAL (70–100: Soft-Hold + Cooling Challenge).',
        keyInvariant: 'AI never autonomously freezes accounts or logs raw PIN keystrokes.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'inspectPaymentSafety() Telemetry Evaluator',
        technicalSummary:
          'Computes weighted behavioral anomaly points prior to payment authorization and attaches risk metadata to the staged review screen.',
        keyInvariant: '100% deterministic, reproducible risk scoring formula.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'Step-Up Verified BCNF Settlement',
        technicalSummary:
          'Requires explicit user step-up acknowledgment + 4-digit PIN when risk is CRITICAL before committing to the BCNF ledger.',
        keyInvariant: 'Protects users from nocturnal account drain & coercion.',
      },
    ],
  },
  'AI-08': {
    id: 'AI-08',
    shortLabel: 'AI-08: LinUCB Rewards',
    title: 'AI-08 • Contextual-Bandit Rewards Optimization & Smart Discovery',
    subtitle: 'LinUCB Category Ranking + Smart Workflow Discovery + Deterministic Cashback',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'ledger_entries',
    presenterGuide: {
      audiencePitch:
        'Show Section 1.8 of the PRD: LinUCB contextual bandits personalize which workflow (Recharge, Bills, Receive QR, Activity) and merchant voucher category are highlighted, while actual rupee cashback credits remain 100% server-authoritative.',
      prdExactExample:
        'PRD 1.8: Guide users to relevant app workflows (Recharge, Bills, Receive QR, Activity) and optimize reward relevance (LinUCB) within merchant margin budgets.',
      stepByStepWalkthrough: [
        'Switch the Transaction Context Category (Dining, Utilities, Telecom) and adjust Exploration Alpha (α) to see the LinUCB UCB scores re-rank the 4 reward arms live.',
        'Click any of the 4 "Smart Discovery Workflow Launchers" (Recharge, Bills, Receive QR, Activity) to jump directly to that workflow.',
        'Point out the PRD Guardrail: LinUCB ranks relevance, while Scratch Card generation (>₹50) and cashback ledger credits are 100% deterministic in Cloud Functions.',
      ],
      incumbentMarketGap:
        'CRED and GPay hand out repetitive "Better Luck Next Time" cards or irrelevant rummy vouchers.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'LinUcbExplorerCard.kt & SmartDiscoveryRow.kt',
        technicalSummary:
          'Lets evaluators tune transaction category, payment amount, and LinUCB exploration parameter alpha, plus 1-click Smart Discovery workflow buttons.',
        keyInvariant: 'Displays Empirical Mean + Alpha * Uncertainty Bonus = Total UCB.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Bandit Ranking vs. Ledger Credit Separation',
        technicalSummary:
          'Enforces PRD Section 1.8 guardrail: LinUCB only ranks voucher/category relevance; it can never mint arbitrary rupee cashback or mutate balances.',
        keyInvariant: 'Strict separation between recommendation ranking and ledger math.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'computeLinUcbScores() + claimScratchReward()',
        technicalSummary:
          'Solves contextual ridge regression for arm selection while keeping scratch-card issuance (>₹50) and cashback amounts 100% deterministic on the server.',
        keyInvariant: 'Deterministic server-authoritative cashback settlement.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'acc_rewards_treasury -> acc_yash_wallet',
        technicalSummary:
          'Credits claimed cashback via atomic double-entry rows in ledger_entries.',
        keyInvariant: 'Auditable treasury debit for every rupee of user cashback.',
      },
    ],
  },
};

export const NEXT_GEN_FEATURE_SPECS: Record<
  NextGenFeatureId,
  FeaturePipelineSpec
> = {
  'NEXT-01': {
    id: 'NEXT-01',
    shortLabel: 'NEXT-01: Snap & Split Receipt',
    title: 'NEXT-01 • Multimodal "Snap-and-Split" Itemized Bill Agent in P2P & Group Chat',
    subtitle: 'Gemini Vision Line-Item Extraction + Hinglish Exclusion + Proportional GST/Discount Math',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.1 of the PRD: upload a dining bill in group chat and say in Hinglish "Aman didn\'t have the cold coffee, split the rest equally between the three of us." Gemini Vision extracts items while deterministic backend math splits GST and discounts down to the paisa!',
      prdExactExample:
        'PRD 2.1 Prompt: "Aman didn\'t have the cold coffee, split the rest equally between the three of us." -> parseAndSplitReceipt -> Item-Claim Compose Card.',
      stepByStepWalkthrough: [
        'Click the exact PRD Hinglish preset button ("Aman didn\'t have the cold coffee, split the rest equally between the three of us") to auto-configure the item claims.',
        'Toggle any participant pill ([Yash], [Aman], [Pooja]) on Paneer Tikka, 2x Cold Coffee, or Veg Hakka Noodles to watch the deterministic proportional GST (+₹62.50) and discount (-₹112.50) recalculate in 0ms.',
        'Click "Pay My Share" to stage a standard stagePeerPayment request into the 4-digit PIN flow!',
      ],
      incumbentMarketGap:
        'GPay and Splitwise force users to manually calculate itemized dishes, proportional 5% GST, and promo discounts outside the app.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'ChatCopilotScreen.kt (Item-Claim Compose Card)',
        technicalSummary:
          'Renders the interactive Item-Claim Compose Card with participant chips ([Yash], [Aman], [Pooja]), itemName, quantity, unitPrice, taxAmount, and discountAmount.',
        keyInvariant: 'Real-time rupee/paisa recalculation on every participant toggle.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'parseAndSplitReceipt() + Deterministic Math Engine',
        technicalSummary:
          'Parses Hinglish constraints ("Aman didn\'t have the cold coffee") and allocates 5% GST (+₹62.50) & promo discount (-₹112.50) proportionally in deterministic code.',
        keyInvariant: 'Verifies line items + taxes - discounts == ₹1,200.00 grand total.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'stagePeerPayment() Share Settlement',
        technicalSummary:
          'Stages the user\'s exact calculated share into the Payment Review & 4-Digit PIN modal.',
        keyInvariant: 'No automatic group debit without explicit PIN entry.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ transactions & ledger_entries',
        technicalSummary:
          'Commits the settled bill share to the BCNF ledger and appends a verified receipt bubble to the chat thread.',
        keyInvariant: 'Paisa-exact reconciliation with zero rounding drift.',
      },
    ],
  },
  'NEXT-02': {
    id: 'NEXT-02',
    shortLabel: 'NEXT-02: Net-Zero Khata IOU',
    title: 'NEXT-02 • Conversational "Net-Zero Khata" (Micro-IOU Running Tab Inside P2P Chat)',
    subtitle: 'Natural-Language IOU Parsing + Peer Acknowledgment + Single Net Balance Settlement',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'khata_entries',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.2 of the PRD: instead of cluttering bank statements with 20 tiny ₹20–₹150 chai/auto UPI transactions a week, friends log micro-IOUs conversationally in chat and settle the exact net difference in 1 UPI transfer.',
      prdExactExample:
        'PRD 2.2 Prompts: "Paid ₹120 for auto, split 50-50" or "Deduct the ₹40 Maggi I owed you yesterday." -> proposeChatKhataEntry & stageKhataSettlement.',
      stepByStepWalkthrough: [
        'Click either exact PRD conversational preset ("Paid ₹120 for auto, split 50-50" or "Deduct the ₹40 Maggi I owed you yesterday") to create a structured IOU in /chats/{chatId}/khataEntries/{entryId}.',
        'Click "Simulate Peer Acknowledge" on the pending entry and watch the top Net Running Balance header update immediately.',
        'Click "Settle Net Balance" (stageKhataSettlement) to settle all acknowledged micro-IOUs in ONE atomic PIN-verified UPI transfer!',
      ],
      incumbentMarketGap:
        'Friends and hostelmates clutter bank statements with dozens of ₹20–₹150 micro-transfers that fail during bank server downtimes.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'KhataRunningTabCard.kt',
        technicalSummary:
          'Displays the live Net Running Balance header at the top of P2P chat, conversational IOU presets, peer "Acknowledge" buttons, and 1-click "Settle Net Balance".',
        keyInvariant: 'Consolidates N micro-IOUs into 1 net settlement transfer.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Dual-Party Acknowledgment Invariant',
        technicalSummary:
          'Ensures newly proposed Khata entries start in PENDING_ACK state inside /chats/{chatId}/khataEntries/{entryId} and only affect the net balance once acknowledged.',
        keyInvariant: 'Unacknowledged IOUs cannot inflate net settlement amounts.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'proposeChatKhataEntry() & stageKhataSettlement()',
        technicalSummary:
          'Computes SUM(PEER_OWES_USER) - SUM(USER_OWES_PEER) across ACKNOWLEDGED rows and routes the net difference to stagePeerPayment.',
        keyInvariant: 'Deterministic net-zero offset calculation.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ khata_entries & transactions',
        technicalSummary:
          'Upon PIN confirmation, commits 1 UPI transaction and transitions all included khata_entries rows to SETTLED with linked_tx_id.',
        keyInvariant: 'Foreign key khata_entries.linked_tx_id -> transactions(transaction_id).',
      },
    ],
  },
  'NEXT-03': {
    id: 'NEXT-03',
    shortLabel: 'NEXT-03: Scam & Collect Shield',
    title: 'NEXT-03 • Pre-Flight Scam & Social Engineering Shield in Chat & Scanner',
    subtitle: 'Deterministic QR Rules + Social-Engineering Urgency Classifier + English/Hinglish Threat Card',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.3 of the PRD: when a scammer sends a fake OLX "Scan QR to Receive ₹5,000" message or a fake electricity disconnection SMS, Jain Pay displays a high-contrast English & Hinglish Explainable Threat Card exposing the exact contradiction.',
      prdExactExample:
        'PRD 2.3 Contradiction Warning: "Warning: Entering your PIN on a QR scan ALWAYS sends money out of your account; it never receives money."',
      stepByStepWalkthrough: [
        'Click Scenario 1 ("OLX Buyer: Scan QR & enter PIN to receive ₹5,000 refund"), Scenario 2 ("Fake BESCOM 9:30 PM Power Disconnection SMS"), or Scenario 3 ("Urgent Family Hospital Impersonation").',
        'Inspect the high-contrast English & Hinglish Explainable Threat Card highlighting the exact social-engineering contradiction.',
        'Click "Launch Full-Screen Pre-Flight Scam Shield Modal" to show the mandatory safety acknowledgment gate before any PIN screen can be reached!',
      ],
      incumbentMarketGap:
        'GPay and PhonePe display generic static warnings that social-engineered users click past in panic.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'ScamShieldThreatCard.kt',
        technicalSummary:
          'Intercepts suspicious WhatsApp messages, SMS texts, or QR codes and renders a high-contrast Explainable Threat Card in English and Hinglish.',
        keyInvariant: 'Proves that entering a UPI PIN ALWAYS debits money, never receives.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'inspectPaymentSafety(qrPayload, chatContext)',
        technicalSummary:
          'Cross-checks deterministic UPI URI direction (upi://pay = DEBIT) against social-engineering claims ("receive ₹5,000 refund", "power cut tonight").',
        keyInvariant: 'Detects Semantic Direction Contradiction (CLAIM_RECEIVE vs. URI_DEBIT).',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'Pre-Flight Safety Interlock',
        technicalSummary:
          'Holds the payment draft in a quarantined state unless the user explicitly checks the safety acknowledgment override.',
        keyInvariant: 'Default action is "Block Scam & Protect Wallet Balance".',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'Zero-Debit Wallet Protection + Audit Log',
        technicalSummary:
          'Logs the intercepted scam payload to the AI Tool-Call Audit table while preserving 100% of the user\'s wallet balance.',
        keyInvariant: 'accounts.available_balance remains 100% untouched.',
      },
    ],
  },
  'NEXT-04': {
    id: 'NEXT-04',
    shortLabel: 'NEXT-04: Screenshot-to-Payment',
    title: 'NEXT-04 • Universal "Any-Screenshot-to-Staged-Payment" Intent Engine',
    subtitle: 'Android Share-Sheet Vision Extraction + 7-Day Duplicate Payment Guard',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'transactions',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.4 of the PRD: share an event poster, handwritten Kirana bill, or WhatsApp text to Jain Pay Co-Pilot. It extracts the VPA/amount AND deterministically checks the last 7 days of ledger history to prevent accidental double payments!',
      prdExactExample:
        'PRD 2.4 Flow: extractPaymentIntentFromMedia -> cross-checks queryFinancialLedger over past 7 days -> warns if identical amount was already paid.',
      stepByStepWalkthrough: [
        'Click Media Preset 1 ("VIT HackVerse Poster • techfest@sbi • ₹500") and point out the bright orange 7-DAY DUPLICATE PAYMENT WARNING banner (matches tx_908128 from 21 Oct 2026!).',
        'Switch to Media Preset 2 ("Handwritten Sharma Kirana Bill • ₹430") or Preset 3 ("WhatsApp SMS with Phone Number • ₹750") to see clean first-time extraction.',
        'Click "Stage Extracted Payment" to open the pre-populated Review & 4-Digit PIN modal in one tap.',
      ],
      incumbentMarketGap:
        'Users manually switch apps to type UPI IDs from posters, or accidentally pay the same event poster twice.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'ShareSheetIntentCard.kt',
        technicalSummary:
          'Receives shared posters, handwritten vendor bills, or WhatsApp snippets from Android Share Sheet and displays extracted VPA, amount, and note.',
        keyInvariant: 'Surfaces an explicit 7-Day Duplicate Payment Warning banner.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: '7-Day Historical Deduplication Check',
        technicalSummary:
          'Cross-checks extracted { recipientVpa, amount } against settled transactions in the past 7 days via queryFinancialLedger (detecting tx_908128 to techfest@sbi for ₹500).',
        keyInvariant: 'Prevents accidental double-payment of shared posters/invoices.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'extractPaymentIntentFromMedia()',
        technicalSummary:
          'Combines Gemini Vision OCR extraction with deterministic SQL duplicate lookup and stages a payment draft if the user chooses to proceed.',
        keyInvariant: 'Never auto-debits from a shared screenshot.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ transactions Lookup & Commit',
        technicalSummary:
          'Queries idx_transactions_sender_created_btree for 7-day matching transfers before staging.',
        keyInvariant: '100% deterministic ledger lookup prior to staging.',
      },
    ],
  },
  'NEXT-05': {
    id: 'NEXT-05',
    shortLabel: 'NEXT-05: Safe-to-Spend Simulator',
    title: 'NEXT-05 • Interactive "What-If" Safe-to-Spend & Cashflow Runway Simulator',
    subtitle: 'Live Hypothetical Purchase Slider Subtracting AI-04 Bills & AI-03 Budgets',
    recommendedAdminTab: 'AI_JSON',
    recommendedBcnfTable: 'accounts',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.5 of the PRD: when a student asks "Can I afford ₹3,500 headphones today without messing up my month-end bills?", Jain Pay subtracts upcoming 48h bills (AI-04) and active budget reserves (AI-03) to show the exact cashflow runway impact before spending a rupee.',
      prdExactExample:
        'PRD 2.5 Prompt: "Can I afford ₹3,500 headphones today without messing up my month-end bills?" -> simulateSafeToSpend.',
      stepByStepWalkthrough: [
        'Click the exact PRD preset button ("Can I afford ₹3,500 headphones today without messing up my month-end bills?") to set the simulator to ₹3,500.',
        'Show the deterministic formula breakdown: Current Balance (₹24,880.30) - AI-04 Upcoming Bills (₹7,139.00) - AI-03 Budget Reserves (₹4,200.00) = Safe-to-Spend Before Purchase (₹13,541.30).',
        'Drag the slider from ₹500 up to ₹18,000 to show the status transition from SAFE_PURCHASE to CAUTION_BUFFER_LOW to SHORTFALL_RISK!',
      ],
      incumbentMarketGap:
        'Payment apps only show historical spend after money is gone; they never help users decide if an impulse purchase is safe today.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'SafeToSpendRunwayCard.kt',
        technicalSummary:
          'Provides the PRD preset ("Can I afford ₹3,500 headphones today?") and a live slider showing Safe-to-Spend balance and Runway Days before vs. after.',
        keyInvariant: 'Instant visual feedback: SAFE_PURCHASE / CAUTION / SHORTFALL_RISK.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Deterministic Liquidity Deduction Formula',
        technicalSummary:
          'Subtracts upcoming 48h recurring bills (AI-04: ₹7,139) and active category budget reserves (AI-03: ₹4,200) from live wallet balance before testing the purchase.',
        keyInvariant: 'safeToSpend = balance - upcoming48hBills - budgetReserve.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'simulateSafeToSpend(hypotheticalAmount)',
        technicalSummary:
          'Computes safeToSpendBeforePurchase, safeToSpendAfterPurchase, and daily burn runway impact in deterministic backend math.',
        keyInvariant: 'Read-only simulation: zero impact on actual ledger balances.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'Real-Time accounts.available_balance Sync',
        technicalSummary:
          'Automatically reflects any new payments, refunds, or sandbox balance adjustments from the BCNF accounts table.',
        keyInvariant: 'Always grounded in live accounts.available_balance.',
      },
    ],
  },
  'NEXT-06': {
    id: 'NEXT-06',
    shortLabel: 'NEXT-06: Milestone Trust Cards',
    title: 'NEXT-06 • Milestone-Staged "Trust Cards" for Conditional P2P Deals',
    subtitle: 'Non-Custodial 2-Step P2P Deal Tracker (Advance -> Handover -> Final Balance)',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'milestone_deals',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.6 of the PRD: for second-hand electronics or freelance work, Jain Pay creates a non-custodial 2-step Milestone Deal Card inside P2P chat (CREATED -> ADVANCE_PAID -> DELIVERY_CONFIRMED -> SETTLED) without holding funds in unauthorized escrow.',
      prdExactExample:
        'PRD 2.6 Prompt: "Create a 2-step payment tracker with Vikram for the monitor: ₹1,000 advance today, ₹3,000 when I pick it up on Saturday."',
      stepByStepWalkthrough: [
        'Inspect the active LG 27" IPS Monitor deal with Vikram Singh (₹1,000 Advance already linked to tx_908128, awaiting Saturday physical handover).',
        'Click "Confirm Saturday Physical Handover (DELIVERY_CONFIRMED)" to unlock Milestone 2 ("Pay ₹3,000 Final Balance").',
        'Click "Pay ₹3,000 Final Balance" and enter PIN 1234 to settle the deal and link final_tx_id in the BCNF milestone_deals table!',
      ],
      incumbentMarketGap:
        'Peer marketplace buyers and student freelancers have zero structured milestone tracking inside payment chats.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'MilestoneTrustCard.kt',
        technicalSummary:
          'Renders the 4-state progress stepper (CREATED -> ADVANCE_PAID -> DELIVERY_CONFIRMED -> SETTLED) for peer deals inside P2P chat.',
        keyInvariant: 'Total deal amount strictly equals advance_amount + final_amount.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Non-Custodial Conditional Release Gate',
        technicalSummary:
          'Tracks deal state without holding funds in unauthorized escrow; keeps the "Pay ₹3,000 Final Balance" button locked until physical handover is confirmed.',
        keyInvariant: 'Final payment button cannot be clicked before DELIVERY_CONFIRMED.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'createMilestoneTrustCard() & stagePeerPayment()',
        technicalSummary:
          'Routes both the Advance payment and Final Balance payment through the standard 4-Digit PIN flow and binds the resulting transaction_id.',
        keyInvariant: 'Links advance_tx_id and final_tx_id to authoritative transactions.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ milestone_deals Table',
        technicalSummary:
          'Persists state transitions and foreign-key transaction references in the BCNF milestone_deals table.',
        keyInvariant: 'CHECK (total_amount = advance_amount + final_amount).',
      },
    ],
  },
  'NEXT-07': {
    id: 'NEXT-07',
    shortLabel: 'NEXT-07: Txn Diagnostician',
    title: 'NEXT-07 • Conversational Transaction Diagnostician & Smart Receipt Verifier',
    subtitle: 'getPaymentStatus + IdempotencyManager Audit + English/Hinglish Safe-Retry Guidance',
    recommendedAdminTab: 'BCNF_TABLES',
    recommendedBcnfTable: 'ledger_entries',
    presenterGuide: {
      audiencePitch:
        'Demonstrate Section 2.7 of the PRD: when a payment is stuck in PROCESSING or failed, users panic and retry blindly. Tapping "Ask Co-Pilot about this transaction" inspects getPaymentStatus and IdempotencyManager to prove in English & Hinglish whether money left the sender\'s ledger and whether retrying is safe.',
      prdExactExample:
        'PRD 2.7 Flow: Calls authoritative getPaymentStatus + checks IdempotencyManager state for txnId -> explains in clear English/Hinglish if money left the ledger.',
      stepByStepWalkthrough: [
        'Select tx_908119 ("Blue Tokai Coffee Roasters • ₹340.00 • PROCESSING [NPCI Switch 504 Timeout]").',
        'Show the audience the deterministic proof: 0 ledger_entries rows exist for tx_908119, meaning ₹0.00 was debited from acc_yash_wallet and the UUID idempotency lock is active.',
        'Read the side-by-side English & Hinglish diagnostic explanation, or click "+ Inject New Timed-Out Payment" to test another live timeout!',
      ],
      incumbentMarketGap:
        'Support chatbots reply with generic "Wait 3–5 business days" scripts, causing anxious users to retry and double-pay.',
    },
    nodes: [
      {
        stepNumber: 'NODE 01',
        layerTitle: 'Android Jetpack Compose Client Layer',
        componentBadge: 'TransactionDiagnosticianCard.kt',
        technicalSummary:
          'Lets users select any transaction (such as PROCESSING tx_908119 Blue Tokai ₹340) to inspect its live idempotency lock and ledger debit state in English & Hinglish.',
        keyInvariant: 'Eliminates blind duplicate retries on timed-out bank switches.',
      },
      {
        stepNumber: 'NODE 02',
        layerTitle: 'Zero-Trust AI / Security Gate',
        componentBadge: 'Idempotency & Ledger Cross-Examination',
        technicalSummary:
          'Checks whether any DEBIT row exists in ledger_entries for the target transaction_id and verifies whether idempotency_key is still locked.',
        keyInvariant: 'Deterministic proof of whether ₹0 or ₹X left the sender wallet.',
      },
      {
        stepNumber: 'NODE 03',
        layerTitle: 'Authoritative Backend / Cloud Function',
        componentBadge: 'diagnoseTransactionState(transactionId)',
        technicalSummary:
          'Calls getPaymentStatus() and returns a structured diagnostic report with safe-retry guidance in clear English and Hinglish.',
        keyInvariant: 'Read-only diagnostic inspection with zero mutation side effects.',
      },
      {
        stepNumber: 'NODE 04',
        layerTitle: 'Atomic Double-Entry Ledger & Storage',
        componentBadge: 'PostgreSQL 16+ transactions & ledger_entries Join',
        technicalSummary:
          'Performs an authoritative LEFT JOIN between transactions and ledger_entries to verify exact settlement state.',
        keyInvariant: 'Zero-discrepancy reconciliation between status and ledger rows.',
      },
    ],
  },
};

export const ALL_CORE_OPTIONS = Object.values(CORE_FEATURE_SPECS);
export const ALL_BASELINE_AI_OPTIONS = Object.values(BASELINE_AI_SPECS);
export const ALL_NEXT_GEN_OPTIONS = Object.values(NEXT_GEN_FEATURE_SPECS);

export function getPipelineSpecById(id: SingleFeatureId): FeaturePipelineSpec {
  if (id in CORE_FEATURE_SPECS) {
    return CORE_FEATURE_SPECS[id as CoreFeatureId];
  }
  if (id in BASELINE_AI_SPECS) {
    return BASELINE_AI_SPECS[id as BaselineAiId];
  }
  return NEXT_GEN_FEATURE_SPECS[id as NextGenFeatureId];
}
