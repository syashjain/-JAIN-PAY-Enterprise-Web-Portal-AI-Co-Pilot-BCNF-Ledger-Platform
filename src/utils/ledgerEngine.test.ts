import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as jainPayEngine from '../engine/jainPayEngine';
import {
  verifyPinPBKDF2,
  validateRecipientIdentifier,
  parseUpiUri,
  computeItemizedSplit,
  computeNetKhataBalance,
  inspectPaymentSafetyEngine,
  simulateSafeToSpendMath,
  computeBehavioralFraudScore,
  computeLinUcbScores,
  executeAtomicPayment,
  executeAtomicRefund,
  simulateConcurrentSsiRace,
} from './ledgerEngine';
import { AccountRecord, KhataEntryRecord } from '../types/domain';

test('verifyPinPBKDF2 validates 4-digit PIN 1234 and rejects invalid PINs', () => {
  const valid = verifyPinPBKDF2('1234');
  assert.equal(valid.isValid, true);
  assert.equal(valid.iterations, 10000);
  assert.ok(valid.auditTrail.includes('MATCH_VERIFIED'));

  const invalid = verifyPinPBKDF2('9999');
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.auditTrail.includes('HASH_MISMATCH_403'));
});

test('validateRecipientIdentifier validates UPI VPAs and 10-digit Indian mobile numbers', () => {
  const vpa = validateRecipientIdentifier('rahul@okaxis');
  assert.equal(vpa.valid, true);
  assert.equal(vpa.kind, 'VPA');

  const mobile = validateRecipientIdentifier('9876543210');
  assert.equal(mobile.valid, true);
  assert.equal(mobile.kind, 'MOBILE');
  assert.equal(mobile.normalizedVpa, '9876543210@jainpay');

  const bad = validateRecipientIdentifier('invalid-vpa-without-at');
  assert.equal(bad.valid, false);
});

test('NEXT-01 computeItemizedSplit calculates exact rupee/paisa shares with 5% GST and discount', () => {
  const split = computeItemizedSplit(
    [
      {
        id: '1',
        name: 'Paneer Tikka Starter',
        price: 320,
        claimedBy: ['Yash', 'Pooja'],
      },
      {
        id: '2',
        name: 'Cold Coffee',
        price: 180,
        claimedBy: ['Yash', 'Pooja'],
      },
      {
        id: '3',
        name: '3x Veg Hakka Noodles',
        price: 750,
        claimedBy: ['Yash', 'Pooja', 'Rahul'],
      },
    ],
    5,
    112.5
  );

  assert.equal(split.subtotal, 1250);
  assert.equal(split.gstAmount, 62.5);
  assert.equal(split.grandTotal, 1200);
  assert.equal(split.shares.Yash, 436.15);
  assert.equal(split.shares.Pooja, 436.15);
  assert.equal(split.shares.Rahul, 327.7);
  // Sum of individual shares must equal grandTotal (₹1,200.00) to the exact paisa
  const totalShares =
    Math.round((split.shares.Yash + split.shares.Pooja + split.shares.Rahul) * 100) /
    100;
  assert.equal(totalShares, 1200);
});

test('NEXT-02 computeNetKhataBalance computes signed net balance accurately', () => {
  const sampleEntries: KhataEntryRecord[] = [
    {
      khata_id: 'k1',
      creator_user_id: 'usr_rahul_02',
      peer_user_id: 'usr_rahul_02',
      peer_name: 'Rahul Verma',
      peer_vpa: 'rahul@okaxis',
      direction: 'USER_OWES_PEER',
      amount: 210,
      description: 'Campus Canteen Lunch',
      status: 'ACKNOWLEDGED',
      linked_tx_id: null,
      created_at: new Date().toISOString(),
    },
    {
      khata_id: 'k2',
      creator_user_id: 'usr_yash_01',
      peer_user_id: 'usr_rahul_02',
      peer_name: 'Rahul Verma',
      peer_vpa: 'rahul@okaxis',
      direction: 'PEER_OWES_USER',
      amount: 70,
      description: 'Auto split 50-50',
      status: 'ACKNOWLEDGED',
      linked_tx_id: null,
      created_at: new Date().toISOString(),
    },
  ];

  const res = computeNetKhataBalance(sampleEntries, 'usr_rahul_02');
  assert.equal(res.acknowledgedNet, -140);
  assert.equal(res.absAmount, 140);
});

test('NEXT-03 inspectPaymentSafetyEngine intercepts OLX collect trap QR', () => {
  const analysis = inspectPaymentSafetyEngine(
    'OLX Army Officer Buyer: Scan this QR code and enter your UPI PIN to RECEIVE ₹4,000 immediately!',
    'upi://pay?pa=scammer99@okaxis&pn=VerifyRefund&am=4000&cu=INR'
  );
  assert.equal(analysis.riskLevel, 'CRITICAL');
  assert.equal(analysis.isCollectTrap, true);
  assert.equal(analysis.blockedByDefault, true);
  assert.equal(analysis.parsedAmount, 4000);
});

test('executeAtomicPayment enforces BCNF double-entry invariants and UUID idempotency deduplication', () => {
  const baseAccounts: AccountRecord[] = [
    {
      account_id: 'acc_yash_wallet',
      user_id: 'usr_yash_01',
      account_type: 'USER_WALLET',
      vpa_address: 'yash@jainpay',
      available_balance: 24880.3,
      currency: 'INR',
      version_seq: 10,
      updated_at: new Date().toISOString(),
    },
    {
      account_id: 'acc_npci_settlement',
      user_id: 'usr_system_00',
      account_type: 'COUNTERPARTY_SETTLEMENT',
      vpa_address: 'settlement@npci',
      available_balance: 500000,
      currency: 'INR',
      version_seq: 10,
      updated_at: new Date().toISOString(),
    },
  ];

  const firstRun = executeAtomicPayment(
    {
      accounts: baseAccounts,
      transactions: [],
      ledgerEntries: [],
      scratchCards: [],
      sandboxOutcome: 'INSTANT_SUCCESS',
    },
    {
      idempotencyKey: 'uuid-test-1001',
      recipientName: 'Rahul Verma',
      recipientVpa: 'rahul@okaxis',
      amount: 500,
      note: 'Dinner share',
      txType: 'SEND',
      category: 'P2P Transfers',
      pinInput: '1234',
    }
  );

  assert.equal(firstRun.outcome, 'COMMITTED');
  assert.equal(firstRun.newLedgerEntries.length, 2);
  const debitRow = firstRun.newLedgerEntries.find((e) => e.debit_amount > 0)!;
  const creditRow = firstRun.newLedgerEntries.find((e) => e.credit_amount > 0)!;
  assert.equal(debitRow.debit_amount, 500);
  assert.equal(debitRow.credit_amount, 0);
  assert.equal(creditRow.credit_amount, 500);
  assert.equal(creditRow.debit_amount, 0);
  assert.equal(debitRow.balance_after, 24380.3);

  // Replay with exact same idempotencyKey must NOT double-debit
  const replayRun = executeAtomicPayment(
    {
      accounts: firstRun.updatedAccounts,
      transactions: [firstRun.transaction!],
      ledgerEntries: firstRun.newLedgerEntries,
      scratchCards: [],
      sandboxOutcome: 'INSTANT_SUCCESS',
    },
    {
      idempotencyKey: 'uuid-test-1001',
      recipientName: 'Rahul Verma',
      recipientVpa: 'rahul@okaxis',
      amount: 500,
      note: 'Dinner share',
      txType: 'SEND',
      category: 'P2P Transfers',
      pinInput: '1234',
    }
  );

  assert.equal(replayRun.outcome, 'IDEMPOTENT_REPLAY');
  const walletAfterReplay = replayRun.updatedAccounts.find(
    (a) => a.account_id === 'acc_yash_wallet'
  )!;
  assert.equal(walletAfterReplay.available_balance, 24380.3);

  // Refund must restore balance to 24880.30
  const refundRun = executeAtomicRefund(
    {
      accounts: firstRun.updatedAccounts,
      transactions: [firstRun.transaction!],
      ledgerEntries: firstRun.newLedgerEntries,
    },
    firstRun.transaction!.transaction_id
  );
  assert.equal(refundRun.success, true);
  const walletAfterRefund = refundRun.updatedAccounts.find(
    (a) => a.account_id === 'acc_yash_wallet'
  )!;
  assert.equal(walletAfterRefund.available_balance, 24880.3);
});

test('AI-07, AI-08, NEXT-05, parseUpiUri and SSI simulator work deterministically', () => {
  const ssi = simulateConcurrentSsiRace();
  assert.equal(ssi.worker1Status, 'COMMITTED');
  assert.equal(ssi.worker2Status, 'ABORTED_SQLSTATE_40001');
  assert.equal(ssi.finalBalance, 0);

  const safe = simulateSafeToSpendMath(24880.3, 3500);
  assert.equal(safe.verdict, 'SAFE_COMFORTABLE');

  const fad = computeBehavioralFraudScore({
    velocity15Min: 8,
    hourOfDay: 2,
    amountRatioVsBaseline: 6.5,
    isNewCounterparty: true,
  });
  assert.equal(fad.tier, 'CRITICAL');

  const linucb = computeLinUcbScores({
    txCategory: 'Utilities',
    txAmount: 1850,
    explorationAlpha: 0.5,
  });
  assert.equal(linucb.length, 3);
  assert.equal(linucb[0].isSelectedWinner, true);

  const parsedQr = parseUpiUri('upi://pay?pa=bluetokai@hdfcbank&pn=Blue%20Tokai&am=280&cu=INR');
  assert.equal(parsedQr.isValid, true);
  assert.equal(parsedQr.am, 280);
  assert.equal(typeof jainPayEngine.executeAtomicPayment, 'function');
});

test('Kage temple assets are removed and replaced with custom FintechSpatialBackdrop 3D canvas', () => {
  assert.equal(fs.existsSync('src/shaders/landing-pages'), false, 'src/shaders/landing-pages should be removed');
  assert.equal(fs.existsSync('public/landing-pages'), false, 'public/landing-pages should be removed');
  assert.equal(
    fs.existsSync('src/components/layout/FintechSpatialBackdrop.tsx'),
    true,
    'Custom FintechSpatialBackdrop.tsx must exist'
  );
  const backdropSource = fs.readFileSync('src/components/layout/FintechSpatialBackdrop.tsx', 'utf8');
  assert.ok(backdropSource.includes('fintech-3d-canvas'));
  assert.ok(backdropSource.includes('THREE.BufferGeometry'));
  assert.ok(backdropSource.includes('requestAnimationFrame'));
});

test('Enterprise Security Hardenings: 7-Table RLS DDL, BOLA/IDOR Refund Guard, and Parameterized SQL', async () => {
  const { POSTGRES_16_PRODUCTION_DDL, INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_LEDGER_ENTRIES } =
    await import('../data/initialState');

  // 1. Verify all 7 BCNF tables have ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY
  const tables = [
    'users',
    'accounts',
    'linked_bank_accounts',
    'transactions',
    'ledger_entries',
    'khata_entries',
    'milestone_deals',
  ];
  for (const tbl of tables) {
    assert.ok(
      POSTGRES_16_PRODUCTION_DDL.includes(`ALTER TABLE ${tbl}`) &&
        POSTGRES_16_PRODUCTION_DDL.includes('ENABLE ROW LEVEL SECURITY') &&
        POSTGRES_16_PRODUCTION_DDL.includes('FORCE ROW LEVEL SECURITY'),
      `Missing RLS enforcement for ${tbl}`
    );
  }
  assert.ok(POSTGRES_16_PRODUCTION_DDL.includes('CREATE POLICY rls_ledger_entries_tenant_isolation ON ledger_entries'));
  assert.ok(POSTGRES_16_PRODUCTION_DDL.includes('CREATE POLICY rls_khata_entries_tenant_isolation ON khata_entries'));
  assert.ok(POSTGRES_16_PRODUCTION_DDL.includes('CREATE POLICY rls_milestone_deals_tenant_isolation ON milestone_deals'));

  // 2. Verify BOLA/IDOR ownership check blocks unauthorized callerWalletId on executeAtomicRefund
  const bolaAttempt = executeAtomicRefund(
    {
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      ledgerEntries: INITIAL_LEDGER_ENTRIES,
    },
    'tx_908142',
    'acc_attacker_wallet'
  );
  assert.equal(bolaAttempt.success, false);
  assert.ok(bolaAttempt.message.includes('BOLA_IDOR_403'));
  assert.equal(bolaAttempt.sqlLog.status, 'DECLINED');

  // 3. Verify authorized refund succeeds and uses parameterized SQL ($1, $2)
  const validRefund = executeAtomicRefund(
    {
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      ledgerEntries: INITIAL_LEDGER_ENTRIES,
    },
    'tx_908142',
    'acc_yash_wallet'
  );
  assert.equal(validRefund.success, true);
  assert.ok(
    validRefund.sqlLog.sqlStatements.some((s) =>
      s.includes("SELECT set_config('app.current_user_id', $1::text, true);")
    )
  );
});

test('Decoupled LedgerApiService and ENV_CONFIG enforce API envelopes, PIN redaction, and validation', async () => {
  const { ENV_CONFIG } = await import('../config/envConfig');
  const { LedgerApiService } = await import('../services/api/ledgerApiService');
  const { INITIAL_USERS, INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_LEDGER_ENTRIES } =
    await import('../data/initialState');

  assert.equal(ENV_CONFIG.security.defaultRlsTenantId, 'usr_yash_01');
  assert.equal(ENV_CONFIG.security.pinMaxFailedAttempts, 3);
  assert.equal(ENV_CONFIG.fintech3D.primaryColor, '#FF5E00');

  // Verify rotateUserPinRpc redacts raw PIN in securityAudit and returns ApiResult envelope
  const pinRes = LedgerApiService.rotateUserPinRpc(
    INITIAL_USERS,
    '9876',
    'a1b2c3d4e5f60718',
    'deadbeefcafe1234'
  );
  assert.equal(pinRes.ok, true);
  if (pinRes.ok) {
    assert.ok(pinRes.data.sqlLog.securityAudit.includes('[REDACTED]'));
    assert.equal(pinRes.data.sqlLog.securityAudit.includes('9876'), false);
  }

  // Verify invalid PIN format returns structured ApiResult error envelope instead of crashing
  const invalidPinRes = LedgerApiService.rotateUserPinRpc(
    INITIAL_USERS,
    '12ab',
    'a1b2c3d4e5f60718',
    'deadbeefcafe1234'
  );
  assert.equal(invalidPinRes.ok, false);

  // Verify executeRefundRpc returns structured envelope
  const refundRes = LedgerApiService.executeRefundRpc(
    {
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      ledgerEntries: INITIAL_LEDGER_ENTRIES,
    },
    'tx_908142'
  );
  assert.equal(refundRes.ok, true);
});

test('12-Table Enterprise BCNF Expansion & 10 AI Voice Chat Options evaluate deterministically', async () => {
  const {
    POSTGRES_16_PRODUCTION_DDL,
    TEN_AI_VOICE_CHAT_OPTIONS,
    INITIAL_ACCOUNTS,
    INITIAL_LINKED_BANKS,
    INITIAL_TRANSACTIONS,
    INITIAL_LEDGER_ENTRIES,
    INITIAL_KHATA_ENTRIES,
    INITIAL_MILESTONE_DEALS,
    INITIAL_AUTOPAY_MANDATES,
    INITIAL_CREDIT_SANCTIONS,
    INITIAL_FX_TREASURY_VAULTS,
    INITIAL_DISPUTE_CHARGEBACKS,
    INITIAL_SECURITY_AUDIT_LOGS,
  } = await import('../data/initialState');
  const { evaluateDatabaseGroundedQuery } = await import('./aiVoiceEngine');

  // 1. Verify all 12 BCNF tables are defined in DDL with RLS enabled
  const all12Tables = [
    'users',
    'accounts',
    'linked_bank_accounts',
    'transactions',
    'ledger_entries',
    'khata_entries',
    'milestone_deals',
    'autopay_mandates',
    'credit_sanctions',
    'fx_treasury_vaults',
    'dispute_chargebacks',
    'security_audit_logs',
  ];
  for (const tbl of all12Tables) {
    assert.ok(
      POSTGRES_16_PRODUCTION_DDL.includes(`CREATE TABLE ${tbl}`),
      `Missing CREATE TABLE for ${tbl}`
    );
    assert.ok(
      POSTGRES_16_PRODUCTION_DDL.includes(`ALTER TABLE ${tbl}`) &&
        POSTGRES_16_PRODUCTION_DDL.includes('FORCE ROW LEVEL SECURITY'),
      `Missing FORCE ROW LEVEL SECURITY for ${tbl}`
    );
  }

  // 2. Verify exactly 10 AI Voice Chat options exist and each evaluates cleanly
  assert.equal(TEN_AI_VOICE_CHAT_OPTIONS.length, 10);

  const snapshot = {
    walletBalance: INITIAL_ACCOUNTS[0].available_balance,
    walletVpa: INITIAL_ACCOUNTS[0].vpa_address,
    accounts: INITIAL_ACCOUNTS,
    linkedBanks: INITIAL_LINKED_BANKS,
    transactions: INITIAL_TRANSACTIONS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    khataEntries: INITIAL_KHATA_ENTRIES,
    milestoneDeals: INITIAL_MILESTONE_DEALS,
    autopayMandates: INITIAL_AUTOPAY_MANDATES,
    creditSanctions: INITIAL_CREDIT_SANCTIONS,
    fxTreasuryVaults: INITIAL_FX_TREASURY_VAULTS,
    disputeChargebacks: INITIAL_DISPUTE_CHARGEBACKS,
    securityAuditLogs: INITIAL_SECURITY_AUDIT_LOGS,
  };

  for (const opt of TEN_AI_VOICE_CHAT_OPTIONS) {
    const result = evaluateDatabaseGroundedQuery(
      opt.promptText,
      snapshot,
      opt.id
    );
    assert.ok(result.answerText.length > 20, `Empty answerText for ${opt.id}`);
    assert.ok(
      result.spokenSummary.length > 15,
      `Empty spokenSummary for ${opt.id}`
    );
    assert.ok(
      result.sqlExecuted.toUpperCase().includes('SELECT') ||
        result.sqlExecuted.toUpperCase().includes('SHOW'),
      `Missing SQL trace for ${opt.id}`
    );
    assert.ok(result.keyMetrics.length === 4, `Expected 4 metrics for ${opt.id}`);
  }
});

test('aiVoiceEngine exports 10 distinct voice profiles and useVoiceAgent hook', async () => {
  const {
    VOICE_PROFILES,
    getVoiceProfileById,
    formatSpokenSummaryForProfile,
    useVoiceAgent,
  } = await import('./aiVoiceEngine');

  assert.equal(VOICE_PROFILES.length, 10, 'Must have 10 distinct voice profiles');
  const uniqueIds = new Set(VOICE_PROFILES.map((p) => p.id));
  assert.equal(uniqueIds.size, 10, 'All 10 voice profile IDs must be unique');

  const names = VOICE_PROFILES.map((p) => p.name);
  assert.ok(names.includes('Concise Corporate'));
  assert.ok(names.includes('Helpful Guide'));
  assert.ok(names.includes('Analytical Auditor'));

  for (const profile of VOICE_PROFILES) {
    const Lookup = getVoiceProfileById(profile.id);
    assert.equal(Lookup.id, profile.id);
    const formatted = formatSpokenSummaryForProfile(
      'Your wallet balance is twenty four thousand rupees.',
      profile.id
    );
    assert.ok(formatted.includes('Your wallet balance is twenty four thousand rupees.'));
    assert.ok(formatted.length > 30);
  }

  assert.equal(typeof useVoiceAgent, 'function', 'useVoiceAgent hook must be exported');
});

test('Multi-Turn Gemini Chatbot, Google Search Grounding, and Live Voice API helpers work deterministically', async () => {
  const {
    GEMINI_CHATBOT_ROLES,
    GEMINI_MODEL_TIERS,
    SEARCH_GROUNDING_PRESET_QUERIES,
    LIVE_VOICE_TRAINING_PROMPTS,
    evaluateMultiTurnChatReply,
    evaluateSearchGroundedQuery,
  } = await import('./aiVoiceEngine');
  const {
    INITIAL_ACCOUNTS,
    INITIAL_LINKED_BANKS,
    INITIAL_TRANSACTIONS,
    INITIAL_LEDGER_ENTRIES,
    INITIAL_KHATA_ENTRIES,
    INITIAL_MILESTONE_DEALS,
    INITIAL_AUTOPAY_MANDATES,
    INITIAL_CREDIT_SANCTIONS,
    INITIAL_FX_TREASURY_VAULTS,
    INITIAL_DISPUTE_CHARGEBACKS,
    INITIAL_SECURITY_AUDIT_LOGS,
  } = await import('../data/initialState');

  const snapshot = {
    walletBalance: INITIAL_ACCOUNTS[0].available_balance,
    walletVpa: INITIAL_ACCOUNTS[0].vpa_address,
    accounts: INITIAL_ACCOUNTS,
    linkedBanks: INITIAL_LINKED_BANKS,
    transactions: INITIAL_TRANSACTIONS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    khataEntries: INITIAL_KHATA_ENTRIES,
    milestoneDeals: INITIAL_MILESTONE_DEALS,
    autopayMandates: INITIAL_AUTOPAY_MANDATES,
    creditSanctions: INITIAL_CREDIT_SANCTIONS,
    fxTreasuryVaults: INITIAL_FX_TREASURY_VAULTS,
    disputeChargebacks: INITIAL_DISPUTE_CHARGEBACKS,
    securityAuditLogs: INITIAL_SECURITY_AUDIT_LOGS,
  };

  assert.equal(GEMINI_CHATBOT_ROLES.length, 4);
  assert.equal(GEMINI_MODEL_TIERS.length, 3);
  assert.equal(SEARCH_GROUNDING_PRESET_QUERIES.length, 4);
  assert.equal(LIVE_VOICE_TRAINING_PROMPTS.length, 5);

  const chatReply = evaluateMultiTurnChatReply(
    'What is my wallet balance?',
    'BCNF_DB_PROFESSOR',
    'FAST_FLASH_LITE_3_1',
    [],
    snapshot
  );
  assert.ok(chatReply.replyText.includes('gemini-3.1-flash-lite'));
  assert.ok(chatReply.spokenSummary.length > 10);

  for (const preset of SEARCH_GROUNDING_PRESET_QUERIES) {
    const grounded = evaluateSearchGroundedQuery(preset.query, snapshot);
    assert.ok(grounded.answerText.length > 30);
    assert.ok(grounded.groundingChunks.length >= 1);
    assert.ok(grounded.groundingChunks[0].uri.startsWith('https://'));
  }
});

test('Stream-based response handler and Web Speech API clause chunker work deterministically', async () => {
  const {
    createResponseTokenStream,
    splitIntoSpeechClauses,
    streamWebSpeechSynthesis,
    VOICE_PROFILES,
  } = await import('./aiVoiceEngine');

  const sampleText =
    'Executive Briefing: Your Jain Pay wallet balance is 24,880.30 rupees. All 12 BCNF tables satisfy the double-entry XOR invariant! Ready for your next query.';
  const clauses = splitIntoSpeechClauses(sampleText);
  assert.equal(clauses.length, 4);
  assert.ok(clauses[0].startsWith('Executive Briefing:'));
  assert.ok(clauses[2].includes('12 BCNF tables'));

  const tokenFrames = createResponseTokenStream(sampleText, 4);
  assert.ok(tokenFrames.length >= 4);
  assert.equal(tokenFrames[tokenFrames.length - 1].isFinal, true);
  assert.equal(tokenFrames[tokenFrames.length - 1].accumulatedText, sampleText);
  assert.equal(tokenFrames[tokenFrames.length - 1].progress, 1);

  let started = false;
  const seenClauses: string[] = [];
  const handle = streamWebSpeechSynthesis(sampleText, VOICE_PROFILES[0], {
    onStart: () => {
      started = true;
    },
    onClauseStart: (_idx, text) => {
      seenClauses.push(text);
    },
  });
  assert.equal(started, true);
  handle.cancel();
});

test('FACTORY_STYLE.md and src/index.css strictly document and enforce Geist font scale, #101010 canvas, #eeeeee bone cards, and zero-shadow/zero-blur rules', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const styleDocPath = path.resolve(process.cwd(), 'FACTORY_STYLE.md');
  assert.equal(
    fs.existsSync(styleDocPath),
    true,
    'FACTORY_STYLE.md must exist in the root directory'
  );

  const styleDoc = fs.readFileSync(styleDocPath, 'utf-8');
  assert.ok(styleDoc.includes('#101010'), 'FACTORY_STYLE.md must document #101010 Obsidian Canvas');
  assert.ok(styleDoc.includes('#eeeeee'), 'FACTORY_STYLE.md must document #eeeeee Bone Cards');
  assert.ok(styleDoc.includes('#1d1a18'), 'FACTORY_STYLE.md must document #1d1a18 Carbon Lift');
  assert.ok(styleDoc.includes('#ee6018'), 'FACTORY_STYLE.md must document #ee6018 Signal Orange status indicator');
  assert.ok(styleDoc.includes('Geist'), 'FACTORY_STYLE.md must document Geist font scale');
  assert.ok(styleDoc.includes('Geist Mono'), 'FACTORY_STYLE.md must document Geist Mono font scale');
  assert.ok(styleDoc.includes('72px') && styleDoc.includes('44px') && styleDoc.includes('36px'), 'FACTORY_STYLE.md must document the full Geist type scale');
  assert.ok(styleDoc.includes('box-shadow: none'), 'FACTORY_STYLE.md must document the zero-shadow rule');
  assert.ok(styleDoc.includes('backdrop-filter: none'), 'FACTORY_STYLE.md must document the zero-blur rule');

  const cssPath = path.resolve(process.cwd(), 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(cssContent.includes('--color-obsidian-canvas: #101010'));
  assert.ok(cssContent.includes('--color-carbon-lift: #1d1a18'));
  assert.ok(cssContent.includes('--color-bone: #eeeeee'));
  assert.ok(cssContent.includes('--color-signal-orange: #ee6018'));
  assert.ok(cssContent.includes('box-shadow: none !important'));
  assert.ok(cssContent.includes('backdrop-filter: none !important'));
  assert.ok(cssContent.includes('--radius-sm: 3px'));
  assert.ok(cssContent.includes('--radius-cards: 10px'));
  assert.ok(cssContent.includes('--radius-largepanels: 20px'));
});

test('AiChatLogs.tsx implements minimal terminal view of AI tool calls in Admin Vault using Factory monochromatic palette', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const aiChatLogsPath = path.resolve(
    process.cwd(),
    'src/components/AiChatLogs.tsx'
  );
  assert.equal(
    fs.existsSync(aiChatLogsPath),
    true,
    'src/components/AiChatLogs.tsx must exist'
  );

  const aiChatLogsContent = fs.readFileSync(aiChatLogsPath, 'utf-8');
  assert.ok(aiChatLogsContent.includes('#101010'), 'Uses Obsidian Canvas #101010');
  assert.ok(aiChatLogsContent.includes('#1d1a18'), 'Uses Carbon Lift #1d1a18');
  assert.ok(aiChatLogsContent.includes('#3d3a39'), 'Uses Ash Stroke #3d3a39');
  assert.ok(aiChatLogsContent.includes('#8a8380'), 'Uses Warm Granite #8a8380');
  assert.ok(aiChatLogsContent.includes('#b8b3b0'), 'Uses Pale Stone #b8b3b0');
  assert.ok(aiChatLogsContent.includes('#eeeeee'), 'Uses Bone #eeeeee');
  assert.ok(aiChatLogsContent.includes('requestPayload'), 'Displays requestPayload');
  assert.ok(aiChatLogsContent.includes('responsePayload'), 'Displays responsePayload');

  const adminVaultPath = path.resolve(
    process.cwd(),
    'src/components/AdminVaultSection.tsx'
  );
  const adminVaultContent = fs.readFileSync(adminVaultPath, 'utf-8');
  assert.ok(
    adminVaultContent.includes('<AiChatLogs'),
    'AdminVaultSection renders <AiChatLogs />'
  );
});

test('Home3DShowcase displays Yash Jain, cards use translucent backgrounds, and SparkleCursorOverlay is mounted', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const homePath = path.resolve(
    process.cwd(),
    'src/components/Home3DShowcase.tsx'
  );
  const homeContent = fs.readFileSync(homePath, 'utf-8');
  assert.ok(homeContent.includes('Yash Jain'), 'Home3DShowcase displays Yash Jain');
  assert.equal(
    homeContent.includes('Yashvardhan'),
    false,
    'Home3DShowcase must not display Yashvardhan'
  );

  const cssPath = path.resolve(process.cwd(), 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(
    cssContent.includes('rgba(238, 238, 238, 0.85)'),
    'Primary cards use translucent Bone background rgba(238, 238, 238, 0.85)'
  );
  assert.ok(
    cssContent.includes('backdrop-filter: blur(12px)'),
    'Primary cards enable backdrop-filter: blur(12px)'
  );

  const cursorPath = path.resolve(
    process.cwd(),
    'src/components/common/SparkleCursorOverlay.tsx'
  );
  assert.equal(
    fs.existsSync(cursorPath),
    true,
    'SparkleCursorOverlay.tsx must exist'
  );

  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  assert.ok(
    appContent.includes('<SparkleCursorOverlay />'),
    'App.tsx renders <SparkleCursorOverlay />'
  );
});

test('Light Mode and Dark Mode theme architecture and high-contrast card rules are configured', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const contextPath = path.resolve(process.cwd(), 'src/context/JainPayContext.tsx');
  const contextContent = fs.readFileSync(contextPath, 'utf-8');
  assert.ok(contextContent.includes("export type ThemeMode = 'dark' | 'light'"), 'Defines ThemeMode type');
  assert.ok(contextContent.includes('toggleThemeMode'), 'Exposes toggleThemeMode handler');
  assert.ok(contextContent.includes("setAttribute('data-theme', themeMode)"), 'Syncs data-theme attribute on document');

  const headerPath = path.resolve(process.cwd(), 'src/components/layout/TopNavigationHeader.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');
  assert.ok(headerContent.includes('data-testid="theme-mode-toggle"'), 'Header includes theme-mode-toggle button');

  const cssPath = path.resolve(process.cwd(), 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(cssContent.includes('[data-theme="light"] .card-3d-orange'), 'Defines Light Mode card-3d-orange surface');
  assert.ok(cssContent.includes('--surface-inverted-container: rgba(255, 255, 255, 0.92)'), 'Defines Light Mode inverted #ffffff (92% opacity) container variable');
  assert.ok(cssContent.includes('--text-inverted-primary: #101010'), 'Defines Light Mode strict #101010 primary text variable');
  assert.ok(cssContent.includes('--surface-dark-translucent-card: rgba(22, 20, 19, 0.84)'), 'Defines Dark Mode translucent card surface');
});

test('10 Web Speech API synthesis configurations, strict JanPay AI Chat fallback, and Ask a Question from AI partition are verified', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const {
    VOICE_PROFILES,
    getWebSpeechSynthesisSettings,
    evaluateStrictKnowledgeQuery,
    UNAVAILABLE_INFO_RESPONSE,
  } = await import('./aiVoiceEngine');
  const {
    INITIAL_ACCOUNTS,
    INITIAL_LINKED_BANKS,
    INITIAL_TRANSACTIONS,
    INITIAL_LEDGER_ENTRIES,
    INITIAL_KHATA_ENTRIES,
    INITIAL_MILESTONE_DEALS,
    INITIAL_AUTOPAY_MANDATES,
    INITIAL_CREDIT_SANCTIONS,
    INITIAL_FX_TREASURY_VAULTS,
    INITIAL_DISPUTE_CHARGEBACKS,
    INITIAL_SECURITY_AUDIT_LOGS,
  } = await import('../data/initialState');

  // 1. Verify each of the 10 voice profiles maps to a distinct synthesis setting tuple
  assert.equal(VOICE_PROFILES.length, 10);
  const synthesisSignatures = new Set<string>();
  for (const profile of VOICE_PROFILES) {
    const settings = getWebSpeechSynthesisSettings(profile.id);
    assert.ok(settings.rate >= 0.9 && settings.rate <= 1.25, `Valid speechRate for ${profile.id}`);
    assert.ok(settings.pitch >= 0.85 && settings.pitch <= 1.15, `Valid speechPitch for ${profile.id}`);
    assert.ok(settings.volume >= 0.85 && settings.volume <= 1.0, `Valid speechVolume for ${profile.id}`);
    assert.ok(
      settings.lang === 'en-IN' || settings.lang === 'en-US' || settings.lang === 'en-GB',
      `Valid speechLang for ${profile.id}`
    );
    assert.ok(settings.voiceSelectorHint.length > 0, `Non-empty voiceSelectorHint for ${profile.id}`);
    const sig = `${settings.rate}:${settings.pitch}:${settings.volume}:${settings.lang}:${settings.voiceSelectorHint}`;
    synthesisSignatures.add(sig);
  }
  assert.equal(synthesisSignatures.size, 10, 'Each of the 10 voice profiles must map to a distinct Web Speech synthesis setting');

  // 2. Verify strict knowledge query evaluation returns grounded answers for database info and exact unavailable message otherwise
  const snapshot = {
    walletBalance: INITIAL_ACCOUNTS[0].available_balance,
    walletVpa: INITIAL_ACCOUNTS[0].vpa_address,
    accounts: INITIAL_ACCOUNTS,
    linkedBanks: INITIAL_LINKED_BANKS,
    transactions: INITIAL_TRANSACTIONS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    khataEntries: INITIAL_KHATA_ENTRIES,
    milestoneDeals: INITIAL_MILESTONE_DEALS,
    autopayMandates: INITIAL_AUTOPAY_MANDATES,
    creditSanctions: INITIAL_CREDIT_SANCTIONS,
    fxTreasuryVaults: INITIAL_FX_TREASURY_VAULTS,
    disputeChargebacks: INITIAL_DISPUTE_CHARGEBACKS,
    securityAuditLogs: INITIAL_SECURITY_AUDIT_LOGS,
  };

  assert.equal(UNAVAILABLE_INFO_RESPONSE, 'Sorry, the information is not available.');

  const availableRes = evaluateStrictKnowledgeQuery(
    'What is Yash Jain wallet balance and primary bank account?',
    snapshot,
    'CONCISE_CORPORATE'
  );
  assert.equal(availableRes.isInformationAvailable, true);
  assert.ok(availableRes.answerText.includes('24,880.30'));

  const unavailableWeather = evaluateStrictKnowledgeQuery(
    'What is the current weather forecast in Tokyo tomorrow?',
    snapshot,
    'HELPFUL_GUIDE'
  );
  assert.equal(unavailableWeather.isInformationAvailable, false);
  assert.equal(unavailableWeather.answerText, 'Sorry, the information is not available.');
  assert.equal(unavailableWeather.spokenSummary, 'Sorry, the information is not available.');

  const unavailableRecipe = evaluateStrictKnowledgeQuery(
    'How do I bake a chocolate cake?',
    snapshot,
    'CONCISE_CORPORATE'
  );
  assert.equal(unavailableRecipe.isInformationAvailable, false);
  assert.equal(unavailableRecipe.answerText, 'Sorry, the information is not available.');

  // Verify normal greeting + GenPay/JanPay/ZenPay foundations question is answered naturally
  const foundationsRes = evaluateStrictKnowledgeQuery(
    'Hi, how are you? How is ZenPay? What are the foundations? What are the things we have used?',
    snapshot,
    'CONCISE_CORPORATE'
  );
  assert.equal(foundationsRes.isInformationAvailable, true);
  assert.ok(foundationsRes.answerText.includes('JanPay'));
  assert.ok(foundationsRes.answerText.includes('React 19'));

  // Verify asking for an unlisted person's balance (e.g., Amit) strictly returns "Sorry, the information is not available."
  const amitBalanceRes = evaluateStrictKnowledgeQuery(
    'What is the balance of that Amit here?',
    snapshot,
    'CONCISE_CORPORATE'
  );
  assert.equal(amitBalanceRes.isInformationAvailable, false);
  assert.equal(amitBalanceRes.answerText, 'Sorry, the information is not available.');

  // 3. Verify front-page partitions, true 50% circular voice assistant button, getUserMedia microphone access, and server Gemini API integration
  const homePath = path.resolve(process.cwd(), 'src/components/Home3DShowcase.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf-8');
  assert.ok(homeContent.includes('data-testid="janpay-ai-chat-partition"'), 'Renders JanPay AI Chat partition');
  assert.ok(homeContent.includes('data-testid="janpay-voice-circle-btn"'), 'Renders circular JanPay AI Voice Assistant button');
  assert.ok(homeContent.includes('janpay-voice-orb'), 'Uses true circular janpay-voice-orb class');
  assert.ok(homeContent.includes('navigator.mediaDevices.getUserMedia'), 'Requests microphone access via getUserMedia');
  assert.ok(homeContent.includes('Yes, what is your question, sir? Speak now.'), 'Prompts "Yes, what is your question, sir? Speak now." on circle click');
  assert.equal(homeContent.includes('GEMINI API + 12-TABLE GROUNDED'), false, 'Hides technical GEMINI API + 12-TABLE GROUNDED badge');
  assert.equal(homeContent.includes('Concise Corporate'), false, 'Does not display Concise Corporate label in Home3DShowcase UI');
  assert.ok(homeContent.includes('data-testid="frontpage-ask-ai-box"'), 'Renders Ask a Question from AI box beyond JanPay AI Chat');

  const cssPath = path.resolve(process.cwd(), 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(cssContent.includes('button.janpay-voice-orb'), 'Defines button.janpay-voice-orb in src/index.css');
  assert.ok(cssContent.includes('width: 148px !important'), 'Enforces 148px circular width on janpay-voice-orb');

  const serverPath = path.resolve(process.cwd(), 'server.ts');
  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  assert.ok(serverContent.includes('/api/ai/frontpage-chat'), 'Exposes /api/ai/frontpage-chat route');
  assert.ok(serverContent.includes('/api/ai/voice-transcribe'), 'Exposes /api/ai/voice-transcribe multimodal microphone endpoint');
  assert.ok(serverContent.includes('process.env.GEMINI_API_KEY'), 'Integrates GEMINI_API_KEY in server.ts');
});

test('Session verification guards private user data (balances, transaction history) while allowing public queries', async () => {
  const {
    isPrivateUserDataRequest,
    verifyUserSessionForPrivateData,
    evaluateDatabaseGroundedQuery,
    evaluateStrictKnowledgeQuery,
  } = await import('./aiVoiceEngine');
  const {
    INITIAL_ACCOUNTS,
    INITIAL_LINKED_BANKS,
    INITIAL_TRANSACTIONS,
    INITIAL_LEDGER_ENTRIES,
    INITIAL_KHATA_ENTRIES,
    INITIAL_MILESTONE_DEALS,
    INITIAL_AUTOPAY_MANDATES,
    INITIAL_CREDIT_SANCTIONS,
    INITIAL_FX_TREASURY_VAULTS,
    INITIAL_DISPUTE_CHARGEBACKS,
    INITIAL_SECURITY_AUDIT_LOGS,
  } = await import('../data/initialState');

  const snapshot = {
    walletBalance: INITIAL_ACCOUNTS[0].available_balance,
    walletVpa: INITIAL_ACCOUNTS[0].vpa_address,
    accounts: INITIAL_ACCOUNTS,
    linkedBanks: INITIAL_LINKED_BANKS,
    transactions: INITIAL_TRANSACTIONS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    khataEntries: INITIAL_KHATA_ENTRIES,
    milestoneDeals: INITIAL_MILESTONE_DEALS,
    autopayMandates: INITIAL_AUTOPAY_MANDATES,
    creditSanctions: INITIAL_CREDIT_SANCTIONS,
    fxTreasuryVaults: INITIAL_FX_TREASURY_VAULTS,
    disputeChargebacks: INITIAL_DISPUTE_CHARGEBACKS,
    securityAuditLogs: INITIAL_SECURITY_AUDIT_LOGS,
  };

  assert.equal(isPrivateUserDataRequest('What is my wallet balance and transaction history?'), true);
  assert.equal(isPrivateUserDataRequest('What is JanPay about and what are the foundations?'), false);

  // 1. Active session allows private balance & transaction queries
  const activeCheck = verifyUserSessionForPrivateData(
    'What is my wallet balance?',
    snapshot,
    'OPT_01_WALLET_LIQUIDITY',
    { isAuthenticated: true, sessionStatus: 'ACTIVE', userId: 'usr_yash_01' }
  );
  assert.equal(activeCheck.isVerified, true);
  assert.equal(activeCheck.sessionStatus, 'ACTIVE');

  // 2. Unauthenticated or expired session blocks private balance & transaction history queries
  const expiredEval = evaluateDatabaseGroundedQuery(
    'Show my wallet balance and recent transaction history',
    snapshot,
    'OPT_01_WALLET_LIQUIDITY',
    'CONCISE_CORPORATE',
    { isAuthenticated: false, sessionStatus: 'EXPIRED' }
  );
  assert.ok(expiredEval.answerText.includes('Authentication required (EXPIRED)'));
  assert.equal(expiredEval.tablesQueried.length, 0);
  assert.equal(expiredEval.answerText.includes('24,880.30'), false, 'Does not leak private wallet balance when session is EXPIRED');

  const unauthStrict = evaluateStrictKnowledgeQuery(
    'What is my wallet balance and transaction history?',
    snapshot,
    'CONCISE_CORPORATE',
    { isAuthenticated: false, sessionStatus: 'UNAUTHENTICATED' }
  );
  assert.equal(unauthStrict.isInformationAvailable, false);
  assert.ok(unauthStrict.answerText.includes('Authentication required (UNAUTHENTICATED)'));

  // 3. Public non-private foundation queries still succeed even if session is unauthenticated
  const publicFoundationStrict = evaluateStrictKnowledgeQuery(
    'What is JanPay and what are the foundations we have used?',
    snapshot,
    'CONCISE_CORPORATE',
    { isAuthenticated: false, sessionStatus: 'UNAUTHENTICATED' }
  );
  assert.equal(publicFoundationStrict.isInformationAvailable, true);
  assert.ok(publicFoundationStrict.answerText.includes('Boyce-Codd Normal Form'));
});

test('Real-time Gemini Flash stream handler integrates GEMINI_API_KEY, streams valid audio/wav RIFF containers, and grounds Balance and Transaction queries', async () => {
  const {
    resolveGeminiFlashEnvConfig,
    encodePcm16ToWavContainer,
    synthesizeClauseToWavChunk,
    isValidWavAudioBuffer,
    playWavAudioChunkInBrowser,
    groundBalanceAndTransactionQuery,
    streamRealtimeGeminiVoiceResponse,
  } = await import('./aiVoiceEngine');
  const {
    INITIAL_ACCOUNTS,
    INITIAL_LINKED_BANKS,
    INITIAL_TRANSACTIONS,
    INITIAL_LEDGER_ENTRIES,
    INITIAL_KHATA_ENTRIES,
    INITIAL_MILESTONE_DEALS,
    INITIAL_AUTOPAY_MANDATES,
    INITIAL_CREDIT_SANCTIONS,
    INITIAL_FX_TREASURY_VAULTS,
    INITIAL_DISPUTE_CHARGEBACKS,
    INITIAL_SECURITY_AUDIT_LOGS,
  } = await import('../data/initialState');

  const snapshot = {
    walletBalance: INITIAL_ACCOUNTS[0].available_balance,
    walletVpa: INITIAL_ACCOUNTS[0].vpa_address,
    accounts: INITIAL_ACCOUNTS,
    linkedBanks: INITIAL_LINKED_BANKS,
    transactions: INITIAL_TRANSACTIONS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    khataEntries: INITIAL_KHATA_ENTRIES,
    milestoneDeals: INITIAL_MILESTONE_DEALS,
    autopayMandates: INITIAL_AUTOPAY_MANDATES,
    creditSanctions: INITIAL_CREDIT_SANCTIONS,
    fxTreasuryVaults: INITIAL_FX_TREASURY_VAULTS,
    disputeChargebacks: INITIAL_DISPUTE_CHARGEBACKS,
    securityAuditLogs: INITIAL_SECURITY_AUDIT_LOGS,
  };

  // 1. Verify environment variable & explicit API key resolution
  const prevKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'AIzaSyTestEnvGeminiFlashKey998877';
  const envConfig = resolveGeminiFlashEnvConfig();
  assert.equal(envConfig.apiKeyConfigured, true);
  assert.equal(envConfig.envSource, 'GEMINI_API_KEY');
  assert.equal(envConfig.requestedModelAlias, 'gemini-2.0-flash');
  assert.equal(envConfig.audioOutputMimeType, 'audio/wav');
  assert.equal(envConfig.sampleRateHz, 24000);
  if (prevKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = prevKey;
  }

  const explicitConfig = resolveGeminiFlashEnvConfig('AIzaSyExplicitProvidedKey112233');
  assert.equal(explicitConfig.apiKeyConfigured, true);
  assert.equal(explicitConfig.maskedKeyPreview, 'AIza••••2233');

  // 2. Verify canonical 44-byte RIFF WAVE (audio/wav) container encoding, validation & playback
  const dummyPcm = new Int16Array([0, 1200, -1200, 2400, -2400, 0]);
  const wavContainer = encodePcm16ToWavContainer(dummyPcm, 24000, 'Balance check');
  assert.equal(wavContainer.mimeType, 'audio/wav');
  assert.equal(wavContainer.byteLength, 44 + dummyPcm.length * 2);
  assert.equal(isValidWavAudioBuffer(wavContainer.wavBytes), true);
  assert.equal(playWavAudioChunkInBrowser(wavContainer), true);
  assert.ok(wavContainer.dataUri.startsWith('data:audio/wav;base64,'));

  const clauseWav = synthesizeClauseToWavChunk(
    'Your live wallet balance is twenty four thousand eight hundred eighty rupees.',
    'CONCISE_CORPORATE',
    0,
    24000
  );
  assert.equal(clauseWav.mimeType, 'audio/wav');
  assert.equal(isValidWavAudioBuffer(clauseWav.wavBytes), true);

  // 3. Verify internal data grounding for 'Balance' and 'Transaction' queries
  const balanceGrounded = groundBalanceAndTransactionQuery(
    'What is my current wallet balance?',
    snapshot,
    'CONCISE_CORPORATE'
  );
  assert.equal(balanceGrounded.queryDomain, 'BALANCE');
  assert.equal(balanceGrounded.isSessionVerified, true);
  assert.ok(balanceGrounded.answerText.includes('24,880.30'));
  assert.ok(balanceGrounded.tablesQueried.includes('accounts'));
  assert.equal(balanceGrounded.balanceContext?.walletBalanceInr, 24880.3);

  const txGrounded = groundBalanceAndTransactionQuery(
    'Show my recent transactions and passbook history',
    snapshot,
    'CONCISE_CORPORATE'
  );
  assert.equal(txGrounded.queryDomain, 'TRANSACTION');
  assert.equal(txGrounded.isSessionVerified, true);
  assert.ok(txGrounded.tablesQueried.includes('transactions'));
  assert.ok((txGrounded.transactionContext?.totalTransactions ?? 0) > 0);

  // 4. Verify real-time stream handler emits valid audio/wav chunks and token frames
  const seenFrames: number[] = [];
  const seenWavChunks: string[] = [];
  const streamResult = await streamRealtimeGeminiVoiceResponse({
    query: 'Check my wallet balance and recent transactions',
    snapshot,
    apiKey: 'AIzaSyProvidedGeminiKey556677',
    voiceProfileId: 'CONCISE_CORPORATE',
    onTokenFrame: (frame) => {
      seenFrames.push(frame.frameIndex);
      assert.equal(frame.audioChunk.mimeType, 'audio/wav');
      assert.equal(isValidWavAudioBuffer(frame.audioChunk.wavBytes), true);
    },
    onAudioWavChunk: (chunk) => {
      seenWavChunks.push(chunk.mimeType);
    },
  });

  assert.equal(streamResult.queryDomain, 'BALANCE_AND_TRANSACTION');
  assert.ok(streamResult.finalText.includes('24,880.30'));
  assert.ok(streamResult.frames.length >= 1);
  assert.equal(streamResult.frames.length, seenFrames.length);
  assert.equal(streamResult.audioChunks.length, seenWavChunks.length);
  assert.equal(streamResult.combinedWav.mimeType, 'audio/wav');
  assert.equal(isValidWavAudioBuffer(streamResult.combinedWav.wavBytes), true);
});

test('Maximum payment, minimum payment, last payment, first payment, and scheduled payment implementation dates answer accurately without unsolicited PostgreSQL definitions', async () => {
  const {
    evaluateDatabaseGroundedQuery,
    evaluateStrictKnowledgeQuery,
  } = await import('./aiVoiceEngine');
  const {
    INITIAL_ACCOUNTS,
    INITIAL_LINKED_BANKS,
    INITIAL_TRANSACTIONS,
    INITIAL_LEDGER_ENTRIES,
    INITIAL_KHATA_ENTRIES,
    INITIAL_MILESTONE_DEALS,
    INITIAL_AUTOPAY_MANDATES,
    INITIAL_CREDIT_SANCTIONS,
    INITIAL_FX_TREASURY_VAULTS,
    INITIAL_DISPUTE_CHARGEBACKS,
    INITIAL_SECURITY_AUDIT_LOGS,
  } = await import('../data/initialState');

  const snapshot = {
    walletBalance: INITIAL_ACCOUNTS[0].available_balance,
    walletVpa: INITIAL_ACCOUNTS[0].vpa_address,
    accounts: INITIAL_ACCOUNTS,
    linkedBanks: INITIAL_LINKED_BANKS,
    transactions: INITIAL_TRANSACTIONS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    khataEntries: INITIAL_KHATA_ENTRIES,
    milestoneDeals: INITIAL_MILESTONE_DEALS,
    autopayMandates: INITIAL_AUTOPAY_MANDATES,
    creditSanctions: INITIAL_CREDIT_SANCTIONS,
    fxTreasuryVaults: INITIAL_FX_TREASURY_VAULTS,
    disputeChargebacks: INITIAL_DISPUTE_CHARGEBACKS,
    securityAuditLogs: INITIAL_SECURITY_AUDIT_LOGS,
  };

  // 1. Maximum Payment
  const maxRes = evaluateStrictKnowledgeQuery(
    'What is the maximum payment?',
    snapshot
  );
  assert.equal(maxRes.isInformationAvailable, true);
  assert.ok(maxRes.answerText.includes('1,640.00'), 'Maximum outgoing payment must cite ₹1,640.00 (BESCOM)');
  assert.ok(maxRes.answerText.includes('5,000.00'), 'Maximum overall transaction must cite ₹5,000.00 (ACM Stipend)');
  assert.equal(
    maxRes.answerText.includes('PostgreSQL 16.4 with 12 strictly normalized BCNF tables'),
    false,
    'Must not dump unsolicited PostgreSQL definition on maximum payment query'
  );

  // 2. Minimum Payment
  const minRes = evaluateStrictKnowledgeQuery(
    'What is the minimum payment?',
    snapshot
  );
  assert.equal(minRes.isInformationAvailable, true);
  assert.ok(minRes.answerText.includes('500.00'), 'Minimum settled outgoing payment must cite ₹500.00 (VIT HackVerse)');
  assert.ok(minRes.answerText.includes('45.00'), 'Minimum overall transaction must cite ₹45.00 (LinUCB Cashback)');
  assert.equal(
    minRes.answerText.includes('PostgreSQL 16.4 with 12 strictly normalized BCNF tables'),
    false,
    'Must not dump unsolicited PostgreSQL definition on minimum payment query'
  );

  // 3. Last Payment
  const lastRes = evaluateStrictKnowledgeQuery(
    'What was my last payment and when was it made?',
    snapshot
  );
  assert.equal(lastRes.isInformationAvailable, true);
  assert.ok(lastRes.answerText.includes('1,640.00'));
  assert.ok(lastRes.answerText.includes('2026-10-22'));
  assert.ok(lastRes.answerText.includes('Blue Tokai'));

  // 4. Scheduled Payment Implementation Date
  const dateRes = evaluateStrictKnowledgeQuery(
    'What is the date on which the next payment should be implemented?',
    snapshot
  );
  assert.equal(dateRes.isInformationAvailable, true);
  assert.ok(dateRes.answerText.includes('2026-10-26'));
  assert.ok(dateRes.answerText.includes('2026-10-29'));
  assert.ok(dateRes.answerText.includes('2026-11-05'));

  // 5. Also verify evaluateDatabaseGroundedQuery directly
  const dbMax = evaluateDatabaseGroundedQuery(
    'What is my maximum payment and minimum payment?',
    snapshot
  );
  assert.ok(dbMax.answerText.includes('1,640.00'));
  assert.ok(dbMax.answerText.includes('500.00'));
  assert.equal(
    dbMax.answerText.includes('PostgreSQL 16.4 with 12 strictly normalized BCNF tables'),
    false
  );
});

test('AiVoiceCopilotStage Status / Voice Agent indicator pill and requestAnimationFrame audio wave intensity helpers work deterministically', async () => {
  const {
    resolveVoiceAgentOrbStatus,
    computeRealtimeWaveBarHeights,
  } = await import('./aiVoiceEngine');

  // 1. Idle state -> 'Ready • Select Persona or Speak'
  const readyStatus = resolveVoiceAgentOrbStatus({
    isListeningMic: false,
    isLoadingReply: false,
    isSpeaking: false,
    isStreamingText: false,
    activePersonaName: 'Aarav Mehta',
  });
  assert.equal(readyStatus.state, 'READY');
  assert.equal(readyStatus.pillLabel, 'Ready • Select Persona or Speak');
  assert.equal(readyStatus.isActive, false);

  // 2. Recording microphone input -> 'Listening...'
  const listeningStatus = resolveVoiceAgentOrbStatus({
    isListeningMic: true,
    isLoadingReply: false,
    isSpeaking: false,
    isStreamingText: false,
    activePersonaName: 'Aarav Mehta',
  });
  assert.equal(listeningStatus.state, 'LISTENING');
  assert.equal(listeningStatus.pillLabel, 'Listening...');
  assert.equal(listeningStatus.isActive, true);

  // 3. Evaluating query -> 'Processing 12-Table BCNF Query...'
  const processingStatus = resolveVoiceAgentOrbStatus({
    isListeningMic: false,
    isLoadingReply: true,
    isSpeaking: false,
    isStreamingText: false,
    activePersonaName: 'Vikram Rathore',
  });
  assert.equal(processingStatus.state, 'PROCESSING');
  assert.equal(processingStatus.pillLabel, 'Processing 12-Table BCNF Query...');
  assert.equal(processingStatus.isActive, true);

  // 4. Streaming text & TTS audio -> 'Speaking • [Active Persona Name]...'
  const speakingStatus = resolveVoiceAgentOrbStatus({
    isListeningMic: false,
    isLoadingReply: false,
    isSpeaking: true,
    isStreamingText: true,
    activePersonaName: 'Dr. Ananya Iyer',
  });
  assert.equal(speakingStatus.state, 'SPEAKING');
  assert.equal(speakingStatus.pillLabel, 'Speaking • Dr. Ananya Iyer...');
  assert.equal(speakingStatus.isActive, true);

  // 5. Verify computeRealtimeWaveBarHeights across READY, LISTENING (with AnalyserNode bins), and SPEAKING
  const idleWave = computeRealtimeWaveBarHeights({
    state: 'READY',
    elapsedMs: 0,
  });
  assert.equal(idleWave.orbBarHeightsPx.length, 5);
  assert.equal(idleWave.equalizerBarHeightsPx.length, 16);
  assert.equal(idleWave.intensityPct, 0);

  const mockBins = new Uint8Array(32).fill(160);
  const micWave = computeRealtimeWaveBarHeights({
    state: 'LISTENING',
    frequencyBins: mockBins,
    elapsedMs: 420,
  });
  assert.equal(micWave.orbBarHeightsPx.length, 5);
  assert.equal(micWave.equalizerBarHeightsPx.length, 16);
  assert.ok(micWave.intensityPct >= 50);

  const ttsWave = computeRealtimeWaveBarHeights({
    state: 'SPEAKING',
    elapsedMs: 850,
    speechRate: 1.05,
    speechPitch: 1.1,
  });
  assert.ok(ttsWave.intensityPct >= 24);

  // 6. Verify AiVoiceCopilotStage.tsx wires requestAnimationFrame, createAnalyser, and Status / Voice Agent pill
  const copilotSrc = fs.readFileSync(
    'src/components/AiVoiceCopilotStage.tsx',
    'utf8'
  );
  assert.ok(copilotSrc.includes('requestAnimationFrame'));
  assert.ok(copilotSrc.includes('createAnalyser'));
  assert.ok(copilotSrc.includes('copilot-voice-status-pill'));
  assert.ok(copilotSrc.includes('copilot-voice-orb'));
  assert.ok(copilotSrc.includes('Status / Voice Agent'));
});

test('Gemini API key validator and 401 UNAUTHENTICATED / ACCESS_TOKEN_TYPE_UNSUPPORTED circuit breaker prevent invalid key calls and noisy proxy warnings', async () => {
  const fs = await import('node:fs');
  const {
    isUsableGeminiApiKey,
    isGeminiAuthOrTokenError,
    recordGeminiUpstreamFailure,
    resetGeminiUpstreamCircuitBreaker,
    resolveGeminiFlashEnvConfig,
  } = await import('./aiVoiceEngine');

  resetGeminiUpstreamCircuitBreaker();

  // 1. Placeholders, empty strings, and OAuth2 access tokens (ya29.) are rejected
  assert.equal(isUsableGeminiApiKey(''), false);
  assert.equal(isUsableGeminiApiKey('MY_GEMINI_API_KEY'), false);
  assert.equal(isUsableGeminiApiKey('YOUR_GEMINI_API_KEY'), false);
  assert.equal(
    isUsableGeminiApiKey('ya29.a0AfH6SMBxUnsupportedAccessToken1234567890'),
    false
  );
  assert.equal(
    isUsableGeminiApiKey('Bearer ya29.a0AfH6SMBxUnsupportedAccessToken'),
    false
  );

  // 2. Valid AIza... keys pass validation until tripped by a 401 UNAUTHENTICATED error
  const testCandidateKey = 'AIzaSyCircuitBreakerTestKey9988776655';
  assert.equal(isUsableGeminiApiKey(testCandidateKey), true);

  const simulated401Payload =
    '{"error":{"code":401,"message":"API key not valid. Please pass a valid API key.","status":"UNAUTHENTICATED","details":[{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"ACCESS_TOKEN_TYPE_UNSUPPORTED","metadata":{"method":"google.ai.generativelanguage.v1beta.GenerativeService.GenerateContent","service":"generativelanguage.googleapis.com"}}]}}';

  assert.equal(isGeminiAuthOrTokenError(new Error(simulated401Payload)), true);
  assert.equal(
    recordGeminiUpstreamFailure(testCandidateKey, new Error(simulated401Payload)),
    true
  );
  assert.equal(
    isUsableGeminiApiKey(testCandidateKey),
    false,
    'Circuit breaker must mark key unusable after 401 UNAUTHENTICATED / ACCESS_TOKEN_TYPE_UNSUPPORTED'
  );

  const fallbackConfig = resolveGeminiFlashEnvConfig(testCandidateKey);
  assert.equal(fallbackConfig.envSource, 'SERVER_PROXY_MANAGED');

  resetGeminiUpstreamCircuitBreaker();
  assert.equal(isUsableGeminiApiKey(testCandidateKey), true);

  // 3. Verify server.ts uses isUsableGeminiApiKey and recordGeminiUpstreamFailure without noisy [JAIN-PAY AI PROXY] console.warn
  const serverSrc = fs.readFileSync('server.ts', 'utf8');
  assert.ok(serverSrc.includes('isUsableGeminiApiKey'));
  assert.ok(serverSrc.includes('recordGeminiUpstreamFailure'));
  assert.equal(
    serverSrc.includes('[JAIN-PAY AI PROXY] Gemini API call fell back'),
    false
  );
});

test('Voice orb Factory visual tokens and CSS animations provide distinct visual feedback states for READY, LISTENING, PROCESSING, and SPEAKING', async () => {
  const fs = await import('node:fs');
  const { resolveVoiceOrbVisualTokens } = await import('./aiVoiceEngine');

  const readyTokens = resolveVoiceOrbVisualTokens('READY', 'Architect Professor');
  const listeningTokens = resolveVoiceOrbVisualTokens('LISTENING', 'Architect Professor');
  const processingTokens = resolveVoiceOrbVisualTokens('PROCESSING', 'Architect Professor');
  const speakingTokens = resolveVoiceOrbVisualTokens('SPEAKING', 'Architect Professor');

  // Verify each state resolves to a distinct orb class, ring class, bar class, and Factory accent
  assert.equal(readyTokens.orbStateClass, 'janpay-voice-orb-ready');
  assert.ok(listeningTokens.orbStateClass.includes('janpay-voice-orb-listening'));
  assert.ok(processingTokens.orbStateClass.includes('janpay-voice-orb-processing'));
  assert.ok(speakingTokens.orbStateClass.includes('janpay-voice-orb-speaking'));

  assert.equal(listeningTokens.primaryAccentHex, '#ee6018');
  assert.equal(processingTokens.primaryAccentHex, '#fafafa');
  assert.equal(speakingTokens.primaryAccentHex, '#a0ca92');

  assert.equal(listeningTokens.telemetryTag, 'REC • MIC CAPTURE');
  assert.equal(processingTokens.telemetryTag, 'BCNF • SQL EVAL');
  assert.equal(speakingTokens.telemetryTag, '24KHZ • WAV STREAM');

  const cssSrc = fs.readFileSync('src/index.css', 'utf8');
  assert.ok(cssSrc.includes('janpay-voice-orb-listening'));
  assert.ok(cssSrc.includes('janpay-voice-orb-processing'));
  assert.ok(cssSrc.includes('janpay-voice-orb-speaking'));
  assert.ok(cssSrc.includes('janpayProcessingSpinClockwise'));
  assert.ok(cssSrc.includes('janpaySpeakingWaveOuter'));

  const stageSrc = fs.readFileSync('src/components/AiVoiceCopilotStage.tsx', 'utf8');
  assert.ok(stageSrc.includes('resolveVoiceOrbVisualTokens'));
  assert.ok(stageSrc.includes('copilot-orb-state-selector'));
  assert.ok(stageSrc.includes('copilot-voice-state-pipeline'));
});

test('21 Verified AI Voice Queries catalog and PDF document generation function deterministically for professor demonstration', async () => {
  const fs = await import('node:fs');
  const { VERIFIED_20_VOICE_QUERIES, generateVoiceQuestionsPdfDocument } = await import(
    './voiceQuestionsPdfGenerator'
  );

  assert.ok(VERIFIED_20_VOICE_QUERIES.length >= 20, 'At least 20 verified questions exist');
  assert.equal(VERIFIED_20_VOICE_QUERIES.length, 21);

  // Verify key questions exist in catalog
  const questionsMap = new Map(VERIFIED_20_VOICE_QUERIES.map((q) => [q.id, q]));

  // Q01 Max Payment
  assert.ok(questionsMap.has('q01_max_payment'));
  assert.ok(questionsMap.get('q01_max_payment')!.question.toLowerCase().includes('maximum payment'));
  assert.ok(questionsMap.get('q01_max_payment')!.expectedSpokenReply.includes('1,640'));

  // Q02 Min Payment
  assert.ok(questionsMap.has('q02_min_payment'));
  assert.ok(questionsMap.get('q02_min_payment')!.question.toLowerCase().includes('minimum payment'));
  assert.ok(questionsMap.get('q02_min_payment')!.expectedSpokenReply.includes('500'));

  // Q03 Last Payment
  assert.ok(questionsMap.has('q03_last_payment'));
  assert.ok(questionsMap.get('q03_last_payment')!.question.toLowerCase().includes('last payment'));

  // Q05 Implementation Date
  assert.ok(questionsMap.has('q05_scheduled_date'));
  assert.ok(questionsMap.get('q05_scheduled_date')!.expectedSpokenReply.includes('October 26, 2026'));

  // Q07 XOR Invariant
  assert.ok(questionsMap.has('q07_ledger_xor_audit'));
  assert.ok(questionsMap.get('q07_ledger_xor_audit')!.expectedSpokenReply.includes('zero paisa drift'));

  // Test PDF generation
  const pdfDoc = generateVoiceQuestionsPdfDocument({
    walletBalance: 24880.3,
    walletVpa: 'yash@jainpay',
  });
  assert.ok(pdfDoc, 'PDF document generated');
  const pdfOutput = pdfDoc.output('arraybuffer');
  assert.ok(pdfOutput.byteLength > 10000, 'PDF size is substantial and formatted');

  // Verify static PDF file exists in public/
  assert.ok(fs.existsSync('public/jain_pay_20_voice_queries_guide.pdf'), 'public static PDF exists');
  const staticPdfStats = fs.statSync('public/jain_pay_20_voice_queries_guide.pdf');
  assert.ok(staticPdfStats.size > 20000, 'Static PDF file size > 20KB');
});

