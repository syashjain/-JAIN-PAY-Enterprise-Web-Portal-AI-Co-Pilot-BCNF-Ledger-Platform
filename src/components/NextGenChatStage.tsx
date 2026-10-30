import React, { useState } from 'react';
import {
  AiToolCallLog,
  KhataEntryRecord,
  LedgerEntryRecord,
  MilestoneDealRecord,
  StagedPaymentDraft,
  TransactionRecord,
} from '../types/domain';
import { NextGenFeatureId } from '../data/pipelineMetadata';
import {
  computeNetKhataSummary,
  computeProportionalBillSplit,
  computeSafeToSpendSimulation,
  diagnoseTransactionDeterministically,
  formatInr,
  roundPaisa,
} from '../utils/ledgerEngine';
import {
  Receipt,
  BookOpen,
  ShieldAlert,
  Image,
  Gauge,
  Handshake,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Sparkles,
  Share2,
} from 'lucide-react';

interface NextGenChatStageProps {
  selectedFeature: NextGenFeatureId;
  availableBalance: number;
  transactions: TransactionRecord[];
  ledgerEntries: LedgerEntryRecord[];
  khataEntries: KhataEntryRecord[];
  milestoneDeals: MilestoneDealRecord[];
  diagnosedTxId: string;
  onSelectDiagnosedTxId: (txId: string) => void;
  onStagePayment: (draft: StagedPaymentDraft) => void;
  onProposeKhataEntry: (
    peerId: string,
    peerName: string,
    peerVpa: string,
    direction: 'PEER_OWES_USER' | 'USER_OWES_PEER',
    amount: number,
    description: string
  ) => void;
  onAcknowledgeKhataEntry: (khataId: string) => void;
  onCreateMilestoneDeal: (
    sellerName: string,
    sellerVpa: string,
    itemTitle: string,
    advanceAmount: number,
    finalAmount: number
  ) => void;
  onConfirmMilestoneHandover: (dealId: string) => void;
  onInterceptScamQr: (uri: string, chatMessage: string) => void;
  onSimulateBankTimeout: () => void;
  onLogAiToolCall: (
    moduleCode: AiToolCallLog['moduleCode'],
    toolName: AiToolCallLog['toolName'],
    req: Record<string, unknown>,
    res: Record<string, unknown>
  ) => void;
}

const SNAP_SPLIT_PARTICIPANTS = [
  { id: 'usr_yash_01', name: 'Yash (You)' },
  { id: 'usr_rahul_02', name: 'Aman / Rahul' },
  { id: 'usr_pooja_03', name: 'Pooja' },
];

const INITIAL_RECEIPT_LINES = [
  {
    id: 'item_paneer',
    name: 'Paneer Tikka Starter (qty: 1 • unit: ₹320)',
    price: 320,
    claimedByUserIds: ['usr_yash_01', 'usr_rahul_02', 'usr_pooja_03'],
  },
  {
    id: 'item_coffee',
    name: '2x Cold Coffee (qty: 2 • unit: ₹90)',
    price: 180,
    claimedByUserIds: ['usr_yash_01', 'usr_pooja_03'],
  },
  {
    id: 'item_noodles',
    name: '3x Veg Hakka Noodles (qty: 3 • unit: ₹250)',
    price: 750,
    claimedByUserIds: ['usr_yash_01', 'usr_rahul_02', 'usr_pooja_03'],
  },
];

const PRD_SCAM_SCENARIOS = [
  {
    id: 'scam_olx_qr',
    badge: 'PRD 2.3 Scenario 1 • Fake OLX Buyer QR',
    title: 'OLX Army Buyer "Scan QR to Receive ₹5,000 Refund/Advance"',
    senderHandle: 'olx.army.buyer99@ybl',
    amount: 5000,
    uri: 'upi://pay?pa=olx.army.buyer99@ybl&pn=OLX%20Verified%20Escrow%20Refund&am=5000.00&cu=INR&tn=Scan%20to%20Receive%20Rs%205000',
    messageText:
      '"Brother I am Indian Army officer buying your sofa. Scan this QR code and enter your UPI PIN to RECEIVE ₹5,000 refund/advance in your bank account immediately."',
    contradictionEn:
      'Warning: Entering your PIN on a QR scan ALWAYS sends money out of your account; it never receives money (upi://pay?am=5000.00 is a DEBIT instruction).',
    contradictionHi:
      'सावधान (Hinglish): QR scan karke UPI PIN dalne se paise HAMESHA aapke account se kat-te hain, kabhi receive nahi hote!',
  },
  {
    id: 'scam_electricity_sms',
    badge: 'PRD 2.3 Scenario 2 • Fake Electricity Disconnection SMS',
    title: 'Fake BESCOM 9:30 PM Power Disconnection Threat SMS',
    senderHandle: '9811009988@ybl',
    amount: 1850,
    uri: 'upi://pay?pa=9811009988@ybl&pn=Electricity%20Officer%20Personal&am=1850.00&cu=INR&tn=Urgent%20Power%20Reconnection',
    messageText:
      '"Dear Consumer, your BESCOM electricity power will be disconnected tonight at 9:30 PM as previous bill was not updated. Immediately pay ₹1,850 to personal officer VPA 9811009988@ybl."',
    contradictionEn:
      'Warning: Official BBPS utilities (bescom@bbps) never ask for payments to personal 10-digit mobile VPAs (9811009988@ybl) or threaten 9:30 PM disconnection via SMS.',
    contradictionHi:
      'सावधान (Hinglish): Sarkari bijli board kabhi bhi personal mobile number VPA par paise mangne ka SMS nahi bhejta!',
  },
  {
    id: 'scam_family_hospital',
    badge: 'PRD 2.3 Scenario 3 • Urgent Family Impersonation',
    title: 'WhatsApp Family Hospital Emergency Impersonation',
    senderHandle: 'urgent.medical.help@okaxis',
    amount: 8000,
    uri: 'upi://pay?pa=urgent.medical.help@okaxis&pn=Unknown%20Mule%20Account&am=8000.00&cu=INR&tn=Hospital%20ICU%20Deposit',
    messageText:
      '"Beta this is Papa\'s friend, your father is in ICU and my UPI limit is exhausted. Send ₹8,000 immediately to urgent.medical.help@okaxis and I will return it in 10 mins."',
    contradictionEn:
      'Warning: First-time unverified counterparty (urgent.medical.help@okaxis) combined with high-urgency emotional coercion ("ICU", "immediately"). Call family directly before entering PIN.',
    contradictionHi:
      'सावधान (Hinglish): Anjaan VPA aur hospital emergency ke naam par turant paise mat bhejein—pehle phone call karke confirm karein!',
  },
];

const SHARE_SHEET_MEDIA_PRESETS = [
  {
    id: 'poster_hackverse',
    label: '1. Event Poster with UPI ID (VIT HackVerse • ₹500 — Duplicate Check!)',
    mediaType: 'Shared Event Poster (Instagram / WhatsApp)',
    recipientName: 'VIT HackVerse Registration',
    recipientVpa: 'techfest@sbi',
    amount: 500,
    note: 'Team Entry Fee (Extracted from Poster)',
  },
  {
    id: 'kirana_handwritten',
    label: '2. Handwritten Vendor Bill on WhatsApp (Sharma Kirana • ₹430)',
    mediaType: 'Shared WhatsApp Photo (Handwritten Slip)',
    recipientName: 'Sharma Kirana & Dairy',
    recipientVpa: 'sharmakirana@icici',
    amount: 430,
    note: 'Monthly Milk, Bread & Grocery Slip',
  },
  {
    id: 'sms_phone_snippet',
    label: '3. Text Snippet with Phone Number & Amount (Badminton Court • ₹750)',
    mediaType: 'Shared Android Text Selection',
    recipientName: 'Rahul Verma (Court Booking)',
    recipientVpa: 'rahul@okaxis',
    amount: 750,
    note: 'Badminton Court Booking (Phone: 9811204912)',
  },
];

export const NextGenChatStage: React.FC<NextGenChatStageProps> = ({
  selectedFeature,
  availableBalance,
  transactions,
  ledgerEntries,
  khataEntries,
  milestoneDeals,
  diagnosedTxId,
  onSelectDiagnosedTxId,
  onStagePayment,
  onProposeKhataEntry,
  onAcknowledgeKhataEntry,
  onCreateMilestoneDeal,
  onConfirmMilestoneHandover,
  onInterceptScamQr,
  onSimulateBankTimeout,
  onLogAiToolCall,
}) => {
  // NEXT-01 State
  const [receiptLines, setReceiptLines] = useState(INITIAL_RECEIPT_LINES);
  const [activeHinglishConstraint, setActiveHinglishConstraint] = useState(
    'PRD 2.1 Prompt: "Aman didn\'t have the cold coffee, split the rest equally between the three of us."'
  );

  // NEXT-02 State
  const [khataDirection, setKhataDirection] = useState<
    'PEER_OWES_USER' | 'USER_OWES_PEER'
  >('PEER_OWES_USER');
  const [khataAmount, setKhataAmount] = useState('60');
  const [khataDesc, setKhataDesc] = useState(
    'Paid ₹120 for auto, split 50-50'
  );

  // NEXT-03 State
  const [selectedScamIdx, setSelectedScamIdx] = useState(0);

  // NEXT-04 State
  const [selectedPosterIdx, setSelectedPosterIdx] = useState(0);

  // NEXT-05 State (Defaults to PRD ₹3,500 Headphones example!)
  const [hypotheticalSpend, setHypotheticalSpend] = useState(3500);
  const [hypotheticalItemLabel, setHypotheticalItemLabel] = useState(
    '₹3,500 Sony Wireless Headphones (PRD 2.5 Example)'
  );

  // NEXT-06 State
  const [newDealTitle, setNewDealTitle] = useState(
    'Second-Hand Keychron K2 Mechanical Keyboard'
  );
  const [newDealAdvance, setNewDealAdvance] = useState('500');
  const [newDealFinal, setNewDealFinal] = useState('1500');

  // ============================================================================
  // NEXT-01: MULTIMODAL "SNAP-AND-SPLIT" ITEMIZED BILL AGENT
  // ============================================================================
  if (selectedFeature === 'NEXT-01') {
    const splitResult = computeProportionalBillSplit({
      items: receiptLines,
      participants: SNAP_SPLIT_PARTICIPANTS,
      taxAmount: 62.5,
      discountAmount: 112.5,
    });

    const toggleParticipantOnLine = (lineId: string, userId: string) => {
      setReceiptLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line;
          const exists = line.claimedByUserIds.includes(userId);
          const nextIds = exists
            ? line.claimedByUserIds.filter((id) => id !== userId)
            : [...line.claimedByUserIds, userId];
          return {
            ...line,
            claimedByUserIds: nextIds.length > 0 ? nextIds : [userId],
          };
        })
      );
    };

    const yashShare =
      splitResult.shares.find((s) => s.userId === 'usr_yash_01')?.finalShare ||
      400;

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              NEXT-01 • ITEM-CLAIM COMPOSE CARD &amp; PROPORTIONAL TAX ENGINE
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Multimodal &ldquo;Snap-and-Split&rdquo; Itemized Bill Agent
            </h2>
          </div>
          <Receipt className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* Exact PRD 2.1 Hinglish Constraint Presets */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-[#C8CAD0]">
            1-Click Hinglish / English Exclusion Prompts (PRD Section 2.1):
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReceiptLines([
                  {
                    id: 'item_paneer',
                    name: 'Paneer Tikka Starter (qty: 1 • unit: ₹320)',
                    price: 320,
                    claimedByUserIds: [
                      'usr_yash_01',
                      'usr_rahul_02',
                      'usr_pooja_03',
                    ],
                  },
                  {
                    id: 'item_coffee',
                    name: '2x Cold Coffee (qty: 2 • unit: ₹90)',
                    price: 180,
                    claimedByUserIds: ['usr_yash_01', 'usr_pooja_03'],
                  },
                  {
                    id: 'item_noodles',
                    name: '3x Veg Hakka Noodles (qty: 3 • unit: ₹250)',
                    price: 750,
                    claimedByUserIds: [
                      'usr_yash_01',
                      'usr_rahul_02',
                      'usr_pooja_03',
                    ],
                  },
                ]);
                setActiveHinglishConstraint(
                  'PRD 2.1 Exact Prompt: "Aman didn\'t have the cold coffee, split the rest equally between the three of us."'
                );
                onLogAiToolCall(
                  'NEXT-01',
                  'parseAndSplitReceipt',
                  {
                    prompt:
                      "Aman didn't have the cold coffee, split the rest equally between the three of us.",
                  },
                  { grandTotal: 1200, taxAmount: 62.5, discountAmount: 112.5 }
                );
              }}
              className="px-3.5 py-1.5 rounded-full btn-blaze-orange text-xs"
            >
              1. &ldquo;Aman didn&apos;t have the cold coffee, split the rest
              equally&rdquo; (PRD Exact)
            </button>

            <button
              type="button"
              onClick={() => {
                setReceiptLines([
                  {
                    id: 'item_paneer',
                    name: 'Paneer Tikka Starter (qty: 1 • unit: ₹320)',
                    price: 320,
                    claimedByUserIds: ['usr_yash_01', 'usr_pooja_03'],
                  },
                  {
                    id: 'item_coffee',
                    name: '2x Cold Coffee (qty: 2 • unit: ₹90)',
                    price: 180,
                    claimedByUserIds: ['usr_yash_01', 'usr_pooja_03'],
                  },
                  {
                    id: 'item_noodles',
                    name: '3x Veg Hakka Noodles (qty: 3 • unit: ₹250)',
                    price: 750,
                    claimedByUserIds: [
                      'usr_yash_01',
                      'usr_rahul_02',
                      'usr_pooja_03',
                    ],
                  },
                ]);
                setActiveHinglishConstraint(
                  'Hinglish Exclusion: "Aman ne Paneer Tikka aur Cold Coffee nahi piya, baaki sab 3 mein split karo."'
                );
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#14141C] border border-[#FF6A00]/40 text-xs text-white"
            >
              2. &ldquo;Aman didn&apos;t have Paneer Tikka or Cold Coffee&rdquo;
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-[#050507] border border-[#FF6A00]/30 text-[11px] font-mono text-[#FF8800]">
            {activeHinglishConstraint}
          </div>
        </div>

        {/* Receipt Header */}
        <div className="card-3d-sub p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div>
            <span className="text-white font-bold">
              Mainland China / Zomato Invoice #ZM9921
            </span>
            <span className="text-[#AEAEB7] block">
              Items Subtotal: ₹1,250.00 • +5% GST (taxAmount): +₹62.50 •
              Promo (discountAmount): -₹112.50
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-[#FF8800] font-bold">
            Grand Total: {formatInr(splitResult.grandTotal)}
          </span>
        </div>

        {/* Item-Claim Compose Card Lines */}
        <div className="space-y-2">
          {receiptLines.map((line) => (
            <div
              key={line.id}
              className="card-3d-sub p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-white">{line.name}</div>
                <div className="text-[11px] font-mono text-[#FF8800]">
                  Line Price: {formatInr(line.price)} (
                  {formatInr(roundPaisa(line.price / line.claimedByUserIds.length))}{' '}
                  / person)
                </div>
              </div>

              <div className="flex gap-1.5">
                {SNAP_SPLIT_PARTICIPANTS.map((p) => {
                  const active = line.claimedByUserIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleParticipantOnLine(line.id, p.id)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                        active
                          ? 'btn-blaze-orange'
                          : 'bg-[#050507] border border-white/15 text-[#60606C]'
                      }`}
                    >
                      {p.name.split(' ')[0]} {active ? '✓' : '×'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Participant Shares */}
        <div className="grid grid-cols-3 gap-3">
          {splitResult.shares.map((s) => (
            <div
              key={s.userId}
              className="card-3d-sub p-3.5 rounded-2xl text-center font-mono"
            >
              <div className="text-[11px] text-[#C8CAD0]">{s.name}</div>
              <div className="text-lg font-extrabold text-[#FF8800] my-0.5">
                {formatInr(s.finalShare)}
              </div>
              <div className="text-[10px] text-[#AEAEB7]">
                Sub ₹{s.itemSubtotal} + Tax ₹{s.taxShare} - Disc ₹
                {s.discountShare}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onStagePayment({
              recipientName: 'Mainland China / Group Split',
              recipientVpa: 'zomato@hdfcbank',
              amount: yashShare,
              note: `NEXT-01 Itemized Split Share (Invoice #ZM9921)`,
              txType: 'SEND',
              category: 'Dining & Food',
              idempotencyKey: `uuid-split-${Date.now()}`,
              sourceModule: 'NEXT-01',
            });
          }}
          className="w-full py-3.5 px-5 rounded-full btn-blaze-orange text-xs"
        >
          Pay My Share ({formatInr(yashShare)}) → stagePeerPayment &amp; 4-Digit
          PIN
        </button>
      </div>
    );
  }

  // ============================================================================
  // NEXT-02: CONVERSATIONAL NET-ZERO KHATA (MICRO-IOU RUNNING TAB)
  // ============================================================================
  if (selectedFeature === 'NEXT-02') {
    const rahulSummary = computeNetKhataSummary(khataEntries, 'usr_rahul_02');

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              NEXT-02 • /chats/chat_rahul_02/khataEntries &amp; BCNF KHATA_ENTRIES
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Conversational &ldquo;Net-Zero Khata&rdquo; Micro-IOU Tab
            </h2>
          </div>
          <BookOpen className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* Top Running Balance Header in Chat (PRD 2.2b) */}
        <div className="card-3d-sub p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono text-[#AEAEB7] block">
              TOP OF CHAT DETERMINISTIC RUNNING BALANCE HEADER:
            </span>
            <span className="text-xl font-mono font-extrabold text-[#FF8800]">
              {rahulSummary.netBalance > 0
                ? `Net Khata: Rahul owes You ${formatInr(
                    rahulSummary.netBalance
                  )}`
                : rahulSummary.netBalance < 0
                ? `Net Khata: You owe Rahul ${formatInr(
                    Math.abs(rahulSummary.netBalance)
                  )}`
                : 'Net Khata: ₹0.00 (100% Settled)'}
            </span>
          </div>

          {rahulSummary.netBalance !== 0 && (
            <button
              type="button"
              onClick={() => {
                const settleAmt = Math.abs(rahulSummary.netBalance);
                onLogAiToolCall(
                  'NEXT-02',
                  'stageKhataSettlement',
                  { peerUserId: 'usr_rahul_02', netAmountInr: settleAmt },
                  { stagedTo: 'rahul@okaxis', settledCount: khataEntries.length }
                );
                onStagePayment({
                  recipientName: 'Rahul Verma (Net-Zero Khata)',
                  recipientVpa: 'rahul@okaxis',
                  amount: settleAmt,
                  note: 'NEXT-02 Consolidated Net-Zero Khata Settlement',
                  txType: 'SEND',
                  category: 'P2P Transfers',
                  idempotencyKey: `uuid-khata-${Date.now()}`,
                  sourceModule: 'NEXT-02',
                  linkedKhataSettlementPeerId: 'usr_rahul_02',
                });
              }}
              className="py-2.5 px-4 rounded-full btn-blaze-orange text-xs"
            >
              Settle Net Balance ({formatInr(Math.abs(rahulSummary.netBalance))}
              ) → 1 UPI Txn
            </button>
          )}
        </div>

        {/* 1-Click Exact PRD 2.2 Conversational Prompts */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-[#C8CAD0]">
            1-Click Conversational IOU Prompts from PRD Section 2.2:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onProposeKhataEntry(
                  'usr_rahul_02',
                  'Rahul Verma',
                  'rahul@okaxis',
                  'PEER_OWES_USER',
                  60,
                  'Paid ₹120 for auto, split 50-50 (Rahul share ₹60)'
                );
              }}
              className="px-3.5 py-2 rounded-full btn-blaze-orange text-xs"
            >
              + &ldquo;Paid ₹120 for auto, split 50-50&rdquo; (PRD Exact → +₹60)
            </button>

            <button
              type="button"
              onClick={() => {
                onProposeKhataEntry(
                  'usr_rahul_02',
                  'Rahul Verma',
                  'rahul@okaxis',
                  'USER_OWES_PEER',
                  40,
                  'Deduct the ₹40 Maggi I owed you yesterday'
                );
              }}
              className="px-3.5 py-2 rounded-full bg-[#14141C] border border-[#FF6A00]/40 text-xs text-white"
            >
              + &ldquo;Deduct the ₹40 Maggi I owed you yesterday&rdquo; (PRD
              Exact → -₹40)
            </button>
          </div>
        </div>

        {/* Khata Rows */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {khataEntries
            .filter((k) => k.peer_user_id === 'usr_rahul_02')
            .map((k) => (
              <div
                key={k.khata_id}
                className="card-3d-sub p-3.5 rounded-2xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {k.description}
                  </div>
                  <div className="text-[11px] font-mono text-[#AEAEB7]">
                    /chats/chat_rahul_02/khataEntries/{k.khata_id} •{' '}
                    {k.direction} • {k.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-extrabold text-[#FF8800]">
                    {k.direction === 'PEER_OWES_USER' ? '+' : '-'}
                    {formatInr(k.amount)}
                  </span>
                  {k.status === 'PENDING_PEER_ACK' && (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeKhataEntry(k.khata_id)}
                      className="px-3 py-1 rounded-full btn-blaze-orange text-[11px]"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Custom Khata Entry Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const amt = roundPaisa(Number(khataAmount) || 50);
            onProposeKhataEntry(
              'usr_rahul_02',
              'Rahul Verma',
              'rahul@okaxis',
              khataDirection,
              amt,
              khataDesc.trim() || 'Shared Hostel Tea & Snacks'
            );
          }}
          className="card-3d-sub p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end"
        >
          <div>
            <label className="block text-[11px] text-[#C8CAD0] mb-1">
              Direction
            </label>
            <select
              value={khataDirection}
              onChange={(e) =>
                setKhataDirection(
                  e.target.value as 'PEER_OWES_USER' | 'USER_OWES_PEER'
                )
              }
              className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="PEER_OWES_USER">Rahul Owes Me (+)</option>
              <option value="USER_OWES_PEER">I Owe Rahul (-)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#C8CAD0] mb-1">
              Amount (INR)
            </label>
            <input
              type="number"
              value={khataAmount}
              onChange={(e) => setKhataAmount(e.target.value)}
              className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/50 hover:border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800] flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose Custom IOU</span>
          </button>
        </form>
      </div>
    );
  }

  // ============================================================================
  // NEXT-03: PRE-FLIGHT SCAM & SOCIAL ENGINEERING SHIELD IN CHAT & SCANNER
  // ============================================================================
  if (selectedFeature === 'NEXT-03') {
    const activeScam = PRD_SCAM_SCENARIOS[selectedScamIdx];

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              NEXT-03 • EXPLAINABLE THREAT CARD (ENGLISH &amp; HINGLISH)
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Pre-Flight Scam &amp; Social Engineering Shield
            </h2>
          </div>
          <ShieldAlert className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* 3 Exact PRD Scam Scenario Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {PRD_SCAM_SCENARIOS.map((scam, idx) => (
            <button
              key={scam.id}
              type="button"
              onClick={() => setSelectedScamIdx(idx)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedScamIdx === idx
                  ? 'btn-blaze-orange'
                  : 'bg-[#14141C] border border-[#FF6A00]/30 text-[#C8CAD0]'
              }`}
            >
              {scam.badge}
            </button>
          ))}
        </div>

        {/* High-Contrast Explainable Threat Card (PRD 2.3c) */}
        <div className="card-3d-sub p-5 rounded-2xl space-y-3 border-[#FF5E00]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-extrabold text-[#FF8800] uppercase">
              ⚠️ {activeScam.title}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-[10px] font-mono font-bold text-[#FF8800]">
              VPA: {activeScam.senderHandle} • {formatInr(activeScam.amount)}
            </span>
          </div>

          <p className="text-xs text-white italic bg-[#050507] p-3 rounded-xl border border-white/10">
            {activeScam.messageText}
          </p>

          <div className="p-3.5 rounded-xl bg-[#241006] border border-[#FF6A00] space-y-1.5 text-xs">
            <div className="font-mono font-bold text-[#FF8800]">
              EXPLAINABLE CONTRADICTION (ENGLISH):
            </div>
            <p className="text-white leading-relaxed">
              {activeScam.contradictionEn}
            </p>
            <div className="font-mono font-bold text-[#FF8800] pt-1">
              EXPLAINABLE CONTRADICTION (HINGLISH):
            </div>
            <p className="text-[#F0F0F0] leading-relaxed">
              {activeScam.contradictionHi}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onInterceptScamQr(activeScam.uri, activeScam.messageText)
          }
          className="w-full py-3.5 px-5 rounded-full btn-blaze-orange text-xs"
        >
          Launch Full-Screen NEXT-03 Scam Shield Interception Modal →
        </button>
      </div>
    );
  }

  // ============================================================================
  // NEXT-04: UNIVERSAL "ANY-SCREENSHOT-TO-STAGED-PAYMENT" INTENT ENGINE
  // ============================================================================
  if (selectedFeature === 'NEXT-04') {
    const activeMedia = SHARE_SHEET_MEDIA_PRESETS[selectedPosterIdx];
    const duplicateTx = transactions.find(
      (t) =>
        t.counterparty_vpa.toLowerCase() ===
          activeMedia.recipientVpa.toLowerCase() &&
        t.amount === activeMedia.amount &&
        t.status === 'SUCCESS'
    );

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              NEXT-04 • SHARE-SHEET INTENT EXTRACTOR &amp; 7-DAY DEDUPLICATION
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Any-Screenshot-to-Staged-Payment Engine
            </h2>
          </div>
          <Share2 className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* 3 Share Sheet Media Presets (Event Poster, Handwritten Bill, SMS Snippet) */}
        <div className="flex flex-wrap gap-2">
          {SHARE_SHEET_MEDIA_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPosterIdx(idx);
                onLogAiToolCall(
                  'NEXT-04',
                  'extractPaymentIntentFromMedia',
                  { sharedMediaId: p.id, mediaType: p.mediaType },
                  {
                    recipientVpa: p.recipientVpa,
                    amount: p.amount,
                    duplicateFoundInLast7Days: Boolean(
                      transactions.find(
                        (t) =>
                          t.counterparty_vpa === p.recipientVpa &&
                          t.amount === p.amount
                      )
                    ),
                  }
                );
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPosterIdx === idx
                  ? 'btn-blaze-orange'
                  : 'bg-[#14141C] border border-[#FF6A00]/30 text-[#C8CAD0]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="card-3d-sub p-5 rounded-2xl space-y-3 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Share Source:</span>
            <span className="text-white">{activeMedia.mediaType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Extracted Merchant:</span>
            <span className="text-white font-bold">
              {activeMedia.recipientName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">
              Extracted recipientVpaOrPhone:
            </span>
            <span className="text-[#FF8800] font-bold">
              {activeMedia.recipientVpa}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#AEAEB7]">Extracted Amount:</span>
            <span className="text-white font-extrabold">
              {formatInr(activeMedia.amount)}
            </span>
          </div>
        </div>

        {duplicateTx ? (
          <div className="p-4 rounded-2xl bg-[#261207] border border-[#FF6A00] text-xs space-y-1">
            <div className="font-mono font-extrabold text-[#FF8800] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>
                7-DAY DUPLICATE PAYMENT DETECTED BY queryFinancialLedger!
              </span>
            </div>
            <p className="text-[#F0F0F0]">
              You already paid <strong>{formatInr(duplicateTx.amount)}</strong>{' '}
              to <strong>{duplicateTx.counterparty_vpa}</strong> in{' '}
              <code>{duplicateTx.transaction_id}</code> ({duplicateTx.note}).
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#121218] border border-[#FF6A00]/30 text-xs font-mono text-[#FF8800] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              7-Day Ledger Cross-Check Passed: No duplicate payment found for{' '}
              {activeMedia.recipientVpa}.
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            onStagePayment({
              recipientName: activeMedia.recipientName,
              recipientVpa: activeMedia.recipientVpa,
              amount: activeMedia.amount,
              note: activeMedia.note,
              txType: 'SEND',
              category: 'P2P Transfers',
              idempotencyKey: `uuid-poster-${Date.now()}`,
              sourceModule: 'NEXT-04',
            })
          }
          className="w-full py-3.5 px-5 rounded-full btn-blaze-orange text-xs"
        >
          Stage Extracted Payment ({formatInr(activeMedia.amount)}) →
          SendMoneyScreen / 4-Digit PIN
        </button>
      </div>
    );
  }

  // ============================================================================
  // NEXT-05: INTERACTIVE "WHAT-IF" SAFE-TO-SPEND & CASHFLOW RUNWAY SIMULATOR
  // ============================================================================
  if (selectedFeature === 'NEXT-05') {
    const sim = computeSafeToSpendSimulation({
      currentBalance: availableBalance,
      upcoming48hBills: 7139,
      remainingBudgetCommitments: 4200,
      hypotheticalPurchase: hypotheticalSpend,
      dailyBurnRate: 520,
    });

    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              NEXT-05 • SAFE-TO-SPEND &amp; CASHFLOW RUNWAY SIMULATOR
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Interactive &ldquo;What-If&rdquo; Safe-to-Spend Simulator
            </h2>
          </div>
          <Gauge className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* Exact PRD 2.5 Preset Prompt Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              label:
                '1. "Can I afford ₹3,500 headphones today without messing up my month-end bills?" (PRD Exact)',
              amt: 3500,
            },
            {
              label: '2. "Can I buy a ₹9,500 Flight Ticket today?" (Caution Buffer)',
              amt: 9500,
            },
            {
              label: '3. "What if I buy a ₹16,500 Monitor today?" (Shortfall Risk)',
              amt: 16500,
            },
          ].map((preset) => (
            <button
              key={preset.amt}
              type="button"
              onClick={() => {
                setHypotheticalSpend(preset.amt);
                setHypotheticalItemLabel(preset.label);
                onLogAiToolCall(
                  'NEXT-05',
                  'simulateSafeToSpend',
                  { hypotheticalPurchaseInr: preset.amt },
                   computeSafeToSpendSimulation({
                    currentBalance: availableBalance,
                    upcoming48hBills: 7139,
                    remainingBudgetCommitments: 4200,
                    hypotheticalPurchase: preset.amt,
                    dailyBurnRate: 520,
                  }) as unknown as Record<string, unknown>
                );
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                hypotheticalSpend === preset.amt
                  ? 'btn-blaze-orange'
                  : 'bg-[#14141C] border border-[#FF6A00]/30 text-[#C8CAD0]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Formula Deduction Row */}
        <div className="p-3.5 rounded-2xl bg-[#050507] border border-[#FF6A00]/30 text-xs font-mono text-[#D8DAE0] flex flex-wrap items-center justify-between gap-2">
          <span>
            Wallet: <strong className="text-white">{formatInr(availableBalance)}</strong>
          </span>
          <span>- AI-04 48h Bills: <strong className="text-[#FF8800]">₹7,139</strong></span>
          <span>- AI-03 Budgets: <strong className="text-[#FF8800]">₹4,200</strong></span>
          <span>
            = Safe Baseline:{' '}
            <strong className="text-[#FF8800]">
              {formatInr(sim.safeToSpendBefore)}
            </strong>
          </span>
        </div>

        <div className="card-3d-sub p-4 rounded-2xl space-y-2.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#C8CAD0] truncate pr-2">
              {hypotheticalItemLabel}
            </span>
            <span className="text-lg font-extrabold text-[#FF8800] shrink-0">
              {formatInr(hypotheticalSpend)}
            </span>
          </div>

          <input
            type="range"
            min={500}
            max={20000}
            step={250}
            value={hypotheticalSpend}
            onChange={(e) => {
              setHypotheticalSpend(Number(e.target.value));
              setHypotheticalItemLabel('Custom Hypothetical Impulse Purchase');
            }}
            className="w-full accent-[#FF5E00]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              SAFE-TO-SPEND BEFORE
            </span>
            <span className="text-lg font-extrabold text-white">
              {formatInr(sim.safeToSpendBefore)}
            </span>
            <span className="text-[11px] text-[#FF8800] block">
              {sim.runwayDaysBefore} Days Runway
            </span>
          </div>

          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              SAFE-TO-SPEND AFTER
            </span>
            <span className="text-lg font-extrabold text-[#FF8800]">
              {formatInr(sim.safeToSpendAfter)}
            </span>
            <span className="text-[11px] text-white block">
              {sim.runwayDaysAfter} Days Runway
            </span>
          </div>

          <div className="card-3d-sub p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#AEAEB7] block">
              ADVISORY VERDICT
            </span>
            <span className="text-sm font-extrabold text-[#FF8800] block mt-1">
              {sim.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // NEXT-06: MILESTONE-STAGED "TRUST CARDS" FOR CONDITIONAL P2P DEALS
  // ============================================================================
  if (selectedFeature === 'NEXT-06') {
    return (
      <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#FF6A00]/20 pb-4">
          <div>
            <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
              NEXT-06 • /chats/chat_vikram_04/milestones &amp; MILESTONE_DEALS
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Milestone-Staged &ldquo;Trust Cards&rdquo; for Conditional P2P Deals
            </h2>
          </div>
          <Handshake className="w-6 h-6 text-[#FF8800]" />
        </div>

        {/* Exact PRD 2.6 Prompt Banner */}
        <div className="p-3.5 rounded-2xl bg-[#050507] border border-[#FF6A00]/35 text-xs font-mono text-[#FF8800]">
          PRD 2.6 Prompt: &ldquo;Create a 2-step payment tracker with Vikram for
          the monitor: ₹1,000 advance today, ₹3,000 when I pick it up on
          Saturday.&rdquo;
        </div>

        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {milestoneDeals.map((deal) => (
            <div
              key={deal.deal_id}
              className="card-3d-sub p-5 rounded-2xl space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {deal.item_title}
                  </span>
                  <span className="text-[11px] font-mono text-[#AEAEB7]">
                    Seller: {deal.seller_name} ({deal.seller_vpa}) • Total:{' '}
                    {formatInr(deal.total_amount)}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FF5E00]/20 border border-[#FF6A00] text-xs font-mono font-bold text-[#FF8800]">
                  {deal.status === 'HANDOVER_CONFIRMED'
                    ? 'DELIVERY_CONFIRMED'
                    : deal.status}
                </span>
              </div>

              {/* 4-Step Non-Custodial State Machine Progress */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center">
                {[
                  { label: '1. CREATED', active: true },
                  {
                    label: '2. ADVANCE_PAID',
                    active: deal.status !== 'CREATED',
                  },
                  {
                    label: '3. DELIVERY_CONFIRMED',
                    active:
                      deal.status === 'HANDOVER_CONFIRMED' ||
                      deal.status === 'SETTLED',
                  },
                  {
                    label: '4. SETTLED',
                    active: deal.status === 'SETTLED',
                  },
                ].map((st) => (
                  <div
                    key={st.label}
                    className={`py-1 px-2 rounded-lg border ${
                      st.active
                        ? 'bg-[#FF5E00]/20 border-[#FF6A00] text-[#FF8800] font-bold'
                        : 'bg-[#050507] border-white/10 text-[#60606C]'
                    }`}
                  >
                    {st.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {deal.status === 'CREATED' && (
                  <button
                    type="button"
                    onClick={() =>
                      onStagePayment({
                        recipientName: deal.seller_name,
                        recipientVpa: deal.seller_vpa,
                        amount: deal.advance_amount,
                        note: `Milestone 1 Advance: ${deal.item_title}`,
                        txType: 'SEND',
                        category: 'P2P Transfers',
                        idempotencyKey: `uuid-ms-adv-${deal.deal_id}-${Date.now()}`,
                        sourceModule: 'NEXT-06',
                        linkedMilestoneDeal: {
                          dealId: deal.deal_id,
                          step: 'ADVANCE',
                        },
                      })
                    }
                    className="py-2 px-4 rounded-full btn-blaze-orange text-xs"
                  >
                    Pay {formatInr(deal.advance_amount)} Advance (PIN Flow)
                  </button>
                )}

                {deal.status === 'ADVANCE_PAID' && (
                  <button
                    type="button"
                    onClick={() => onConfirmMilestoneHandover(deal.deal_id)}
                    className="py-2 px-4 rounded-full btn-blaze-orange text-xs"
                  >
                    Confirm Saturday Handover → Unlock Final Payment
                  </button>
                )}

                {deal.status === 'HANDOVER_CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() =>
                      onStagePayment({
                        recipientName: deal.seller_name,
                        recipientVpa: deal.seller_vpa,
                        amount: deal.final_amount,
                        note: `Milestone 2 Final Settlement: ${deal.item_title}`,
                        txType: 'SEND',
                        category: 'P2P Transfers',
                        idempotencyKey: `uuid-ms-fin-${deal.deal_id}-${Date.now()}`,
                        sourceModule: 'NEXT-06',
                        linkedMilestoneDeal: {
                          dealId: deal.deal_id,
                          step: 'FINAL',
                        },
                      })
                    }
                    className="py-2 px-4 rounded-full btn-blaze-orange text-xs"
                  >
                    Pay {formatInr(deal.final_amount)} Final Balance (PIN Flow)
                  </button>
                )}

                {deal.status === 'SETTLED' && (
                  <span className="text-xs font-mono text-[#FF8800] font-bold">
                    ✓ BOTH MILESTONES SETTLED (Adv Tx: {deal.advance_tx_id} •
                    Final Tx: {deal.final_tx_id})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create New Milestone Deal Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateMilestoneDeal(
              'Vikram Singh',
              'vikram@hdfcbank',
              newDealTitle.trim() || 'Used Keychron Keyboard',
              roundPaisa(Number(newDealAdvance) || 500),
              roundPaisa(Number(newDealFinal) || 1500)
            );
          }}
          className="card-3d-sub p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end"
        >
          <input
            type="text"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
            placeholder="Item title..."
            className="bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-3 py-2 text-xs text-white"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newDealAdvance}
              onChange={(e) => setNewDealAdvance(e.target.value)}
              placeholder="Adv ₹"
              className="w-1/2 bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-2.5 py-2 text-xs font-mono text-white"
            />
            <input
              type="number"
              value={newDealFinal}
              onChange={(e) => setNewDealFinal(e.target.value)}
              placeholder="Final ₹"
              className="w-1/2 bg-[#050507] border border-[#FF6A00]/30 rounded-xl px-2.5 py-2 text-xs font-mono text-white"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/50 text-xs font-mono font-bold text-[#FF8800]"
          >
            + Create Milestone Card
          </button>
        </form>
      </div>
    );
  }

  // ============================================================================
  // NEXT-07: CONVERSATIONAL TRANSACTION DIAGNOSTICIAN & RECEIPT VERIFIER
  // ============================================================================
  const targetTx =
    transactions.find((t) => t.transaction_id === diagnosedTxId) ||
    transactions[0];
  const diag = diagnoseTransactionDeterministically(targetTx, ledgerEntries);

  return (
    <div className="card-3d-orange rounded-[28px] p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF6A00]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#FF8800] font-bold block mb-1">
            NEXT-07 • getPaymentStatus + IdempotencyManager DIAGNOSTICIAN
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Conversational Transaction Diagnostician
          </h2>
        </div>

        <button
          type="button"
          onClick={onSimulateBankTimeout}
          className="py-2 px-4 rounded-full bg-[#14141C] border border-[#FF6A00]/50 text-xs font-mono font-bold text-[#FF8800]"
        >
          + Inject New Timed-Out Payment
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#C8CAD0] mb-1.5">
          Select Transaction from ActivityHistoryScreen to Diagnose:
        </label>
        <select
          value={targetTx.transaction_id}
          onChange={(e) => {
            const txId = e.target.value;
            onSelectDiagnosedTxId(txId);
            const found =
              transactions.find((t) => t.transaction_id === txId) || targetTx;
            const d = diagnoseTransactionDeterministically(
              found,
              ledgerEntries
            );
            onLogAiToolCall(
              'NEXT-07',
              'diagnoseTransactionState',
              { transactionId: txId },
              d as unknown as Record<string, unknown>
            );
          }}
          className="w-full bg-[#050507] border border-[#FF6A00]/30 rounded-2xl px-4 py-3 text-xs font-mono text-white"
        >
          {transactions.map((t) => (
            <option
              key={t.transaction_id}
              value={t.transaction_id}
              className="bg-[#0C0C10]"
            >
              {t.transaction_id} • {t.counterparty_name} • {formatInr(t.amount)}{' '}
              • [{t.status}]
            </option>
          ))}
        </select>
      </div>

      <div className="card-3d-sub p-5 rounded-2xl space-y-3 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-[#AEAEB7]">UUID Idempotency Lock:</span>
          <span className="text-[#FF8800] font-bold">
            {targetTx.idempotency_key}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#AEAEB7]">BCNF Ledger Rows Committed:</span>
          <span className="text-white font-bold">
            {diag.ledgerRowsFound} rows in public.ledger_entries
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#AEAEB7]">Did Funds Leave Sender Wallet?</span>
          <span className="text-[#FF8800] font-bold">
            {diag.fundsLeftSender
              ? 'YES (Settled Debit Row Exists)'
              : 'NO (₹0.00 Debited — Wallet Untouched)'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#050507] border border-[#FF6A00]/40 space-y-2 font-sans">
          <div>
            <span className="text-[11px] font-mono font-bold text-[#FF8800] block">
              ENGLISH DIAGNOSTIC VERDICT:
            </span>
            <p className="text-[#F0F0F0] leading-relaxed">
              {diag.safeRetryGuidance}
            </p>
          </div>
          <div className="pt-2 border-t border-white/10">
            <span className="text-[11px] font-mono font-bold text-[#FF8800] block">
              HINGLISH DIAGNOSTIC VERDICT (PRD 2.7b):
            </span>
            <p className="text-[#D8DAE0] leading-relaxed">
              {diag.fundsLeftSender
                ? `Aapke wallet se ${formatInr(
                    targetTx.amount
                  )} debit ho chuke hain (${
                    diag.ledgerRowsFound
                  } ledger_entries rows). Dobara payment mat karein; agar merchant ko nahi mila toh Server Refund trigger karein.`
                : `Chinta mat karein! NPCI switch timeout ke kaaran yeh transaction ${targetTx.status} state mein hai, par aapke wallet se ₹0.00 kate hain (0 ledger_entries rows). UUID idempotency lock active hai.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
