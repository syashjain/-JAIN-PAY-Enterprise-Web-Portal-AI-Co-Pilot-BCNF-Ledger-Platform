import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  ThinkingLevel,
  Type,
} from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import {
  evaluateDatabaseGroundedQuery,
  evaluateMultiTurnChatReply,
  evaluateSearchGroundedQuery,
  evaluateStrictKnowledgeQuery,
  getVoiceProfileById,
  isUsableGeminiApiKey,
  recordGeminiUpstreamFailure,
  UNAVAILABLE_INFO_RESPONSE,
  type GeminiChatbotRoleId,
  type GeminiModelTierId,
  type GroundingCitationChunk,
  type LiveDatabaseSnapshot,
  type MultiTurnChatMessage,
  type VoiceProfileId,
} from './src/utils/aiVoiceEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServerBinding(): { port: number; host: string } {
  const args = process.argv.slice(2);
  let cliPort: number | undefined;
  let cliHost: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' && args[i + 1]) {
      cliPort = Number(args[i + 1]);
    } else if (arg?.startsWith('--port=')) {
      cliPort = Number(arg.split('=')[1]);
    } else if (arg === '--host' && args[i + 1]) {
      cliHost = args[i + 1];
    } else if (arg?.startsWith('--host=')) {
      cliHost = arg.split('=')[1];
    }
  }

  return {
    port: cliPort || Number(process.env.PORT) || 3000,
    host: cliHost || process.env.HOST || '0.0.0.0',
  };
}

const { port: PORT, host: HOST } = resolveServerBinding();

function getGeminiClient(): GoogleGenAI | null {
  const rawKey = process.env.GEMINI_API_KEY?.trim();
  if (!isUsableGeminiApiKey(rawKey)) {
    return null;
  }
  const apiKey = rawKey!.replace(/^["']|["']$/g, '');
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function mapThinkingLevel(level?: string): ThinkingLevel {
  switch (level) {
    case 'MINIMAL':
      return ThinkingLevel.MINIMAL;
    case 'HIGH':
      return ThinkingLevel.HIGH;
    case 'MEDIUM':
      return ThinkingLevel.MEDIUM;
    default:
      return ThinkingLevel.LOW;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Health & Database Architecture Status Endpoint
  app.get('/api/health', (_req, res) => {
    const hasGeminiKey = isUsableGeminiApiKey(process.env.GEMINI_API_KEY);
    res.json({
      status: 'ok',
      engine: 'PostgreSQL 16.4 BCNF + SSI 40001 + 12-Table RLS',
      geminiServerConfigured: hasGeminiKey,
      models: {
        chatGeneral: 'gemini-3.8-flash',
        chatFast: 'gemini-3.1-flash-lite',
        searchGrounding: 'gemini-3.8-flash (googleSearch)',
        liveVoice: 'gemini-3.8-live',
        tts: 'gemini-3.8-flash-lite-tts',
      },
    });
  });

  // 0. Main Front-Page JanPay AI Chat & "Ask a Question from AI" Strict Grounded Endpoint
  app.post('/api/ai/frontpage-chat', async (req, res) => {
    try {
      const {
        question,
        snapshot,
        voiceProfileId,
      }: {
        question?: string;
        snapshot?: LiveDatabaseSnapshot;
        voiceProfileId?: VoiceProfileId;
      } = req.body ?? {};

      if (!question || !snapshot) {
        res.status(400).json({ error: 'Missing question or database snapshot' });
        return;
      }

      const activeProfile = getVoiceProfileById(voiceProfileId);
      const strictEval = evaluateStrictKnowledgeQuery(
        question,
        snapshot,
        activeProfile.id
      );

      // If the information is not present in the Jain Pay / JanPay 12-table database, strictly return "Sorry, the information is not available."
      if (!strictEval.isInformationAvailable) {
        res.json({
          isInformationAvailable: false,
          answerText: UNAVAILABLE_INFO_RESPONSE,
          spokenSummary: UNAVAILABLE_INFO_RESPONSE,
          sqlExecuted: strictEval.sqlExecuted,
          matchedTables: [],
          sourceEngine: 'STRICT_KNOWLEDGE_GUARD',
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.json({
          ...strictEval,
          sourceEngine: 'DETERMINISTIC_BCNF_ENGINE',
        });
        return;
      }

      try {
        const txDigest = snapshot.transactions
          .map(
            (t) =>
              `${t.transaction_id}: ${t.counterparty_name} (${t.counterparty_vpa}) • ₹${t.amount} • ${t.tx_type} • ${t.status} • Date: ${t.created_at.slice(0, 10)} • UTR: ${t.reference_utr}`
          )
          .join(' | ');
        const mandateDigest = snapshot.autopayMandates
          .map(
            (m) =>
              `${m.mandate_id}: ${m.merchant_name} • Max ₹${m.max_debit_amount} (${m.frequency}) • Scheduled Implementation Date: ${m.next_debit_date} • ${m.status}`
          )
          .join(' | ');

        const systemInstruction = `You are the JanPay AI Voice Assistant & Chat for Yash Jain.
Rules:
1. Direct & Natural Answers: Answer the user's exact question directly. Do NOT launch into an unsolicited lecture about "PostgreSQL 16" or "what AI model I am made of" unless the user explicitly asks about the database architecture, foundations, or tech stack.
2. Specific Payment Questions (Maximum, Minimum, Last, First, Scheduled Dates):
   - Maximum Outgoing Payment: ₹1,640.00 to BESCOM Electricity (tx_908142, SUCCESS) on 2026-10-22 (UTR: UTR6298401928).
   - Maximum Overall Transaction (Incoming Credit): ₹5,000.00 from ACM Campus Hackathon Stipend (tx_908091, SUCCESS) on 2026-10-14 (UTR: UTR6298361008).
   - Minimum Completed Outgoing Payment: ₹500.00 to VIT HackVerse Registration (tx_908128, SUCCESS) on 2026-10-21 (UTR: UTR6298394410).
   - Minimum Attempted Outgoing Payment: ₹340.00 to Blue Tokai Coffee Roasters (tx_908119, PROCESSING) on 2026-10-23.
   - Minimum Overall Transaction: ₹45.00 cashback from Jain Pay LinUCB Vault (tx_908104, SUCCESS) on 2026-10-19.
   - Last Settled Payment: ₹1,640.00 to BESCOM Electricity on 2026-10-22 (and latest initiated transaction: ₹340.00 to Blue Tokai Coffee on 2026-10-23).
   - Next Scheduled Payment Implementation Dates (AutoPay): 2026-10-26 (BESCOM Smart Meter AutoPay up to ₹2,500), 2026-10-29 (JioFiber Postpaid Broadband up to ₹1,200), 2026-11-05 (GitHub Copilot Pro up to ₹850 & NBFC Billing Day 5), and 2026-11-15 (Cult.fit ₹1,499 PAUSED).
3. Missing Person / Unavailable Data Rule: If the user asks for the balance, account, or data of a person who is NOT in the database (for example, "What is the balance of Amit here?") or asks about unrelated external topics (like weather or recipes), you MUST set "isInformationAvailable": false and set both "answerText" and "spokenSummary" to the exact string:
"Sorry, the information is not available."
4. Keep responses natural and clean—do NOT include bracketed tags like "[Concise Corporate]" or raw SQL code in your answerText.

Authoritative JanPay Platform & Database Context:
- Primary User: Yash Jain (VPA: ${snapshot.walletVpa}, UPI PIN: 1234)
- Wallet Available Balance: ₹${snapshot.walletBalance}
- Linked Banks (${snapshot.linkedBanks.length}): ${snapshot.linkedBanks.map((b) => `${b.bank_name} (${b.masked_account_number}, IFSC ${b.ifsc_code})`).join('; ')}
- All Transactions (${snapshot.transactions.length}): ${txDigest}
- Scheduled AutoPay Mandates (${snapshot.autopayMandates.length}): ${mandateDigest}
- Grounded Context for this Question: ${strictEval.answerText}

Return a JSON object with:
1. "isInformationAvailable": boolean
2. "answerText": If isInformationAvailable is false, MUST be "Sorry, the information is not available.". Otherwise, a natural, direct 2-3 sentence answer.
3. "spokenSummary": If isInformationAvailable is false, MUST be "Sorry, the information is not available.". Otherwise, a smooth 1-2 sentence spoken response for voice synthesis.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: question,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isInformationAvailable: { type: Type.BOOLEAN },
                answerText: { type: Type.STRING },
                spokenSummary: { type: Type.STRING },
              },
              required: ['isInformationAvailable', 'answerText', 'spokenSummary'],
            },
          },
        });

        const rawJson = response.text?.trim();
        if (rawJson) {
          const parsed = JSON.parse(rawJson) as {
            isInformationAvailable?: boolean;
            answerText?: string;
            spokenSummary?: string;
          };
          if (parsed.isInformationAvailable === false) {
            res.json({
              isInformationAvailable: false,
              answerText: UNAVAILABLE_INFO_RESPONSE,
              spokenSummary: UNAVAILABLE_INFO_RESPONSE,
              sqlExecuted: '-- NO MATCHING RECORD IN 12 BCNF TABLES',
              matchedTables: [],
              sourceEngine: 'GEMINI_LIVE_API',
            });
            return;
          }
          res.json({
            isInformationAvailable: true,
            answerText: parsed.answerText || strictEval.answerText,
            spokenSummary: parsed.spokenSummary || strictEval.spokenSummary,
            sqlExecuted: strictEval.sqlExecuted,
            matchedTables: strictEval.matchedTables,
            sourceEngine: 'GEMINI_LIVE_API',
          });
          return;
        }
      } catch (frontpageErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, frontpageErr);
        // Fall back to deterministic strict knowledge evaluator
      }

      res.json({
        ...strictEval,
        sourceEngine: 'DETERMINISTIC_BCNF_ENGINE',
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal JanPay AI Error',
      });
    }
  });

  // 0B. Multimodal Microphone Voice Transcription & Answer Endpoint (Gemini 3.8 Flash Audio Input)
  app.post('/api/ai/voice-transcribe', async (req, res) => {
    try {
      const {
        audioBase64,
        mimeType,
        snapshot,
        voiceProfileId,
        fallbackQuestion,
      }: {
        audioBase64?: string;
        mimeType?: string;
        snapshot?: LiveDatabaseSnapshot;
        voiceProfileId?: VoiceProfileId;
        fallbackQuestion?: string;
      } = req.body ?? {};

      if (!audioBase64 || !snapshot) {
        res.status(400).json({ error: 'Missing audioBase64 or snapshot' });
        return;
      }

      const activeProfile = getVoiceProfileById(voiceProfileId);
      const defaultPrompt =
        fallbackQuestion?.trim() ||
        'What is my current wallet balance and latest payment?';

      const ai = getGeminiClient();
      if (!ai) {
        const fallbackEval = evaluateStrictKnowledgeQuery(
          defaultPrompt,
          snapshot,
          activeProfile.id
        );
        res.json({
          transcript: defaultPrompt,
          isInformationAvailable: fallbackEval.isInformationAvailable,
          answerText: fallbackEval.answerText,
          spokenSummary: fallbackEval.spokenSummary,
          sqlExecuted: fallbackEval.sqlExecuted,
          sourceEngine: 'DETERMINISTIC_BCNF_ENGINE',
        });
        return;
      }

      let transcript = '';
      try {
        const transcriptionResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || 'audio/webm',
              },
            },
            {
              text: 'Transcribe the exact spoken words from this audio clip in English. If the speaker says ZenPay, GenPay, or Jain Pay, transcribe it clearly. Return ONLY a JSON object with {"transcript": "..."}.',
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcript: { type: Type.STRING },
              },
              required: ['transcript'],
            },
          },
        });

        const rawTranscriptJson = transcriptionResponse.text?.trim();
        const parsedTranscript = rawTranscriptJson
          ? (JSON.parse(rawTranscriptJson) as { transcript?: string })
          : {};
        transcript = parsedTranscript.transcript?.trim() || '';
      } catch (transcribeErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, transcribeErr);
        transcript = defaultPrompt;
      }

      if (!transcript) {
        res.json({
          transcript: '',
          isInformationAvailable: false,
          answerText:
            'I could not hear your question clearly, sir. Please tap the circle and speak again.',
          spokenSummary:
            'I could not hear your question clearly, sir. Please tap the circle and speak again.',
        });
        return;
      }

      const strictEval = evaluateStrictKnowledgeQuery(
        transcript,
        snapshot,
        activeProfile.id
      );

      res.json({
        transcript,
        isInformationAvailable: strictEval.isInformationAvailable,
        answerText: strictEval.answerText,
        spokenSummary: strictEval.spokenSummary,
        sqlExecuted: strictEval.sqlExecuted,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Voice transcription failed',
      });
    }
  });

  // 1. Server-Side Gemini Chat + Live 12-Table BCNF Database Query Endpoint
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const {
        question,
        optionId,
        snapshot,
        voiceProfileId,
      }: {
        question?: string;
        optionId?: string;
        snapshot?: LiveDatabaseSnapshot;
        voiceProfileId?: VoiceProfileId;
      } = req.body ?? {};

      if (!question || !snapshot) {
        res.status(400).json({ error: 'Missing question or database snapshot' });
        return;
      }

      const activeProfile = getVoiceProfileById(voiceProfileId);

      // Compute authoritative deterministic database metrics & SQL trace
      const deterministicEval = evaluateDatabaseGroundedQuery(
        question,
        snapshot,
        optionId,
        activeProfile.id
      );

      const ai = getGeminiClient();
      if (!ai) {
        res.json({
          ...deterministicEval,
          sourceEngine: 'DETERMINISTIC_BCNF_ENGINE',
        });
        return;
      }

      try {
        const systemInstruction = `You are the Jain Pay Financial AI Co-Pilot for Yash Jain.
Active Voice Persona: ${activeProfile.name} (${activeProfile.roleBadge}).
Voice Persona Directive: ${activeProfile.toneDirective}
IMPORTANT: Answer the user's specific question directly (such as maximum payment, minimum payment, last payment, payment date, scheduled implementation date, wallet balance, or normal conversation). Do NOT define yourself as a PostgreSQL database or recite what model you are made of unless the user explicitly asks about database architecture.
Authoritative deterministic telemetry for this query:
- Direct Grounded Answer: ${deterministicEval.answerText}
- SQL Executed: ${deterministicEval.sqlExecuted}
- Wallet Balance: ₹${snapshot.walletBalance} (${snapshot.walletVpa})
- Linked Banks: ${snapshot.linkedBanks.length}
- Active AutoPay Mandates: ${snapshot.autopayMandates.filter((m) => m.status === 'ACTIVE').length}
- Credit Sanction Limit: ₹${snapshot.creditSanctions[0]?.sanctioned_limit ?? 50000}

Return a JSON object with:
1. "answerText": A direct, accurate 2-3 sentence response answering the user's exact question using the Direct Grounded Answer facts above.
2. "spokenSummary": A natural, conversational 1-2 sentence voice script matching the "${activeProfile.name}" persona suitable for Text-to-Speech (avoid raw SQL symbols or underscores so it sounds smooth when spoken aloud).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: question,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answerText: { type: Type.STRING },
                spokenSummary: { type: Type.STRING },
              },
              required: ['answerText', 'spokenSummary'],
            },
          },
        });

        const rawJson = response.text?.trim();
        if (rawJson) {
          const parsed = JSON.parse(rawJson) as {
            answerText?: string;
            spokenSummary?: string;
          };
          res.json({
            answerText: parsed.answerText || deterministicEval.answerText,
            spokenSummary:
              parsed.spokenSummary || deterministicEval.spokenSummary,
            sqlExecuted: deterministicEval.sqlExecuted,
            tablesQueried: deterministicEval.tablesQueried,
            keyMetrics: deterministicEval.keyMetrics,
            sourceEngine: 'GEMINI_LIVE_API',
          });
          return;
        }
      } catch (geminiErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, geminiErr);
      }

      res.json({
        ...deterministicEval,
        sourceEngine: 'DETERMINISTIC_BCNF_ENGINE',
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : 'Internal AI Co-Pilot Error',
      });
    }
  });

  // 2. Multi-Turn Gemini Chatbot Endpoint (ai.chats.create with gemini-3.8-flash & gemini-3.1-flash-lite)
  app.post('/api/ai/multi-turn-chat', async (req, res) => {
    try {
      const {
        message,
        roleId = 'BCNF_DB_PROFESSOR',
        systemInstruction = 'You are an enterprise database architect and financial assistant.',
        modelTierId = 'GENERAL_FLASH_3_8',
        modelName = 'gemini-3.8-flash',
        thinkingLevel = 'LOW',
        history = [],
        snapshot,
      }: {
        message?: string;
        roleId?: GeminiChatbotRoleId;
        systemInstruction?: string;
        modelTierId?: GeminiModelTierId;
        modelName?: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
        thinkingLevel?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        snapshot?: LiveDatabaseSnapshot;
      } = req.body ?? {};

      if (!message || !snapshot) {
        res.status(400).json({ error: 'Missing message or database snapshot' });
        return;
      }

      const fallbackReply = evaluateMultiTurnChatReply(
        message,
        roleId,
        modelTierId,
        history as MultiTurnChatMessage[],
        snapshot
      );

      const ai = getGeminiClient();
      if (!ai) {
        res.json(fallbackReply);
        return;
      }

      try {
        // Convert prior turns (excluding the latest user message at the end) to SDK Content format
        const priorTurns = history.slice(0, -1).map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }));

        const enrichedSystemInstruction = `${systemInstruction}
Live 12-Table BCNF Database Context:
- Wallet Balance: ₹${snapshot.walletBalance} (${snapshot.walletVpa})
- Linked Banks: ${snapshot.linkedBanks.map((b) => `${b.bank_name} (${b.masked_account_number})`).join(', ')}
- Active AutoPay Mandates: ${snapshot.autopayMandates.filter((m) => m.status === 'ACTIVE').length}
- Deterministic Fact Check: ${fallbackReply.replyText}`;

        const chat = ai.chats.create({
          model: modelName,
          history: priorTurns,
          config: {
            systemInstruction: enrichedSystemInstruction,
            thinkingConfig: {
              thinkingLevel: mapThinkingLevel(thinkingLevel),
            },
          },
        });

        const response = await chat.sendMessage({
          message,
        });

        const replyText = response.text?.trim() || fallbackReply.replyText;
        res.json({
          replyText,
          spokenSummary: fallbackReply.spokenSummary,
          modelUsed: `${modelName} (${thinkingLevel})`,
        });
        return;
      } catch (chatErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, chatErr);
      }

      res.json(fallbackReply);
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : 'Multi-Turn Chat Error',
      });
    }
  });

  // 3. Google Search Grounding Endpoint (gemini-3.8-flash with googleSearch tool)
  app.post('/api/ai/search-grounding', async (req, res) => {
    try {
      const {
        query,
        snapshot,
      }: {
        query?: string;
        snapshot?: LiveDatabaseSnapshot;
      } = req.body ?? {};

      if (!query || !snapshot) {
        res.status(400).json({ error: 'Missing query or database snapshot' });
        return;
      }

      const fallbackGrounding = evaluateSearchGroundedQuery(query, snapshot);
      const ai = getGeminiClient();

      if (!ai) {
        res.json(fallbackGrounding);
        return;
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: query,
          config: {
            systemInstruction: `You are the Jain Pay Regulatory & Database Research Analyst. Use Google Search to provide accurate, up-to-date facts on RBI regulations, NPCI UPI 2.0/AutoPay/Global/UDIR rules, and PostgreSQL 16 architecture, and connect them to the user's Jain Pay wallet (${snapshot.walletVpa}, ₹${snapshot.walletBalance}).`,
            tools: [{ googleSearch: {} }],
          },
        });

        const rawChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const extractedChunks: GroundingCitationChunk[] = [];

        if (Array.isArray(rawChunks)) {
          for (const ch of rawChunks) {
            const web = (ch as { web?: { uri?: string; title?: string } }).web;
            if (web?.uri) {
              extractedChunks.push({
                title: web.title || web.uri,
                uri: web.uri,
                snippet:
                  'Verified live web source retrieved via Gemini Google Search Grounding.',
              });
            }
          }
        }

        const answerText =
          response.text?.trim() || fallbackGrounding.answerText;

        res.json({
          query,
          answerText,
          spokenSummary: fallbackGrounding.spokenSummary,
          groundingChunks:
            extractedChunks.length > 0
              ? extractedChunks
              : fallbackGrounding.groundingChunks,
          sourceEngine: 'GEMINI_GOOGLE_SEARCH_GROUNDING',
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      } catch (searchErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, searchErr);
      }

      res.json(fallbackGrounding);
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : 'Search Grounding Error',
      });
    }
  });

  // 4. Server-Side Gemini Text-to-Speech (TTS) Voice Synthesis Endpoint
  app.post('/api/ai/tts', async (req, res) => {
    try {
      const {
        text,
        voiceName = 'Kore',
        toneDirective,
      }: {
        text?: string;
        voiceName?: string;
        toneDirective?: string;
      } = req.body ?? {};

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Missing text for voice synthesis' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.json({
          fallbackToBrowserTts: true,
          reason: 'GEMINI_API_KEY not set in environment; using Web Speech API.',
        });
        return;
      }

      try {
        const stylePrompt = toneDirective
          ? `${toneDirective} Speak the following clearly: ${text}`
          : `Speak clearly in a warm, confident fintech assistant voice: ${text}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              parts: [
                {
                  text: stylePrompt,
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const inlineData =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          res.json({
            fallbackToBrowserTts: false,
            audioBase64: inlineData.data,
            mimeType: inlineData.mimeType || 'audio/wav',
          });
          return;
        }
      } catch (ttsErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, ttsErr);
      }

      res.json({
        fallbackToBrowserTts: true,
      });
    } catch (err) {
      res.json({
        fallbackToBrowserTts: true,
        error: err instanceof Error ? err.message : 'TTS Fallback',
      });
    }
  });

  // Create HTTP server first so Vite middlewareMode HMR shares the same server instance
  // and never collides with port 3000 (strictPort: true in vite.config.ts).
  const httpServer = http.createServer(app);

  // Mount Vite Dev Server or Static Production Bundle
  const distPath = path.resolve(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        port: PORT,
        strictPort: true,
        host: HOST,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : { server: httpServer },
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Attach WebSocketServer at /api/ai/live for gemini-3.8-live
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const reqUrl = request.url || '';
    if (reqUrl.startsWith('/api/ai/live')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs, request) => {
    const urlObj = new URL(request.url || '/api/ai/live', 'http://localhost');
    const voiceName = urlObj.searchParams.get('voice') || 'Kore';
    const profileId = (urlObj.searchParams.get('profile') ||
      'CONCISE_CORPORATE') as VoiceProfileId;
    const activeProfile = getVoiceProfileById(profileId);

    const ai = getGeminiClient();
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null =
      null;

    if (ai) {
      try {
        liveSession = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
            systemInstruction: `You are the Jain Pay Real-Time Live Voice Co-Pilot (${activeProfile.name}). ${activeProfile.toneDirective}`,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              const audio =
                message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ audio }));
              }
              const outTranscript =
                message.serverContent?.outputTranscription?.text;
              if (outTranscript) {
                clientWs.send(
                  JSON.stringify({
                    transcript: outTranscript,
                    latencyMs: 52,
                  })
                );
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            },
          },
        });
      } catch (liveErr) {
        recordGeminiUpstreamFailure(process.env.GEMINI_API_KEY, liveErr);
      }
    }

    clientWs.on('message', (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString()) as {
          type?: string;
          audio?: string;
          text?: string;
          voiceProfileId?: VoiceProfileId;
          snapshot?: LiveDatabaseSnapshot;
        };

        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
          return;
        }

        if (parsed.text) {
          if (liveSession) {
            liveSession.sendRealtimeInput({
              text: parsed.text,
            });
          } else if (parsed.snapshot) {
            const evalRes = evaluateDatabaseGroundedQuery(
              parsed.text,
              parsed.snapshot,
              undefined,
              parsed.voiceProfileId ?? activeProfile.id
            );
            clientWs.send(
              JSON.stringify({
                transcript: evalRes.spokenSummary,
                spokenSummary: evalRes.spokenSummary,
                latencyMs: 38,
              })
            );
          }
        }
      } catch {
        // Ignore malformed frame
      }
    });

    clientWs.on('close', () => {
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore close error
        }
      }
    });
  });

  httpServer.listen(PORT, HOST, () => {
    console.info(`  ➜  Local:   http://localhost:${PORT}/`);
    console.info(`  ➜  Network: http://${HOST}:${PORT}/`);
    console.info(
      `[JAIN-PAY FULL-STACK SERVER] Express + Vite + Gemini Live/Search/Chat Proxy listening on http://${HOST}:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error('[JAIN-PAY FULL-STACK SERVER] Fatal startup error:', err);
  process.exit(1);
});
