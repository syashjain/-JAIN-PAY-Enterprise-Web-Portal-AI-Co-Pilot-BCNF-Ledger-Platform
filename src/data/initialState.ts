import {
  AccountRecord,
  AiToolCallLog,
  AiVoiceChatOption,
  AutopayMandateRecord,
  ChatMessage,
  CreditSanctionRecord,
  DisputeChargebackRecord,
  FxTreasuryVaultRecord,
  KhataEntryRecord,
  LedgerEntryRecord,
  LinkedBankAccountRecord,
  MilestoneDealRecord,
  ScratchCardItem,
  SecurityAuditLogRecord,
  SqlRlsLogEntry,
  TransactionRecord,
  UserRecord,
} from '../types/domain';

export const INITIAL_USERS: UserRecord[] = [
  {
    user_id: 'usr_yash_01',
    full_name: 'Yash Jain',
    vpa_handle: 'yash@jainpay',
    phone_number: '+91-9820411890',
    pbkdf2_pin_hash:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    pbkdf2_salt_hex: '9f8e7d6c5b4a39281726354455667788',
    kyc_tier: 'FULL_KYC_BIOMETRIC',
    rls_tenant_scope: 'tenant_usr_yash_01',
    created_at: '2026-08-12T09:15:00Z',
  },
  {
    user_id: 'usr_rahul_02',
    full_name: 'Rahul Verma',
    vpa_handle: 'rahul@okaxis',
    phone_number: '+91-9811204912',
    pbkdf2_pin_hash:
      '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    pbkdf2_salt_hex: '11223344556677889900aabbccddeeff',
    kyc_tier: 'FULL_KYC_BIOMETRIC',
    rls_tenant_scope: 'tenant_usr_rahul_02',
    created_at: '2026-08-14T11:30:00Z',
  },
  {
    user_id: 'usr_pooja_03',
    full_name: 'Pooja Sharma',
    vpa_handle: 'pooja@icici',
    phone_number: '+91-9765110921',
    pbkdf2_pin_hash:
      '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    pbkdf2_salt_hex: 'aabbccddeeff00112233445566778899',
    kyc_tier: 'FULL_KYC_BIOMETRIC',
    rls_tenant_scope: 'tenant_usr_pooja_03',
    created_at: '2026-08-19T16:45:00Z',
  },
  {
    user_id: 'usr_vikram_04',
    full_name: 'Vikram Singh',
    vpa_handle: 'vikram@hdfcbank',
    phone_number: '+91-9900182736',
    pbkdf2_pin_hash:
      '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    pbkdf2_salt_hex: 'ffeeddccbbaa99887766554433221100',
    kyc_tier: 'FULL_KYC_BIOMETRIC',
    rls_tenant_scope: 'tenant_usr_vikram_04',
    created_at: '2026-09-01T10:12:00Z',
  },
  {
    user_id: 'usr_ananya_05',
    full_name: 'Ananya Nair',
    vpa_handle: 'ananya@kotak',
    phone_number: '+91-9845091823',
    pbkdf2_pin_hash:
      '2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
    pbkdf2_salt_hex: '00112233445566778899aabbccddeeff',
    kyc_tier: 'FULL_KYC_BIOMETRIC',
    rls_tenant_scope: 'tenant_usr_ananya_05',
    created_at: '2026-09-10T08:40:00Z',
  },
];

export const INITIAL_ACCOUNTS: AccountRecord[] = [
  {
    account_id: 'acc_yash_wallet',
    user_id: 'usr_yash_01',
    account_type: 'USER_WALLET',
    vpa_address: 'yash@jainpay',
    available_balance: 24880.3,
    currency: 'INR',
    version_seq: 18,
    updated_at: '2026-10-24T13:40:00Z',
  },
  {
    account_id: 'acc_npci_settlement',
    user_id: 'usr_system_00',
    account_type: 'COUNTERPARTY_SETTLEMENT',
    vpa_address: 'settlement@npci',
    available_balance: 842150.0,
    currency: 'INR',
    version_seq: 194,
    updated_at: '2026-10-24T13:40:00Z',
  },
  {
    account_id: 'acc_rewards_treasury',
    user_id: 'usr_system_00',
    account_type: 'SYSTEM_TREASURY',
    vpa_address: 'treasury@jainpay',
    available_balance: 125000.0,
    currency: 'INR',
    version_seq: 64,
    updated_at: '2026-10-24T13:40:00Z',
  },
  {
    account_id: 'acc_escrow_trust_pool',
    user_id: 'usr_system_00',
    account_type: 'SYSTEM_TREASURY',
    vpa_address: 'escrow.vault@jainpay',
    available_balance: 310000.0,
    currency: 'INR',
    version_seq: 42,
    updated_at: '2026-10-24T13:40:00Z',
  },
];

export const INITIAL_LINKED_BANKS: LinkedBankAccountRecord[] = [
  {
    bank_account_id: 'bnk_sbi_8820',
    user_id: 'usr_yash_01',
    bank_name: 'State Bank of India',
    masked_account_number: '•••• •••• 8820',
    ifsc_code: 'SBIN0004820',
    account_holder_name: 'Yash Jain',
    is_primary: true,
    linked_at: '2026-08-12T09:18:00Z',
  },
  {
    bank_account_id: 'bnk_hdfc_4419',
    user_id: 'usr_yash_01',
    bank_name: 'HDFC Bank',
    masked_account_number: '•••• •••• 4419',
    ifsc_code: 'HDFC0001092',
    account_holder_name: 'Yash Jain',
    is_primary: false,
    linked_at: '2026-09-04T14:22:00Z',
  },
  {
    bank_account_id: 'bnk_icici_7105',
    user_id: 'usr_yash_01',
    bank_name: 'ICICI Bank',
    masked_account_number: '•••• •••• 7105',
    ifsc_code: 'ICIC0000042',
    account_holder_name: 'Yash Jain',
    is_primary: false,
    linked_at: '2026-09-28T17:10:00Z',
  },
];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    transaction_id: 'tx_908142',
    idempotency_key: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    sender_account_id: 'acc_yash_wallet',
    receiver_account_id: 'acc_npci_settlement',
    counterparty_name: 'BESCOM Electricity',
    counterparty_vpa: 'bescom@bbps',
    tx_type: 'BILL_PAYMENT',
    category: 'Utilities',
    amount: 1640.0,
    status: 'SUCCESS',
    note: 'BBPS Consumer #8841209921 Oct Cycle',
    reference_utr: 'UTR6298401928',
    created_at: '2026-10-22T18:20:00Z',
  },
  {
    transaction_id: 'tx_908139',
    idempotency_key: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    sender_account_id: 'acc_yash_wallet',
    receiver_account_id: 'acc_npci_settlement',
    counterparty_name: 'Mainland China & Zomato',
    counterparty_vpa: 'zomato@hdfcbank',
    tx_type: 'SEND',
    category: 'Dining & Food',
    amount: 845.0,
    status: 'SUCCESS',
    note: 'Weekend Dinner Order #ZM9921',
    reference_utr: 'UTR6298401104',
    created_at: '2026-10-20T21:10:00Z',
  },
  {
    transaction_id: 'tx_908135',
    idempotency_key: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
    sender_account_id: 'acc_yash_wallet',
    receiver_account_id: 'acc_npci_settlement',
    counterparty_name: 'Jio 5G Prepaid',
    counterparty_vpa: 'jio.prepaid@bbps',
    tx_type: 'RECHARGE',
    category: 'Telecom Recharge',
    amount: 666.0,
    status: 'SUCCESS',
    note: '84 Days 1.5GB/Day True 5G Unlimited',
    reference_utr: 'UTR6298399812',
    created_at: '2026-10-18T11:05:00Z',
  },
  {
    transaction_id: 'tx_908128',
    idempotency_key: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    sender_account_id: 'acc_yash_wallet',
    receiver_account_id: 'acc_npci_settlement',
    counterparty_name: 'VIT HackVerse Registration',
    counterparty_vpa: 'techfest@sbi',
    tx_type: 'SEND',
    category: 'P2P Transfers',
    amount: 500.0,
    status: 'SUCCESS',
    note: 'Team Entry Fee',
    reference_utr: 'UTR6298394410',
    created_at: '2026-10-21T15:30:00Z',
  },
  {
    transaction_id: 'tx_908119',
    idempotency_key: 'c9a646d3-9c61-4cb7-bfcd-ee2522c8f633',
    sender_account_id: 'acc_yash_wallet',
    receiver_account_id: 'acc_npci_settlement',
    counterparty_name: 'Blue Tokai Coffee Roasters',
    counterparty_vpa: 'bluetokai@hdfcbank',
    tx_type: 'SEND',
    category: 'Dining & Food',
    amount: 340.0,
    status: 'PROCESSING',
    note: 'Iced Pour Over [NPCI Switch 504 Timeout]',
    reference_utr: 'UTR6298381002',
    created_at: '2026-10-23T16:45:00Z',
  },
  {
    transaction_id: 'tx_908104',
    idempotency_key: '4e8b7a12-901c-4821-88fa-918273645511',
    sender_account_id: 'acc_rewards_treasury',
    receiver_account_id: 'acc_yash_wallet',
    counterparty_name: 'Jain Pay LinUCB Vault',
    counterparty_vpa: 'treasury@jainpay',
    tx_type: 'CASHBACK',
    category: 'System / Credits',
    amount: 45.0,
    status: 'SUCCESS',
    note: 'LinUCB Utility Bill Cashback Credit',
    reference_utr: 'UTRCB20261019',
    created_at: '2026-10-19T09:00:00Z',
  },
  {
    transaction_id: 'tx_908098',
    idempotency_key: '8c12a940-771e-4412-991a-1029384756ab',
    sender_account_id: 'acc_yash_wallet',
    receiver_account_id: 'acc_npci_settlement',
    counterparty_name: 'Amazon India Marketplace',
    counterparty_vpa: 'amazonpay@apl',
    tx_type: 'SEND',
    category: 'Shopping',
    amount: 1299.0,
    status: 'SUCCESS',
    note: 'Keychron PBT Keycap Set & USB-C Cable',
    reference_utr: 'UTR6298370192',
    created_at: '2026-10-16T14:22:00Z',
  },
  {
    transaction_id: 'tx_908091',
    idempotency_key: '3f99a110-12ab-48c9-b001-998877665544',
    sender_account_id: 'acc_npci_settlement',
    receiver_account_id: 'acc_yash_wallet',
    counterparty_name: 'ACM Campus Hackathon Stipend',
    counterparty_vpa: 'acm.stipend@icici',
    tx_type: 'RECEIVE',
    category: 'System / Credits',
    amount: 5000.0,
    status: 'SUCCESS',
    note: '1st Runner-Up Systems Architecture Prize',
    reference_utr: 'UTR6298361008',
    created_at: '2026-10-14T10:30:00Z',
  },
];

export const INITIAL_LEDGER_ENTRIES: LedgerEntryRecord[] = [
  {
    entry_id: 'le_dr_908142',
    transaction_id: 'tx_908142',
    account_id: 'acc_yash_wallet',
    debit_amount: 1640.0,
    credit_amount: 0,
    balance_after: 24880.3,
    entry_narration: 'DR bescom@bbps • BBPS Consumer #8841209921',
    created_at: '2026-10-22T18:20:00Z',
  },
  {
    entry_id: 'le_cr_908142',
    transaction_id: 'tx_908142',
    account_id: 'acc_npci_settlement',
    debit_amount: 0,
    credit_amount: 1640.0,
    balance_after: 842150.0,
    entry_narration: 'CR bescom@bbps • Settlement Credit',
    created_at: '2026-10-22T18:20:00Z',
  },
  {
    entry_id: 'le_dr_908139',
    transaction_id: 'tx_908139',
    account_id: 'acc_yash_wallet',
    debit_amount: 845.0,
    credit_amount: 0,
    balance_after: 26520.3,
    entry_narration: 'DR zomato@hdfcbank • Weekend Dinner Order #ZM9921',
    created_at: '2026-10-20T21:10:00Z',
  },
  {
    entry_id: 'le_cr_908139',
    transaction_id: 'tx_908139',
    account_id: 'acc_npci_settlement',
    debit_amount: 0,
    credit_amount: 845.0,
    balance_after: 840510.0,
    entry_narration: 'CR zomato@hdfcbank • Settlement Credit',
    created_at: '2026-10-20T21:10:00Z',
  },
  {
    entry_id: 'le_dr_908128',
    transaction_id: 'tx_908128',
    account_id: 'acc_yash_wallet',
    debit_amount: 500.0,
    credit_amount: 0,
    balance_after: 27365.3,
    entry_narration: 'DR techfest@sbi • Team Entry Fee',
    created_at: '2026-10-21T15:30:00Z',
  },
  {
    entry_id: 'le_cr_908128',
    transaction_id: 'tx_908128',
    account_id: 'acc_npci_settlement',
    debit_amount: 0,
    credit_amount: 500.0,
    balance_after: 839665.0,
    entry_narration: 'CR techfest@sbi • Settlement Credit',
    created_at: '2026-10-21T15:30:00Z',
  },
  {
    entry_id: 'le_cr_908104',
    transaction_id: 'tx_908104',
    account_id: 'acc_yash_wallet',
    debit_amount: 0,
    credit_amount: 45.0,
    balance_after: 27865.3,
    entry_narration: 'CR treasury@jainpay • LinUCB Cashback',
    created_at: '2026-10-19T09:00:00Z',
  },
  {
    entry_id: 'le_dr_908104',
    transaction_id: 'tx_908104',
    account_id: 'acc_rewards_treasury',
    debit_amount: 45.0,
    credit_amount: 0,
    balance_after: 125000.0,
    entry_narration: 'DR treasury@jainpay • LinUCB Cashback Payout',
    created_at: '2026-10-19T09:00:00Z',
  },
  {
    entry_id: 'le_dr_908098',
    transaction_id: 'tx_908098',
    account_id: 'acc_yash_wallet',
    debit_amount: 1299.0,
    credit_amount: 0,
    balance_after: 27820.3,
    entry_narration: 'DR amazonpay@apl • Keychron PBT Keycap Set',
    created_at: '2026-10-16T14:22:00Z',
  },
  {
    entry_id: 'le_cr_908098',
    transaction_id: 'tx_908098',
    account_id: 'acc_npci_settlement',
    debit_amount: 0,
    credit_amount: 1299.0,
    balance_after: 839165.0,
    entry_narration: 'CR amazonpay@apl • Settlement Credit',
    created_at: '2026-10-16T14:22:00Z',
  },
];

export const INITIAL_KHATA_ENTRIES: KhataEntryRecord[] = [
  {
    khata_id: 'kh_401',
    creator_user_id: 'usr_rahul_02',
    peer_user_id: 'usr_rahul_02',
    peer_name: 'Rahul Verma',
    peer_vpa: 'rahul@okaxis',
    direction: 'USER_OWES_PEER',
    amount: 330.0,
    description: 'Lab Printouts & Spiral Binding Share',
    status: 'ACKNOWLEDGED',
    linked_tx_id: null,
    created_at: '2026-10-21T10:15:00Z',
  },
  {
    khata_id: 'kh_402',
    creator_user_id: 'usr_yash_01',
    peer_user_id: 'usr_rahul_02',
    peer_name: 'Rahul Verma',
    peer_vpa: 'rahul@okaxis',
    direction: 'PEER_OWES_USER',
    amount: 120.0,
    description: 'Late Night Maggi & Nescafe Run',
    status: 'ACKNOWLEDGED',
    linked_tx_id: null,
    created_at: '2026-10-22T23:10:00Z',
  },
];

export const INITIAL_MILESTONE_DEALS: MilestoneDealRecord[] = [
  {
    deal_id: 'dl_monitor_01',
    buyer_user_id: 'usr_yash_01',
    seller_name: 'Vikram Singh',
    seller_vpa: 'vikram@hdfcbank',
    item_title: 'LG 27" IPS Monitor (Hostel Block-C Deal)',
    total_amount: 4000.0,
    advance_amount: 1000.0,
    final_amount: 3000.0,
    status: 'CREATED',
    advance_tx_id: null,
    final_tx_id: null,
    updated_at: '2026-10-24T12:00:00Z',
  },
  {
    deal_id: 'dl_ipad_02',
    buyer_user_id: 'usr_yash_01',
    seller_name: 'Ananya Nair',
    seller_vpa: 'ananya@kotak',
    item_title: 'Apple Pencil 2nd Gen (Library Study Room)',
    total_amount: 4500.0,
    advance_amount: 1500.0,
    final_amount: 3000.0,
    status: 'ADVANCE_PAID',
    advance_tx_id: 'tx_908128',
    final_tx_id: null,
    updated_at: '2026-10-23T15:10:00Z',
  },
];

// ============================================================================
// SEED DATA FOR NEW TABLES 8 TO 12
// ============================================================================

export const INITIAL_AUTOPAY_MANDATES: AutopayMandateRecord[] = [
  {
    mandate_id: 'mnd_upi_901',
    umn_reference: 'ece89102a74c4b91@jainpay',
    user_id: 'usr_yash_01',
    merchant_name: 'BESCOM Smart Meter AutoPay',
    merchant_vpa: 'bescom.autopay@bbps',
    category: 'Utilities',
    max_debit_amount: 2500.0,
    frequency: 'MONTHLY',
    next_debit_date: '2026-10-26',
    status: 'ACTIVE',
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    mandate_id: 'mnd_upi_902',
    umn_reference: '77b1209ca9814d02@jainpay',
    user_id: 'usr_yash_01',
    merchant_name: 'JioFiber Postpaid Broadband',
    merchant_vpa: 'jiofiber.mandate@bbps',
    category: 'Utilities',
    max_debit_amount: 1200.0,
    frequency: 'MONTHLY',
    next_debit_date: '2026-10-29',
    status: 'ACTIVE',
    created_at: '2026-08-20T12:30:00Z',
  },
  {
    mandate_id: 'mnd_upi_903',
    umn_reference: '31f0982bc1124e88@jainpay',
    user_id: 'usr_yash_01',
    merchant_name: 'GitHub Copilot Pro Student Add-on',
    merchant_vpa: 'github.india@hdfcbank',
    category: 'Shopping',
    max_debit_amount: 850.0,
    frequency: 'MONTHLY',
    next_debit_date: '2026-11-05',
    status: 'ACTIVE',
    created_at: '2026-09-05T09:15:00Z',
  },
  {
    mandate_id: 'mnd_upi_904',
    umn_reference: '99a4410de8234c19@jainpay',
    user_id: 'usr_yash_01',
    merchant_name: 'Cult.fit Elite Campus Gym',
    merchant_vpa: 'cultfit.autopay@icici',
    category: 'Shopping',
    max_debit_amount: 1499.0,
    frequency: 'QUARTERLY',
    next_debit_date: '2026-11-15',
    status: 'PAUSED',
    created_at: '2026-09-12T18:45:00Z',
  },
];

export const INITIAL_CREDIT_SANCTIONS: CreditSanctionRecord[] = [
  {
    facility_id: 'crd_nbfc_101',
    user_id: 'usr_yash_01',
    lender_partner: 'Jain Pay Capital & Axis NBFC Co-Lend',
    sanctioned_limit: 50000.0,
    utilized_amount: 6400.0,
    available_credit: 43600.0,
    annual_eir_percent: 14.25,
    cibil_score_band: '792 (EXCELLENT_PRIME)',
    billing_cycle_day: 5,
    status: 'ACTIVE_GOOD_STANDING',
    updated_at: '2026-10-24T08:00:00Z',
  },
  {
    facility_id: 'crd_nbfc_102',
    user_id: 'usr_rahul_02',
    lender_partner: 'Jain Pay Micro-Campus Flexi Line',
    sanctioned_limit: 25000.0,
    utilized_amount: 4200.0,
    available_credit: 20800.0,
    annual_eir_percent: 15.5,
    cibil_score_band: '764 (PRIME)',
    billing_cycle_day: 10,
    status: 'ACTIVE_GOOD_STANDING',
    updated_at: '2026-10-22T11:20:00Z',
  },
];

export const INITIAL_FX_TREASURY_VAULTS: FxTreasuryVaultRecord[] = [
  {
    vault_id: 'fx_pool_sg_01',
    corridor_code: 'UPI_GLOBAL_SG',
    base_currency: 'INR',
    quote_currency: 'SGD',
    spot_rate_inr: 63.42,
    spread_bps: 35,
    pool_liquidity_quote: 285000.0,
    settlement_rail: 'NPCI-NIPL × PayNow Singapore Real-Time Bridge',
    updated_at: '2026-10-24T13:55:00Z',
  },
  {
    vault_id: 'fx_pool_ae_02',
    corridor_code: 'UPI_GLOBAL_AE',
    base_currency: 'INR',
    quote_currency: 'AED',
    spot_rate_inr: 22.88,
    spread_bps: 40,
    pool_liquidity_quote: 640000.0,
    settlement_rail: 'NPCI-NIPL × NeoPay UAE Instant Corridor',
    updated_at: '2026-10-24T13:55:00Z',
  },
  {
    vault_id: 'fx_pool_us_03',
    corridor_code: 'UPI_GLOBAL_US',
    base_currency: 'INR',
    quote_currency: 'USD',
    spot_rate_inr: 84.06,
    spread_bps: 45,
    pool_liquidity_quote: 420000.0,
    settlement_rail: 'FedNow × Jain Pay Nostro Treasury Pool',
    updated_at: '2026-10-24T13:55:00Z',
  },
  {
    vault_id: 'fx_pool_eu_04',
    corridor_code: 'UPI_GLOBAL_EU',
    base_currency: 'INR',
    quote_currency: 'EUR',
    spot_rate_inr: 91.18,
    spread_bps: 38,
    pool_liquidity_quote: 195000.0,
    settlement_rail: 'SEPA Instant × Lyra Europe UPI QR Gateway',
    updated_at: '2026-10-24T13:55:00Z',
  },
];

export const INITIAL_DISPUTE_CHARGEBACKS: DisputeChargebackRecord[] = [
  {
    dispute_id: 'dsp_udir_501',
    transaction_id: 'tx_908119',
    user_id: 'usr_yash_01',
    npci_udir_ticket: 'UDIR2026102399104',
    reason_code: 'UDIR_504_TIMEOUT',
    disputed_amount: 340.0,
    status: 'OPEN_INVESTIGATION',
    sla_deadline: '2026-10-25T16:45:00Z',
    evidence_sha256:
      '4f8a9c12e7b031d9a4c6e8f1029384756abcdef1234567890abcdef123456789',
    created_at: '2026-10-23T16:46:00Z',
  },
  {
    dispute_id: 'dsp_udir_502',
    transaction_id: 'tx_908139',
    user_id: 'usr_yash_01',
    npci_udir_ticket: 'UDIR2026102088412',
    reason_code: 'DUPLICATE_DEBIT',
    disputed_amount: 845.0,
    status: 'AUTO_RESOLVED_CREDIT',
    sla_deadline: '2026-10-22T21:10:00Z',
    evidence_sha256:
      '9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    created_at: '2026-10-20T21:15:00Z',
  },
];

export const INITIAL_SECURITY_AUDIT_LOGS: SecurityAuditLogRecord[] = [
  {
    audit_id: 'aud_sec_801',
    user_id: 'usr_yash_01',
    event_type: 'RLS_TENANT_BIND',
    isolation_mode: 'SERIALIZABLE',
    client_ip_cidr: '103.21.124.0/24',
    device_attestation: 'PLAY_INTEGRITY_MEETS_STRONG_INTEGRITY',
    metadata_json:
      '{"rls_tenant":"usr_yash_01","pgbouncer_pool":"transaction_6432","tables_enforced":12}',
    created_at: '2026-10-24T14:00:01Z',
  },
  {
    audit_id: 'aud_sec_802',
    user_id: 'usr_yash_01',
    event_type: 'AI_ZERO_TRUST_READ',
    isolation_mode: 'READ COMMITTED',
    client_ip_cidr: '103.21.124.0/24',
    device_attestation: 'GEMINI_PROXY_READ_ONLY_ROLE',
    metadata_json:
      '{"tool":"queryFinancialLedger","mutated_rows":0,"pin_redacted":true}',
    created_at: '2026-10-24T14:00:05Z',
  },
  {
    audit_id: 'aud_sec_803',
    user_id: 'usr_yash_01',
    event_type: 'SCAM_SHIELD_INTERCEPT',
    isolation_mode: 'READ COMMITTED',
    client_ip_cidr: '103.21.124.0/24',
    device_attestation: 'PRE_FLIGHT_QR_PARSER_V2',
    metadata_json:
      '{"blocked_vpa":"refund.olx.claim@ybl","detected_trap":"COLLECT_DEBIT_MISMATCH","risk_score":96}',
    created_at: '2026-10-24T14:05:12Z',
  },
];

// ============================================================================
// 10 NEAT & CLEAN EXAMPLE OPTIONS FOR AI CHAT & VOICE REPLY
// ============================================================================

export const TEN_AI_VOICE_CHAT_OPTIONS: AiVoiceChatOption[] = [
  {
    id: 'OPT_01_WALLET_LIQUIDITY',
    numberLabel: '01',
    category: 'Wallet & Multi-Bank Liquidity',
    title: 'Check Wallet Balance & Linked Bank Accounts',
    promptText:
      'What is my current Jain Pay wallet balance, primary linked bank account, and total available liquidity?',
    targetTables: ['accounts', 'linked_bank_accounts', 'credit_sanctions'],
    sqlPreview:
      "SELECT a.vpa_address, a.available_balance, b.bank_name, b.ifsc_code FROM accounts a JOIN linked_bank_accounts b ON a.user_id = b.user_id WHERE a.user_id = current_setting('app.current_user_id', true);",
  },
  {
    id: 'OPT_02_LEDGER_XOR_AUDIT',
    numberLabel: '02',
    category: 'Double-Entry Ledger Proof',
    title: 'Audit Double-Entry Ledger & XOR Invariant',
    promptText:
      'Audit my ledger_entries table and verify that every debit and credit satisfies the BCNF double-entry XOR invariant.',
    targetTables: ['ledger_entries', 'transactions'],
    sqlPreview:
      'SELECT transaction_id, SUM(debit_amount) AS total_dr, SUM(credit_amount) AS total_cr FROM ledger_entries GROUP BY transaction_id HAVING SUM(debit_amount) = SUM(credit_amount);',
  },
  {
    id: 'OPT_03_SPEND_ANALYTICS',
    numberLabel: '03',
    category: 'Spending Analytics',
    title: '30-Day Spend Breakdown by Category',
    promptText:
      'Break down my October spending by category and tell me my largest completed utility, shopping, and dining transactions.',
    targetTables: ['transactions', 'ledger_entries'],
    sqlPreview:
      "SELECT category, COUNT(*) AS tx_count, SUM(amount) AS total_inr FROM transactions WHERE status = 'SUCCESS' AND tx_type IN ('SEND','BILL_PAYMENT','RECHARGE') GROUP BY category ORDER BY total_inr DESC;",
  },
  {
    id: 'OPT_04_SAFE_TO_SPEND',
    numberLabel: '04',
    category: 'Cashflow Runway',
    title: 'Safe-to-Spend & 48-Hour Bill Runway',
    promptText:
      'Am I safe to spend ₹3,500 right now after reserving for upcoming BBPS electricity, broadband, and UPI AutoPay mandates?',
    targetTables: ['accounts', 'autopay_mandates', 'transactions'],
    sqlPreview:
      "SELECT available_balance, (SELECT COALESCE(SUM(max_debit_amount),0) FROM autopay_mandates WHERE status = 'ACTIVE') AS active_mandate_reserve FROM accounts WHERE account_id = 'acc_yash_wallet';",
  },
  {
    id: 'OPT_05_TIMEOUT_DIAGNOSIS',
    numberLabel: '05',
    category: 'NPCI Timeout & UDIR',
    title: 'Diagnose Stuck Blue Tokai Payment (tx_908119)',
    promptText:
      'Why is transaction tx_908119 to Blue Tokai Coffee stuck in PROCESSING, and is it safe to retry without double-debiting?',
    targetTables: ['transactions', 'ledger_entries', 'dispute_chargebacks'],
    sqlPreview:
      "SELECT t.transaction_id, t.status, t.idempotency_key, COUNT(l.entry_id) AS ledger_rows, d.npci_udir_ticket FROM transactions t LEFT JOIN ledger_entries l ON t.transaction_id = l.transaction_id LEFT JOIN dispute_chargebacks d ON t.transaction_id = d.transaction_id WHERE t.transaction_id = 'tx_908119' GROUP BY t.transaction_id, d.npci_udir_ticket;",
  },
  {
    id: 'OPT_06_AUTOPAY_MANDATES',
    numberLabel: '06',
    category: 'UPI AutoPay 2.0',
    title: 'Inspect Active UPI AutoPay Mandates',
    promptText:
      'List my active UPI AutoPay 2.0 mandates, UMN references, monthly caps, and next scheduled debit dates.',
    targetTables: ['autopay_mandates'],
    sqlPreview:
      "SELECT mandate_id, merchant_name, umn_reference, max_debit_amount, frequency, next_debit_date, status FROM autopay_mandates WHERE user_id = current_setting('app.current_user_id', true) ORDER BY next_debit_date ASC;",
  },
  {
    id: 'OPT_07_CREDIT_SANCTIONS',
    numberLabel: '07',
    category: 'NBFC Credit & BNPL',
    title: 'Review Sanctioned Credit Line & CIBIL Tier',
    promptText:
      'What is my sanctioned NBFC credit limit, current utilization percentage, EIR interest rate, and CIBIL score band?',
    targetTables: ['credit_sanctions', 'users'],
    sqlPreview:
      "SELECT facility_id, lender_partner, sanctioned_limit, utilized_amount, available_credit, annual_eir_percent, cibil_score_band FROM credit_sanctions WHERE user_id = current_setting('app.current_user_id', true);",
  },
  {
    id: 'OPT_08_FX_TREASURY',
    numberLabel: '08',
    category: 'Cross-Border UPI Global',
    title: 'Query FX Treasury Vaults (SGD, AED, USD, EUR)',
    promptText:
      'Show the live FX Treasury Vault liquidity, spot rates in INR, and settlement rails for UPI Global corridors.',
    targetTables: ['fx_treasury_vaults'],
    sqlPreview:
      'SELECT corridor_code, quote_currency, spot_rate_inr, spread_bps, pool_liquidity_quote, settlement_rail FROM fx_treasury_vaults ORDER BY corridor_code;',
  },
  {
    id: 'OPT_09_KHATA_AND_ESCROW',
    numberLabel: '09',
    category: 'P2P Khata & Escrow',
    title: 'Calculate Net Khata Balance & Escrow Deals',
    promptText:
      'Calculate my net P2P Khata balance with Rahul Verma and check the status of my Milestone Escrow deals.',
    targetTables: ['khata_entries', 'milestone_deals'],
    sqlPreview:
      "SELECT peer_name, direction, amount, status FROM khata_entries WHERE creator_user_id = 'usr_yash_01' OR peer_user_id = 'usr_yash_01';",
  },
  {
    id: 'OPT_10_BCNF_SSI_ARCHITECTURE',
    numberLabel: '10',
    category: 'Database Architecture',
    title: 'Explain 12-Table BCNF, SSI 40001 & RLS Design',
    promptText:
      'Explain how our 12-table BCNF schema, Serializable Snapshot Isolation (SQLSTATE 40001), BRIN/GIN indexes, and PgBouncer transaction pooling work.',
    targetTables: ['security_audit_logs', 'ledger_entries', 'accounts'],
    sqlPreview:
      "SHOW default_transaction_isolation; -- SERIALIZABLE | PgBouncer pool_mode = transaction | HikariCP maxPoolSize = (Tn * (Cm - 1)) + 1",
  },
];

export const INITIAL_SCRATCH_CARDS: ScratchCardItem[] = [
  {
    id: 'sc_init_01',
    sourceTxId: 'tx_908142',
    rewardAmount: 35.0,
    merchantSponsor: 'BESCOM & BBPS Green Rebate',
    title: 'BBPS Utility Bill Payment Reward',
    isScratched: false,
    claimedAt: null,
  },
  {
    id: 'sc_init_02',
    sourceTxId: 'tx_908139',
    rewardAmount: 50.0,
    merchantSponsor: 'Zomato Dining Partner',
    title: 'Weekend Dining Super Cashback',
    isScratched: false,
    claimedAt: null,
  },
  {
    id: 'sc_init_03',
    sourceTxId: 'tx_908104',
    rewardAmount: 45.0,
    merchantSponsor: 'Jain Pay LinUCB Vault',
    title: 'Claimed Utility Cashback',
    isScratched: true,
    claimedAt: '2026-10-19T09:00:00Z',
  },
];

export const INITIAL_SQL_LOGS: SqlRlsLogEntry[] = [
  {
    id: 'sql_boot_01',
    timestamp: '2026-10-24T14:00:01Z',
    cloudFunction: 'createPayment',
    isolationLevel: 'SERIALIZABLE',
    rlsTenant: 'usr_yash_01',
    sqlStatements: [
      `BEGIN ISOLATION LEVEL SERIALIZABLE;`,
      `SELECT set_config('app.current_user_id', $1, true); -- Bind [$1 = 'usr_yash_01']`,
      `-- RLS Policies active across all 12 Enterprise BCNF tables`,
      `SELECT account_id, available_balance, version_seq FROM accounts WHERE user_id = current_setting('app.current_user_id', true);`,
      `COMMIT;`,
    ],
    securityAudit:
      'PostgreSQL 16.4 SSI Cluster initialized | 12 BCNF Tables | PgBouncer port 6432 pool_mode=transaction | RLS Enforced.',
    status: 'COMMITTED',
  },
];

export const INITIAL_AI_LOGS: AiToolCallLog[] = [
  {
    id: 'ai_boot_01',
    timestamp: '2026-10-24T14:00:05Z',
    moduleCode: 'AI-05',
    toolName: 'queryFinancialLedger',
    requestPayload: {
      tenant_user_id: 'usr_yash_01',
      window_days: 30,
      include_categories: true,
    },
    responsePayload: {
      authoritative_balance_masked: true,
      thirty_day_outflow_inr: 5290.0,
      top_category: 'Utilities (₹1,640.00)',
      mutated_database: false,
      zero_trust_guardrail: 'READ_ONLY_VERIFIED',
    },
    executionMs: 38,
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_copilot_1',
    threadId: 'thread_copilot',
    sender: 'ai_copilot',
    senderName: 'Jain Pay AI Co-Pilot',
    timestamp: '14:01 IST',
    text: 'Namaste Yash! I am your Zero-Trust Financial Co-Pilot. I have read-only access to your RLS-scoped 12-table PostgreSQL 16+ ledger and can stage payments, detect collect-trap QR scams (NEXT-03), extract event posters (NEXT-04), simulate Safe-to-Spend runway (NEXT-05), or diagnose timed-out transactions (NEXT-07). I can NEVER move money without your explicit review and 4-digit PIN.',
  },
  {
    id: 'msg_copilot_2',
    threadId: 'thread_copilot',
    sender: 'ai_copilot',
    senderName: 'Jain Pay AI Co-Pilot',
    timestamp: '14:02 IST',
    text: 'Here is a live Safe-to-Spend Runway simulation (NEXT-05) against your upcoming ₹11,016 recurring bills (BESCOM ₹1,850 + Jio ₹666 + Hostel/Flat Rent ₹8,500):',
    widgetType: 'SAFE_TO_SPEND_NEXT05',
    safeToSpendInitialAmount: 3500,
  },
  {
    id: 'msg_group_1',
    threadId: 'thread_group_dining',
    sender: 'pooja',
    senderName: 'Pooja Sharma',
    timestamp: '21:15 IST',
    text: 'Guys, uploading tonight’s Mainland China dinner bill (₹1,200 total after 5% GST and promo discount). Rahul didn’t eat the Paneer Tikka starter or Cold Coffee!',
  },
  {
    id: 'msg_group_2',
    threadId: 'thread_group_dining',
    sender: 'ai_copilot',
    senderName: 'Jain Pay AI Co-Pilot (NEXT-01 Snap & Split)',
    timestamp: '21:15 IST',
    text: 'Parsed Mainland China receipt via Vision OCR and applied your Hinglish constraint: excluded Rahul from Paneer Tikka Starter (₹320) & Cold Coffee (₹180), and allocated 5% GST (₹62.50) and Promo Discount (-₹112.50) proportionally to the exact paisa:',
    widgetType: 'SPLIT_RECEIPT_NEXT01',
    splitPayload: {
      merchantName: 'Mainland China • Indiranagar',
      gstPercent: 5,
      discountAmount: 112.5,
      items: [
        {
          id: 'item_paneer',
          name: 'Paneer Tikka Starter',
          price: 320,
          claimedBy: ['Yash', 'Pooja'],
        },
        {
          id: 'item_coffee',
          name: 'Cold Coffee',
          price: 180,
          claimedBy: ['Yash', 'Pooja'],
        },
        {
          id: 'item_noodles',
          name: '3x Veg Hakka Noodles',
          price: 750,
          claimedBy: ['Yash', 'Pooja', 'Rahul'],
        },
      ],
    },
  },
  {
    id: 'msg_rahul_1',
    threadId: 'thread_rahul',
    sender: 'rahul',
    senderName: 'Rahul Verma',
    timestamp: 'Yesterday',
    text: 'Bro, our Net-Zero Khata running tab is super clean—no need to fire 10 tiny UPI transactions every day for auto and chai. Currently you owe ₹210.00 net.',
  },
  {
    id: 'msg_vikram_1',
    threadId: 'thread_vikram',
    sender: 'vikram',
    senderName: 'Vikram Singh (Hostel Block-C)',
    timestamp: '12:05 IST',
    text: 'Hey Yash! Ready to hand over the LG 27" 4K IPS Monitor for ₹4,000. Let’s use a 2-step Milestone Trust Card: ₹1,000 advance now to reserve it, and ₹3,000 once you test the display in person.',
  },
  {
    id: 'msg_vikram_2',
    threadId: 'thread_vikram',
    sender: 'ai_copilot',
    senderName: 'Jain Pay AI Co-Pilot (NEXT-06 Trust Card)',
    timestamp: '12:06 IST',
    text: 'Created BCNF Milestone Trust Card (Deal ID: dl_monitor_01 • LG 27" IPS Monitor • Total: ₹4,000). Each stage routes through the authoritative 4-Digit PIN payment flow and links the resulting transaction_id.',
    widgetType: 'MILESTONE_CARD_NEXT06',
    milestoneDealId: 'dl_monitor_01',
  },
];

export const SAMPLE_OCR_BILLS = [
  {
    id: 'bill_bescom',
    label: 'BESCOM Electricity Bill (Bengaluru)',
    billerName: 'BESCOM Electricity',
    billerVpa: 'bescom@bbps',
    consumerId: '8841209921',
    dueDate: '2026-10-26',
    totalAmountDue: 1850.0,
    billPeriod: '01 Sep 2026 - 30 Sep 2026 (248 kWh)',
    confidenceScore: 0.994,
  },
  {
    id: 'bill_jiofiber',
    label: 'JioFiber Broadband Invoice (150 Mbps)',
    billerName: 'JioFiber Broadband',
    billerVpa: 'jiofiber@bbps',
    consumerId: '080-44918201',
    dueDate: '2026-10-29',
    totalAmountDue: 1178.82,
    billPeriod: 'Oct 2026 Postpaid Fiber + OTT Bundle',
    confidenceScore: 0.989,
  },
  {
    id: 'bill_djb',
    label: 'Delhi Jal Board Water Utility Bill',
    billerName: 'Delhi Jal Board (DJB)',
    billerVpa: 'djb.water@bbps',
    consumerId: 'DJB-90182736',
    dueDate: '2026-11-02',
    totalAmountDue: 490.0,
    billPeriod: 'Bi-Monthly Domestic Water Tariff',
    confidenceScore: 0.981,
  },
];

export const MOBILE_RECHARGE_PLANS = [
  {
    id: 'plan_jio_299',
    operator: 'Jio',
    vpa: 'jio.prepaid@bbps',
    category: 'Popular',
    price: 299,
    data: '1.5 GB/day',
    validity: '28 Days',
    benefits: 'Unlimited Voice + 100 SMS/day + JioCinema',
  },
  {
    id: 'plan_jio_666',
    operator: 'Jio',
    vpa: 'jio.prepaid@bbps',
    category: '5G Unlimited',
    price: 666,
    data: '1.5 GB/day + True 5G',
    validity: '84 Days',
    benefits: 'Unlimited True 5G Data + Free Roaming + JioTV',
  },
  {
    id: 'plan_jio_2999',
    operator: 'Jio',
    vpa: 'jio.prepaid@bbps',
    category: 'Long-Term Annual',
    price: 2999,
    data: '2.5 GB/day + True 5G',
    validity: '365 Days',
    benefits: 'Annual Flagship Plan + Unlimited 5G + Ajio/Swiggy Coupons',
  },
  {
    id: 'plan_airtel_349',
    operator: 'Airtel',
    vpa: 'airtel.prepaid@bbps',
    category: '5G Unlimited',
    price: 349,
    data: '2.0 GB/day + 5G Plus',
    validity: '28 Days',
    benefits: 'Unlimited 5G Data + Apollo 24|7 + Wynk Music',
  },
  {
    id: 'plan_airtel_859',
    operator: 'Airtel',
    vpa: 'airtel.prepaid@bbps',
    category: 'Popular',
    price: 859,
    data: '1.5 GB/day + 5G Plus',
    validity: '84 Days',
    benefits: '84-Day Value Pack + Airtel Xstream Play',
  },
  {
    id: 'plan_vi_149',
    operator: 'Vi (Vodafone Idea)',
    vpa: 'vi.prepaid@bbps',
    category: 'Data Packs',
    price: 149,
    data: '12 GB Booster',
    validity: 'Existing Plan',
    benefits: 'Binge All Night (12 AM - 6 AM) + Weekend Data Rollover',
  },
  {
    id: 'plan_bsnl_197',
    operator: 'BSNL',
    vpa: 'bsnl.prepaid@bbps',
    category: 'Popular',
    price: 197,
    data: '2.0 GB/day',
    validity: '70 Days',
    benefits: 'Pan-India MTNL/BSNL Roaming + Unlimited Calls',
  },
];

export const BBPS_BILL_CATEGORIES = [
  {
    id: 'bbps_elec',
    title: 'Electricity',
    billerName: 'BESCOM / Tata Power',
    vpa: 'bescom@bbps',
    sampleDue: 1850.0,
    consumerNo: '8841209921',
    dueBadge: 'Due in 36h',
  },
  {
    id: 'bbps_water',
    title: 'Water',
    billerName: 'BWSSB / Delhi Jal Board',
    vpa: 'bwssb.water@bbps',
    sampleDue: 490.0,
    consumerNo: 'WTR-209184',
    dueBadge: 'Due in 6d',
  },
  {
    id: 'bbps_gas',
    title: 'Piped Gas / LPG',
    billerName: 'Indane / GAIL Gas',
    vpa: 'indane.lpg@bbps',
    sampleDue: 903.0,
    consumerNo: 'LPG-7748291',
    dueBadge: 'Cylinder Refill',
  },
  {
    id: 'bbps_broadband',
    title: 'Broadband / FTTH',
    billerName: 'JioFiber / ACT Fibernet',
    vpa: 'jiofiber@bbps',
    sampleDue: 1178.82,
    consumerNo: '080-44918201',
    dueBadge: 'Due in 5d',
  },
  {
    id: 'bbps_fastag',
    title: 'FASTag Recharge',
    billerName: 'ICICI / NHAI FASTag',
    vpa: 'nhai.fastag@icici',
    sampleDue: 500.0,
    consumerNo: 'KA-01-MJ-8820',
    dueBadge: 'Low Balance',
  },
  {
    id: 'bbps_insurance',
    title: 'Insurance Premium',
    billerName: 'LIC / HDFC Ergo Health',
    vpa: 'lic.premium@bbps',
    sampleDue: 2450.0,
    consumerNo: 'POL-9948102',
    dueBadge: 'Quarterly',
  },
  {
    id: 'bbps_municipal',
    title: 'Municipal Taxes',
    billerName: 'BBMP Property Tax',
    vpa: 'bbmp.tax@bbps',
    sampleDue: 1620.0,
    consumerNo: 'PID-084-1129',
    dueBadge: '5% Rebate',
  },
  {
    id: 'bbps_edu',
    title: 'Education Fees',
    billerName: 'Semester Hostel & Lab Fee',
    vpa: 'vit.accounts@sbi',
    sampleDue: 4200.0,
    consumerNo: 'REG-22BCE1094',
    dueBadge: 'Even Sem',
  },
];

export const INDIAN_BANKS_DIRECTORY = [
  { name: 'State Bank of India', ifscPrefix: 'SBIN0004820', code: 'SBI' },
  { name: 'HDFC Bank', ifscPrefix: 'HDFC0001092', code: 'HDFC' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC0000042', code: 'ICICI' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB0000118', code: 'AXIS' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK0000421', code: 'KOTAK' },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNB0041900', code: 'PNB' },
  { name: 'Bank of Baroda', ifscPrefix: 'BARB0INDIRA', code: 'BOB' },
];

export const PGBOUNCER_HIKARICP_CONFIG = `# ============================================================================
# 1. PGBOUNCER TRANSACTION-MODE CONFIGURATION (/etc/pgbouncer/pgbouncer.ini)
# ============================================================================
[databases]
jainpay_prod = host=10.24.0.10 port=5432 dbname=jainpay_ledger

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
pool_mode = transaction
max_client_conn = 5000
default_pool_size = 32
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
server_reset_query = DISCARD ALL
ignore_startup_parameters = extra_float_digits

# ============================================================================
# 2. HIKARICP / DRIZZLE POOL SIZING FORMULA (PostgreSQL Wiki Benchmark)
# Formula: connections = ((core_count * 2) + effective_spindle_count)
# For 16-vCPU NVMe Primary Node: (16 * 2) + 1 = 33 max server connections
# ============================================================================
spring.datasource.hikari.maximum-pool-size=33
spring.datasource.hikari.minimum-idle=33
spring.datasource.hikari.connection-timeout=2500
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.transaction-isolation=TRANSACTION_SERIALIZABLE`;

export const POSTGRES_16_PRODUCTION_DDL = `-- ============================================================================
-- JAIN PAY ENTERPRISE 12-TABLE BCNF LEDGER SCHEMA (PostgreSQL 16.4+)
-- Isolation: SERIALIZABLE (SSI Predicate Locks) | Multi-Tenancy: Row-Level Security
-- Connection Pooling: PgBouncer (pool_mode = transaction, port = 6432)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. USERS TABLE (3NF / BCNF: Every non-trivial FD X -> Y has X as a superkey)
CREATE TABLE users (
    user_id          VARCHAR(64) PRIMARY KEY,
    full_name        VARCHAR(120) NOT NULL,
    vpa_handle       VARCHAR(256) NOT NULL UNIQUE
                     CHECK (vpa_handle ~ '^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$'),
    phone_number     VARCHAR(20) NOT NULL UNIQUE,
    pbkdf2_pin_hash  CHAR(64) NOT NULL,
    pbkdf2_salt_hex  CHAR(32) NOT NULL,
    kyc_tier         VARCHAR(32) NOT NULL DEFAULT 'FULL_KYC_BIOMETRIC',
    rls_tenant_scope VARCHAR(64) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2. ACCOUNTS TABLE (Optimistic version_seq + Non-negative Balance Invariant)
CREATE TABLE accounts (
    account_id        VARCHAR(64) PRIMARY KEY,
    user_id           VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    account_type      VARCHAR(32) NOT NULL
                      CHECK (account_type IN ('USER_WALLET', 'COUNTERPARTY_SETTLEMENT', 'SYSTEM_TREASURY')),
    vpa_address       VARCHAR(256) NOT NULL UNIQUE,
    available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00
                      CHECK (available_balance >= 0.00),
    currency          CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
    version_seq       BIGINT NOT NULL DEFAULT 1,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3. LINKED BANK ACCOUNTS TABLE (BCNF Separated from Accounts)
CREATE TABLE linked_bank_accounts (
    bank_account_id       VARCHAR(64) PRIMARY KEY,
    user_id               VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bank_name             VARCHAR(120) NOT NULL,
    masked_account_number VARCHAR(32) NOT NULL,
    ifsc_code             CHAR(11) NOT NULL CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    account_holder_name   VARCHAR(120) NOT NULL,
    is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
    linked_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 4. TRANSACTIONS TABLE (UUID Idempotency Lock prevents Double-Tap Replay)
CREATE TABLE transactions (
    transaction_id      VARCHAR(64) PRIMARY KEY,
    idempotency_key     VARCHAR(128) NOT NULL UNIQUE,
    sender_account_id   VARCHAR(64) NOT NULL REFERENCES accounts(account_id),
    receiver_account_id VARCHAR(64) NOT NULL REFERENCES accounts(account_id),
    counterparty_name   VARCHAR(120) NOT NULL,
    counterparty_vpa    VARCHAR(256) NOT NULL,
    tx_type             VARCHAR(32) NOT NULL
                        CHECK (tx_type IN ('SEND','RECEIVE','BILL_PAYMENT','RECHARGE','CASHBACK','REFUND','BALANCE_ADJUSTMENT')),
    category            VARCHAR(64) NOT NULL,
    amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    status              VARCHAR(24) NOT NULL
                        CHECK (status IN ('SUCCESS','PROCESSING','FAILED','REFUNDED')),
    note                TEXT NOT NULL DEFAULT '',
    reference_utr       VARCHAR(64) NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_distinct_parties CHECK (sender_account_id <> receiver_account_id)
);

-- 5. APPEND-ONLY DOUBLE-ENTRY LEDGER TABLE (Strict XOR Debit/Credit Invariant)
CREATE TABLE ledger_entries (
    entry_id        VARCHAR(64) PRIMARY KEY,
    transaction_id  VARCHAR(64) NOT NULL REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
    account_id      VARCHAR(64) NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
    debit_amount    NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0.00),
    credit_amount   NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0.00),
    balance_after   NUMERIC(14, 2) NOT NULL CHECK (balance_after >= 0.00),
    entry_narration TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_double_entry_xor CHECK (
        (debit_amount > 0.00 AND credit_amount = 0.00) OR
        (credit_amount > 0.00 AND debit_amount = 0.00)
    )
);

-- 6. CONVERSATIONAL NET-ZERO KHATA TABLE (NEXT-02)
CREATE TABLE khata_entries (
    khata_id        VARCHAR(64) PRIMARY KEY,
    creator_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id),
    peer_user_id    VARCHAR(64) NOT NULL REFERENCES users(user_id),
    peer_name       VARCHAR(120) NOT NULL,
    peer_vpa        VARCHAR(256) NOT NULL,
    direction       VARCHAR(24) NOT NULL CHECK (direction IN ('PEER_OWES_USER', 'USER_OWES_PEER')),
    amount          NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    description     TEXT NOT NULL,
    status          VARCHAR(24) NOT NULL CHECK (status IN ('PENDING_ACK', 'ACKNOWLEDGED', 'SETTLED')),
    linked_tx_id    VARCHAR(64) REFERENCES transactions(transaction_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 7. MILESTONE TRUST DEALS TABLE (NEXT-06)
CREATE TABLE milestone_deals (
    deal_id         VARCHAR(64) PRIMARY KEY,
    buyer_user_id   VARCHAR(64) NOT NULL REFERENCES users(user_id),
    seller_name     VARCHAR(120) NOT NULL,
    seller_vpa      VARCHAR(256) NOT NULL,
    item_title      VARCHAR(200) NOT NULL,
    total_amount    NUMERIC(14, 2) NOT NULL CHECK (total_amount = advance_amount + final_amount),
    advance_amount  NUMERIC(14, 2) NOT NULL CHECK (advance_amount > 0.00),
    final_amount    NUMERIC(14, 2) NOT NULL CHECK (final_amount > 0.00),
    status          VARCHAR(32) NOT NULL
                    CHECK (status IN ('CREATED', 'ADVANCE_PAID', 'HANDOVER_CONFIRMED', 'SETTLED')),
    advance_tx_id   VARCHAR(64) REFERENCES transactions(transaction_id),
    final_tx_id     VARCHAR(64) REFERENCES transactions(transaction_id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 8. NPCI UPI AUTOPAY 2.0 RECURRING MANDATES TABLE (BCNF Isolated Mandate State)
CREATE TABLE autopay_mandates (
    mandate_id       VARCHAR(64) PRIMARY KEY,
    umn_reference    VARCHAR(128) NOT NULL UNIQUE,
    user_id          VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    merchant_name    VARCHAR(120) NOT NULL,
    merchant_vpa     VARCHAR(256) NOT NULL,
    category         VARCHAR(64) NOT NULL,
    max_debit_amount NUMERIC(14, 2) NOT NULL CHECK (max_debit_amount > 0.00),
    frequency        VARCHAR(24) NOT NULL CHECK (frequency IN ('MONTHLY', 'QUARTERLY', 'AS_PRESENTED')),
    next_debit_date  DATE NOT NULL,
    status           VARCHAR(24) NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'REVOKED')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 9. NBFC CREDIT SANCTIONS & BNPL FACILITY TABLE (BCNF Credit Line Invariant)
CREATE TABLE credit_sanctions (
    facility_id        VARCHAR(64) PRIMARY KEY,
    user_id            VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    lender_partner     VARCHAR(120) NOT NULL,
    sanctioned_limit   NUMERIC(14, 2) NOT NULL CHECK (sanctioned_limit > 0.00),
    utilized_amount    NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (utilized_amount >= 0.00),
    available_credit   NUMERIC(14, 2) NOT NULL CHECK (available_credit = sanctioned_limit - utilized_amount),
    annual_eir_percent NUMERIC(5, 2) NOT NULL CHECK (annual_eir_percent >= 0.00),
    cibil_score_band   VARCHAR(64) NOT NULL,
    billing_cycle_day  INT NOT NULL CHECK (billing_cycle_day BETWEEN 1 AND 28),
    status             VARCHAR(32) NOT NULL CHECK (status IN ('ACTIVE_GOOD_STANDING', 'FROZEN', 'CLOSED')),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 10. CROSS-BORDER FX TREASURY VAULTS TABLE (UPI Global / NIPL Liquidity Pools)
CREATE TABLE fx_treasury_vaults (
    vault_id             VARCHAR(64) PRIMARY KEY,
    corridor_code        VARCHAR(32) NOT NULL UNIQUE,
    base_currency        CHAR(3) NOT NULL DEFAULT 'INR' CHECK (base_currency = 'INR'),
    quote_currency       CHAR(3) NOT NULL CHECK (quote_currency IN ('SGD', 'AED', 'USD', 'EUR')),
    spot_rate_inr        NUMERIC(12, 4) NOT NULL CHECK (spot_rate_inr > 0.0000),
    spread_bps           INT NOT NULL CHECK (spread_bps >= 0),
    pool_liquidity_quote NUMERIC(16, 2) NOT NULL CHECK (pool_liquidity_quote >= 0.00),
    settlement_rail      VARCHAR(160) NOT NULL,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 11. NPCI UDIR DISPUTE & CHARGEBACK TICKETS TABLE
CREATE TABLE dispute_chargebacks (
    dispute_id       VARCHAR(64) PRIMARY KEY,
    transaction_id   VARCHAR(64) NOT NULL REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
    user_id          VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    npci_udir_ticket VARCHAR(64) NOT NULL UNIQUE,
    reason_code      VARCHAR(48) NOT NULL
                     CHECK (reason_code IN ('UDIR_504_TIMEOUT', 'DUPLICATE_DEBIT', 'GOODS_NOT_RECEIVED', 'COLLECT_TRAP_REPORT')),
    disputed_amount  NUMERIC(14, 2) NOT NULL CHECK (disputed_amount > 0.00),
    status           VARCHAR(32) NOT NULL
                     CHECK (status IN ('OPEN_INVESTIGATION', 'AUTO_RESOLVED_CREDIT', 'ESCALATED_NPCI', 'CLOSED')),
    sla_deadline     TIMESTAMPTZ NOT NULL,
    evidence_sha256  CHAR(64) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 12. IMMUTABLE SECURITY & SERIALIZATION AUDIT LOGS TABLE (GIN + BRIN Indexed)
CREATE TABLE security_audit_logs (
    audit_id           VARCHAR(64) PRIMARY KEY,
    user_id            VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    event_type         VARCHAR(48) NOT NULL,
    isolation_mode     VARCHAR(24) NOT NULL CHECK (isolation_mode IN ('SERIALIZABLE', 'READ COMMITTED')),
    client_ip_cidr     CIDR NOT NULL,
    device_attestation VARCHAR(120) NOT NULL,
    metadata_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- ADVANCED INDEXING STRATEGY (BRIN Time-Series + GIN JSONB + GiST + B-Tree Covering)
-- ============================================================================
CREATE INDEX idx_ledger_entries_created_brin
    ON ledger_entries USING BRIN (created_at) WITH (pages_per_range = 32);

CREATE INDEX idx_security_audit_created_brin
    ON security_audit_logs USING BRIN (created_at) WITH (pages_per_range = 16);

CREATE INDEX idx_security_audit_metadata_gin
    ON security_audit_logs USING GIN (metadata_json jsonb_path_ops);

CREATE INDEX idx_transactions_sender_created_btree
    ON transactions USING BTREE (sender_account_id, created_at DESC)
    INCLUDE (amount, status, category);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) FOR ZERO-TRUST MULTI-TENANCY ACROSS ALL 12 BCNF TABLES
-- ============================================================================
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                FORCE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             FORCE ROW LEVEL SECURITY;
ALTER TABLE linked_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_bank_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         FORCE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries       FORCE ROW LEVEL SECURITY;
ALTER TABLE khata_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_entries        FORCE ROW LEVEL SECURITY;
ALTER TABLE milestone_deals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_deals      FORCE ROW LEVEL SECURITY;
ALTER TABLE autopay_mandates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopay_mandates     FORCE ROW LEVEL SECURITY;
ALTER TABLE credit_sanctions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sanctions     FORCE ROW LEVEL SECURITY;
ALTER TABLE fx_treasury_vaults   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_treasury_vaults   FORCE ROW LEVEL SECURITY;
ALTER TABLE dispute_chargebacks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_chargebacks  FORCE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs  FORCE ROW LEVEL SECURITY;

CREATE POLICY rls_users_tenant_isolation ON users
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_accounts_tenant_isolation ON accounts
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_linked_banks_tenant_isolation ON linked_bank_accounts
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_transactions_tenant_isolation ON transactions
    FOR ALL
    USING (
        sender_account_id IN (
            SELECT account_id FROM accounts WHERE user_id = current_setting('app.current_user_id', true)
        )
        OR receiver_account_id IN (
            SELECT account_id FROM accounts WHERE user_id = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY rls_ledger_entries_tenant_isolation ON ledger_entries
    FOR ALL
    USING (
        account_id IN (
            SELECT account_id FROM accounts WHERE user_id = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY rls_khata_entries_tenant_isolation ON khata_entries
    FOR ALL
    USING (
        creator_user_id = current_setting('app.current_user_id', true)
        OR peer_user_id = current_setting('app.current_user_id', true)
    );

CREATE POLICY rls_milestone_deals_tenant_isolation ON milestone_deals
    FOR ALL
    USING (buyer_user_id = current_setting('app.current_user_id', true))
    WITH CHECK (buyer_user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_autopay_mandates_tenant_isolation ON autopay_mandates
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_credit_sanctions_tenant_isolation ON credit_sanctions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_fx_treasury_public_read ON fx_treasury_vaults
    FOR SELECT
    USING (current_setting('app.current_user_id', true) IS NOT NULL);

CREATE POLICY rls_dispute_chargebacks_tenant_isolation ON dispute_chargebacks
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY rls_security_audit_logs_tenant_isolation ON security_audit_logs
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true));`;

export const AI_ARCHITECTURE_COMPARISON_MATRIX = [
  {
    code: 'AI-01',
    moduleName: 'Deterministic Spending Insights',
    toolContract: 'queryFinancialLedger',
    jainPayCapability:
      '100% deterministic TypeScript WoW/MoM math + natural-language summary with explicit date coverage.',
    incumbentGap:
      'GPay / PhonePe show static pie charts or hallucinated LLM math without ledger reconciliation.',
  },
  {
    code: 'AI-02',
    moduleName: 'Natural-Language Ledger Search',
    toolContract: 'queryFinancialLedger',
    jainPayCapability:
      'Translates Hinglish/English queries into schema-validated JSON filter predicates side-by-side with rows.',
    incumbentGap:
      'Paytm / GPay only support basic keyword substring matching on counterparty names.',
  },
  {
    code: 'AI-03',
    moduleName: 'Smart Category Budgets & Pace Alerts',
    toolContract: 'queryFinancialLedger',
    jainPayCapability:
      'Proactive month-end burn rate projection with 72% & 95% pace alerts per category.',
    incumbentGap:
      'Incumbents only notify AFTER a user has already overspent their monthly budget.',
  },
  {
    code: 'AI-04',
    moduleName: '48-Hour Predictive Cashflow Shortfall',
    toolContract: 'fetchBillDueStatus',
    jainPayCapability:
      'Detects upcoming BBPS bills due within 48h and stages payments without risky silent auto-debits.',
    incumbentGap:
      'UPI Autopay blindly triggers debits against low balances, causing bank bounce charges.',
  },
  {
    code: 'AI-05',
    moduleName: 'Zero-Trust Core Co-Pilot Tool Suite',
    toolContract: 'stagePeerPayment',
    jainPayCapability:
      'Strict Read/Stage-Only boundary: AI prepares payment drafts; 4-digit PBKDF2 PIN + Server executes.',
    incumbentGap:
      'Generic AI wrappers lack strict cryptographic separation between LLM output and ledger mutation.',
  },
  {
    code: 'AI-06',
    moduleName: 'Multimodal Utility Bill Vision OCR',
    toolContract: 'fetchBillDueStatus',
    jainPayCapability:
      'Extracts Biller, Consumer ID, Due Date & Amount into an Editable Confirmation Form before staging.',
    incumbentGap:
      'Requires manual typing of 10-12 digit consumer numbers for offline paper bills.',
  },
  {
    code: 'AI-07',
    moduleName: 'Behavioral Fraud & Anomaly Engine (FAD)',
    toolContract: 'inspectPaymentSafety',
    jainPayCapability:
      'Scores 15-min velocity, nocturnal hour, baseline ratio & new VPA into LOW / MEDIUM / CRITICAL tiers.',
    incumbentGap:
      'Opaque binary blocks without explainable telemetry or step-up biometric sliders.',
  },
  {
    code: 'AI-08',
    moduleName: 'Contextual-Bandit (LinUCB) Rewards',
    toolContract: 'queryFinancialLedger',
    jainPayCapability:
      'Optimizes voucher relevance via UCB exploration while keeping cashback ledger credits 100% deterministic.',
    incumbentGap:
      'CRED / GPay distribute repetitive "Better Luck Next Time" or irrelevant rummy coupons.',
  },
  {
    code: 'NEXT-01',
    moduleName: 'Multimodal Snap-and-Split Receipt Agent',
    toolContract: 'parseAndSplitReceipt',
    jainPayCapability:
      'Parses dining bills + Hinglish exclusions ("Rahul didn’t drink cold coffee") with proportional 5% GST.',
    incumbentGap:
      'GPay / Splitwise require manual line-by-line typing or naive equal division.',
  },
  {
    code: 'NEXT-02',
    moduleName: 'Conversational Net-Zero Khata IOU Tab',
    toolContract: 'proposeChatKhataEntry',
    jainPayCapability:
      'Maintains BCNF khata_entries with peer acknowledgment and settles N micro-IOUs in 1 net UPI transfer.',
    incumbentGap:
      'Clutters bank statements with dozens of ₹20–₹70 micro-transactions every week.',
  },
  {
    code: 'NEXT-03',
    moduleName: 'Pre-Flight Scam & Collect-Trap Shield',
    toolContract: 'inspectPaymentSafety',
    jainPayCapability:
      'Intercepts OLX "Scan QR to receive ₹4,000" traps by proving upi://pay?am=4000 ALWAYS debits money.',
    incumbentGap:
      'Shows tiny generic warnings that social-engineered users click past.',
  },
  {
    code: 'NEXT-04',
    moduleName: 'Any-Screenshot-to-Staged-Payment Engine',
    toolContract: 'extractPaymentIntentFromMedia',
    jainPayCapability:
      'Extracts VPA/amount from college fest posters AND checks 7-day ledger history for duplicate payments.',
    incumbentGap:
      'Scanning a poster twice happily double-pays the merchant without historical deduplication.',
  },
  {
    code: 'NEXT-05',
    moduleName: 'Interactive What-If Safe-to-Spend Simulator',
    toolContract: 'simulateSafeToSpend',
    jainPayCapability:
      'Live slider subtracting upcoming BBPS bills & budget reserves to show real-time runway days before/after.',
    incumbentGap:
      'Shows raw bank balance without accounting for rent and electricity due in 48 hours.',
  },
  {
    code: 'NEXT-06',
    moduleName: 'Milestone-Staged Trust Cards',
    toolContract: 'createMilestoneTrustCard',
    jainPayCapability:
      '2-step conditional P2P deal tracker (₹1,000 Advance -> Physical Handover -> ₹3,000 Final) linked to tx_ids.',
    incumbentGap:
      'Peer marketplace buyers have zero structured milestone tracking inside P2P chat.',
  },
  {
    code: 'NEXT-07',
    moduleName: 'Conversational Transaction Diagnostician',
    toolContract: 'diagnoseTransactionState',
    jainPayCapability:
      'Inspects idempotency_key & ledger_entries on timed-out payments to prove whether retrying is safe.',
    incumbentGap:
      'Leaves users anxious with "Wait 3–5 business days" boilerplate chatbot scripts.',
  },
];
