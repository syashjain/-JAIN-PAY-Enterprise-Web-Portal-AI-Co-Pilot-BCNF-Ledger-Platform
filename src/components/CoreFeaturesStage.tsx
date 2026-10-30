import React, { useState } from 'react';
import {
  AccountRecord,
  LedgerEntryRecord,
  LinkedBankAccountRecord,
  ScratchCardItem,
  StagedPaymentDraft,
  TransactionCategory,
  TransactionRecord,
  TransactionType,
  UserRecord,
} from '../types/domain';
import { CoreFeatureId } from '../data/pipelineMetadata';
import {
  computeBehavioralFraudScore,
  computePBKDF2HashHex,
  formatInr,
  generateSaltHex16Bytes,
  parseUpiUri,
  roundPaisa,
  validateRecipientIdentifier,
  verifyPinPBKDF2,
} from '../utils/ledgerEngine';
import { INDIAN_BANKS_DIRECTORY } from '../data/initialState';

const INDIAN_BANKS_LIST = INDIAN_BANKS_DIRECTORY;

const QR_TEST_PAYLOADS = [
  {
    id: 'qr_bluetokai',
    label: '1. Blue Tokai Merchant (₹280)',
    description: 'Valid NPCI UPI 2.0 Merchant URI (MC: 5812 • ₹280.00)',
    uri: 'upi://pay?pa=bluetokai@hdfcbank&pn=Blue%20Tokai%20Coffee&mc=5812&tr=BT90812&am=280.00&cu=INR',
    isScamTrap: false,
  },
  {
    id: 'qr_rahul',
    label: '2. Rahul Verma Peer QR (₹500)',
    description: 'Verified P2P VPA rahul@okaxis • ₹500.00',
    uri: 'upi://pay?pa=rahul@okaxis&pn=Rahul%20Verma&am=500.00&cu=INR',
    isScamTrap: false,
  },
  {
    id: 'qr_malformed',
    label: '3. Malformed / Tampered QR URI',
    description: 'Missing mandatory pa= param & negative amount (-900)',
    uri: 'upi://pay?pn=FakeMerchant&am=-900&cu=USD',
    isScamTrap: false,
  },
  {
    id: 'qr_olx_scam',
    label: '4. OLX Buyer Scam Trap (am=4000)',
    description: '"Scan QR & enter UPI PIN to RECEIVE ₹4,000 advance"',
    uri: 'upi://pay?pa=olx.army.buyer99@ybl&pn=OLX%20Verified%20Escrow%20Refund&am=4000.00&cu=INR&tn=Scan%20to%20Receive%20Rs%204000',
    isScamTrap: true,
  },
];

const TELECOM_5G_PLANS = [
  {
    id: 'jio_666',
    operator: 'Jio True 5G',
    vpa: 'jio.prepaid@bbps',
    dataBenefit: '1.5 GB/Day + Unlimited 5G',
    validity: '84 Days Validity • Unlimited Calls',
    amount: 666,
  },
  {
    id: 'airtel_349',
    operator: 'Airtel 5G Plus',
    vpa: 'airtel.prepaid@bbps',
    dataBenefit: '2.0 GB/Day + Unlimited 5G',
    validity: '28 Days Validity • Apollo 24|7',
    amount: 349,
  },
  {
    id: 'vi_479',
    operator: 'Vi Hero Unlimited',
    vpa: 'vi.prepaid@bbps',
    dataBenefit: '1.5 GB/Day + Weekend Rollover',
    validity: '56 Days Validity • Binge All Night',
    amount: 479,
  },
];

const BBPS_UTILITY_BILLERS = [
  {
    id: 'bbps_bescom',
    name: 'BESCOM Electricity',
    vpa: 'bescom@bbps',
    categoryLabel: 'Electricity',
    defaultAmount: 1850,
  },
  {
    id: 'bbps_jiofiber',
    name: 'JioFiber Broadband',
    vpa: 'jiofiber@bbps',
    categoryLabel: 'Broadband FTTH',
    defaultAmount: 1178.82,
  },
  {
    id: 'bbps_bwssb',
    name: 'BWSSB Water Board',
    vpa: 'bwssb.water@bbps',
    categoryLabel: 'Water Utility',
    defaultAmount: 490,
  },
];

import {
  Smartphone,
  KeyRound,
  Send,
  QrCode,
  ScanLine,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Clock,
  Sparkles,
  Building2,
  Zap,
  ShieldAlert,
} from 'lucide-react';

interface CoreFeaturesStageProps {
  selectedOption: CoreFeatureId;
  currentUser: UserRecord;
  activePin: string;
  walletAccount: AccountRecord;
  linkedBanks: LinkedBankAccountRecord[];
  transactions: TransactionRecord[];
  ledgerEntries: LedgerEntryRecord[];
  scratchCards: ScratchCardItem[];
  fadState: {
    velocity15Min: number;
    hourOfDay: number;
    amountRatioVsBaseline: number;
    isNewCounterparty: boolean;
  };
  onUpdateUserPin: (
    newPin: string,
    newSaltHex: string,
    newHashHex: string
  ) => void;
  onRecordOtpSessionVerified: (phone: string, otpCode: string) => void;
  onStagePayment: (draft: StagedPaymentDraft) => void;
  onInterceptScamQr: (uri: string, caption: string) => void;
  onOpenReceipt: (tx: TransactionRecord) => void;
  onTriggerRefund: (txId: string) => void;
  onSimulateBankTimeout: () => void;
  onAskCoPilotDiagnostician: (txId: string) => void;
  onAddBankAccount: (
    bankName: string,
    ifscCode: string,
    maskedAcct: string
  ) => void;
  onSetPrimaryBank: (bankAccountId: string) => void;
  onClaimScratchCard: (cardId: string) => void;
}

const QUICK_CONTACTS: Array<{
  name: string;
  vpa: string;
  category: TransactionCategory;
}> = [
  { name: 'Rahul Verma', vpa: 'rahul@okaxis', category: 'P2P Transfers' },
  { name: 'Pooja Sharma', vpa: 'pooja@icici', category: 'Food & Dining' },
  { name: 'Vikram Singh', vpa: 'vikram@hdfcbank', category: 'P2P Transfers' },
  { name: 'BESCOM Electricity', vpa: 'bescom@bbps', category: 'Utilities' },
];

export const CoreFeaturesStage: React.FC<CoreFeaturesStageProps> = ({
  selectedOption,
  currentUser,
  activePin,
  walletAccount,
  linkedBanks,
  transactions,
  ledgerEntries,
  scratchCards,
  fadState,
  onUpdateUserPin,
  onRecordOtpSessionVerified,
  onStagePayment,
  onInterceptScamQr,
  onOpenReceipt,
  onTriggerRefund,
  onSimulateBankTimeout,
  onAskCoPilotDiagnostician,
  onAddBankAccount,
  onSetPrimaryBank,
  onClaimScratchCard,
}) => {
  // CORE-A State: Phone OTP & PBKDF2 PIN Security
  const [phoneInput, setPhoneInput] = useState('9820411890');
  const [generatedOtp, setGeneratedOtp] = useState('482910');
  const [enteredOtp, setEnteredOtp] = useState('482910');
  const [otpFeedback, setOtpFeedback] = useState(
    'Session Active: +91-9820411890 bound to UID usr_yash_01.'
  );
  const [currentPinInput, setCurrentPinInput] = useState(activePin);
  const [newPinInput, setNewPinInput] = useState('5678');
  const [pinFeedback, setPinFeedback] = useState('');

  // CORE-B State: Send Money
  const [recipientName, setRecipientName] = useState('Rahul Verma');
  const [recipientVpa, setRecipientVpa] = useState('rahul@okaxis');
  const [amountStr, setAmountStr] = useState('500');
  const [note, setNote] = useState('Hostel Lab & Dinner Share');
  const [category, setCategory] =
    useState<TransactionCategory>('P2P Transfers');
  const [sendError, setSendError] = useState('');

  // CORE-C State: Dynamic UPI QR & Scanner
  const [receiveAmount, setReceiveAmount] = useState('250');
  const [copiedUri, setCopiedUri] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('');

  // CORE-D State: Activity Filter
  const [activeFilter, setActiveFilter] = useState<'ALL' | TransactionType>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // CORE-E State: Services & Rewards Sub-Tab
  const [serviceSubTab, setServiceSubTab] = useState<
    'RECHARGE_BBPS' | 'INDIAN_BANKS' | 'SCRATCH_REWARDS'
  >('RECHARGE_BBPS');
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const [customIfsc, setCustomIfsc] = useState(INDIAN_BANKS_LIST[0].ifscPrefix);
  const [last4Digits, setLast4Digits] = useState('4419');

  // ============================================================================
  // RENDER OPTION A: PHONE OTP SESSION & PBKDF2 PIN SECURITY
  // ============================================================================
  if (selectedOption === 'CORE-A') {
    const handleVerifyOtp = () => {
      if (enteredOtp.trim() !== generatedOtp) {
        setOtpFeedback(
          `INVALID_OTP_401: Entered OTP '${enteredOtp}' does not match issued code '${generatedOtp}'.`
        );
        return;
      }
      setOtpFeedback(
        `VERIFIED SESSION: +91-${phoneInput} bound to UID '${currentUser.user_id}' (RLS Tenant: usr_yash_01).`
      );
      onRecordOtpSessionVerified(`+91-${phoneInput}`, generatedOtp);
    };

    const handleRotatePin = (e: React.FormEvent) => {
      e.preventDefault();
      const check = verifyPinPBKDF2(
        currentPinInput,
        activePin,
        currentUser.pbkdf2_salt_hex
      );
      if (!check.isValid) {
        setPinFeedback(
          `HASH_MISMATCH_403: Current PIN must match active PIN (${activePin}).`
        );
        return;
      }
      if (!/^\d{4}$/.test(newPinInput.trim())) {
        setPinFeedback('New PIN must be exactly 4 digits.');
        return;
      }
      const freshSalt = generateSaltHex16Bytes();
      const freshHash = computePBKDF2HashHex(newPinInput.trim(), freshSalt);
      onUpdateUserPin(newPinInput.trim(), freshSalt, freshHash);
      setCurrentPinInput(newPinInput.trim());
      setPinFeedback(
        `ROTATED: New PIN '${newPinInput.trim()}' salted (0x${freshSalt.slice(
          0,
          10
        )}...) & hashed across 10,000 PBKDF2-HMAC-SHA256 iterations.`
      );
    };

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-6">
        <div className="border-b border-[#FF6A00]/20 pb-4">
          <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
            CORE-A • AUTHENTICATION &amp; CRYPTOGRAPHIC KEY DERIVATION
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Phone OTP Session &amp; PBKDF2-HMAC-SHA256 PIN Security
          </h2>
        </div>

        {/* Part 1: Phone OTP Simulator */}
        <div className="card-3d-sub rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#FF8800] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>1. Interactive Phone OTP Sign-In Simulator</span>
            </span>
            <span className="text-xs font-mono text-[#C8CAD0]">
              Tenant: {currentUser.user_id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="core-a-phone"
                className="block text-xs text-[#C8CAD0] mb-1"
              >
                +91 10-Digit Mobile Number
              </label>
              <input
                id="core-a-phone"
                type="text"
                maxLength={10}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label
                htmlFor="core-a-otp"
                className="block text-xs text-[#C8CAD0] mb-1"
              >
                6-Digit SMS OTP (Issued: {generatedOtp})
              </label>
              <input
                id="core-a-otp"
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#FF8800]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="py-2.5 px-5 rounded-full btn-blaze-orange text-xs"
            >
              Verify 6-Digit OTP &amp; Bind Session
            </button>
            <button
              type="button"
              onClick={() => {
                const code = Math.floor(
                  100000 + Math.random() * 900000
                ).toString();
                setGeneratedOtp(code);
                setEnteredOtp(code);
                setOtpFeedback(`Dispatched fresh SMS OTP (${code}) to +91-${phoneInput}.`);
              }}
              className="py-2 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/30 text-xs font-semibold text-white hover:border-[#FF6A00]"
            >
              Generate Fresh OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setEnteredOtp('000000');
                setOtpFeedback(
                  'INVALID_OTP_401: Simulated wrong 6-digit OTP rejected by Auth Gate.'
                );
              }}
              className="py-2 px-4 rounded-full bg-[#14141C] border border-white/15 text-xs text-[#C8CAD0] hover:text-white"
            >
              Simulate Invalid OTP
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#050507] border border-[#FF6A00]/30 text-xs font-mono text-[#FF8800]">
            {otpFeedback}
          </div>
        </div>

        {/* Part 2: PBKDF2 PIN Rotation */}
        <form
          onSubmit={handleRotatePin}
          className="card-3d-sub rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#FF8800] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              <span>2. Change Security PIN (updatePins • 10,000 Iterations)</span>
            </span>
            <span className="text-xs font-mono text-white font-bold">
              Active PIN: {activePin}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#050507] border border-white/10 text-[11px] font-mono space-y-1">
            <div className="text-[#C8CAD0] truncate">
              16-Byte Salt: <span className="text-[#FF8800]">0x{currentUser.pbkdf2_salt_hex}</span>
            </div>
            <div className="text-[#AEAEB7] truncate">
              PBKDF2 Digest: <span className="text-white">{currentUser.pbkdf2_pin_hash}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="core-a-cur-pin"
                className="block text-xs text-[#C8CAD0] mb-1"
              >
                Current 4-Digit PIN
              </label>
              <input
                id="core-a-cur-pin"
                type="text"
                maxLength={4}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label
                htmlFor="core-a-new-pin"
                className="block text-xs text-[#C8CAD0] mb-1"
              >
                New 4-Digit Wallet/UPI PIN
              </label>
              <input
                id="core-a-new-pin"
                type="text"
                maxLength={4}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#FF8800]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-full btn-blaze-orange text-xs"
            >
              Execute updatePins() • Rotate Salt &amp; PBKDF2 Hash
            </button>
            <button
              type="button"
              onClick={() => {
                const defaultSalt = '9f8e7d6c5b4a39281726354455667788';
                const defaultHash = computePBKDF2HashHex('1234', defaultSalt);
                onUpdateUserPin('1234', defaultSalt, defaultHash);
                setCurrentPinInput('1234');
                setPinFeedback('Restored default demo PIN to 1234.');
              }}
              className="py-2.5 px-4 rounded-full bg-[#14141C] border border-white/15 text-xs font-semibold text-[#C8CAD0] hover:text-white"
            >
              Restore Default 1234
            </button>
          </div>

          {pinFeedback && (
            <div className="p-3 rounded-xl bg-[#050507] border border-[#FF6A00]/40 text-xs font-mono text-[#FF8800]">
              {pinFeedback}
            </div>
          )}
        </form>
      </div>
    );
  }

  // ============================================================================
  // RENDER OPTION B: SEND MONEY & IDEMPOTENT DOUBLE-TAP PROTECTION
  // ============================================================================
  if (selectedOption === 'CORE-B') {
    const numericAmount = roundPaisa(Number(amountStr) || 0);
    const fadRisk = computeBehavioralFraudScore({
      velocity15Min: Math.max(
        fadState.velocity15Min,
        numericAmount > 5000 ? 6 : 2
      ),
      hourOfDay: fadState.hourOfDay,
      amountRatioVsBaseline: Math.max(
        fadState.amountRatioVsBaseline,
        numericAmount / 650
      ),
      isNewCounterparty:
        fadState.isNewCounterparty ||
        !QUICK_CONTACTS.some((c) => c.vpa === recipientVpa.trim().toLowerCase()),
    });

    const handleReviewPayment = (e: React.FormEvent) => {
      e.preventDefault();
      setSendError('');
      const check = validateRecipientIdentifier(recipientVpa);
      if (!check.valid) {
        setSendError(check.error || 'Invalid UPI VPA or mobile number.');
        return;
      }
      if (numericAmount <= 0 || numericAmount > 100000) {
        setSendError('Enter a valid amount between ₹1.00 and ₹1,00,000.00.');
        return;
      }
      onStagePayment({
        recipientName: recipientName.trim() || check.normalizedVpa,
        recipientVpa: check.normalizedVpa,
        amount: numericAmount,
        note: note.trim() || 'UPI Peer Transfer',
        txType: check.normalizedVpa.endsWith('@bbps') ? 'BILL_PAYMENT' : 'SEND',
        category,
        idempotencyKey: `uuid-v4-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        sourceModule: 'CORE-B',
      });
    };

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              CORE-B • ATOMIC DOUBLE-ENTRY TRANSFER &amp; UUID IDEMPOTENCY
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Send Money &amp; Idempotent Double-Tap Protection
            </h2>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-[#121218] border border-[#FF6A00]/40 text-xs font-mono text-[#FF8800] font-bold">
            Balance: {formatInr(walletAccount.available_balance)}
          </span>
        </div>

        <div>
          <div className="text-xs font-mono text-[#C8CAD0] mb-2.5">
            1-Click Verified Counterparty Presets:
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_CONTACTS.map((c) => {
              const active = recipientVpa === c.vpa;
              return (
                <button
                  key={c.vpa}
                  type="button"
                  onClick={() => {
                    setRecipientName(c.name);
                    setRecipientVpa(c.vpa);
                    setCategory(c.category);
                    setSendError('');
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'btn-blaze-orange'
                      : 'bg-[#14141C] border border-[#FF6A00]/25 text-[#F0F0F0] hover:border-[#FF6A00]'
                  }`}
                >
                  {c.name} ({c.vpa})
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleReviewPayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="core-b-vpa"
                className="block text-xs text-[#C8CAD0] mb-1.5"
              >
                Recipient UPI VPA or 10-Digit Mobile
              </label>
              <input
                id="core-b-vpa"
                type="text"
                value={recipientVpa}
                onChange={(e) => setRecipientVpa(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-4 py-3 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label
                htmlFor="core-b-amount"
                className="block text-xs text-[#C8CAD0] mb-1.5"
              >
                Amount (INR) — Deterministic Paisa Math
              </label>
              <input
                id="core-b-amount"
                type="number"
                step="0.01"
                min="1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-4 py-3 text-sm font-mono font-bold text-[#FF8800]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="core-b-name"
                className="block text-xs text-[#C8CAD0] mb-1.5"
              >
                Counterparty Display Name
              </label>
              <input
                id="core-b-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-4 py-3 text-xs text-white"
              />
            </div>
            <div>
              <label
                htmlFor="core-b-note"
                className="block text-xs text-[#C8CAD0] mb-1.5"
              >
                Ledger Narration Note
              </label>
              <input
                id="core-b-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-4 py-3 text-xs text-white"
              />
            </div>
          </div>

          {sendError && (
            <div className="p-3 rounded-xl bg-[#14141C] border border-[#FF5E00] text-xs text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF8800] shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#121218] border border-[#FF6A00]/25 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono">
              <span className="text-[#AEAEB7] block">
                AI-07 Pre-Flight Risk Check:
              </span>
              <span className="text-[#FF8800] font-bold">
                {fadRisk.tier} ({fadRisk.score}/100) — {fadRisk.enforcementAction}
              </span>
            </div>

            <button
              type="submit"
              className="py-3.5 px-7 rounded-full btn-blaze-orange text-xs flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>
                Stage &amp; Review Payment ({formatInr(numericAmount)})
              </span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // RENDER OPTION C: DYNAMIC UPI QR & PRE-FLIGHT SCANNER
  // ============================================================================
  if (selectedOption === 'CORE-C') {
    const generatedUpiUri = `upi://pay?pa=${
      walletAccount.vpa_address
    }&pn=Yash%20Jain&mc=0000&tr=JP20261025&cu=INR&am=${roundPaisa(
      Number(receiveAmount) || 0
    ).toFixed(2)}`;

    const handleTestQrPayload = (
      payload: (typeof QR_TEST_PAYLOADS)[number]
    ) => {
      const parsed = parseUpiUri(payload.uri);
      if (!parsed.isValid) {
        setScannerStatus(`BLOCKED BY UPIParser: ${parsed.errorReason}`);
        return;
      }
      if (payload.isScamTrap) {
        setScannerStatus(
          `INTERCEPTED COLLECT TRAP (${parsed.pa} • ₹${parsed.am}): Routed to NEXT-03 Scam Shield!`
        );
        onInterceptScamQr(
          payload.uri,
          `Scanned QR Code from ${parsed.pn} (${parsed.pa}) requesting ₹${parsed.am} with caption: "Scan QR and enter UPI PIN to RECEIVE ₹4,000"`
        );
        return;
      }
      setScannerStatus(
        `VERIFIED URI (${parsed.pa}): Staged ₹${parsed.am?.toFixed(
          2
        )} to ${parsed.pn}.`
      );
      onStagePayment({
        recipientName: parsed.pn,
        recipientVpa: parsed.pa,
        amount: parsed.am || 100,
        note: `QR Scan Payment (${parsed.mc ? `MC:${parsed.mc}` : 'P2P'})`,
        txType: 'SEND',
        category: parsed.mc === '5812' ? 'Food & Dining' : 'P2P Transfers',
        idempotencyKey: `uuid-qr-${Date.now()}`,
        sourceModule: 'CORE-C',
      });
    };

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-6">
        <div className="border-b border-[#FF6A00]/20 pb-4">
          <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
            CORE-C • NPCI UPI 2.0 URI SYNTHESIS &amp; PRE-FLIGHT QR SCANNER
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Dynamic UPI QR Generator &amp; Pre-Flight Scanner
          </h2>
        </div>

        {/* Dynamic QR Box */}
        <div className="card-3d-sub rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-4 flex flex-col items-center">
            <svg
              viewBox="0 0 120 120"
              className="w-32 h-32 bg-white p-2 rounded-2xl shadow-lg mb-2"
              aria-label="Dynamic UPI QR Code for yash@jainpay"
            >
              <rect x="8" y="8" width="28" height="28" fill="#050507" />
              <rect x="12" y="12" width="20" height="20" fill="#ffffff" />
              <rect x="16" y="16" width="12" height="12" fill="#050507" />
              <rect x="84" y="8" width="28" height="28" fill="#050507" />
              <rect x="88" y="12" width="20" height="20" fill="#ffffff" />
              <rect x="92" y="16" width="12" height="12" fill="#050507" />
              <rect x="8" y="84" width="28" height="28" fill="#050507" />
              <rect x="12" y="88" width="20" height="20" fill="#ffffff" />
              <rect x="16" y="92" width="12" height="12" fill="#050507" />
              <rect x="44" y="12" width="8" height="8" fill="#050507" />
              <rect x="60" y="12" width="12" height="8" fill="#050507" />
              <rect x="40" y="44" width="32" height="32" fill="#FF5E00" />
              <rect x="48" y="52" width="16" height="16" fill="#ffffff" />
              <rect x="80" y="48" width="24" height="8" fill="#050507" />
              <rect x="44" y="84" width="12" height="12" fill="#050507" />
              <rect x="64" y="88" width="16" height="16" fill="#050507" />
            </svg>
            <span className="text-xs font-mono font-bold text-[#FF8800]">
              yash@jainpay
            </span>
          </div>

          <div className="sm:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#FF8800]" />
                <label
                  htmlFor="core-c-amt"
                  className="text-xs font-semibold text-[#C8CAD0]"
                >
                  Request Amount (INR):
                </label>
                <input
                  id="core-c-amt"
                  type="number"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="w-28 bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedUpiUri);
                  setCopiedUri(true);
                  setTimeout(() => setCopiedUri(false), 1800);
                }}
                className="py-1.5 px-3.5 rounded-full bg-[#14141C] border border-[#FF6A00]/40 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                {copiedUri ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FF8800]" />
                    <span>Copied URI</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#FF8800]" />
                    <span>Copy URI</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#050507] border border-[#FF6A00]/30 text-xs font-mono text-[#FF8800] break-all">
              {generatedUpiUri}
            </div>
          </div>
        </div>

        {/* 4 Pre-Flight Scanner Presets */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-[#C8CAD0] flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-[#FF8800]" />
            <span>
              1-Click Web QR Scanner Presets (Tests UPIParser &amp; NEXT-03
              Collect-Trap Shield):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QR_TEST_PAYLOADS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTestQrPayload(item)}
                className="card-3d-sub p-4 rounded-2xl text-left hover:border-[#FF6A00] transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">
                    {item.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF5E00]/20 text-[10px] font-mono font-bold text-[#FF8800]">
                    Simulate Scan
                  </span>
                </div>
                <div className="text-xs text-[#AEAEB7]">{item.description}</div>
              </button>
            ))}
          </div>

          {scannerStatus && (
            <div className="p-3.5 rounded-xl bg-[#050507] border border-[#FF6A00] text-xs font-mono text-[#FF8800]">
              {scannerStatus}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER OPTION D: ACTIVITY LEDGER & AUTHORITATIVE SERVER REFUNDS
  // ============================================================================
  if (selectedOption === 'CORE-D') {
    const filtered = transactions.filter((t) => {
      if (activeFilter !== 'ALL' && t.tx_type !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.transaction_id.toLowerCase().includes(q) ||
          t.counterparty_name.toLowerCase().includes(q) ||
          t.counterparty_vpa.toLowerCase().includes(q) ||
          t.idempotency_key.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              CORE-D • IMMUTABLE AUDIT TRAIL &amp; COMPENSATING REVERSALS
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Activity History &amp; Authoritative Server Refunds
            </h2>
          </div>

          <button
            type="button"
            onClick={onSimulateBankTimeout}
            className="py-2 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/50 hover:border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800] flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Simulate Timed-Out Payment (BANK_TIMEOUT)</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                'ALL',
                'SEND',
                'BILL_PAYMENT',
                'CASHBACK',
                'REFUND',
              ] as Array<'ALL' | TransactionType>
            ).map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setActiveFilter(pill)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                  activeFilter === pill
                    ? 'btn-blaze-orange'
                    : 'bg-[#14141C] border border-white/15 text-[#C8CAD0]'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tx_id, VPA, UUID..."
            className="bg-[#050507] border border-[#FF6A00]/30 rounded-full px-4 py-1.5 text-xs text-white"
          />
        </div>

        {/* Compact Scrollable Transaction Cards */}
        <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
          {filtered.map((tx) => {
            const isCredit = tx.receiver_account_id === 'acc_yash_wallet';
            const canRefund =
              tx.status === 'SUCCESS' &&
              tx.sender_account_id === 'acc_yash_wallet' &&
              tx.tx_type !== 'REFUND';
            const entryCount = ledgerEntries.filter(
              (e) => e.transaction_id === tx.transaction_id
            ).length;

            return (
              <div
                key={tx.transaction_id}
                className="card-3d-sub p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {tx.counterparty_name}
                    </span>
                    <span className="text-[11px] font-mono text-[#AEAEB7]">
                      ({tx.counterparty_vpa})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#050507] border border-[#FF6A00]/30 text-[10px] font-mono text-[#FF8800]">
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#AEAEB7] mt-0.5">
                    {tx.transaction_id} • {entryCount} ledger_entries rows •{' '}
                    {tx.note}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-mono font-extrabold ${
                      isCredit ? 'text-[#FF8800]' : 'text-white'
                    }`}
                  >
                    {isCredit ? '+' : '-'}
                    {formatInr(tx.amount)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenReceipt(tx)}
                    className="py-1.5 px-3 rounded-full bg-[#14141C] border border-white/15 text-[11px] font-semibold text-white flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-[#FF8800]" />
                    <span>Receipt</span>
                  </button>

                  {canRefund && (
                    <button
                      type="button"
                      onClick={() => onTriggerRefund(tx.transaction_id)}
                      className="py-1.5 px-3 rounded-full btn-blaze-orange text-[11px] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Server Refund</span>
                    </button>
                  )}

                  {tx.status === 'PROCESSING' && (
                    <button
                      type="button"
                      onClick={() =>
                        onAskCoPilotDiagnostician(tx.transaction_id)
                      }
                      className="py-1.5 px-3 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-[11px] font-mono font-bold text-[#FF8800]"
                    >
                      Diagnose (NEXT-07)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER OPTION E: BBPS BILLS, 5G RECHARGE, INDIAN BANKS & SCRATCH REWARDS
  // ============================================================================
  return (
    <div className="card-3d-orange rounded-[28px] p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FF6A00]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
            CORE-E • ECOSYSTEM SERVICES, IFSC LINKING &amp; TREASURY REWARDS
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            BBPS Bills, 5G Recharge, Banks &amp; Scratch Cashback
          </h2>
        </div>
      </div>

      {/* Sub-Mode Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            id: 'RECHARGE_BBPS' as const,
            label: '1. 5G Recharge & BBPS Billers',
            icon: Zap,
          },
          {
            id: 'INDIAN_BANKS' as const,
            label: `2. Linked Indian Banks (${linkedBanks.length})`,
            icon: Building2,
          },
          {
            id: 'SCRATCH_REWARDS' as const,
            label: `3. Scratch Card Cashback (${
              scratchCards.filter((c) => !c.isScratched).length
            } Unscratched)`,
            icon: Sparkles,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = serviceSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setServiceSubTab(t.id)}
              className={`py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                active
                  ? 'btn-blaze-orange'
                  : 'bg-[#14141C] border border-[#FF6A00]/30 text-[#C8CAD0] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {serviceSubTab === 'RECHARGE_BBPS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <div className="text-xs font-mono font-bold text-[#FF8800]">
              5G Prepaid Packs (Jio / Airtel / Vi)
            </div>
            {TELECOM_5G_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="card-3d-sub p-3.5 rounded-2xl flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {plan.operator} • {plan.dataBenefit}
                  </div>
                  <div className="text-[11px] text-[#AEAEB7]">
                    {plan.validity}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onStagePayment({
                      recipientName: `${plan.operator} Prepaid`,
                      recipientVpa: plan.vpa,
                      amount: plan.amount,
                      note: `5G Recharge (${plan.validity})`,
                      txType: 'RECHARGE',
                      category: 'Utilities',
                      idempotencyKey: `uuid-rec-${plan.id}-${Date.now()}`,
                      sourceModule: 'CORE-E',
                    })
                  }
                  className="py-1.5 px-3.5 rounded-full btn-blaze-orange text-xs font-mono"
                >
                  {formatInr(plan.amount)}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-mono font-bold text-[#FF8800]">
              Bharat BillPay (BBPS) Utility Billers
            </div>
            {BBPS_UTILITY_BILLERS.map((b) => (
              <div
                key={b.id}
                className="card-3d-sub p-3.5 rounded-2xl flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-white">{b.name}</div>
                  <div className="text-[11px] font-mono text-[#AEAEB7]">
                    {b.vpa}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onStagePayment({
                      recipientName: b.name,
                      recipientVpa: b.vpa,
                      amount: b.defaultAmount,
                      note: `${b.categoryLabel} Bill Settlement`,
                      txType: 'BILL_PAYMENT',
                      category: 'Utilities',
                      idempotencyKey: `uuid-bbps-${b.id}-${Date.now()}`,
                      sourceModule: 'CORE-E',
                    })
                  }
                  className="py-1.5 px-3.5 rounded-full bg-[#14141C] border border-[#FF6A00]/40 hover:border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800]"
                >
                  Pay {formatInr(b.defaultAmount)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {serviceSubTab === 'INDIAN_BANKS' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {linkedBanks.map((bnk) => (
              <div
                key={bnk.bank_account_id}
                className="card-3d-sub p-4 rounded-2xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {bnk.bank_name} ({bnk.masked_account_number})
                  </div>
                  <div className="text-[11px] font-mono text-[#AEAEB7]">
                    IFSC: {bnk.ifsc_code} • Holder: {bnk.account_holder_name}
                  </div>
                </div>
                {bnk.is_primary ? (
                  <span className="px-3 py-1 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800]">
                    PRIMARY SETTLEMENT
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetPrimaryBank(bnk.bank_account_id)}
                    className="py-1.5 px-3.5 rounded-full bg-[#14141C] border border-white/20 text-xs text-white"
                  >
                    Set Primary
                  </button>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const bank = INDIAN_BANKS_LIST[selectedBankIdx];
              onAddBankAccount(
                bank.name,
                customIfsc.trim().toUpperCase(),
                `•••• •••• ${last4Digits.padStart(4, '0')}`
              );
            }}
            className="card-3d-sub p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label
                htmlFor="core-e-bank"
                className="block text-xs text-[#C8CAD0] mb-1"
              >
                Select Indian Bank
              </label>
              <select
                id="core-e-bank"
                value={selectedBankIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedBankIdx(idx);
                  setCustomIfsc(INDIAN_BANKS_LIST[idx].ifscPrefix);
                }}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-2 text-xs text-white"
              >
                {INDIAN_BANKS_LIST.map((b, idx) => (
                  <option key={b.name} value={idx} className="bg-[#0C0C10]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="core-e-ifsc"
                className="block text-xs text-[#C8CAD0] mb-1"
              >
                11-Char IFSC Code
              </label>
              <input
                id="core-e-ifsc"
                type="text"
                maxLength={11}
                value={customIfsc}
                onChange={(e) => setCustomIfsc(e.target.value)}
                className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 rounded-full btn-blaze-orange text-xs"
            >
              + Link Bank to BCNF
            </button>
          </form>
        </div>
      )}

      {serviceSubTab === 'SCRATCH_REWARDS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {scratchCards.map((card) => (
            <div
              key={card.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                card.isScratched
                  ? 'bg-[#121218] border-[#FF6A00]/50'
                  : 'bg-gradient-to-br from-[#231208] to-[#0C0C10] border-[#FF6A00]'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono text-[#FF8800] uppercase">
                  {card.merchantSponsor}
                </span>
                <div className="text-2xl font-mono font-extrabold text-white my-2">
                  {card.isScratched
                    ? `+${formatInr(card.rewardAmount)}`
                    : '₹ ??'}
                </div>
                <div className="text-xs text-[#C8CAD0] mb-4">{card.title}</div>
              </div>

              {card.isScratched ? (
                <span className="text-xs font-mono text-[#FF8800] font-bold">
                  ✓ CREDITED TO WALLET
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onClaimScratchCard(card.id)}
                  className="w-full py-2.5 px-3 rounded-full btn-blaze-orange text-xs"
                >
                  Scratch &amp; Credit +{formatInr(card.rewardAmount)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
