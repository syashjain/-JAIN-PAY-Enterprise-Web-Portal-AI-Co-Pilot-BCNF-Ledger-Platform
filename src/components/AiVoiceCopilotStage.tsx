import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TEN_AI_VOICE_CHAT_OPTIONS,
  PGBOUNCER_HIKARICP_CONFIG,
} from '../data/initialState';
import {
  AiVoiceChatOption,
  BcnfTableName,
} from '../types/domain';
import {
  useVoiceAgent,
  resolveVoiceAgentOrbStatus,
  resolveVoiceOrbVisualTokens,
  computeRealtimeWaveBarHeights,
  type LiveDatabaseSnapshot,
  type VoiceOrbInteractionState,
} from '../utils/aiVoiceEngine';
import { formatInr } from '../utils/ledgerEngine';
import { VoiceAgentSubfunctionId } from '../context/JainPayContext';
import {
  Volume2,
  VolumeX,
  Send,
  Database,
  Play,
  Square,
  CheckCircle2,
  Terminal,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Globe,
  ShieldAlert,
  Radio,
  MessageSquare,
  Search,
  Mic,
  MicOff,
  ExternalLink,
  Trash2,
  Sparkles,
  FileText,
  Download,
  BookOpen,
} from 'lucide-react';
import {
  downloadVoiceQuestionsPdf,
  VERIFIED_20_VOICE_QUERIES,
  type VerifiedVoiceQueryItem,
} from '../utils/voiceQuestionsPdfGenerator';

interface AiVoiceCopilotStageProps {
  activeSubfunction: VoiceAgentSubfunctionId;
  onSelectSubfunction: (sub: VoiceAgentSubfunctionId) => void;
  snapshot: LiveDatabaseSnapshot;
  onToggleAutopayMandate: (mandateId: string) => void;
  onRepayCreditSanction: (amount: number) => void;
  onInspectTableInVault: (table: BcnfTableName) => void;
}

export const AiVoiceCopilotStage: React.FC<AiVoiceCopilotStageProps> = ({
  activeSubfunction,
  onSelectSubfunction,
  snapshot,
  onToggleAutopayMandate,
  onRepayCreditSanction,
  onInspectTableInVault,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [multiTurnInput, setMultiTurnInput] = useState('');
  const [liveCustomVoiceInput, setLiveCustomVoiceInput] = useState('');
  const [previewOrbState, setPreviewOrbState] =
    useState<VoiceOrbInteractionState | null>(null);
  const [activeQueryTab, setActiveQueryTab] = useState<'20_VERIFIED_PDF' | '10_QUICK'>(
    '20_VERIFIED_PDF'
  );
  const [pdfDownloadFeedback, setPdfDownloadFeedback] = useState<string | null>(null);

  // Web Speech API SpeechRecognition State & Microphone Permissions
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<
    'prompt' | 'granted' | 'denied'
  >('prompt');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>('');
  const [activeTargetMode, setActiveTargetMode] = useState<
    'customPrompt' | 'multiTurn' | 'live' | 'auto'
  >('customPrompt');

  const recognitionRef = useRef<{ stop: () => void; abort?: () => void } | null>(
    null
  );
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const submittedVoiceRef = useRef<boolean>(false);
  const activeTargetModeRef = useRef<
    'customPrompt' | 'multiTurn' | 'live' | 'auto'
  >('customPrompt');

  // Web Audio API AnalyserNode & requestAnimationFrame Wave Visualizer Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const frequencyBinsRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafWaveIdRef = useRef<number | null>(null);
  const orbBarRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const eqBarRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const intensityBadgeRef = useRef<HTMLSpanElement | null>(null);

  const {
    voiceProfiles,
    selectedProfileId,
    selectedProfile,
    setSelectedProfileId,
    previewVoiceProfile,
    autoSpeakEnabled,
    setAutoSpeakEnabled,
    isSpeaking,
    isLoadingReply,
    isStreamingText,
    streamedAnswerText,
    activeOptionId,
    latestTurn,
    activeSpeechClause,
    speechStreamProgress,
    speakTextAloud,
    stopSpeaking,
    executeAiVoiceQuery,
    // Multi-Turn Gemini Chatbot
    chatbotRoles,
    modelTiers,
    selectedRoleId,
    setSelectedRoleId,
    selectedModelTierId,
    setSelectedModelTierId,
    chatMessages,
    isSendingChatMessage,
    sendMultiTurnMessage,
    clearMultiTurnHistory,
    // Google Search Grounding
    searchPresetQueries,
    searchQuery,
    setSearchQuery,
    searchResult,
    isSearchingGrounding,
    executeSearchGrounding,
    // Gemini Live API (gemini-3.8-live)
    liveTrainingPrompts,
    isLiveSessionActive,
    liveSessionStatus,
    liveTranscripts,
    startLiveVoiceSession,
    stopLiveVoiceSession,
    sendLiveVoiceTurn,
  } = useVoiceAgent(snapshot);

  const handleOptionClick = (opt: AiVoiceChatOption) => {
    void executeAiVoiceQuery(opt.promptText, opt.id);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    const q = customPrompt.trim();
    setCustomPrompt('');
    void executeAiVoiceQuery(q);
  };

  const handleMultiTurnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiTurnInput.trim()) return;
    const msg = multiTurnInput.trim();
    setMultiTurnInput('');
    void sendMultiTurnMessage(msg);
  };

  const handleSearchGroundingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    void executeSearchGrounding(searchQuery);
  };

  const handleLiveVoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveCustomVoiceInput.trim()) return;
    const txt = liveCustomVoiceInput.trim();
    setLiveCustomVoiceInput('');
    sendLiveVoiceTurn(txt);
  };

  const activeChatbotRole =
    chatbotRoles.find((r) => r.id === selectedRoleId) ?? chatbotRoles[0];

  const cleanupSpeechRecognition = useCallback(() => {
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {
        // ignore audio context close errors
      }
      audioContextRef.current = null;
    }
    analyserNodeRef.current = null;
    frequencyBinsRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListeningMic(false);
  }, []);

  const triggerVoiceSubmission = useCallback(
    (queryText: string) => {
      if (submittedVoiceRef.current) return;
      const cleaned = queryText.trim();
      if (!cleaned) return;
      submittedVoiceRef.current = true;
      cleanupSpeechRecognition();
      setLiveInterimTranscript('');

      const mode = activeTargetModeRef.current;
      if (
        mode === 'multiTurn' ||
        (mode === 'auto' && activeSubfunction === 'MULTI_TURN_CHATBOT')
      ) {
        setMultiTurnInput(cleaned);
        void sendMultiTurnMessage(cleaned);
      } else if (
        mode === 'live' ||
        (mode === 'auto' && activeSubfunction === 'LIVE_VOICE_SESSION')
      ) {
        setLiveCustomVoiceInput(cleaned);
        sendLiveVoiceTurn(cleaned);
      } else {
        setCustomPrompt(cleaned);
        void executeAiVoiceQuery(cleaned);
      }
    },
    [
      activeSubfunction,
      cleanupSpeechRecognition,
      executeAiVoiceQuery,
      sendLiveVoiceTurn,
      sendMultiTurnMessage,
    ]
  );

  const startListeningVoice = useCallback(
    async (
      targetMode: 'customPrompt' | 'multiTurn' | 'live' | 'auto' = 'auto'
    ) => {
      cleanupSpeechRecognition();
      submittedVoiceRef.current = false;
      setActiveTargetMode(targetMode);
      activeTargetModeRef.current = targetMode;
      setLiveInterimTranscript('');
      setSpeechError(null);

      // 1. Request Microphone Permissions via navigator.mediaDevices.getUserMedia + Web Audio AnalyserNode
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

          // Bind Web Audio API AnalyserNode for real-time requestAnimationFrame wave intensity
          if (typeof window !== 'undefined') {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;
            if (AudioCtx) {
              try {
                const audioCtx = new AudioCtx();
                audioContextRef.current = audioCtx;
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.78;
                source.connect(analyser);
                analyserNodeRef.current = analyser;
                frequencyBinsRef.current = new Uint8Array(
                  analyser.frequencyBinCount
                );
              } catch {
                // Fallback to harmonic requestAnimationFrame animation if AudioContext is restricted
              }
            }
          }
        } catch {
          setMicPermissionStatus('denied');
          setSpeechError(
            'Microphone access denied. Please allow microphone permission in your browser.'
          );
          setIsListeningMic(false);
          return;
        }
      }

      // 2. Initialize Web Speech API SpeechRecognition interface
      if (typeof window === 'undefined') return;

      const SpeechRec =
        (window as unknown as { SpeechRecognition?: new () => any })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => any })
          .webkitSpeechRecognition;

      if (!SpeechRec) {
        setSpeechError(
          'Web Speech API SpeechRecognition is not supported in this browser environment. Please type your query.'
        );
        return;
      }

      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedProfile.speechLang || 'en-IN';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListeningMic(true);
          setSpeechError(null);
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          let hasFinal = false;

          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            if (item?.[0]?.transcript) {
              fullTranscript += item[0].transcript + ' ';
            }
            if (item?.isFinal) {
              hasFinal = true;
            }
          }

          const cleaned = fullTranscript.trim();
          if (cleaned) {
            setLiveInterimTranscript(cleaned);

            // Dynamically set captured text into the active chat query input
            const mode = activeTargetModeRef.current;
            if (
              mode === 'multiTurn' ||
              (mode === 'auto' && activeSubfunction === 'MULTI_TURN_CHATBOT')
            ) {
              setMultiTurnInput(cleaned);
            } else if (
              mode === 'live' ||
              (mode === 'auto' && activeSubfunction === 'LIVE_VOICE_SESSION')
            ) {
              setLiveCustomVoiceInput(cleaned);
            } else {
              setCustomPrompt(cleaned);
            }

            if (silenceTimeoutRef.current) {
              window.clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }

            // Trigger the Gemini AI response chain if final or after speech pause
            if (hasFinal) {
              triggerVoiceSubmission(cleaned);
            } else {
              silenceTimeoutRef.current = window.setTimeout(() => {
                triggerVoiceSubmission(cleaned);
              }, 1800);
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            setSpeechError(`Speech recognition: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListeningMic(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setSpeechError(
          `Failed to start SpeechRecognition: ${err?.message || 'Unknown error'}`
        );
        cleanupSpeechRecognition();
      }
    },
    [
      activeSubfunction,
      cleanupSpeechRecognition,
      selectedProfile.speechLang,
      triggerVoiceSubmission,
    ]
  );

  const stopListeningVoice = useCallback(() => {
    cleanupSpeechRecognition();
  }, [cleanupSpeechRecognition]);

  const finishSpeakingAndTrigger = useCallback(() => {
    if (liveInterimTranscript.trim()) {
      triggerVoiceSubmission(liveInterimTranscript.trim());
    } else {
      cleanupSpeechRecognition();
    }
  }, [cleanupSpeechRecognition, liveInterimTranscript, triggerVoiceSubmission]);

  const toggleListeningVoice = useCallback(
    (targetMode: 'customPrompt' | 'multiTurn' | 'live' | 'auto' = 'auto') => {
      if (isListeningMic) {
        if (liveInterimTranscript.trim()) {
          finishSpeakingAndTrigger();
        } else {
          stopListeningVoice();
        }
      } else {
        void startListeningVoice(targetMode);
      }
    },
    [
      finishSpeakingAndTrigger,
      isListeningMic,
      liveInterimTranscript,
      startListeningVoice,
      stopListeningVoice,
    ]
  );

  // Resolve live high-contrast 'Status / Voice Agent' indicator state & label
  const liveOrbStatus = resolveVoiceAgentOrbStatus({
    isListeningMic,
    isLoadingReply,
    isSendingChatMessage,
    isSearchingGrounding,
    isSpeaking,
    isStreamingText,
    activePersonaName: selectedProfile.name,
  });

  // Automatically clear any manual preview override when a live voice/query interaction starts
  useEffect(() => {
    if (liveOrbStatus.isActive && previewOrbState !== null) {
      setPreviewOrbState(null);
    }
  }, [liveOrbStatus.isActive, previewOrbState]);

  const effectiveOrbState: VoiceOrbInteractionState = liveOrbStatus.isActive
    ? liveOrbStatus.state
    : previewOrbState ?? liveOrbStatus.state;

  const orbStatus = resolveVoiceAgentOrbStatus({
    isListeningMic: effectiveOrbState === 'LISTENING',
    isLoadingReply: effectiveOrbState === 'PROCESSING',
    isSpeaking: effectiveOrbState === 'SPEAKING',
    isStreamingText: effectiveOrbState === 'SPEAKING',
    activePersonaName: selectedProfile.name,
  });

  const orbVisualTokens = resolveVoiceOrbVisualTokens(
    orbStatus.state,
    selectedProfile.name
  );

  // Real-time requestAnimationFrame audio wave intensity loop (Web Audio AnalyserNode + smooth fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyWaveFrameToDom = (elapsedMs: number) => {
      if (
        orbStatus.state === 'LISTENING' &&
        analyserNodeRef.current &&
        frequencyBinsRef.current
      ) {
        try {
          analyserNodeRef.current.getByteFrequencyData(
            frequencyBinsRef.current
          );
        } catch {
          // ignore analyser read errors
        }
      }

      const frame = computeRealtimeWaveBarHeights({
        state: orbStatus.state,
        frequencyBins:
          orbStatus.state === 'LISTENING' ? frequencyBinsRef.current : null,
        elapsedMs,
        speechRate: selectedProfile.speechRate,
        speechPitch: selectedProfile.speechPitch,
        orbBarCount: 5,
        equalizerBarCount: 16,
      });

      for (let i = 0; i < frame.orbBarHeightsPx.length; i += 1) {
        const el = orbBarRefs.current[i];
        if (el) {
          el.style.height = `${frame.orbBarHeightsPx[i]}px`;
        }
      }

      for (let i = 0; i < frame.equalizerBarHeightsPx.length; i += 1) {
        const eqEl = eqBarRefs.current[i];
        if (eqEl) {
          eqEl.style.height = `${frame.equalizerBarHeightsPx[i]}px`;
        }
      }

      if (intensityBadgeRef.current) {
        intensityBadgeRef.current.textContent = `${frame.intensityPct}%`;
      }
    };

    if (!orbStatus.isActive) {
      applyWaveFrameToDom(0);
      return;
    }

    const tick = (now: number) => {
      applyWaveFrameToDom(now);
      rafWaveIdRef.current = window.requestAnimationFrame(tick);
    };

    rafWaveIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafWaveIdRef.current !== null) {
        window.cancelAnimationFrame(rafWaveIdRef.current);
        rafWaveIdRef.current = null;
      }
    };
  }, [
    orbStatus.isActive,
    orbStatus.state,
    selectedProfile.speechPitch,
    selectedProfile.speechRate,
  ]);

  useEffect(() => {
    return () => {
      cleanupSpeechRecognition();
    };
  }, [cleanupSpeechRecognition]);

  const handleVoiceOrbPrimaryClick = () => {
    setPreviewOrbState(null);
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    toggleListeningVoice('auto');
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Top Function Header Card — Factory Dashboard Frame */}
      <div className="factory-dashboard-frame p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[11px] font-mono uppercase text-[#eeeeee]">
                <span className="factory-status-pulse" />
                <span>FUNCTION 02 • GEMINI AI SUITE (FREE-TIER MODELS)</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[11px] font-mono uppercase text-[#a0ca92]">
                12 BCNF Tables + Live API + Search Grounding
              </span>
              <span className="px-2.5 py-0.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[11px] font-mono uppercase text-[#b8b3b0]">
                Active Persona: {selectedProfile.name} ({selectedProfile.geminiVoiceName})
              </span>
            </div>
            <h2 className="text-[28px] font-normal text-[#eeeeee] tracking-[-0.025em]">
              Interactive AI Database Agent, Multi-Turn Chatbot, Live Voice &amp; Search Grounding
            </h2>
            <p className="text-[13px] text-[#8a8380]">
              Powered by free-tier Gemini models (<code>gemini-3.8-flash</code>,{' '}
              <code>gemini-3.1-flash-lite</code>, <code>gemini-3.8-live</code>, and{' '}
              <code>googleSearch</code> grounding) with 10 distinct voice profiles.
            </p>
          </div>

          {/* Voice Playback Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Real-Time Microphone / SpeechRecognition Voice Input Button */}
            <button
              type="button"
              data-testid="copilot-global-mic-btn"
              onClick={() => {
                setPreviewOrbState(null);
                toggleListeningVoice('auto');
              }}
              className={`px-3.5 py-2 rounded-[3px] text-[12px] font-mono uppercase flex items-center gap-1.5 border transition-all ${
                isListeningMic
                  ? 'bg-[#1d1a18] border-[#ee6018] text-[#ee6018] animate-pulse'
                  : 'bg-[#1d1a18] border-[#3d3a39] hover:border-[#fafafa] text-[#a0ca92]'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-[#ee6018]" />
              <span>
                {isListeningMic
                  ? 'Listening... Click to Send'
                  : micPermissionStatus === 'granted'
                  ? 'Speak Query (Mic Ready)'
                  : 'Allow Mic & Speak Query'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewOrbState(null);
                previewVoiceProfile(selectedProfileId);
              }}
              className="px-3.5 py-2 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[12px] font-mono uppercase text-[#eeeeee] flex items-center gap-1.5 transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-[#ee6018]" />
              <span>Test {selectedProfile.name} Voice</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoSpeakEnabled((prev) => !prev)}
              className={`px-3.5 py-2 rounded-[3px] text-[12px] font-mono uppercase flex items-center gap-1.5 border transition-all ${
                autoSpeakEnabled
                  ? 'bg-[#1d1a18] border-[#a0ca92] text-[#a0ca92]'
                  : 'bg-[#101010] border-[#3d3a39] text-[#8a8380]'
              }`}
            >
              {autoSpeakEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Auto-Voice Reply: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Auto-Voice Reply: OFF</span>
                </>
              )}
            </button>

            {isSpeaking ? (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-4 py-2 rounded-[3px] bg-[#1d1a18] border border-[#ee6018] text-[#eeeeee] text-[12px] font-mono uppercase flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 text-[#ee6018] fill-current" />
                <span>Stop Voice</span>
              </button>
            ) : (
              latestTurn && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOrbState(null);
                    void speakTextAloud(latestTurn.spokenSummary);
                  }}
                  className="px-4 py-2 rounded-[3px] bg-[#fafafa] text-[#101010] text-[12px] font-mono uppercase flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Speak Reply Aloud</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 10 Distinct Voice Profile Configurations Strip */}
        <div className="pt-4 border-t border-[#1d1a18] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-mono text-[#b8b3b0] uppercase tracking-[-0.02em]">
              10 DISTINCT VOICE PROFILE CONFIGURATIONS (SELECT PERSONA FOR TTS &amp; STREAMING)
            </span>
            <span className="text-[12px] font-mono text-[#8a8380] uppercase">
              {selectedProfile.roleBadge} • Rate {selectedProfile.speechRate.toFixed(2)}x • Pitch {selectedProfile.speechPitch.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {voiceProfiles.map((profile) => {
              const isSelected = profile.id === selectedProfileId;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`p-2.5 rounded-[10px] border text-left transition-all flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-[#1d1a18]/90 border-[#ee6018] text-[#eeeeee]'
                      : 'bg-[#101010]/70 border-[#3d3a39] text-[#eeeeee] hover:border-[#fafafa]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-mono truncate text-[#eeeeee]">
                      {profile.numberLabel} • {profile.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] shrink-0 ${
                        isSelected
                          ? 'bg-[#101010] text-[#ee6018]'
                          : 'bg-[#1d1a18] text-[#a0ca92]'
                      }`}
                    >
                      {profile.geminiVoiceName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] truncate ${
                      isSelected ? 'text-[#b8b3b0]' : 'text-[#8a8380]'
                    }`}
                  >
                    {profile.roleBadge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* GEMINI 2.0 FLASH INTERACTIVE VOICE ORB & REAL-TIME WAVE STAGE       */}
        {/* =================================================================== */}
        <div
          data-testid="copilot-voice-orb-panel"
          data-voice-state={orbStatus.state}
          className="pt-5 border-t border-[#1d1a18] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          {/* Left / Center Column (5 cols): Status / Voice Agent Pill Directly Above the Circular Voice Orb */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between p-5 rounded-[10px] bg-[#101010] border border-[#3d3a39] space-y-4">
            {/* High-Contrast 'Status / Voice Agent' Indicator Pill Directly Above the Voice Orb */}
            <div
              data-testid="copilot-voice-status-pill"
              data-status-state={orbStatus.state}
              role="status"
              aria-live="polite"
              className={`px-4 py-2 rounded-[3px] border flex items-center gap-2.5 transition-all ${
                orbStatus.state === 'LISTENING'
                  ? 'bg-[#1d1a18] border-[#ee6018] text-[#fafafa]'
                  : orbStatus.state === 'PROCESSING'
                  ? 'bg-[#1d1a18] border-[#fafafa] text-[#fafafa]'
                  : orbStatus.state === 'SPEAKING'
                  ? 'bg-[#1d1a18] border-[#a0ca92] text-[#a0ca92]'
                  : 'bg-[#1d1a18] border-[#3d3a39] text-[#eeeeee]'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  orbStatus.state === 'LISTENING'
                    ? 'bg-[#ee6018] animate-ping'
                    : orbStatus.state === 'PROCESSING'
                    ? 'bg-[#fafafa] animate-pulse'
                    : orbStatus.state === 'SPEAKING'
                    ? 'bg-[#a0ca92] animate-pulse'
                    : 'bg-[#a0ca92]'
                }`}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#b8b3b0] border-r border-[#3d3a39] pr-2">
                Status / Voice Agent
              </span>
              <span
                data-testid="copilot-voice-status-text"
                className="text-[12px] font-mono font-medium tracking-[-0.01em]"
              >
                {orbStatus.pillLabel}
              </span>
            </div>

            {/* Circular Voice Orb Stage (.janpay-voice-stage + 3 concentric state rings + .janpay-voice-orb) */}
            <div
              data-testid="copilot-voice-stage"
              data-orb-visual-state={orbStatus.state.toLowerCase()}
              className="janpay-voice-stage"
            >
              <span
                aria-hidden="true"
                data-testid="copilot-voice-ring-outer"
                className={`janpay-voice-ring janpay-voice-ring-outer ${orbVisualTokens.ringStateClass}`}
              />
              <span
                aria-hidden="true"
                data-testid="copilot-voice-ring-mid"
                className={`janpay-voice-ring janpay-voice-ring-mid ${orbVisualTokens.ringStateClass}`}
              />
              <span
                aria-hidden="true"
                data-testid="copilot-voice-ring-inner"
                className={`janpay-voice-ring janpay-voice-ring-inner ${orbVisualTokens.ringStateClass}`}
              />

              <button
                type="button"
                data-testid="copilot-voice-orb"
                data-orb-state={orbStatus.state}
                onClick={handleVoiceOrbPrimaryClick}
                aria-label={`Gemini Voice Agent Orb — ${orbStatus.pillLabel}`}
                className={`janpay-voice-orb ${orbVisualTokens.orbStateClass}`}
              >
                {/* Factory Telemetry Micro-Header Inside Orb */}
                <span
                  data-testid="copilot-orb-telemetry-tag"
                  className={`janpay-orb-telemetry-tag px-1.5 py-0.5 rounded-[3px] text-[9px] font-mono uppercase tracking-wider border ${
                    orbStatus.state === 'LISTENING'
                      ? 'bg-[#101010]/80 border-[#fafafa] text-[#fafafa]'
                      : orbStatus.state === 'PROCESSING'
                      ? 'bg-[#101010] border-[#ee6018] text-[#ee6018]'
                      : orbStatus.state === 'SPEAKING'
                      ? 'bg-[#101010]/85 border-[#a0ca92] text-[#a0ca92]'
                      : 'bg-[#101010]/70 border-[#3d3a39] text-[#b8b3b0]'
                  }`}
                >
                  {orbVisualTokens.telemetryTag}
                </span>

                {orbStatus.state === 'PROCESSING' ? (
                  <RefreshCw className="w-7 h-7 shrink-0 text-[#fafafa] animate-spin" />
                ) : orbStatus.state === 'SPEAKING' ? (
                  <Volume2 className="w-7 h-7 shrink-0 text-[#a0ca92] scale-110 transition-transform" />
                ) : (
                  <Mic
                    className={`w-7 h-7 shrink-0 transition-transform duration-300 ${
                      orbStatus.state === 'LISTENING'
                        ? 'scale-110 text-[#fafafa]'
                        : 'text-[#ee6018]'
                    }`}
                  />
                )}

                {/* 5 Real-Time Audio Wave Bars Inside the Orb (60fps requestAnimationFrame) */}
                <div
                  data-testid="copilot-orb-wave-bars"
                  className="flex items-end justify-center gap-1.5 h-5 shrink-0"
                >
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <span
                      key={idx}
                      ref={(el) => {
                        orbBarRefs.current[idx] = el;
                      }}
                      style={{ height: '7px' }}
                      className={`janpay-voice-bar ${orbVisualTokens.barStateClass}`}
                    />
                  ))}
                </div>

                <span className="text-[10px] font-mono uppercase tracking-wider font-medium shrink-0">
                  {orbVisualTokens.orbCaption}
                </span>
              </button>
            </div>

            {/* Interactive Factory Visual State Inspector Strip (Live Auto | Listening | Processing | Speaking) */}
            <div
              data-testid="copilot-orb-state-selector"
              className="w-full pt-2 border-t border-[#1d1a18] space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8a8380]">
                <span>Orb State Feedback Mode</span>
                <span className="text-[#b8b3b0]">{orbVisualTokens.cadenceLabel}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: null, label: 'Auto Live', dotColor: 'bg-[#b8b3b0]' },
                    {
                      id: 'LISTENING' as VoiceOrbInteractionState,
                      label: 'Listening',
                      dotColor: 'bg-[#ee6018]',
                    },
                    {
                      id: 'PROCESSING' as VoiceOrbInteractionState,
                      label: 'Processing',
                      dotColor: 'bg-[#fafafa]',
                    },
                    {
                      id: 'SPEAKING' as VoiceOrbInteractionState,
                      label: 'Speaking',
                      dotColor: 'bg-[#a0ca92]',
                    },
                  ] as const
                ).map((item) => {
                  const isSelected =
                    item.id === null
                      ? previewOrbState === null
                      : previewOrbState === item.id ||
                        (previewOrbState === null && orbStatus.state === item.id);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      data-testid={`copilot-orb-state-btn-${(item.id ?? 'AUTO').toLowerCase()}`}
                      onClick={() => setPreviewOrbState(item.id)}
                      className={`px-2 py-1.5 rounded-[3px] border text-[10px] font-mono uppercase flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                        isSelected
                          ? item.id === 'LISTENING'
                            ? 'bg-[#1d1a18] border-[#ee6018] text-[#ee6018]'
                            : item.id === 'PROCESSING'
                            ? 'bg-[#1d1a18] border-[#fafafa] text-[#fafafa]'
                            : item.id === 'SPEAKING'
                            ? 'bg-[#1d1a18] border-[#a0ca92] text-[#a0ca92]'
                            : 'bg-[#1d1a18] border-[#eeeeee] text-[#eeeeee]'
                          : 'bg-[#101010] border-[#3d3a39] text-[#8a8380] hover:border-[#b8b3b0]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dotColor}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#8a8380] text-center max-w-xs">
              {orbStatus.subLabel}
            </p>
          </div>

          {/* Right Column (7 cols): 16-Band Real-Time Audio Wave Intensity Visualizer & Live Telemetry */}
          <div
            data-testid="copilot-audio-wave-visualizer"
            className="lg:col-span-7 p-5 rounded-[10px] bg-[#101010] border border-[#3d3a39] flex flex-col justify-between space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1d1a18] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ee6018]" />
                <span className="text-[12px] font-mono uppercase text-[#eeeeee]">
                  REAL-TIME AUDIO WAVE INTENSITY (requestAnimationFrame + Web Audio AnalyserNode)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#8a8380] uppercase">
                  Wave Intensity:
                </span>
                <span
                  ref={intensityBadgeRef}
                  data-testid="copilot-wave-intensity-pct"
                  className={`px-2.5 py-0.5 rounded-[3px] bg-[#1d1a18] border text-[11px] font-mono tabular-nums ${
                    orbStatus.state === 'LISTENING'
                      ? 'border-[#ee6018] text-[#ee6018]'
                      : orbStatus.state === 'PROCESSING'
                      ? 'border-[#fafafa] text-[#fafafa]'
                      : orbStatus.state === 'SPEAKING'
                      ? 'border-[#a0ca92] text-[#a0ca92]'
                      : 'border-[#3d3a39] text-[#ee6018]'
                  }`}
                >
                  0%
                </span>
              </div>
            </div>

            {/* 3-Stage Factory Voice Feedback Pipeline Strip (LISTENING -> PROCESSING -> SPEAKING) */}
            <div
              data-testid="copilot-voice-state-pipeline"
              className="grid grid-cols-3 gap-2"
            >
              <div
                className={`p-2.5 rounded-[3px] border transition-all ${
                  orbStatus.state === 'LISTENING'
                    ? 'bg-[#1d1a18] border-[#ee6018] text-[#fafafa]'
                    : 'bg-[#101010] border-[#3d3a39] text-[#8a8380]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                  <span className={orbStatus.state === 'LISTENING' ? 'text-[#ee6018]' : ''}>
                    01 • LISTENING
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#ee6018]" />
                </div>
                <span className="text-[11px] font-mono block mt-1 truncate">
                  Signal Orange Sonar (#ee6018)
                </span>
              </div>

              <div
                className={`p-2.5 rounded-[3px] border transition-all ${
                  orbStatus.state === 'PROCESSING'
                    ? 'bg-[#1d1a18] border-[#fafafa] text-[#fafafa]'
                    : 'bg-[#101010] border-[#3d3a39] text-[#8a8380]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                  <span className={orbStatus.state === 'PROCESSING' ? 'text-[#fafafa]' : ''}>
                    02 • PROCESSING
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#fafafa]" />
                </div>
                <span className="text-[11px] font-mono block mt-1 truncate">
                  Chalk Dual-Rotor Bezel (#fafafa)
                </span>
              </div>

              <div
                className={`p-2.5 rounded-[3px] border transition-all ${
                  orbStatus.state === 'SPEAKING'
                    ? 'bg-[#1d1a18] border-[#a0ca92] text-[#a0ca92]'
                    : 'bg-[#101010] border-[#3d3a39] text-[#8a8380]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                  <span className={orbStatus.state === 'SPEAKING' ? 'text-[#a0ca92]' : ''}>
                    03 • SPEAKING
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#a0ca92]" />
                </div>
                <span className="text-[11px] font-mono block mt-1 truncate">
                  Metric Green Broadcast (#a0ca92)
                </span>
              </div>
            </div>

            {/* 16-Band Frequency Equalizer Strip Animated via requestAnimationFrame */}
            <div className="h-24 px-4 py-3 rounded-[10px] bg-[#1d1a18] border border-[#3d3a39] flex items-end justify-between gap-2">
              {Array.from({ length: 16 }, (_, idx) => (
                <span
                  key={idx}
                  ref={(el) => {
                    eqBarRefs.current[idx] = el;
                  }}
                  style={{ height: '8px' }}
                  className={`janpay-eq-bar flex-1 rounded-[2px] transition-[background-color] duration-150 ${
                    orbStatus.state === 'LISTENING'
                      ? 'janpay-eq-bar-listening'
                      : orbStatus.state === 'PROCESSING'
                      ? 'janpay-eq-bar-processing'
                      : orbStatus.state === 'SPEAKING'
                      ? 'janpay-eq-bar-speaking'
                      : ''
                  }`}
                />
              ))}
            </div>

            {/* 4-Tile Voice & BCNF Grounding Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39]">
                <span className="text-[10px] font-mono uppercase text-[#8a8380] block">
                  Agent State
                </span>
                <span
                  data-testid="copilot-telemetry-agent-state"
                  className={`text-[12px] font-mono mt-0.5 block truncate ${
                    orbStatus.state === 'LISTENING'
                      ? 'text-[#ee6018]'
                      : orbStatus.state === 'PROCESSING'
                      ? 'text-[#fafafa]'
                      : orbStatus.state === 'SPEAKING'
                      ? 'text-[#a0ca92]'
                      : 'text-[#eeeeee]'
                  }`}
                >
                  {orbStatus.state} • {orbVisualTokens.telemetryTag}
                </span>
              </div>
              <div className="p-2.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39]">
                <span className="text-[10px] font-mono uppercase text-[#8a8380] block">
                  Active Voice
                </span>
                <span className="text-[12px] font-mono text-[#a0ca92] mt-0.5 block truncate">
                  {selectedProfile.geminiVoiceName} ({selectedProfile.speechRate.toFixed(2)}x)
                </span>
              </div>
              <div className="p-2.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39]">
                <span className="text-[10px] font-mono uppercase text-[#8a8380] block">
                  Audio Pipeline
                </span>
                <span className="text-[12px] font-mono text-[#eeeeee] mt-0.5 block truncate">
                  24kHz WAV + Analyser
                </span>
              </div>
              <div className="p-2.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39]">
                <span className="text-[10px] font-mono uppercase text-[#8a8380] block">
                  BCNF Grounding
                </span>
                <span className="text-[12px] font-mono text-[#ee6018] mt-0.5 block truncate">
                  12 Tables • 20 Queries
                </span>
              </div>
            </div>

            {/* Live Transcript / Active Speech Clause & Quick Voice Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#1d1a18]">
              <div className="text-[12px] font-mono text-[#b8b3b0] truncate max-w-md">
                {isListeningMic && liveInterimTranscript ? (
                  <span>
                    Live Mic Transcript:{' '}
                    <strong className="text-[#fafafa]">
                      &ldquo;{liveInterimTranscript}&rdquo;
                    </strong>
                  </span>
                ) : isSpeaking && activeSpeechClause ? (
                  <span>
                    Active TTS Clause ({selectedProfile.name}):{' '}
                    <strong className="text-[#a0ca92]">
                      &ldquo;{activeSpeechClause}&rdquo;
                    </strong>
                  </span>
                ) : (
                  <span>
                    Persona Ready: <strong className="text-[#eeeeee]">{selectedProfile.name}</strong> ({selectedProfile.geminiVoiceName}) • 20 Verified BCNF Queries
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  data-testid="copilot-download-pdf-top-btn"
                  onClick={() => {
                    downloadVoiceQuestionsPdf(snapshot);
                    setPdfDownloadFeedback('20 Questions PDF downloaded successfully!');
                    setTimeout(() => setPdfDownloadFeedback(null), 4000);
                  }}
                  className="px-3 py-1.5 rounded-[3px] bg-[#ee6018] hover:bg-[#d85514] text-[#fafafa] text-[11px] font-mono uppercase flex items-center gap-1.5 transition-all shadow-sm"
                  title="Download 20 Verified Questions PDF to show your professor"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 20 Queries PDF</span>
                </button>
                <button
                  type="button"
                  data-testid="copilot-visualizer-test-voice-btn"
                  onClick={() => {
                    setPreviewOrbState(null);
                    previewVoiceProfile(selectedProfileId);
                  }}
                  className="px-3 py-1.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[11px] font-mono uppercase text-[#a0ca92] flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#ee6018]" />
                  <span>Preview Wave &amp; Voice</span>
                </button>
                <button
                  type="button"
                  onClick={handleVoiceOrbPrimaryClick}
                  className="px-3 py-1.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[11px] font-mono uppercase text-[#eeeeee] flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-[#ee6018]" />
                  <span>
                    {isListeningMic
                      ? 'Finish & Send'
                      : isSpeaking
                      ? 'Stop Speaking'
                      : 'Tap Orb to Speak'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBFUNCTION 2.1: AI VOICE STUDIO & 10 CURATED DATABASE QUERIES        */}
      {/* ===================================================================== */}
      {(activeSubfunction === 'VOICE_CHAT_STAGE' ||
        activeSubfunction === 'TEN_PROMPT_MATRIX') && (
        <div className="space-y-6">
          {latestTurn && (
            <div className="card-3d-orange p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1d1a18] pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-[3px] flex items-center justify-center border ${
                      isSpeaking
                        ? 'bg-[#1d1a18] border-[#ee6018] text-[#ee6018]'
                        : 'bg-[#1d1a18] border-[#3d3a39] text-[#eeeeee]'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="factory-status-pulse" />
                      <span className="text-[12px] font-mono uppercase text-[#ee6018]">
                        {isSpeaking
                          ? `SPEAKING VOICE REPLY (${selectedProfile.name.toUpperCase()} • ${selectedProfile.geminiVoiceName})...`
                          : isStreamingText
                          ? `STREAMING RESPONSE (${selectedProfile.name.toUpperCase()})...`
                          : `LATEST AI AGENT & VOICE RESPONSE (${selectedProfile.name.toUpperCase()})`}
                      </span>
                      <span className="text-[11px] font-mono text-[#8a8380]">
                        • {latestTurn.timestamp}
                      </span>
                    </div>
                    <p className="text-[15px] font-normal text-[#eeeeee] mt-0.5">
                      Q: &ldquo;{latestTurn.question}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {latestTurn.tablesQueried.map((tbl) => (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => onInspectTableInVault(tbl)}
                      className="px-2.5 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[11px] font-mono text-[#a0ca92] flex items-center gap-1 transition-all"
                    >
                      <Database className="w-3 h-3" />
                      <span>{tbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Key Database Metrics Strip — Factory Metric Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {latestTurn.keyMetrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-[10px] bg-[#1d1a18] border border-[#3d3a39]"
                  >
                    <span className="text-[11px] font-mono uppercase text-[#b8b3b0] block">
                      {m.label}
                    </span>
                    <span className="text-[16px] font-normal font-mono text-[#eeeeee] tabular-nums mt-1 block">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Streaming Answer + Parameterized SQL */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 factory-bone-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono text-[#eeeeee] uppercase flex items-center gap-1.5">
                      <span className="factory-status-pulse" />
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#a0ca92]" />
                      <span>
                        Authoritative Database Answer &amp; Streaming Transcript
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void speakTextAloud(latestTurn.spokenSummary)
                      }
                      className="px-2.5 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[#eeeeee] text-[11px] font-mono uppercase flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3 text-[#ee6018]" />
                      <span>Replay Voice</span>
                    </button>
                  </div>
                  <p className="text-[15px] text-[#eeeeee] leading-relaxed">
                    {streamedAnswerText || latestTurn.answerText}
                    {isStreamingText && (
                      <span className="inline-block w-2 h-4 ml-1 bg-[#ee6018] animate-pulse align-middle" />
                    )}
                  </p>
                  <div className="pt-2 border-t border-[#3d3a39] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#b8b3b0] uppercase">
                        Web Speech API Stream ({selectedProfile.name} • Rate{' '}
                        {selectedProfile.speechRate.toFixed(2)}x • Pitch{' '}
                        {selectedProfile.speechPitch.toFixed(2)}):
                      </span>
                      <span className="text-[11px] font-mono text-[#ee6018]">
                        {Math.round(speechStreamProgress * 100)}% Streamed
                      </span>
                    </div>
                    <p className="text-[12px] italic text-[#b8b3b0]">
                      &ldquo;{activeSpeechClause || latestTurn.spokenSummary}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 p-4 rounded-[10px] bg-[#0d0d0d] border border-[#3d3a39] space-y-2">
                  <span className="text-[12px] font-mono text-[#a0ca92] uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#ee6018]" />
                    <span>Executed Read-Only PostgreSQL 16 Query</span>
                  </span>
                  <pre className="text-[11px] font-mono text-[#eeeeee] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {latestTurn.sqlExecuted}
                  </pre>
                </div>
              </div>

              {/* Custom Natural-Language Question Bar */}
              <div className="space-y-2 pt-1">
                <form
                  onSubmit={handleCustomSubmit}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Click Mic to speak or type any query about your 12 BCNF tables, balances, AutoPay, credit line, or FX..."
                      className="w-full bg-[#1d1a18] border border-[#3d3a39] focus:border-[#fafafa] rounded-[3px] pl-4 pr-12 py-3 text-xs md:text-sm text-[#eeeeee] placeholder-[#8a8380] focus:outline-none"
                    />
                    <button
                      type="button"
                      data-testid="copilot-mic-btn"
                      onClick={() => toggleListeningVoice('customPrompt')}
                      title="Click once and speak — answers automatically"
                      className={`absolute right-2.5 p-2 rounded-[3px] transition-all flex items-center justify-center ${
                        isListeningMic &&
                        (activeTargetMode === 'customPrompt' ||
                          activeTargetMode === 'auto')
                          ? 'bg-[#ee6018] text-[#fafafa] animate-pulse'
                          : 'bg-[#101010] text-[#ee6018] border border-[#3d3a39] hover:border-[#fafafa]'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingReply}
                    className="px-6 py-3 rounded-[3px] bg-[#fafafa] text-[#101010] text-[13px] font-normal flex items-center justify-center gap-2 shrink-0"
                  >
                    {isLoadingReply ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Querying Ledger...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Ask AI &amp; Speak Reply</span>
                      </>
                    )}
                  </button>
                </form>

                {isListeningMic && (
                  <div className="p-3 rounded-[10px] bg-[#1d1a18] border border-[#ee6018] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#ee6018] flex-1 min-w-[200px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ee6018] animate-ping shrink-0" />
                      <span className="font-mono uppercase font-semibold text-[11px]">
                        Microphone Active:
                      </span>
                      <span className="text-[#eeeeee] italic truncate">
                        {liveInterimTranscript
                          ? `"${liveInterimTranscript}"`
                          : 'Speak now — your question will be answered automatically when you pause'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {liveInterimTranscript && (
                        <button
                          type="button"
                          onClick={finishSpeakingAndTrigger}
                          className="px-3 py-1.5 rounded-[3px] btn-blaze-orange text-[11px] font-mono uppercase flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Answer Now</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopListeningVoice}
                        className="px-2.5 py-1.5 rounded-[3px] bg-[#101010] border border-[#3d3a39] text-[#b8b3b0] hover:text-[#eeeeee] text-[11px] font-mono uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {speechError && (
                  <div className="p-2.5 rounded-[3px] bg-[#1d1a18] border border-[#ee6018]/60 text-[#ee6018] text-xs font-mono flex items-center justify-between">
                    <span>{speechError}</span>
                    <button
                      type="button"
                      onClick={() => setSpeechError(null)}
                      className="text-[#b8b3b0] hover:text-[#eeeeee] uppercase text-[10px]"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TABBED VOICE QUERIES MATRIX & PROFESSOR PDF GUIDE */}
          <div className="card-3d-orange p-6 space-y-5">
            {/* Header & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3d3a39] pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-mono text-[#ee6018] uppercase tracking-[-0.02em]">
                    BCNF VOICE DIRECTORY • 100% GROUNDED ACCURACY
                  </span>
                  <span className="px-2 py-0.5 rounded-[3px] bg-[#1d1a18] border border-[#a0ca92] text-[10px] font-mono text-[#a0ca92]">
                    ZERO HALLUCINATION GUARANTEE
                  </span>
                </div>
                <h3 className="text-[20px] font-normal text-[#eeeeee] mt-1">
                  Verified Database Voice Queries &amp; Professor Examination Guide
                </h3>
              </div>

              {/* PDF Action Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="copilot-download-pdf-matrix-btn"
                  onClick={() => {
                    downloadVoiceQuestionsPdf(snapshot);
                    setPdfDownloadFeedback('20 Questions PDF downloaded successfully!');
                    setTimeout(() => setPdfDownloadFeedback(null), 4000);
                  }}
                  className="px-3.5 py-2 rounded-[3px] bg-[#ee6018] hover:bg-[#d85514] text-[#fafafa] text-[12px] font-mono uppercase flex items-center gap-2 transition-all shadow-md font-semibold"
                >
                  <Download className="w-4 h-4" />
                  <span>Download 20 Queries PDF</span>
                </button>

                <a
                  href="/jain_pay_20_voice_queries_guide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#fafafa] text-[#eeeeee] text-[12px] font-mono uppercase flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-[#ee6018]" />
                  <span>View PDF</span>
                </a>
              </div>
            </div>

            {/* Download feedback notification */}
            {pdfDownloadFeedback && (
              <div className="p-3 rounded-[3px] bg-[#1d1a18] border border-[#a0ca92] text-[#a0ca92] text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{pdfDownloadFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfDownloadFeedback(null)}
                  className="text-[#8a8380] hover:text-[#fafafa] text-[10px] uppercase font-mono"
                >
                  Close
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-[#1d1a18] pb-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveQueryTab('20_VERIFIED_PDF')}
                className={`px-4 py-2 rounded-[3px] text-xs font-mono uppercase flex items-center gap-2 transition-all ${
                  activeQueryTab === '20_VERIFIED_PDF'
                    ? 'bg-[#1d1a18] text-[#ee6018] border border-[#ee6018]'
                    : 'text-[#8a8380] hover:text-[#eeeeee] border border-transparent'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>21 Verified Professor Questions (With Expected Replies)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveQueryTab('10_QUICK')}
                className={`px-4 py-2 rounded-[3px] text-xs font-mono uppercase flex items-center gap-2 transition-all ${
                  activeQueryTab === '10_QUICK'
                    ? 'bg-[#1d1a18] text-[#ee6018] border border-[#ee6018]'
                    : 'text-[#8a8380] hover:text-[#eeeeee] border border-transparent'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>10 Quick Curated Options</span>
              </button>
            </div>

            {/* TAB 1: 21 VERIFIED PROFESSOR QUESTIONS */}
            {activeQueryTab === '20_VERIFIED_PDF' && (
              <div className="space-y-4">
                <div className="p-3 rounded-[3px] bg-[#101010] border border-[#3d3a39] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#b8b3b0]">
                  <span>
                    Speak any of these 21 questions into the microphone or click <strong className="text-[#eeeeee]">Ask &amp; Speak Now</strong> to hear the immediate reply:
                  </span>
                  <span className="text-[#a0ca92]">
                    Immediate Audio &lt; 40ms • 12-Table BCNF Grounding
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {VERIFIED_20_VOICE_QUERIES.map((item) => {
                    const isSelected = customPrompt === item.question || activeSpeechClause.includes(item.expectedSpokenReply.slice(0, 20));
                    return (
                      <div
                        key={item.id}
                        className={`text-left p-4 rounded-[10px] border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#1d1a18] border-[#ee6018]'
                            : 'bg-[#101010] border-[#3d3a39] hover:border-[#fafafa]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-[3px] bg-[#1d1a18] border border-[#ee6018] text-[#ee6018] font-mono text-xs flex items-center justify-center font-bold">
                                {item.number}
                              </span>
                              <span className="text-[11px] font-mono uppercase text-[#ee6018]">
                                {item.category}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#a0ca92]">
                              [{item.targetBcnfTables.join(', ')}]
                            </span>
                          </div>

                          <div>
                            <p className="text-[14px] font-medium text-[#fafafa]">
                              &ldquo;{item.question}&rdquo;
                            </p>
                            <p className="text-[12px] text-[#b8b3b0] mt-1.5 leading-relaxed line-clamp-2 italic">
                              Reply: &ldquo;{item.expectedSpokenReply}&rdquo;
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#1d1a18] flex items-center justify-between text-[11px] font-mono text-[#8a8380]">
                            <span>{item.keyMetric}</span>
                            <span className="text-[#ee6018] text-[10px]">
                              {item.personaHint.split('/')[0]}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPrompt(item.question);
                              void executeAiVoiceQuery(item.question);
                            }}
                            className="w-full sm:w-auto px-3 py-1.5 rounded-[3px] bg-[#1d1a18] hover:bg-[#252220] border border-[#3d3a39] hover:border-[#ee6018] text-[#eeeeee] text-[11px] font-mono uppercase flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#ee6018]" />
                            <span>Ask &amp; Speak Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: 10 QUICK CURATED OPTIONS */}
            {activeQueryTab === '10_QUICK' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {TEN_AI_VOICE_CHAT_OPTIONS.map((opt) => {
                  const isSelected = activeOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionClick(opt)}
                      className={`text-left p-4 rounded-[10px] border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1d1a18] border-[#fafafa]'
                          : 'bg-[#101010] border-[#3d3a39] hover:border-[#fafafa] hover:bg-[#1d1a18]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-[3px] font-mono text-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#fafafa] text-[#101010]'
                              : 'bg-[#1d1a18] border border-[#3d3a39] text-[#ee6018]'
                          }`}
                        >
                          {opt.numberLabel}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono uppercase tracking-[-0.02em] text-[#a0ca92]">
                              {opt.category}
                            </span>
                            <span className="text-[11px] font-mono text-[#8a8380]">
                              • [{opt.targetTables.join(', ')}]
                            </span>
                          </div>
                          <p className="text-[15px] font-normal text-[#eeeeee]">
                            {opt.title}
                          </p>
                          <p className="text-[13px] text-[#8a8380] line-clamp-2">
                            &ldquo;{opt.promptText}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="px-2.5 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[#eeeeee] text-[11px] font-mono uppercase flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-[#ee6018]" />
                          <span>Ask &amp; Speak</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBFUNCTION 2.2: MULTI-TURN GEMINI CHATBOT (SCROLLABLE THREAD)        */}
      {/* ===================================================================== */}
      {activeSubfunction === 'MULTI_TURN_CHATBOT' && (
        <div className="card-3d-orange rounded-[24px] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF8800]" />
                <span className="text-xs font-mono font-bold text-[#FF8800] uppercase">
                  SUBFUNCTION 2.2 • MULTI-TURN GEMINI CHATBOT (FREE-TIER MODELS)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Stateful Multi-Turn Conversation with Role System Instructions
              </h3>
              <p className="text-xs text-[#D4D4D8]">
                Maintains full multi-turn conversation history across turns. Choose a specialized Chatbot Role and Free-Tier Model speed below.
              </p>
            </div>

            <button
              type="button"
              onClick={clearMultiTurnHistory}
              className="px-3.5 py-2 rounded-full bg-[#12121A] border border-white/15 hover:border-[#EF4444] text-xs font-mono text-[#D4D4D8] hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Reset Thread</span>
            </button>
          </div>

          {/* Role Selector & Free-Tier Model Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase">
                1. Select Chatbot System Instruction Role:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {chatbotRoles.map((role) => {
                  const active = role.id === selectedRoleId;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-[#FF5E00]/16 border-[#FF5E00] text-white'
                          : 'bg-[#12121A] border-white/10 text-[#D4D4D8] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">
                          {role.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#FF8800]">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8E99] line-clamp-1 mt-1">
                        {role.systemInstruction}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#10B981] uppercase">
                2. Select Free-Tier Gemini Model Speed:
              </span>
              <div className="space-y-2">
                {modelTiers.map((tier) => {
                  const active = tier.id === selectedModelTierId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedModelTierId(tier.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        active
                          ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                          : 'bg-[#12121A] border-white/10 text-[#D4D4D8] hover:border-white/25'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">
                          {tier.label}
                        </span>
                        <span className="text-[10px] text-[#8E8E99] block">
                          {tier.description}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#10B981] shrink-0">
                        {tier.thinkingLevel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Starter Prompt Chips for the Selected Role */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[#8E8E99]">
              Quick Starter Prompts for {activeChatbotRole.title}:
            </span>
            <div className="flex flex-wrap gap-2">
              {activeChatbotRole.starterPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void sendMultiTurnMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-[#12121A] border border-white/10 hover:border-[#FF5E00] text-xs text-[#D4D4D8] hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#FF8800] shrink-0" />
                  <span className="truncate max-w-[420px]">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Multi-Turn Message Thread */}
          <div
            data-testid="multi-turn-chat-thread"
            className="h-[360px] overflow-y-auto rounded-2xl bg-[#09090E] border border-white/10 p-4 space-y-3"
          >
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-1.5 ${
                      isUser
                        ? 'bg-[#FF5E00] text-white'
                        : 'bg-[#12121A] border border-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono opacity-80">
                      <span>
                        {isUser ? 'YOU (Yash Jain)' : msg.roleBadge} •{' '}
                        {msg.modelUsed}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-xs md:text-sm leading-relaxed">
                      {msg.text}
                    </p>
                    {!isUser && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void speakTextAloud(msg.text)}
                          className="text-[10px] font-mono text-[#FF8800] hover:underline flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Speak Turn</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Multi-Turn Message Input Form */}
          <div className="space-y-2">
            <form
              onSubmit={handleMultiTurnSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={multiTurnInput}
                  onChange={(e) => setMultiTurnInput(e.target.value)}
                  placeholder={`Click Mic to speak or message ${activeChatbotRole.title} (history preserved across turns)...`}
                  className="w-full bg-[#12121A] border border-white/15 focus:border-[#FF5E00] rounded-full pl-5 pr-12 py-3 text-xs md:text-sm text-white placeholder-[#8E8E99] focus:outline-none"
                />
                <button
                  type="button"
                  data-testid="multiturn-mic-btn"
                  onClick={() => toggleListeningVoice('multiTurn')}
                  title="Click once and speak — answers automatically"
                  className={`absolute right-2.5 p-2 rounded-full transition-all flex items-center justify-center ${
                    isListeningMic && activeTargetMode === 'multiTurn'
                      ? 'bg-[#ee6018] text-white animate-pulse'
                      : 'bg-[#101010] text-[#ee6018] border border-white/10 hover:border-white/30'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <button
                type="submit"
                disabled={isSendingChatMessage}
                className="px-6 py-3 rounded-full btn-blaze-orange text-xs font-bold flex items-center justify-center gap-2 shrink-0"
              >
                {isSendingChatMessage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Turn...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Multi-Turn Message</span>
                  </>
                )}
              </button>
            </form>

            {isListeningMic && activeTargetMode === 'multiTurn' && (
              <div className="p-3 rounded-xl bg-[#12121A] border border-[#ee6018] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#ee6018] flex-1 min-w-[200px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ee6018] animate-ping shrink-0" />
                  <span className="font-mono uppercase font-semibold text-[11px]">
                    Microphone Listening:
                  </span>
                  <span className="text-white italic truncate">
                    {liveInterimTranscript
                      ? `"${liveInterimTranscript}"`
                      : 'Speak now — answers automatically when you finish speaking'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBFUNCTION 2.3: GEMINI LIVE API (gemini-3.8-live) VOICE CONVERSATION */}
      {/* ===================================================================== */}
      {activeSubfunction === 'LIVE_VOICE_SESSION' && (
        <div className="card-3d-orange rounded-[24px] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#FF8800]" />
                <span className="text-xs font-mono font-bold text-[#FF8800] uppercase">
                  SUBFUNCTION 2.3 • REAL-TIME LIVE API VOICE CONVERSATIONS (gemini-3.8-live)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Bidirectional Low-Latency Live API Voice Session (`/api/ai/live`)
              </h3>
              <p className="text-xs text-[#D4D4D8]">
                Streams real-time voice conversations over WebSocket to <code>gemini-3.8-live</code> with 24kHz audio output and automatic Web Speech synthesis for training demos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
                  isLiveSessionActive
                    ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
                    : 'bg-[#12121A] border-white/10 text-[#D4D4D8]'
                }`}
              >
                {liveSessionStatus}
              </span>

              {isLiveSessionActive ? (
                <button
                  type="button"
                  onClick={stopLiveVoiceSession}
                  className="px-4 py-2 rounded-full bg-[#EF4444] text-white text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>End Live Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startLiveVoiceSession}
                  className="px-4 py-2 rounded-full btn-blaze-orange text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Live Voice Session</span>
                </button>
              )}
            </div>
          </div>

          {/* 1-Click Real-Time Spoken Prompts for Training Demos */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase">
              Click Any Spoken Voice Turn Below to Converse with gemini-3.8-live in Real Time:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {liveTrainingPrompts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => sendLiveVoiceTurn(item.spokenText)}
                  className="p-3.5 rounded-xl bg-[#12121A] border border-white/10 hover:border-[#FF5E00] text-left transition-all space-y-1"
                >
                  <span className="text-xs font-bold text-white block">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-[#8E8E99] line-clamp-2 block">
                    &ldquo;{item.spokenText}&rdquo;
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Voice Transcript Stream */}
          <div className="h-[280px] overflow-y-auto rounded-2xl bg-[#09090E] border border-white/10 p-4 space-y-3">
            {liveTranscripts.map((entry) => {
              const isUser = entry.speaker === 'USER_VOICE';
              return (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-xl border ${
                    isUser
                      ? 'bg-[#FF5E00]/15 border-[#FF5E00]/40'
                      : 'bg-[#12121A] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E8E99] mb-1">
                    <span className="font-bold text-[#FF8800]">
                      {isUser
                        ? '🎙️ USER SPOKEN INPUT'
                        : `🔊 GEMINI-3.8-LIVE (${selectedProfile.name.toUpperCase()})`}
                    </span>
                    <span>
                      {entry.timestamp} • {entry.latencyMs}ms
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-white leading-relaxed">
                    {entry.text}
                  </p>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleLiveVoiceSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <input
              type="text"
              value={liveCustomVoiceInput}
              onChange={(e) => setLiveCustomVoiceInput(e.target.value)}
              placeholder="Speak or type a real-time turn to gemini-3.8-live..."
              className="flex-1 bg-[#12121A] border border-white/15 focus:border-[#FF5E00] rounded-full px-5 py-3 text-xs md:text-sm text-white placeholder-[#8E8E99] focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full btn-blaze-orange text-xs font-bold flex items-center justify-center gap-2 shrink-0"
            >
              <Mic className="w-4 h-4" />
              <span>Send Live Voice Turn</span>
            </button>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBFUNCTION 2.4: GOOGLE SEARCH GROUNDING (gemini-3.8-flash + Search)  */}
      {/* ===================================================================== */}
      {activeSubfunction === 'SEARCH_GROUNDING' && (
        <div className="card-3d-orange rounded-[24px] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#FF8800]" />
                <span className="text-xs font-mono font-bold text-[#FF8800] uppercase">
                  SUBFUNCTION 2.4 • GOOGLE SEARCH GROUNDING (gemini-3.8-flash + googleSearch)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Up-to-Date RBI, NPCI UPI 2.0 &amp; PostgreSQL 16 Grounded Intelligence
              </h3>
              <p className="text-xs text-[#D4D4D8]">
                Combines live Google Search grounding citations (`groundingChunks`) with your 12-table Jain Pay database telemetry.
              </p>
            </div>
          </div>

          {/* 4 Preset Search-Grounded Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchPresetQueries.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => void executeSearchGrounding(preset.query)}
                className="p-3.5 rounded-xl bg-[#12121A] border border-white/10 hover:border-[#FF5E00] text-left transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#FF8800] uppercase">
                    {preset.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#10B981]">
                    googleSearch Grounded
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{preset.title}</p>
                <p className="text-xs text-[#8E8E99] line-clamp-1">
                  &ldquo;{preset.query}&rdquo;
                </p>
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={handleSearchGroundingSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RBI rules, NPCI UPI AutoPay/Global/UDIR circulars, or PostgreSQL 16 benchmarks..."
              className="flex-1 bg-[#12121A] border border-white/15 focus:border-[#FF5E00] rounded-full px-5 py-3 text-xs md:text-sm text-white placeholder-[#8E8E99] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSearchingGrounding}
              className="px-6 py-3 rounded-full btn-blaze-orange text-xs font-bold flex items-center justify-center gap-2 shrink-0"
            >
              {isSearchingGrounding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching Web...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Run Grounded Search</span>
                </>
              )}
            </button>
          </form>

          {/* Grounded Answer + Verified Source Citations */}
          <div className="p-5 rounded-2xl bg-[#09090E] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-[#10B981] uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Search-Grounded Synthesis ({searchResult.sourceEngine} •{' '}
                  {searchResult.timestamp})
                </span>
              </span>
              <button
                type="button"
                onClick={() => void speakTextAloud(searchResult.spokenSummary)}
                className="text-xs font-mono text-[#FF8800] hover:underline flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speak Grounded Summary</span>
              </button>
            </div>

            <p className="text-sm text-white leading-relaxed">
              {searchResult.answerText}
            </p>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase block">
                Verified Web Grounding Sources (groundingChunks):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {searchResult.groundingChunks.map((chunk, idx) => (
                  <a
                    key={idx}
                    href={chunk.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#12121A] border border-white/10 hover:border-[#FF5E00] transition-all flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {chunk.title}
                      </p>
                      <p className="text-[11px] text-[#8E8E99] line-clamp-2">
                        {chunk.snippet}
                      </p>
                      <span className="text-[10px] font-mono text-[#FF8800] truncate block">
                        {chunk.uri}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#FF8800] shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBFUNCTION 2.5: LIVE 12-TABLE DATABASE INSPECTOR & PGBOUNCER         */}
      {/* ===================================================================== */}
      {activeSubfunction === 'LIVE_DB_EXPLORER' && (
        <div className="space-y-6">
          {/* Interactive Cards for the 5 New Enterprise BCNF Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Table 8: UPI AutoPay 2.0 Mandates */}
            <div className="card-3d-orange rounded-[24px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase">
                  TABLE 08 • autopay_mandates
                </span>
                <span className="text-[11px] font-mono text-[#10B981]">
                  NPCI UMN 2.0
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Recurring UPI AutoPay Mandates
              </h3>
              <div className="space-y-2">
                {snapshot.autopayMandates.map((m) => (
                  <div
                    key={m.mandate_id}
                    className="p-3 rounded-xl bg-[#12121A] border border-white/8 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {m.merchant_name}
                      </p>
                      <p className="text-[11px] font-mono text-[#8E8E99]">
                        Cap: {formatInr(m.max_debit_amount)} • {m.frequency} •
                        Next: {m.next_debit_date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleAutopayMandate(m.mandate_id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                        m.status === 'ACTIVE'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      }`}
                    >
                      {m.status === 'ACTIVE' ? (
                        <>
                          <PauseCircle className="w-3 h-3" />
                          <span>ACTIVE (Pause)</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3 h-3" />
                          <span>PAUSED (Resume)</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 9: NBFC Credit Sanctions */}
            <div className="card-3d-orange rounded-[24px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase">
                  TABLE 09 • credit_sanctions
                </span>
                <CreditCard className="w-4 h-4 text-[#FF8800]" />
              </div>
              <h3 className="text-base font-bold text-white">
                NBFC Credit Line &amp; BNPL Facility
              </h3>
              {snapshot.creditSanctions.map((c) => (
                <div
                  key={c.facility_id}
                  className="p-3.5 rounded-xl bg-[#12121A] border border-white/8 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {c.lender_partner}
                    </span>
                    <span className="text-[10px] font-mono text-[#10B981]">
                      {c.cibil_score_band}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-[#09090E]">
                      <span className="text-[10px] font-mono text-[#8E8E99] block">
                        Limit
                      </span>
                      <span className="text-xs font-mono font-bold text-white tabular-nums">
                        {formatInr(c.sanctioned_limit)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#09090E]">
                      <span className="text-[10px] font-mono text-[#8E8E99] block">
                        Utilized
                      </span>
                      <span className="text-xs font-mono font-bold text-[#F59E0B] tabular-nums">
                        {formatInr(c.utilized_amount)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#09090E]">
                      <span className="text-[10px] font-mono text-[#8E8E99] block">
                        Available
                      </span>
                      <span className="text-xs font-mono font-bold text-[#10B981] tabular-nums">
                        {formatInr(c.available_credit)}
                      </span>
                    </div>
                  </div>
                  {c.utilized_amount > 0 && (
                    <button
                      type="button"
                      onClick={() => onRepayCreditSanction(1000)}
                      className="w-full py-1.5 px-3 rounded-full btn-obsidian-secondary text-[11px] font-mono text-[#FF8800] hover:border-[#FF5E00]"
                    >
                      Repay ₹1,000.00 to Credit Line
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Table 10 & 11: FX Treasury Vaults & NPCI UDIR Disputes */}
            <div className="card-3d-orange rounded-[24px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase">
                  TABLES 10–12 • FX, UDIR &amp; AUDIT
                </span>
                <Globe className="w-4 h-4 text-[#FF8800]" />
              </div>
              <h3 className="text-base font-bold text-white">
                UPI Global FX Pools &amp; UDIR Tickets
              </h3>
              <div className="space-y-1.5">
                {snapshot.fxTreasuryVaults.map((fx) => (
                  <div
                    key={fx.vault_id}
                    className="px-3 py-2 rounded-xl bg-[#12121A] border border-white/8 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold text-white">
                      1 {fx.quote_currency} ({fx.corridor_code})
                    </span>
                    <span className="font-mono text-[#FF8800] tabular-nums">
                      ₹{fx.spot_rate_inr.toFixed(2)} ({fx.spread_bps} bps)
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                {snapshot.disputeChargebacks.map((d) => (
                  <div
                    key={d.dispute_id}
                    className="px-3 py-2 rounded-xl bg-[#12121A] border border-white/8 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-[#D4D4D8] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{d.npci_udir_ticket}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#10B981]">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PgBouncer + HikariCP Production Configuration Panel */}
          <div className="card-3d-orange rounded-[24px] p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase">
                  CONNECTION POOLING &amp; SERIALIZABLE SNAPSHOT ISOLATION SIZING
                </span>
                <h3 className="text-lg font-bold text-white">
                  PgBouncer Transaction-Mode &amp; HikariCP Pool Sizing Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectSubfunction('VOICE_CHAT_STAGE')}
                className="px-4 py-2 rounded-full btn-blaze-orange text-xs font-mono font-bold"
              >
                Back to AI Voice Chat
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-[#09090E] border border-white/10 text-xs font-mono text-[#D4D4D8] overflow-x-auto leading-relaxed">
              {PGBOUNCER_HIKARICP_CONFIG}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
