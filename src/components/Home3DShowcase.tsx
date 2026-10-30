import React, { useMemo, useRef, useState } from 'react';
import { useJainPayStore } from '../context/JainPayContext';
import {
  BASELINE_AI_SPECS,
  BaselineAiId,
  CORE_FEATURE_SPECS,
  CoreFeatureId,
  NEXT_GEN_FEATURE_SPECS,
  NextGenFeatureId,
  SingleFeatureId,
} from '../data/pipelineMetadata';
import {
  AccountRecord,
  LinkedBankAccountRecord,
  TopNavigationMode,
} from '../types/domain';
import {
  evaluateStrictKnowledgeQuery,
  getVoiceProfileById,
  getWebSpeechSynthesisSettings,
  streamWebSpeechSynthesis,
  UNAVAILABLE_INFO_RESPONSE,
  type LiveDatabaseSnapshot,
  type VoiceProfileId,
} from '../utils/aiVoiceEngine';
import { formatInr } from '../utils/ledgerEngine';
import {
  ArrowUpRight,
  Cpu,
  Database,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  Lock,
  MessageSquare,
  Mic,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface Home3DShowcaseProps {
  walletAccount: AccountRecord;
  primaryBank: LinkedBankAccountRecord;
  isBalanceRevealed: boolean;
  activePin: string;
  ledgerRowCount: number;
  unscratchedCount: number;
  activeCameraIndex: number;
  onSelectCameraIndex: (idx: number) => void;
  isFullCanvasMode: boolean;
  onToggleFullCanvasMode: () => void;
  onRequestRevealBalance: () => void;
  onMaskBalance: () => void;
  onNavigateMode: (mode: TopNavigationMode) => void;
  onLaunchSpecificFeature: (featureId: SingleFeatureId) => void;
}

const CAMERA_ANGLE_PRESETS = [
  { index: 0, label: '01 • Isometric Grid' },
  { index: 1, label: '02 • BCNF Topology' },
  { index: 2, label: '03 • SSI Horizon' },
  { index: 3, label: '04 • Node Cluster' },
  { index: 4, label: '05 • Zenith Wireframe' },
];

const TRUST_WORDMARKS = [
  'POSTGRESQL 16 SSI',
  'BCNF 12-TABLE LEDGER',
  'ROW-LEVEL SECURITY',
  'PGBOUNCER TX POOL',
  'HIKARICP FORMULA',
  'GEMINI 3.8 LIVE',
  'BRIN + GIN INDEXING',
  'ZERO-TRUST AI',
];

export const Home3DShowcase: React.FC<Home3DShowcaseProps> = ({
  walletAccount,
  primaryBank,
  isBalanceRevealed,
  activePin,
  ledgerRowCount,
  unscratchedCount,
  activeCameraIndex,
  onSelectCameraIndex,
  isFullCanvasMode,
  onToggleFullCanvasMode,
  onRequestRevealBalance,
  onMaskBalance,
  onNavigateMode,
  onLaunchSpecificFeature,
}) => {
  const [isSystemGuideOpen, setIsSystemGuideOpen] = useState(false);

  const store = useJainPayStore();
  const liveSnapshot: LiveDatabaseSnapshot = useMemo(
    () => ({
      walletBalance: walletAccount.available_balance,
      walletVpa: walletAccount.vpa_address,
      accounts: store.accounts,
      linkedBanks: store.linkedBanks,
      transactions: store.transactions,
      ledgerEntries: store.ledgerEntries,
      khataEntries: store.khataEntries,
      milestoneDeals: store.milestoneDeals,
      autopayMandates: store.autopayMandates,
      creditSanctions: store.creditSanctions,
      fxTreasuryVaults: store.fxTreasuryVaults,
      disputeChargebacks: store.disputeChargebacks,
      securityAuditLogs: store.securityAuditLogs,
    }),
    [
      walletAccount.available_balance,
      walletAccount.vpa_address,
      store.accounts,
      store.linkedBanks,
      store.transactions,
      store.ledgerEntries,
      store.khataEntries,
      store.milestoneDeals,
      store.autopayMandates,
      store.creditSanctions,
      store.fxTreasuryVaults,
      store.disputeChargebacks,
      store.securityAuditLogs,
    ]
  );

  // =========================================================================
  // FRONT-PAGE PARTITION 1: JANPAY AI VOICE ASSISTANT (CIRCLE) & JANPAY AI CHAT
  // =========================================================================
  const [selectedFrontVoiceId] = useState<VoiceProfileId>('CONCISE_CORPORATE');
  const activeFrontVoiceProfile = getVoiceProfileById(selectedFrontVoiceId);
  void getWebSpeechSynthesisSettings(activeFrontVoiceProfile);
  const [isFrontSpeaking, setIsFrontSpeaking] = useState(false);
  const [circleState, setCircleState] = useState<
    'idle' | 'greeting' | 'listening'
  >('idle');
  const [circleStatusText, setCircleStatusText] = useState<string>(
    'Click the circle to allow microphone & speak now'
  );
  const [liveSpokenTranscript, setLiveSpokenTranscript] = useState<string>('');
  const [micPermissionStatus, setMicPermissionStatus] = useState<
    'prompt' | 'granted' | 'denied'
  >('prompt');
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);

  const speechHandleRef = useRef<{ cancel: () => void } | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafMeterRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const submittedSpeechRef = useRef<boolean>(false);
  const janPayInputRef = useRef<HTMLInputElement | null>(null);

  const cleanupMicrophoneCapture = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (rafMeterRef.current) {
      window.cancelAnimationFrame(rafMeterRef.current);
      rafMeterRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicVolumeLevel(0);
  };

  const speakFrontText = (
    text: string,
    profileId?: VoiceProfileId,
    onDone?: () => void
  ) => {
    if (speechHandleRef.current) {
      speechHandleRef.current.cancel();
      speechHandleRef.current = null;
    }
    const prof = getVoiceProfileById(profileId ?? selectedFrontVoiceId);
    speechHandleRef.current = streamWebSpeechSynthesis(text, prof, {
      onStart: () => setIsFrontSpeaking(true),
      onEnd: () => {
        setIsFrontSpeaking(false);
        onDone?.();
      },
    });
  };

  const stopFrontSpeech = () => {
    if (speechHandleRef.current) {
      speechHandleRef.current.cancel();
      speechHandleRef.current = null;
    }
    cleanupMicrophoneCapture();
    setIsFrontSpeaking(false);
    setCircleState('idle');
    setCircleStatusText('Click the circle to allow microphone & speak now');
  };

  interface FrontChatTurn {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    spokenSummary?: string;
    isAvailable: boolean;
    timestamp: string;
  }

  const [janPayChatInput, setJanPayChatInput] = useState('');
  const [isJanPayChatLoading, setIsJanPayChatLoading] = useState(false);
  const [janPayChatMessages, setJanPayChatMessages] = useState<FrontChatTurn[]>(
    () => [
      {
        id: 'jp_front_seed_1',
        role: 'assistant',
        text: 'Hello sir! I am your JanPay AI Voice Assistant. Click the circle above to allow microphone access and speak your question, or type below.',
        spokenSummary:
          'Hello sir! I am your JanPay AI Voice Assistant. Click the circle above to speak your question.',
        isAvailable: true,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]
  );

  const submitJanPayChatMessage = async (overrideQuestion?: string) => {
    const q = (overrideQuestion ?? janPayChatInput).trim();
    if (!q) return;
    setJanPayChatInput('');
    setLiveSpokenTranscript('');
    cleanupMicrophoneCapture();

    const userTurn: FrontChatTurn = {
      id: `jp_usr_${Date.now()}`,
      role: 'user',
      text: q,
      isAvailable: true,
      timestamp: new Date().toLocaleTimeString(),
    };
    setJanPayChatMessages((prev) => [...prev, userTurn]);
    setIsJanPayChatLoading(true);
    setCircleStatusText(`Heard: "${q}" — Answering...`);

    let answerText = UNAVAILABLE_INFO_RESPONSE;
    let spokenSummary = UNAVAILABLE_INFO_RESPONSE;
    let isAvailable = false;

    try {
      const res = await fetch('/api/ai/frontpage-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          snapshot: liveSnapshot,
          voiceProfileId: selectedFrontVoiceId,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          isInformationAvailable: boolean;
          answerText: string;
          spokenSummary: string;
        };
        isAvailable = data.isInformationAvailable;
        answerText = data.isInformationAvailable
          ? data.answerText
          : UNAVAILABLE_INFO_RESPONSE;
        spokenSummary = data.isInformationAvailable
          ? data.spokenSummary
          : UNAVAILABLE_INFO_RESPONSE;
      } else {
        const local = evaluateStrictKnowledgeQuery(
          q,
          liveSnapshot,
          selectedFrontVoiceId
        );
        isAvailable = local.isInformationAvailable;
        answerText = local.answerText;
        spokenSummary = local.spokenSummary;
      }
    } catch {
      const local = evaluateStrictKnowledgeQuery(
        q,
        liveSnapshot,
        selectedFrontVoiceId
      );
      isAvailable = local.isInformationAvailable;
      answerText = local.answerText;
      spokenSummary = local.spokenSummary;
    }

    const assistantTurn: FrontChatTurn = {
      id: `jp_ast_${Date.now() + 1}`,
      role: 'assistant',
      text: answerText,
      spokenSummary,
      isAvailable,
      timestamp: new Date().toLocaleTimeString(),
    };
    setJanPayChatMessages((prev) => [...prev, assistantTurn]);
    setIsJanPayChatLoading(false);
    setCircleState('listening');
    setCircleStatusText(answerText);
    speakFrontText(spokenSummary, selectedFrontVoiceId, () => {
      setCircleState('idle');
    });
  };

  const transcribeRecordedAudioBlob = async (blob: Blob) => {
    if (submittedSpeechRef.current || blob.size < 400) return;
    submittedSpeechRef.current = true;
    setIsJanPayChatLoading(true);
    setCircleStatusText('Transcribing your microphone voice...');

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = window.btoa(binary);

      const res = await fetch('/api/ai/voice-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
          snapshot: liveSnapshot,
          voiceProfileId: selectedFrontVoiceId,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          transcript?: string;
          isInformationAvailable: boolean;
          answerText: string;
          spokenSummary: string;
        };
        if (data.transcript && data.transcript.trim()) {
          setIsJanPayChatLoading(false);
          await submitJanPayChatMessage(data.transcript.trim());
          return;
        }
      }
    } catch {
      // ignore
    }
    setIsJanPayChatLoading(false);
    setCircleState('idle');
    setCircleStatusText(
      'Could not catch that clearly. Please speak again or type your question below.'
    );
  };

  const startLiveMicrophoneAndRecognition = async () => {
    cleanupMicrophoneCapture();
    submittedSpeechRef.current = false;
    setLiveSpokenTranscript('');

    // 1. Start Browser SpeechRecognition synchronously on click gesture so words appear live as user speaks
    if (typeof window !== 'undefined') {
      const SpeechRec =
        (window as unknown as { SpeechRecognition?: new () => unknown })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => unknown })
          .webkitSpeechRecognition;

      if (SpeechRec) {
        try {
          const recognition = new SpeechRec() as {
            lang: string;
            continuous: boolean;
            interimResults: boolean;
            maxAlternatives: number;
            onresult: ((event: {
              results: ArrayLike<{
                isFinal?: boolean;
                0: { transcript: string };
              }>;
            }) => void) | null;
            onerror: (() => void) | null;
            onend: (() => void) | null;
            start: () => void;
            stop: () => void;
          };
          recognition.lang = 'en-IN';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            let fullTranscript = '';
            let hasFinal = false;
            for (let i = 0; i < event.results.length; i++) {
              const resItem = event.results[i];
              if (resItem?.[0]?.transcript) {
                fullTranscript += resItem[0].transcript + ' ';
              }
              if (resItem?.isFinal) {
                hasFinal = true;
              }
            }
            const cleaned = fullTranscript.trim();
            if (cleaned) {
              setLiveSpokenTranscript(cleaned);
              setJanPayChatInput(cleaned);
              setDirectQuestionInput(cleaned);
              setCircleStatusText(`Heard: "${cleaned}"`);

              if (silenceTimerRef.current) {
                window.clearTimeout(silenceTimerRef.current);
              }
              if (hasFinal) {
                submittedSpeechRef.current = true;
                void submitJanPayChatMessage(cleaned);
                void submitDirectQuestionBox(cleaned);
              } else {
                silenceTimerRef.current = window.setTimeout(() => {
                  if (!submittedSpeechRef.current && cleaned.length > 1) {
                    submittedSpeechRef.current = true;
                    void submitJanPayChatMessage(cleaned);
                    void submitDirectQuestionBox(cleaned);
                  }
                }, 1300);
              }
            }
          };

          recognition.onerror = () => {
            // Keep MediaRecorder + VAD active as automatic fallback
          };

          recognition.onend = () => {
            // If user hasn't finished speaking yet and mic stream is still active, keep recognition alive
            if (!submittedSpeechRef.current && mediaStreamRef.current) {
              try {
                recognition.start();
              } catch {
                // ignore restart error
              }
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch {
          // SpeechRecognition already running or unsupported
        }
      }
    }

    // 2. Request Real Microphone Access via navigator.mediaDevices.getUserMedia({ audio: true }) + Web Audio VAD auto-submit
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        setMicPermissionStatus('granted');

        // Start MediaRecorder so we capture raw audio for Gemini multimodal transcription if Web Speech doesn't fire
        if (typeof MediaRecorder !== 'undefined') {
          audioChunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              audioChunksRef.current.push(ev.data);
            }
          };
          recorder.start(250);
        }

        // Connect Web Audio AnalyserNode for real-time voice bar visualization AND automatic Voice Activity Detection (VAD)
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          let voiceFramesCount = 0;
          let hasDetectedUserVoice = false;
          let lastVoiceTimestamp = Date.now();

          const updateMeter = () => {
            if (submittedSpeechRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const scaledLevel = Math.min(100, Math.round((avg / 128) * 100));
            setMicVolumeLevel(scaledLevel);

            if (avg > 10) {
              voiceFramesCount += 1;
              lastVoiceTimestamp = Date.now();
              if (voiceFramesCount >= 4) {
                hasDetectedUserVoice = true;
              }
            } else if (
              hasDetectedUserVoice &&
              Date.now() - lastVoiceTimestamp > 1450 &&
              !submittedSpeechRef.current
            ) {
              // User spoke and paused for 1.45s: automatically finish and answer without requiring a second click!
              void handleFinishSpeakingAndSend();
              return;
            }

            rafMeterRef.current = window.requestAnimationFrame(updateMeter);
          };
          rafMeterRef.current = window.requestAnimationFrame(updateMeter);
        }
      } catch {
        setMicPermissionStatus('denied');
      }
    }
  };

  const handleFinishSpeakingAndSend = async () => {
    if (submittedSpeechRef.current) return;

    if (liveSpokenTranscript.trim()) {
      submittedSpeechRef.current = true;
      const spokenText = liveSpokenTranscript.trim();
      await submitJanPayChatMessage(spokenText);
      await submitDirectQuestionBox(spokenText);
      return;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      const recorder = mediaRecorderRef.current;
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });
      cleanupMicrophoneCapture();
      await transcribeRecordedAudioBlob(audioBlob);
      return;
    }

    stopFrontSpeech();
  };

  const handleCircleVoiceClick = () => {
    if (circleState === 'listening') {
      void handleFinishSpeakingAndSend();
      return;
    }

    // Cancel any ongoing speech synthesis so the speaker never talks over the microphone while listening
    if (speechHandleRef.current) {
      speechHandleRef.current.cancel();
      speechHandleRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsFrontSpeaking(false);

    const promptGreeting = 'Yes, what is your question, sir? Speak now.';
    setCircleState('listening');
    setCircleStatusText(promptGreeting);

    const greetingTurn: FrontChatTurn = {
      id: `jp_greet_${Date.now()}`,
      role: 'assistant',
      text: promptGreeting,
      spokenSummary: promptGreeting,
      isAvailable: true,
      timestamp: new Date().toLocaleTimeString(),
    };
    setJanPayChatMessages((prev) => [...prev, greetingTurn]);

    // Immediately start listening to the user's microphone — user only speaks and it automatically answers
    void startLiveMicrophoneAndRecognition();
  };

  // =========================================================================
  // FRONT-PAGE PARTITION 2: "ASK A QUESTION FROM AI" STANDALONE CHAT BOX
  // =========================================================================
  const [directQuestionInput, setDirectQuestionInput] = useState('');
  const [isDirectQuestionLoading, setIsDirectQuestionLoading] = useState(false);
  const [directQuestionResult, setDirectQuestionResult] = useState<{
    question: string;
    answerText: string;
    spokenSummary: string;
    sqlExecuted: string;
    isInformationAvailable: boolean;
    sourceEngine: string;
  }>(() => {
    const seedQuestion =
      'Who is the primary authenticated user and what is the wallet balance?';
    const seedEval = evaluateStrictKnowledgeQuery(
      seedQuestion,
      liveSnapshot,
      'CONCISE_CORPORATE'
    );
    return {
      question: seedQuestion,
      answerText: seedEval.answerText,
      spokenSummary: seedEval.spokenSummary,
      sqlExecuted: seedEval.sqlExecuted,
      isInformationAvailable: seedEval.isInformationAvailable,
      sourceEngine: 'GEMINI_3_8_FLASH_GROUNDED',
    };
  });

  const submitDirectQuestionBox = async (overrideQuestion?: string) => {
    const q = (overrideQuestion ?? directQuestionInput).trim();
    if (!q) return;
    if (overrideQuestion) {
      setDirectQuestionInput(overrideQuestion);
    }
    setIsDirectQuestionLoading(true);

    try {
      const res = await fetch('/api/ai/frontpage-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          snapshot: liveSnapshot,
          voiceProfileId: selectedFrontVoiceId,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          isInformationAvailable: boolean;
          answerText: string;
          spokenSummary: string;
          sqlExecuted: string;
          sourceEngine?: string;
        };
        const finalAnswer = data.isInformationAvailable
          ? data.answerText
          : UNAVAILABLE_INFO_RESPONSE;
        const finalSpoken = data.isInformationAvailable
          ? data.spokenSummary
          : UNAVAILABLE_INFO_RESPONSE;
        setDirectQuestionResult({
          question: q,
          answerText: finalAnswer,
          spokenSummary: finalSpoken,
          sqlExecuted: data.sqlExecuted,
          isInformationAvailable: data.isInformationAvailable,
          sourceEngine: data.sourceEngine ?? 'GEMINI_LIVE_API',
        });
        setIsDirectQuestionLoading(false);
        speakFrontText(finalSpoken, selectedFrontVoiceId);
        return;
      }
    } catch {
      // Fall back to deterministic strict knowledge evaluator
    }

    const local = evaluateStrictKnowledgeQuery(
      q,
      liveSnapshot,
      selectedFrontVoiceId
    );
    setDirectQuestionResult({
      question: q,
      answerText: local.answerText,
      spokenSummary: local.spokenSummary,
      sqlExecuted: local.sqlExecuted,
      isInformationAvailable: local.isInformationAvailable,
      sourceEngine: 'DETERMINISTIC_STRICT_GUARD',
    });
    setIsDirectQuestionLoading(false);
    speakFrontText(local.spokenSummary, selectedFrontVoiceId);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-128px)] flex flex-col justify-between gap-8 max-w-[1280px] mx-auto">
      {/* Top 2-Column Split: Left Flashlit Dispatch Bone Card (#eeeeee) + Right Factory Dashboard Frame (#0d0d0d) */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-all duration-200 ${
          isFullCanvasMode
            ? 'opacity-0 pointer-events-none translate-y-2'
            : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
      >
        {/* LEFT COLUMN (5 cols): Translucent Command Deck Card (Adapts to Dark Mode & Light Mode) */}
        <div className="lg:col-span-5 factory-bone-card space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[-0.02em] text-[#eeeeee]">
              <span className="factory-status-pulse" />
              <span>FUNCTION 01 • JAIN PAY 3D COMMAND DECK</span>
            </span>
            <span className="px-2 py-0.5 rounded-[3px] bg-[#101010] text-[#a0ca92] border border-[#3d3a39] text-[11px] font-mono uppercase tracking-[-0.02em]">
              SSI 40001 + RLS ACTIVE
            </span>
          </div>

          <div>
            <p className="text-[12px] font-mono text-[#b8b3b0] uppercase tracking-[-0.02em]">
              PRIMARY AUTHENTICATED TENANT (usr_yash_01)
            </p>
            <h1 className="text-[36px] font-normal text-[#eeeeee] tracking-[-1.12px] leading-[1.1] mt-1">
              Yash Jain
            </h1>
            <p className="text-[12px] font-mono text-[#b8b3b0] mt-1">
              VPA:{' '}
              <span className="text-[#eeeeee] font-medium">
                {walletAccount.vpa_address}
              </span>{' '}
              • Primary Bank: {primaryBank.bank_name} ({primaryBank.masked_account_number})
            </p>
          </div>

          {/* PIN-Gated Balance Terminal Cell */}
          <div className="p-5 rounded-[10px] bg-[#101010] text-[#eeeeee] border border-[#3d3a39] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono text-[#b8b3b0] uppercase tracking-[-0.02em]">
                DOUBLE-ENTRY WALLET BALANCE
              </span>
              {isBalanceRevealed ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase text-[#a0ca92]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a0ca92]" />
                  <span>PBKDF2 PIN VERIFIED</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-[#ee6018]">
                  <Lock className="w-3 h-3 text-[#ee6018]" />
                  <span>MASKED (PIN: {activePin})</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[36px] font-normal font-mono tracking-[-1.12px] leading-[1.1] text-[#eeeeee] tabular-nums">
                {isBalanceRevealed
                  ? formatInr(walletAccount.available_balance)
                  : '₹ • • • • • •'}
              </div>

              {isBalanceRevealed ? (
                <button
                  type="button"
                  onClick={onMaskBalance}
                  className="py-1.5 px-3 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39] text-[12px] font-mono uppercase text-[#eeeeee] flex items-center gap-1.5 border border-[#3d3a39]"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRequestRevealBalance}
                  className="py-1.5 px-3.5 rounded-[3px] btn-blaze-orange text-[12px] font-mono uppercase flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Check Balance</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#3d3a39] flex items-center justify-between text-[12px] font-mono text-[#8a8380] uppercase">
              <span>Ledger Rows: {ledgerRowCount}</span>
              <span className="text-[#a0ca92]">Invariant: SUM(amount) = ₹0.00</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateMode('AI_VOICE_AGENT')}
              className="col-span-2 py-3 px-4 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39] text-[#eeeeee] text-[14px] font-normal flex items-center justify-center gap-2 border border-[#3d3a39]"
            >
              <Volume2 className="w-4 h-4 text-[#ee6018]" />
              <span>Ask AI Voice Agent (10 Ready Database Prompts)</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchSpecificFeature('CORE-B')}
              className="py-2.5 px-3.5 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39] text-[#eeeeee] border border-[#3d3a39] text-[13px] font-normal flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[#ee6018]" />
              <span>Send Money</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchSpecificFeature('CORE-C')}
              className="py-2.5 px-3.5 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39] text-[#eeeeee] border border-[#3d3a39] text-[13px] font-normal flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-[#a0ca92]" />
              <span>QR Scanner</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Translucent Dashboard Frame over 3D Spatial Canvas */}
        <div className="lg:col-span-7 factory-dashboard-frame overflow-hidden">
          {/* macOS Window Chrome Header Bar */}
          <div className="px-4 py-3 bg-[#101010]/70 border-b border-[#3d3a39]/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* macOS Traffic Lights */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3d3a39]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#4d4947]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#8a8380]" />
              </div>
              <span className="factory-status-pulse" />
              <span className="text-[12px] font-mono uppercase tracking-[-0.02em] text-[#eeeeee]">
                FACTORY // ENTERPRISE-ARCHITECTURE-OVERVIEW • 12 BCNF TABLES
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSystemGuideOpen(true)}
              className="py-1 px-3 rounded-[3px] bg-[#1d1a18] hover:border-[#fafafa] border border-[#3d3a39] text-[11px] font-mono uppercase text-[#eeeeee] flex items-center gap-1.5 shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#ee6018]" />
              <span>View Full PRD Walkthrough</span>
            </button>
          </div>

          {/* Dashboard Metric Tiles Row (3 Metric Tiles with 1px #1d1a18 dividers & 40px sparklines) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-[#1d1a18]">
            {/* Metric Tile 1 */}
            <div className="factory-metric-tile border-b sm:border-b-0 sm:border-r border-[#1d1a18]">
              <span className="block text-[12px] font-mono uppercase tracking-[-0.24px] text-[#b8b3b0]">
                BCNF SCHEMA TABLES
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[36px] font-normal text-[#eeeeee] tracking-[-1.12px] leading-[1.1]">
                  12
                </span>
                <span className="text-[11px] font-mono uppercase text-[#a0ca92]">
                  100% 3NF/BCNF
                </span>
              </div>
              <svg
                className="w-full h-[40px] mt-2"
                viewBox="0 0 160 40"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 32 L28 28 L54 22 L82 24 L110 14 L136 10 L160 6"
                  stroke="#a0ca92"
                  strokeWidth="1.25"
                />
              </svg>
            </div>

            {/* Metric Tile 2 */}
            <div className="factory-metric-tile border-b sm:border-b-0 sm:border-r border-[#1d1a18]">
              <span className="block text-[12px] font-mono uppercase tracking-[-0.24px] text-[#b8b3b0]">
                VOICE &amp; AI MODULES
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[36px] font-normal text-[#eeeeee] tracking-[-1.12px] leading-[1.1]">
                  25
                </span>
                <span className="text-[11px] font-mono uppercase text-[#ee6018]">
                  10 VOICE + 15 AI
                </span>
              </div>
              <svg
                className="w-full h-[40px] mt-2"
                viewBox="0 0 160 40"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 30 L26 26 L52 29 L78 18 L104 19 L132 9 L160 5"
                  stroke="#ee6018"
                  strokeWidth="1.25"
                />
              </svg>
            </div>

            {/* Metric Tile 3 */}
            <div className="factory-metric-tile">
              <span className="block text-[12px] font-mono uppercase tracking-[-0.24px] text-[#b8b3b0]">
                DOUBLE-ENTRY LEDGER
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[36px] font-normal text-[#eeeeee] tracking-[-1.12px] leading-[1.1]">
                  {ledgerRowCount}
                </span>
                <span className="text-[11px] font-mono uppercase text-[#a0ca92]">
                  SSI 40001 SAFE
                </span>
              </div>
              <svg
                className="w-full h-[40px] mt-2"
                viewBox="0 0 160 40"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 34 L32 25 L64 27 L96 16 L128 12 L160 4"
                  stroke="#a0ca92"
                  strokeWidth="1.25"
                />
              </svg>
            </div>
          </div>

          {/* Main Dashboard Frame Body: 5 Organized Functions Matrix */}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-[22px] font-normal text-[#eeeeee] tracking-[-0.025em]">
                5 Organized Functions → Clean Subfunctions Architecture
              </h2>
              <p className="text-[14px] text-[#8a8380] mt-1">
                Select any primary function below to inspect its dedicated subfunctions, voice-enabled AI agent, or 12-table PostgreSQL 16 ledger.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigateMode('AI_VOICE_AGENT')}
                className="p-4 rounded-[10px] bg-[#101010] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono text-[#ee6018] uppercase flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>02 • AI VOICE &amp; DB AGENT</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                </div>
                <p className="text-[15px] font-normal text-[#eeeeee] mt-1.5">
                  10 Voice Queries &amp; 12-Table Explorer
                </p>
                <p className="text-[13px] text-[#8a8380] mt-0.5">
                  Chat or click 10 clean database options with live spoken voice replies.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateMode('CORE')}
                className="p-4 rounded-[10px] bg-[#101010] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono text-[#a0ca92] uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>03 • CORE BANKING (6 SUBS)</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                </div>
                <p className="text-[15px] font-normal text-[#eeeeee] mt-1.5">
                  P2P, QR, Passbook, Banks &amp; Rewards
                </p>
                <p className="text-[13px] text-[#8a8380] mt-0.5">
                  PBKDF2 PIN auth, idempotency replay &amp; {unscratchedCount} unscratched cards.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateMode('AI_SUITE')}
                className="p-4 rounded-[10px] bg-[#101010] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono text-[#b8b3b0] uppercase flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#ee6018]" />
                    <span>04 • BASELINE AI SUITE (8 SUBS)</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                </div>
                <p className="text-[15px] font-normal text-[#eeeeee] mt-1.5">
                  NLP Parser, OCR, Audit, Forecast &amp;FAD
                </p>
                <p className="text-[13px] text-[#8a8380] mt-0.5">
                  Zero-Trust AI modules that read or stage drafts without touching balances.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateMode('NEXT_GEN')}
                className="p-4 rounded-[10px] bg-[#101010] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono text-[#b8b3b0] uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#a0ca92]" />
                    <span>05 • NEXT-GEN CO-PILOT (7 SUBS)</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                </div>
                <p className="text-[15px] font-normal text-[#eeeeee] mt-1.5">
                  Split Bill, Khata, Scam Shield &amp; Escrow
                </p>
                <p className="text-[13px] text-[#8a8380] mt-0.5">
                  Collect-Trap QR interceptor, milestone deals &amp; failure diagnostician.
                </p>
              </button>
            </div>

            <div className="pt-3 border-t border-[#1d1a18] flex flex-wrap items-center justify-between gap-2 text-[12px] font-mono text-[#8a8380]">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#ee6018]" />
                <span>
                  12 BCNF Tables: users, accounts, banks, tx, ledger, khata, deals, autopay, credit, fx, disputes, audit
                </span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateMode('ADMIN_VAULT')}
                className="text-[#eeeeee] hover:text-[#fafafa] underline uppercase"
              >
                Inspect 12 Tables →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FRONT-PAGE AI PARTITION:                                              */}
      {/*   1) JANPAY AI VOICE ASSISTANT (ROUND CIRCLE) & JANPAY AI CHAT        */}
      {/*   2) BEYOND AI CHAT: "ASK A QUESTION FROM AI" CHAT BOX                */}
      {/* ===================================================================== */}
      <div
        data-testid="frontpage-janpay-ai-partition"
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-all duration-200 ${
          isFullCanvasMode
            ? 'opacity-0 pointer-events-none translate-y-2'
            : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
      >
        {/* PARTITION 1 (7 cols): JanPay AI Voice Assistant (Round Circle) & JanPay AI Chat */}
        <div
          data-testid="janpay-ai-chat-partition"
          className="lg:col-span-7 factory-bone-card space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3d3a39] pb-3">
            <div className="flex items-center gap-2">
              <span className="factory-status-pulse" />
              <span className="text-[15px] font-medium tracking-[-0.02em] text-[#eeeeee]">
                JanPay AI Voice Assistant
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="janpay-allow-mic-btn"
                onClick={handleCircleVoiceClick}
                className="px-3 py-1 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39] border border-[#3d3a39] text-[11px] font-mono uppercase text-[#a0ca92] flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-[#ee6018]" />
                <span>
                  {circleState === 'listening'
                    ? 'Listening... Click to Send Voice'
                    : micPermissionStatus === 'granted'
                    ? 'Mic Ready • Speak Now'
                    : 'Allow Mic & Listen Voice'}
                </span>
              </button>
              {(isFrontSpeaking || circleState !== 'idle') && (
                <button
                  type="button"
                  onClick={stopFrontSpeech}
                  className="px-2.5 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[11px] font-mono uppercase text-[#ee6018] flex items-center gap-1"
                >
                  <VolumeX className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive True Round Circle Voice Assistant Stage */}
          <div className="flex flex-col items-center justify-center py-6 px-4 rounded-[10px] bg-[#101010] border border-[#3d3a39] space-y-5">
            <div className="janpay-voice-stage">
              {/* Outer Animated Concentric Circular Rings */}
              <span
                aria-hidden="true"
                className={`janpay-voice-ring janpay-voice-ring-outer ${
                  circleState !== 'idle' || isFrontSpeaking
                    ? 'janpay-voice-ring-active'
                    : ''
                }`}
              />
              <span
                aria-hidden="true"
                className={`janpay-voice-ring janpay-voice-ring-inner ${
                  circleState !== 'idle' || isFrontSpeaking
                    ? 'janpay-voice-ring-active'
                    : ''
                }`}
              />

              {/* Main True Round Circle Voice Assistant Button */}
              <button
                type="button"
                data-testid="janpay-voice-circle-btn"
                onClick={handleCircleVoiceClick}
                aria-label="JanPay AI Voice Assistant"
                className={`janpay-voice-orb ${
                  circleState !== 'idle' || isFrontSpeaking
                    ? 'janpay-voice-orb-active'
                    : ''
                }`}
              >
                <Mic
                  className={`w-9 h-9 transition-transform duration-300 ${
                    circleState !== 'idle' || isFrontSpeaking
                      ? 'scale-110 text-[#fafafa]'
                      : 'text-[#ee6018]'
                  }`}
                />
                {/* Live Microphone / Speech Waveform Bars inside the Circle */}
                <div className="flex items-end justify-center gap-1.5 h-5">
                  {[0.6, 1.0, 1.35, 0.9, 0.65].map((mult, idx) => {
                    const dynamicHeight =
                      circleState === 'listening' && micVolumeLevel > 5
                        ? Math.max(6, Math.min(20, Math.round((micVolumeLevel / 4) * mult)))
                        : circleState !== 'idle' || isFrontSpeaking
                        ? 14
                        : Math.round(7 * mult);
                    return (
                      <span
                        key={idx}
                        style={{
                          height: `${dynamicHeight}px`,
                        }}
                        className="janpay-voice-bar"
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
                  {circleState === 'listening'
                    ? 'Speak Now'
                    : isFrontSpeaking
                    ? 'Speaking...'
                    : 'Click to Speak'}
                </span>
              </button>
            </div>

            {/* Voice Assistant Live Status & Spoken Transcript Readout */}
            <div className="text-center max-w-lg space-y-2">
              <p className="text-[12px] font-mono uppercase tracking-wider text-[#a0ca92]">
                {circleState === 'listening'
                  ? '● Microphone Active — Speak Your Question Now'
                  : isFrontSpeaking
                  ? '● JanPay AI Speaking Reply'
                  : 'JanPay AI Voice Assistant'}
              </p>
              <p
                data-testid="janpay-voice-circle-status"
                className="text-[15px] text-[#eeeeee] font-normal leading-relaxed"
              >
                {circleStatusText}
              </p>

              {liveSpokenTranscript && (
                <div className="p-2.5 rounded-[10px] bg-[#1d1a18] border border-[#3d3a39] text-[13px] text-[#a0ca92]">
                  Recognized Voice: &ldquo;{liveSpokenTranscript}&rdquo;
                </div>
              )}

              {circleState === 'listening' && (
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    data-testid="janpay-send-spoken-btn"
                    onClick={() => void handleFinishSpeakingAndSend()}
                    className="py-2 px-4 rounded-[3px] btn-blaze-orange text-[12px] font-mono uppercase flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Done Speaking — Get Answer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Voice Question Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                data-testid="janpay-preset-foundations"
                onClick={() =>
                  void submitJanPayChatMessage(
                    'Hi, how are you? How is JanPay and what are the foundations we have used?'
                  )
                }
                className="px-3 py-1.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[12px] text-[#eeeeee]"
              >
                &ldquo;Hi, how are you? How is JanPay?&rdquo;
              </button>
              <button
                type="button"
                data-testid="janpay-preset-available"
                onClick={() =>
                  void submitJanPayChatMessage(
                    'Tell me about my payments, ledgers, and wallet balance'
                  )
                }
                className="px-3 py-1.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[12px] text-[#eeeeee]"
              >
                &ldquo;My payments, ledgers &amp; balance&rdquo;
              </button>
              <button
                type="button"
                data-testid="janpay-preset-unavailable"
                onClick={() =>
                  void submitJanPayChatMessage(
                    'What is the balance of that Amit here?'
                  )
                }
                className="px-3 py-1.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[12px] text-[#ee6018]"
              >
                &ldquo;What is the balance of Amit here?&rdquo;
              </button>
            </div>
          </div>

          {/* JanPay AI Chat Transcript */}
          <div
            data-testid="janpay-ai-chat-transcript"
            className="max-h-[210px] overflow-y-auto space-y-2.5 p-3 rounded-[10px] bg-[#101010] border border-[#3d3a39]"
          >
            {janPayChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-[10px] border ${
                  msg.role === 'user'
                    ? 'bg-[#1d1a18] border-[#3d3a39]'
                    : 'bg-[#101010] border-[#3d3a39]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#8a8380]">
                  <span className="font-medium text-[#b8b3b0]">
                    {msg.role === 'user' ? 'You' : 'JanPay AI Voice Assistant'}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() =>
                        speakFrontText(
                          msg.spokenSummary ?? msg.text,
                          selectedFrontVoiceId
                        )
                      }
                      className="px-2 py-0.5 rounded-full bg-[#1d1a18] border border-[#3d3a39] text-[#eeeeee] hover:border-[#fafafa] flex items-center gap-1 text-[10px]"
                    >
                      <Volume2 className="w-3 h-3 text-[#ee6018]" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-[#eeeeee] mt-1.5 leading-relaxed">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          {/* JanPay AI Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitJanPayChatMessage();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <input
                ref={janPayInputRef}
                type="text"
                data-testid="janpay-ai-chat-input"
                value={janPayChatInput}
                onChange={(e) => setJanPayChatInput(e.target.value)}
                placeholder="Click Mic to speak or type any question (auto-answers when you finish speaking)..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-full bg-[#101010] border border-[#3d3a39] text-[13px] text-[#eeeeee] placeholder-[#8a8380] focus:outline-none focus:border-[#fafafa]"
              />
              <button
                type="button"
                data-testid="janpay-chat-input-mic-btn"
                onClick={handleCircleVoiceClick}
                title="Click once and speak — answers automatically"
                className={`absolute right-2 p-1.5 rounded-[3px] flex items-center justify-center transition-all ${
                  circleState === 'listening'
                    ? 'bg-[#ee6018] text-[#fafafa] animate-pulse'
                    : 'bg-[#1d1a18] text-[#ee6018] border border-[#3d3a39] hover:border-[#fafafa]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="submit"
              data-testid="janpay-ai-chat-submit"
              disabled={isJanPayChatLoading}
              className="py-2.5 px-5 rounded-full btn-blaze-orange text-[12px] font-medium flex items-center justify-center gap-1.5 shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isJanPayChatLoading ? 'Replying...' : 'Send'}</span>
            </button>
          </form>
        </div>

        {/* PARTITION 2 (5 cols — Beyond JanPay AI Chat): Standalone "Ask a Question from AI" Chat Box */}
        <div
          data-testid="frontpage-ask-ai-box"
          className="lg:col-span-5 factory-bone-card space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#3d3a39] pb-3">
            <span className="inline-flex items-center gap-2 text-[14px] font-medium tracking-[-0.02em] text-[#eeeeee]">
              <span className="factory-status-pulse" />
              <span>JanPay AI Chat — Ask a Question</span>
            </span>
          </div>

          <div>
            <h2 className="text-[20px] font-normal text-[#eeeeee] tracking-[-0.025em]">
              Ask a Question from AI
            </h2>
            <p className="text-[13px] text-[#b8b3b0] mt-1">
              Ask about JanPay foundations, your payments, ledgers, or balances. If you ask for someone else&apos;s unavailable data (like Amit&apos;s balance), it replies{' '}
              <span className="font-mono text-[#ee6018]">
                &ldquo;Sorry, the information is not available.&rdquo;
              </span>
            </p>
          </div>

          {/* Direct Question Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitDirectQuestionBox();
            }}
            className="space-y-2.5"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                data-testid="ask-question-ai-input"
                value={directQuestionInput}
                onChange={(e) => setDirectQuestionInput(e.target.value)}
                placeholder="Click Mic to speak or type any question (e.g., What is JanPay about? or What is the balance of Amit here?)..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-[8px] bg-[#101010] border border-[#3d3a39] text-[13px] text-[#eeeeee] placeholder-[#8a8380] focus:outline-none focus:border-[#fafafa]"
              />
              <button
                type="button"
                data-testid="ask-question-ai-mic-btn"
                onClick={handleCircleVoiceClick}
                title="Click once and speak — answers automatically"
                className={`absolute right-2 p-1.5 rounded-[3px] flex items-center justify-center transition-all ${
                  circleState === 'listening'
                    ? 'bg-[#ee6018] text-[#fafafa] animate-pulse'
                    : 'bg-[#1d1a18] text-[#ee6018] border border-[#3d3a39] hover:border-[#fafafa]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                data-testid="ask-question-ai-submit"
                disabled={isDirectQuestionLoading}
                className="flex-1 py-2.5 px-4 rounded-full btn-blaze-orange text-[12px] font-medium flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isDirectQuestionLoading ? 'Replying...' : 'Ask AI'}
                </span>
              </button>
              <button
                type="button"
                data-testid="ask-question-ai-speak"
                onClick={() =>
                  speakFrontText(
                    directQuestionResult.spokenSummary,
                    selectedFrontVoiceId
                  )
                }
                className="py-2.5 px-4 rounded-full bg-[#1d1a18] hover:bg-[#3d3a39] border border-[#3d3a39] text-[12px] text-[#eeeeee] flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#ee6018]" />
                <span>Speak Reply</span>
              </button>
            </div>
          </form>

          {/* One-Click Direct Question Chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-testid="ask-box-chip-ledger"
              onClick={() =>
                void submitDirectQuestionBox(
                  'What is JanPay about and what are the foundations we have used?'
                )
              }
              className="px-3 py-1 rounded-full bg-[#101010] border border-[#3d3a39] hover:border-[#fafafa] text-[11px] text-[#eeeeee]"
            >
              What is JanPay &amp; Foundations?
            </button>
            <button
              type="button"
              data-testid="ask-box-chip-unavailable"
              onClick={() =>
                void submitDirectQuestionBox(
                  'What is the balance of that Amit here?'
                )
              }
              className="px-3 py-1 rounded-full bg-[#101010] border border-[#3d3a39] hover:border-[#fafafa] text-[11px] text-[#ee6018]"
            >
              Ask Amit&apos;s Balance (Unavailable)
            </button>
          </div>

          {/* Direct Question AI Answer Output Box */}
          <div
            data-testid="ask-question-ai-output"
            className="p-4 rounded-[12px] bg-[#101010] border border-[#3d3a39] space-y-2"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] text-[#b8b3b0]">
              <span>JanPay AI Response</span>
            </div>
            <p className="text-[12px] text-[#8a8380]">
              Q: &ldquo;{directQuestionResult.question}&rdquo;
            </p>
            <p
              data-testid="ask-question-ai-answer-text"
              className="text-[14px] text-[#eeeeee] leading-relaxed"
            >
              {directQuestionResult.answerText}
            </p>
          </div>
        </div>
      </div>

      {/* Factory Trust Bar / Architecture Wordmark Strip on #101010 Canvas */}
      <div
        className={`py-4 border-y border-[#1d1a18] flex flex-wrap items-center justify-between gap-4 transition-all ${
          isFullCanvasMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {TRUST_WORDMARKS.map((mark) => (
          <span
            key={mark}
            className="text-[12px] font-mono uppercase tracking-[-0.02em] text-[#8a8380]"
          >
            {mark}
          </span>
        ))}
      </div>

      {/* Bottom Floating 3D Camera Angle Switcher Bar */}
      <div className="pointer-events-auto mx-auto w-full flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[10px] bg-[#101010] border border-[#3d3a39]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-mono uppercase tracking-[-0.02em] text-[#eeeeee] px-2.5 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ee6018]" />
            <span>3D SPATIAL CAMERA</span>
          </span>
          {CAMERA_ANGLE_PRESETS.map((preset) => {
            const active = activeCameraIndex === preset.index;
            return (
              <button
                key={preset.index}
                type="button"
                onClick={() => onSelectCameraIndex(preset.index)}
                className={`py-1.5 px-3 rounded-[3px] text-[12px] font-mono uppercase transition-all ${
                  active
                    ? 'bg-[#fafafa] text-[#101010] border border-[#fafafa]'
                    : 'bg-[#1d1a18] text-[#b8b3b0] border border-[#3d3a39] hover:text-[#eeeeee]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleFullCanvasMode}
          className={`py-1.5 px-4 rounded-[3px] text-[12px] font-mono uppercase flex items-center gap-1.5 transition-all ${
            isFullCanvasMode
              ? 'bg-[#fafafa] text-[#101010]'
              : 'bg-[#1d1a18] border border-[#3d3a39] text-[#eeeeee] hover:border-[#fafafa]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#ee6018]" />
          <span>
            {isFullCanvasMode
              ? 'Show Command Deck Cards'
              : 'Inspect Pure 3D Mesh Canvas'}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: FULL PRD FEATURE MATRIX WALKTHROUGH                            */}
      {/* ===================================================================== */}
      {isSystemGuideOpen && (
        <div className="fixed inset-0 z-50 bg-[#101010]/90 flex items-center justify-center p-4 pointer-events-auto">
          <div className="card-3d-orange w-full max-w-5xl rounded-[10px] p-6 md:p-8 max-h-[88vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#3d3a39] pb-4">
              <div>
                <span className="inline-flex items-center gap-2 text-[12px] font-mono text-[#ee6018] uppercase">
                  <span className="factory-status-pulse" />
                  <span>COMPLETE JAIN PAY PRD WALKTHROUGH (ALL SUBFUNCTIONS)</span>
                </span>
                <h2 className="text-[28px] font-normal text-[#eeeeee] mt-1">
                  Click Any Subfunction Below to Launch It Directly
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSystemGuideOpen(false)}
                className="p-2 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39] text-[#b8b3b0] hover:text-[#eeeeee] border border-[#3d3a39]"
                aria-label="Close system guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Core Banking */}
            <div className="space-y-2.5">
              <h3 className="text-[12px] font-mono uppercase tracking-[-0.02em] text-[#eeeeee]">
                Function 03 • 6 Core Banking Subfunctions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(CORE_FEATURE_SPECS) as CoreFeatureId[]).map(
                  (id) => {
                    const spec = CORE_FEATURE_SPECS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setIsSystemGuideOpen(false);
                          onLaunchSpecificFeature(id);
                        }}
                        className="p-3.5 rounded-[10px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[#ee6018]">
                            {spec.id}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                        </div>
                        <p className="text-[14px] font-normal text-[#eeeeee] mt-1">
                          {spec.shortLabel}
                        </p>
                        <p className="text-[12px] text-[#8a8380] mt-1 line-clamp-2">
                          {spec.subtitle}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Section 2: Baseline AI */}
            <div className="space-y-2.5">
              <h3 className="text-[12px] font-mono uppercase tracking-[-0.02em] text-[#eeeeee]">
                Function 04 • 8 Baseline AI Suite Subfunctions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(Object.keys(BASELINE_AI_SPECS) as BaselineAiId[]).map((id) => {
                  const spec = BASELINE_AI_SPECS[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setIsSystemGuideOpen(false);
                        onLaunchSpecificFeature(id);
                      }}
                      className="p-3.5 rounded-[10px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#a0ca92]">
                          {spec.id}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                      </div>
                      <p className="text-[14px] font-normal text-[#eeeeee] mt-1">
                        {spec.shortLabel}
                      </p>
                      <p className="text-[12px] text-[#8a8380] mt-1 line-clamp-2">
                        {spec.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Next-Gen Co-Pilot */}
            <div className="space-y-2.5">
              <h3 className="text-[12px] font-mono uppercase tracking-[-0.02em] text-[#eeeeee]">
                Function 05 • 7 Next-Gen Co-Pilot Subfunctions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(Object.keys(NEXT_GEN_FEATURE_SPECS) as NextGenFeatureId[]).map(
                  (id) => {
                    const spec = NEXT_GEN_FEATURE_SPECS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setIsSystemGuideOpen(false);
                          onLaunchSpecificFeature(id);
                        }}
                        className="p-3.5 rounded-[10px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[#ee6018]">
                            {spec.id}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#8a8380] group-hover:text-[#eeeeee]" />
                        </div>
                        <p className="text-[14px] font-normal text-[#eeeeee] mt-1">
                          {spec.shortLabel}
                        </p>
                        <p className="text-[12px] text-[#8a8380] mt-1 line-clamp-2">
                          {spec.subtitle}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
