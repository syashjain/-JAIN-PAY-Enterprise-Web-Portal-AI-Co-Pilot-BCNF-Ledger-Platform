import React, { useState } from 'react';
import { FeaturePipelineSpec } from '../data/pipelineMetadata';
import {
  Smartphone,
  ShieldCheck,
  Server,
  Database,
  ArrowDown,
  Lock,
  SearchCode,
  Sparkles,
  Presentation,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RightPipelineStageProps {
  spec: FeaturePipelineSpec;
  lastExecutionSummary: string;
  onInspectInAdminVault: (
    recommendedTab: FeaturePipelineSpec['recommendedAdminTab'],
    recommendedTable?: FeaturePipelineSpec['recommendedBcnfTable']
  ) => void;
}

const NODE_ICONS = [Smartphone, ShieldCheck, Server, Database];

export const RightPipelineStage: React.FC<RightPipelineStageProps> = ({
  spec,
  lastExecutionSummary,
  onInspectInAdminVault,
}) => {
  const [showPresenterGuide, setShowPresenterGuide] = useState(true);

  return (
    <div className="card-3d-orange rounded-[28px] p-7 flex flex-col justify-between h-full space-y-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#FF6A00]/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5E00]/15 border border-[#FF6A00]/40 text-[#FF8800] text-[11px] font-mono font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HOW THIS WORKS IN REAL JAIN PAY (PRD + 4-NODE PIPELINE)</span>
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              {spec.title}
            </h3>
            <p className="text-xs text-[#C8CAD0] mt-0.5">{spec.subtitle}</p>
          </div>
        </div>

        {/* ===================================================================
            PRESENTER WALKTHROUGH & LIVE DEMO GUIDE ("HOW TO SHOW AN AUDIENCE")
           =================================================================== */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1F1006] via-[#120B07] to-[#0C0C10] border border-[#FF6A00]/50 p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Presentation className="w-4 h-4 text-[#FF8800] shrink-0" />
              <span className="text-xs font-mono font-extrabold text-[#FF8800] uppercase tracking-wider">
                🎬 How to Show This to Someone Watching (Live Demo Guide)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPresenterGuide((prev) => !prev)}
              className="px-2.5 py-1 rounded-full bg-[#050507] border border-[#FF6A00]/30 text-[10px] font-mono text-[#C8CAD0] hover:text-white flex items-center gap-1"
            >
              <span>{showPresenterGuide ? 'Compact' : 'Expand Guide'}</span>
              {showPresenterGuide ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {showPresenterGuide && (
            <div className="mt-3 space-y-2.5 text-xs">
              <p className="text-[#F0F0F0] leading-relaxed">
                <strong className="text-[#FF8800]">What to Say: </strong>
                {spec.presenterGuide.audiencePitch}
              </p>

              <div className="p-2.5 rounded-xl bg-[#050507]/90 border border-[#FF6A00]/25 font-mono text-[11px] text-[#FF8800] flex items-start gap-2">
                <BookOpenCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>PRD Specification:</strong>{' '}
                  {spec.presenterGuide.prdExactExample}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                  Step-by-Step Click Path on Left Stage:
                </div>
                {spec.presenterGuide.stepByStepWalkthrough.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-[#D8DAE0] leading-snug"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#FF5E00] text-[#050507] font-mono font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="pt-1.5 border-t border-white/10 text-[11px] text-[#AEAEB7]">
                <strong className="text-white">
                  Why GPay / PhonePe / Paytm / CRED Miss This:{' '}
                </strong>
                {spec.presenterGuide.incumbentMarketGap}
              </div>
            </div>
          )}
        </div>

        {/* Live Telemetry Pulse Bar */}
        <div className="p-3 rounded-2xl bg-[#121218] border border-[#FF6A00]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-pulse shrink-0" />
            <span className="text-xs font-mono text-[#F0F0F0] truncate">
              {lastExecutionSummary}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#FF8800] shrink-0 font-bold">
            SSI • RLS ACTIVE
          </span>
        </div>

        {/* 4-Node 3D Architecture Flow */}
        <div className="space-y-2.5">
          {spec.nodes.map((node, index) => {
            const Icon = NODE_ICONS[index] || Server;
            return (
              <React.Fragment key={node.stepNumber}>
                <div className="card-3d-sub rounded-2xl p-3.5 hover:border-[#FF6A00]/50 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5E00] to-[#FF8800] text-[#050507] flex items-center justify-center font-mono font-extrabold text-xs shrink-0 shadow-lg shadow-[#FF5E00]/20">
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-[#FF8800] uppercase tracking-wider">
                          {node.stepNumber} — {node.layerTitle}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#050507] border border-[#FF6A00]/35 text-[10px] font-mono text-[#FFFFFF] font-semibold">
                          {node.componentBadge}
                        </span>
                      </div>

                      <p className="text-xs text-[#D8DAE0] leading-relaxed mb-1.5">
                        {node.technicalSummary}
                      </p>

                      <div className="px-2.5 py-1 rounded-xl bg-[#050507]/90 border border-white/10 text-[11px] font-mono text-[#FF8800] flex items-center gap-1.5">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{node.keyInvariant}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {index < spec.nodes.length - 1 && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5E00]/10 border border-[#FF6A00]/30 text-[10px] font-mono text-[#FF8800]">
                      <ArrowDown className="w-3 h-3" />
                      <span>
                        {index === 0
                          ? 'Zero-Trust Validated Intent'
                          : index === 1
                          ? 'Signed RPC / Staged Draft'
                          : 'SERIALIZABLE BCNF Commit'}
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Button to Inspect Raw SQL & JSON in Admin Vault */}
      <div className="pt-3 border-t border-[#FF6A00]/20">
        <button
          type="button"
          onClick={() =>
            onInspectInAdminVault(
              spec.recommendedAdminTab,
              spec.recommendedBcnfTable
            )
          }
          className="w-full py-3 px-5 rounded-full bg-[#12121A] hover:bg-[#1A1A24] border border-[#FF5E00]/50 text-xs font-mono font-bold text-[#FF8800] hover:text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/50"
        >
          <Lock className="w-3.5 h-3.5 text-[#FF5E00]" />
          <SearchCode className="w-4 h-4 text-[#FF8800]" />
          <span>[ 🔒 Inspect Raw SQL &amp; JSON in Admin Vault ]</span>
        </button>
      </div>
    </div>
  );
};
