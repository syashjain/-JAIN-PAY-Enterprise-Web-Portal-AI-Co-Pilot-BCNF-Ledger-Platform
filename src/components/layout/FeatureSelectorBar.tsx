import React from 'react';
import {
  BASELINE_AI_SPECS,
  BaselineAiId,
  CORE_FEATURE_SPECS,
  CoreFeatureId,
  NEXT_GEN_FEATURE_SPECS,
  NextGenFeatureId,
} from '../../data/pipelineMetadata';
import { VoiceAgentSubfunctionId } from '../../context/JainPayContext';
import { TopNavigationMode } from '../../types/domain';
import { Layers, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface FeatureSelectorBarProps {
  activeMode: TopNavigationMode;
  selectedVoiceSubId: VoiceAgentSubfunctionId;
  selectedCoreId: CoreFeatureId;
  selectedAiId: BaselineAiId;
  selectedNextGenId: NextGenFeatureId;
  isArchitectureDrawerOpen: boolean;
  onSelectVoiceSub: (id: VoiceAgentSubfunctionId) => void;
  onSelectCore: (id: CoreFeatureId) => void;
  onSelectAi: (id: BaselineAiId) => void;
  onSelectNextGen: (id: NextGenFeatureId) => void;
  onToggleArchitectureDrawer: () => void;
}

const VOICE_SUBFUNCTIONS: Array<{
  id: VoiceAgentSubfunctionId;
  label: string;
}> = [
  {
    id: 'VOICE_CHAT_STAGE',
    label: '2.1 Voice Studio & 10 Examples',
  },
  {
    id: 'MULTI_TURN_CHATBOT',
    label: '2.2 Multi-Turn Gemini Chatbot',
  },
  {
    id: 'LIVE_VOICE_SESSION',
    label: '2.3 Live Voice API (gemini-3.8-live)',
  },
  {
    id: 'SEARCH_GROUNDING',
    label: '2.4 Google Search Grounding',
  },
  {
    id: 'LIVE_DB_EXPLORER',
    label: '2.5 12-Table DB & PgBouncer',
  },
];

/**
 * Tier 2 Subfunctions Bar directly beneath the Primary Functions header.
 * Styled in Factory's Carbon Lift (#1d1a18) / Obsidian Canvas (#101010) with 3px radii and Geist Mono 12px uppercase eyebrow.
 */
export const FeatureSelectorBar: React.FC<FeatureSelectorBarProps> = ({
  activeMode,
  selectedVoiceSubId,
  selectedCoreId,
  selectedAiId,
  selectedNextGenId,
  isArchitectureDrawerOpen,
  onSelectVoiceSub,
  onSelectCore,
  onSelectAi,
  onSelectNextGen,
  onToggleArchitectureDrawer,
}) => {
  if (
    activeMode !== 'AI_VOICE_AGENT' &&
    activeMode !== 'CORE' &&
    activeMode !== 'AI_SUITE' &&
    activeMode !== 'NEXT_GEN'
  ) {
    return null;
  }

  return (
    <div className="px-6 py-2 bg-[#101010] border-b border-[#1d1a18] flex flex-wrap items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[-0.02em] text-[#b8b3b0] shrink-0 mr-2 px-2.5 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39]">
          <span className="factory-status-pulse" />
          <Layers className="w-3 h-3 text-[#ee6018]" />
          <span>SUBFUNCTIONS</span>
        </span>

        {activeMode === 'AI_VOICE_AGENT' &&
          VOICE_SUBFUNCTIONS.map((sub) => {
            const active = selectedVoiceSubId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectVoiceSub(sub.id)}
                className={`py-1.5 px-3.5 rounded-[3px] text-[13px] font-normal whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#fafafa] text-[#101010] border border-[#fafafa]'
                    : 'bg-[#1d1a18] text-[#b8b3b0] border border-[#3d3a39] hover:text-[#eeeeee] hover:border-[#fafafa]'
                }`}
              >
                {sub.label}
              </button>
            );
          })}

        {activeMode === 'CORE' &&
          (Object.keys(CORE_FEATURE_SPECS) as CoreFeatureId[]).map((id) => {
            const spec = CORE_FEATURE_SPECS[id];
            const active = selectedCoreId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectCore(id)}
                className={`py-1.5 px-3.5 rounded-[3px] text-[13px] font-normal whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#fafafa] text-[#101010] border border-[#fafafa]'
                    : 'bg-[#1d1a18] text-[#b8b3b0] border border-[#3d3a39] hover:text-[#eeeeee] hover:border-[#fafafa]'
                }`}
              >
                {spec.shortLabel}
              </button>
            );
          })}

        {activeMode === 'AI_SUITE' &&
          (Object.keys(BASELINE_AI_SPECS) as BaselineAiId[]).map((id) => {
            const spec = BASELINE_AI_SPECS[id];
            const active = selectedAiId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectAi(id)}
                className={`py-1.5 px-3.5 rounded-[3px] text-[13px] font-normal whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#fafafa] text-[#101010] border border-[#fafafa]'
                    : 'bg-[#1d1a18] text-[#b8b3b0] border border-[#3d3a39] hover:text-[#eeeeee] hover:border-[#fafafa]'
                }`}
              >
                {spec.shortLabel}
              </button>
            );
          })}

        {activeMode === 'NEXT_GEN' &&
          (Object.keys(NEXT_GEN_FEATURE_SPECS) as NextGenFeatureId[]).map(
            (id) => {
              const spec = NEXT_GEN_FEATURE_SPECS[id];
              const active = selectedNextGenId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectNextGen(id)}
                  className={`py-1.5 px-3.5 rounded-[3px] text-[13px] font-normal whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? 'bg-[#fafafa] text-[#101010] border border-[#fafafa]'
                      : 'bg-[#1d1a18] text-[#b8b3b0] border border-[#3d3a39] hover:text-[#eeeeee] hover:border-[#fafafa]'
                  }`}
                >
                  {spec.shortLabel}
                </button>
              );
            }
          )}
      </div>

      {/* Right: Optional 4-Node Architecture Pipeline Drawer Toggle for Modes 3, 4 & 5 */}
      {(activeMode === 'CORE' ||
        activeMode === 'AI_SUITE' ||
        activeMode === 'NEXT_GEN') && (
        <button
          type="button"
          onClick={onToggleArchitectureDrawer}
          className={`py-1.5 px-3.5 rounded-[3px] text-[12px] font-mono uppercase tracking-[-0.02em] flex items-center gap-1.5 shrink-0 transition-all ${
            isArchitectureDrawerOpen
              ? 'bg-[#1d1a18] border border-[#ee6018] text-[#eeeeee]'
              : 'bg-transparent border border-[#3d3a39] text-[#b8b3b0] hover:border-[#fafafa] hover:text-[#eeeeee]'
          }`}
        >
          {isArchitectureDrawerOpen ? (
            <>
              <PanelRightClose className="w-3.5 h-3.5 text-[#ee6018]" />
              <span>Hide 4-Node Pipeline</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="w-3.5 h-3.5 text-[#ee6018]" />
              <span>Show 4-Node Pipeline</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
