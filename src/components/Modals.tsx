import React, { useState } from 'react';
import {
  FcmPushToast,
  LedgerEntryRecord,
  StagedPaymentDraft,
  TransactionRecord,
} from '../types/domain';
import { formatInr, verifyPinPBKDF2 } from '../utils/ledgerEngine';
import {
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Fingerprint,
  BellRing,
  Stethoscope,
} from 'lucide-react';

// ============================================================================
// 1. FLOATING FCM PUSH NOTIFICATION & APP CHECK ATTESTATION TOAST
// ============================================================================
interface FcmToastContainerProps {
  toasts: FcmPushToast[];
  onDismiss: (id: string) => void;
}

export const FcmToastContainer: React.FC<FcmToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 w-96 max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto card-3d-orange rounded-2xl p-4 text-xs text-white"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 font-mono font-bold text-[#FF8800]">
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>{t.title}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="text-[#AEAEB7] hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[#D8DAE0] mb-1.5 leading-snug">
            {t.redactedLockScreenBody}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#FF8800] pt-1.5 border-t border-white/10">
            <span>✓ {t.attestationStatus}</span>
            <span>{t.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// 2. BALANCE PIN VERIFICATION MODAL (WITH 3-ATTEMPT RATE-LIMIT LOCKOUT)
// ============================================================================
interface BalancePinDialogProps {
  isOpen: boolean;
  activePin: string;
  saltHex: string;
  onClose: () => void;
  onVerified: (pin: string, auditTrail: string) => void;
}

export const BalancePinDialog: React.FC<BalancePinDialogProps> = ({
  isOpen,
  activePin,
  saltHex,
  onClose,
  onVerified,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntilMs, setLockedUntilMs] = useState<number | null>(null);

  if (!isOpen) return null;

  const isLockedOut = lockedUntilMs !== null && Date.now() < lockedUntilMs;
  const remainingLockSeconds = isLockedOut
    ? Math.max(1, Math.ceil((lockedUntilMs - Date.now()) / 1000))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      setErrorMsg(
        `RATE_LIMIT_429: Too many failed PIN attempts (3/3). Wallet PIN locked for ${remainingLockSeconds}s.`
      );
      return;
    }

    const res = verifyPinPBKDF2(pin, activePin, saltHex);
    if (!res.isValid) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 3) {
        const until = Date.now() + 30_000;
        setLockedUntilMs(until);
        setErrorMsg(
          `RATE_LIMIT_429: 3/3 failed PIN attempts! Wallet locked for 30s to prevent brute-force attacks.`
        );
      } else {
        setErrorMsg(
          `PBKDF2-HMAC-SHA256 Hash Mismatch (${nextFailures}/3 attempts)! Enter active PIN: ${activePin}`
        );
      }
      return;
    }

    setErrorMsg('');
    setFailedAttempts(0);
    setLockedUntilMs(null);
    setPin('');
    onVerified(pin, res.auditTrail);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="balance-pin-dialog-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md card-3d-orange rounded-[28px] p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#FF8800]" />
            <h2
              id="balance-pin-dialog-title"
              className="text-lg font-extrabold tracking-tight"
            >
              Verify 4-Digit Wallet PIN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PIN dialog"
            className="p-1.5 rounded-full bg-[#14141C] text-[#C8CAD0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#C8CAD0] mb-4 leading-relaxed">
          Jain Pay enforces server-side{' '}
          <code className="font-mono text-[#FF8800]">
            PBKDF2-HMAC-SHA256 (10,000 iterations)
          </code>{' '}
          with a 3-strike rate-limit lockout before projecting{' '}
          <code className="font-mono">available_balance</code>. Active Demo PIN:{' '}
          <strong className="text-[#FF8800] font-mono">{activePin}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={4}
            disabled={isLockedOut}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            autoFocus
            className="w-full bg-[#050507] border border-[#FF6A00]/40 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-[#FF8800] focus:outline-none focus:border-[#FF6A00] disabled:opacity-40"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setFailedAttempts(0);
                setLockedUntilMs(null);
                setPin(activePin);
                const res = verifyPinPBKDF2(activePin, activePin, saltHex);
                if (res.isValid) {
                  setErrorMsg('');
                  setPin('');
                  onVerified(activePin, res.auditTrail);
                }
              }}
              className="text-xs font-mono text-[#FF8800] hover:underline"
            >
              [Auto-fill Active PIN: {activePin}]
            </button>

            {(failedAttempts > 0 || isLockedOut) && (
              <button
                type="button"
                onClick={() => {
                  setFailedAttempts(0);
                  setLockedUntilMs(null);
                  setErrorMsg('');
                }}
                className="text-xs font-mono text-[#10B981] hover:underline"
              >
                [Reset Demo Lockout]
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#1A0D08] border border-[#FF5E00] text-xs font-mono text-[#FF8800]">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLockedOut}
            className="w-full py-3.5 px-5 rounded-full btn-blaze-orange text-xs disabled:opacity-40"
          >
            {isLockedOut
              ? `Locked Out (3/3 Attempts — Wait ${remainingLockSeconds}s)`
              : 'Verify PBKDF2 Hash & Unlock Balance'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 3. PAYMENT REVIEW & IDEMPOTENT EXECUTION MODAL (WITH 3-ATTEMPT RATE LIMIT)
// ============================================================================
interface PaymentReviewModalProps {
  draft: StagedPaymentDraft | null;
  activePin: string;
  saltHex: string;
  onClose: () => void;
  onExecutePayment: (pinInput: string, isDoubleTapReplayTest: boolean) => void;
  riskTier: 'LOW' | 'MEDIUM' | 'CRITICAL';
  riskScore: number;
}

export const PaymentReviewModal: React.FC<PaymentReviewModalProps> = ({
  draft,
  activePin,
  saltHex,
  onClose,
  onExecutePayment,
  riskTier,
  riskScore,
}) => {
  const [pin, setPin] = useState(activePin);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [softHoldConfirmed, setSoftHoldConfirmed] = useState(false);
  const [pinError, setPinError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntilMs, setLockedUntilMs] = useState<number | null>(null);

  if (!draft) return null;

  const isLockedOut = lockedUntilMs !== null && Date.now() < lockedUntilMs;
  const remainingLockSeconds = isLockedOut
    ? Math.max(1, Math.ceil((lockedUntilMs - Date.now()) / 1000))
    : 0;

  const canSubmit =
    !isLockedOut &&
    (riskTier === 'LOW' ||
      (riskTier === 'MEDIUM' && biometricVerified) ||
      (riskTier === 'CRITICAL' && softHoldConfirmed)) &&
    pin.trim().length === 4;

  const handleConfirm = (isReplay: boolean) => {
    if (isLockedOut) {
      setPinError(
        `RATE_LIMIT_429: Payment authorization locked for ${remainingLockSeconds}s after 3 failed PIN attempts.`
      );
      return;
    }

    const check = verifyPinPBKDF2(pin, activePin, saltHex);
    if (!check.isValid) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 3) {
        setLockedUntilMs(Date.now() + 30_000);
        setPinError(
          `RATE_LIMIT_429: 3/3 failed PIN attempts! Authorization locked for 30s.`
        );
      } else {
        setPinError(
          `Invalid PIN (${nextFailures}/3 attempts)! Expected active PBKDF2 PIN: ${activePin}`
        );
      }
      return;
    }
    setPinError('');
    setFailedAttempts(0);
    setLockedUntilMs(null);
    onExecutePayment(pin, isReplay);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-review-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg card-3d-orange rounded-[28px] p-8 text-white space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block">
              ZERO-TRUST HUMAN-IN-THE-LOOP AUTHORIZATION
            </span>
            <h2
              id="payment-review-modal-title"
              className="text-xl font-extrabold"
            >
              Confirm Staged UPI Transfer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Payment Review Modal"
            className="p-1.5 rounded-full bg-[#14141C] text-[#C8CAD0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="card-3d-sub p-5 rounded-2xl space-y-2.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Recipient Counterparty:</span>
            <span className="text-white font-bold">
              {draft.recipientName} ({draft.recipientVpa})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Amount (Deterministic INR):</span>
            <span className="text-xl font-extrabold text-[#FF8800]">
              {formatInr(draft.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">UUIDv4 Idempotency Key:</span>
            <span className="text-[#C8CAD0] truncate max-w-[240px]">
              {draft.idempotencyKey}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">AI-07 Behavioral Risk:</span>
            <span className="text-[#FF8800] font-bold">
              {riskTier} ({riskScore}/100)
            </span>
          </div>
        </div>

        {riskTier === 'MEDIUM' && (
          <div className="p-4 rounded-2xl bg-[#1C1208] border border-[#FF6A00] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#FF8800] shrink-0" />
              <span>
                MEDIUM Risk Step-Up: Biometric Hardware Attestation Required
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBiometricVerified(true)}
              className="py-1.5 px-3.5 rounded-full btn-blaze-orange text-xs"
            >
              {biometricVerified ? '✓ Verified' : 'Simulate Biometric'}
            </button>
          </div>
        )}

        {riskTier === 'CRITICAL' && (
          <label className="p-4 rounded-2xl bg-[#261008] border border-[#FF5E00] flex items-start gap-2.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={softHoldConfirmed}
              onChange={(e) => setSoftHoldConfirmed(e.target.checked)}
              className="accent-[#FF6A00] mt-0.5"
            />
            <span>
              CRITICAL Risk Soft-Hold Override: I confirm this transfer is not
              under coercion or social-engineering collect scam.
            </span>
          </label>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="review-pin-input"
              className="block text-xs font-mono text-[#C8CAD0]"
            >
              Enter 4-Digit UPI PIN (Active PIN: {activePin})
            </label>
            {(failedAttempts > 0 || isLockedOut) && (
              <button
                type="button"
                onClick={() => {
                  setFailedAttempts(0);
                  setLockedUntilMs(null);
                  setPinError('');
                  setPin(activePin);
                }}
                className="text-xs font-mono text-[#10B981] hover:underline"
              >
                [Reset Demo Lockout]
              </button>
            )}
          </div>
          <input
            id="review-pin-input"
            type="password"
            maxLength={4}
            disabled={isLockedOut}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-[#050507] border border-[#FF6A00]/40 rounded-2xl px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-[#FF8800] disabled:opacity-40"
          />
        </div>

        {pinError && (
          <div className="p-3 rounded-xl bg-[#1A0D08] border border-[#FF5E00] text-xs font-mono text-[#FF8800]">
            {pinError}
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => handleConfirm(false)}
            className="w-full py-3.5 px-5 rounded-full btn-blaze-orange text-xs disabled:opacity-40"
          >
            Authorize &amp; Commit Double-Entry Transfer (
            {formatInr(draft.amount)})
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => handleConfirm(true)}
            className="w-full py-3 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/50 hover:border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800] disabled:opacity-40"
          >
            ⚡ Test Idempotent Double-Tap Replay (Same UUID Key — 0 Extra Debit)
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. AUTHORITATIVE RECEIPT & DOUBLE-ENTRY AUDIT MODAL
// ============================================================================
interface ReceiptModalProps {
  transaction: TransactionRecord | null;
  ledgerEntries: LedgerEntryRecord[];
  replayNotice: string | null;
  onClose: () => void;
  onTriggerRefund: (txId: string) => void;
  onDiagnoseInChat: (txId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  ledgerEntries,
  replayNotice,
  onClose,
  onTriggerRefund,
  onDiagnoseInChat,
}) => {
  if (!transaction) return null;

  const matchedEntries = ledgerEntries.filter(
    (e) => e.transaction_id === transaction.transaction_id
  );
  const canRefund =
    transaction.status === 'SUCCESS' &&
    transaction.sender_account_id === 'acc_yash_wallet' &&
    transaction.tx_type !== 'REFUND';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl card-3d-orange rounded-[28px] p-8 text-white space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#FF8800]" />
            <div>
              <span className="text-xs font-mono text-[#FF8800] font-bold block">
                AUTHORITATIVE BCNF LEDGER RECEIPT
              </span>
              <h2 id="receipt-modal-title" className="text-lg font-extrabold">
                {transaction.transaction_id} • {transaction.status}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Receipt Modal"
            className="p-1.5 rounded-full bg-[#14141C] text-[#C8CAD0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {replayNotice && (
          <div className="p-3.5 rounded-2xl bg-[#241208] border border-[#FF6A00] text-xs font-mono text-[#FF8800]">
            <ShieldCheck className="w-4 h-4 inline mr-1.5" />
            {replayNotice}
          </div>
        )}

        <div className="card-3d-sub p-4 rounded-2xl text-xs font-mono space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Counterparty:</span>
            <span className="text-white font-bold">
              {transaction.counterparty_name} ({transaction.counterparty_vpa})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Amount Settled:</span>
            <span className="text-lg font-extrabold text-[#FF8800]">
              {formatInr(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Idempotency Key:</span>
            <span className="text-[#C8CAD0]">{transaction.idempotency_key}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">NPCI UTR Reference:</span>
            <span className="text-white">{transaction.reference_utr}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono font-bold text-[#FF8800]">
            Matched Double-Entry Rows in public.ledger_entries (
            {matchedEntries.length} rows):
          </div>
          {matchedEntries.map((e) => (
            <div
              key={e.entry_id}
              className="p-3 rounded-xl bg-[#050507] border border-[#FF6A00]/30 font-mono text-xs flex justify-between"
            >
              <span>
                {e.entry_id} ({e.account_id})
              </span>
              <span className="text-[#FF8800] font-bold">
                {e.debit_amount > 0
                  ? `DR -${formatInr(e.debit_amount)}`
                  : `CR +${formatInr(e.credit_amount)}`}{' '}
                (Bal: {formatInr(e.balance_after)})
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {canRefund && (
            <button
              type="button"
              onClick={() => {
                onTriggerRefund(transaction.transaction_id);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-full btn-blaze-orange text-xs flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Trigger Authoritative Server Refund</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onDiagnoseInChat(transaction.transaction_id);
              onClose();
            }}
            className="py-3 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/40 text-xs font-mono font-bold text-[#FF8800] flex items-center gap-1.5"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Inspect in NEXT-07 Diagnostician</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. NEXT-03 PRE-FLIGHT SCAM & COLLECT-TRAP EXPLAINABLE THREAT MODAL
// ============================================================================
interface ScamShieldInterceptionModalProps {
  payload: { uri: string; chatMessage: string } | null;
  onClose: () => void;
  onOverrideAndStage: (uri: string) => void;
}

export const ScamShieldInterceptionModal: React.FC<
  ScamShieldInterceptionModalProps
> = ({ payload, onClose, onOverrideAndStage }) => {
  const [ackChecked, setAckChecked] = useState(false);

  if (!payload) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="NEXT-03 Pre-Flight Scam Shield Threat Card"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="card-3d-orange rounded-[28px] max-w-xl w-full p-7 space-y-5 border-2 border-[#FF5E00]">
        <div className="flex items-start justify-between gap-3 border-b border-[#FF6A00]/30 pb-4">
          <div>
            <span className="text-xs font-mono font-extrabold text-[#FF8800] block">
              ⚠️ NEXT-03 PRE-FLIGHT SCAM &amp; SOCIAL-ENGINEERING INTERCEPTION
            </span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              High-Contrast Explainable Threat Card
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#14141C] text-[#C8CAD0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#050507] border border-white/10 text-xs space-y-1.5">
          <div className="font-mono text-[#FF8800] font-bold">
            Intercepted URI &amp; Social-Engineering Context:
          </div>
          <div className="font-mono text-[11px] text-[#C8CAD0] break-all">
            {payload.uri}
          </div>
          <div className="text-white italic pt-1">{payload.chatMessage}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#261005] border border-[#FF6A00] space-y-2 text-xs">
          <div className="font-mono font-extrabold text-[#FF8800]">
            ENGLISH EXPLAINABLE CONTRADICTION (PRD 2.3c):
          </div>
          <p className="text-white leading-relaxed font-semibold">
            &ldquo;Warning: Entering your PIN on a QR scan ALWAYS sends money
            out of your account; it never receives money.&rdquo;
          </p>
          <div className="font-mono font-extrabold text-[#FF8800] pt-1">
            HINGLISH EXPLAINABLE CONTRADICTION:
          </div>
          <p className="text-[#F0F0F0] leading-relaxed">
            &ldquo;सावधान: QR स्कैन करके UPI PIN डालने से पैसे हमेशा आपके खाते
            से कटते हैं, कभी मिलते नहीं हैं!&rdquo;
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-[#121218] border border-[#FF6A00]/30 text-xs text-[#D8DAE0]">
          <input
            type="checkbox"
            checked={ackChecked}
            onChange={(e) => setAckChecked(e.target.checked)}
            className="mt-0.5 accent-[#FF5E00]"
          />
          <span>
            I explicitly acknowledge that this URI will <strong>DEBIT</strong>{' '}
            money from my account and is not a refund or incoming credit.
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-full btn-blaze-orange text-xs"
          >
            🛡️ Block Scam &amp; Protect My Wallet (Recommended)
          </button>
          <button
            type="button"
            disabled={!ackChecked}
            onClick={() => {
              const uri = payload.uri;
              setAckChecked(false);
              onClose();
              onOverrideAndStage(uri);
            }}
            className={`py-3 px-4 rounded-full text-xs font-mono ${
              ackChecked
                ? 'bg-[#14141C] border border-[#FF6A00] text-[#FF8800] hover:text-white'
                : 'bg-[#0C0C10] border border-white/10 text-[#60606C] cursor-not-allowed'
            }`}
          >
            Proceed to Review Screen →
          </button>
        </div>
      </div>
    </div>
  );
};

