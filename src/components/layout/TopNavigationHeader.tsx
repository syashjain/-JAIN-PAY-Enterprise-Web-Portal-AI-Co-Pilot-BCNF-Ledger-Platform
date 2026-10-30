import React from 'react';
import { ThemeMode } from '../../context/JainPayContext';
import { TopNavigationMode } from '../../types/domain';
import {
  Box,
  Cpu,
  Lock,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sun,
  Volume2,
} from 'lucide-react';

interface TopNavigationHeaderProps {
  activeMode: TopNavigationMode;
  isAdminVaultUnlocked: boolean;
  onSelectMode: (mode: TopNavigationMode) => void;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
}

const PRIMARY_FUNCTIONS: Array<{
  mode: TopNavigationMode;
  numberLabel: string;
  label: string;
  subCountLabel: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    mode: 'HOME_3D',
    numberLabel: '01',
    label: '3D Command Deck',
    subCountLabel: '5 Views',
    icon: Box,
  },
  {
    mode: 'AI_VOICE_AGENT',
    numberLabel: '02',
    label: 'AI Voice & DB Agent',
    subCountLabel: '10 Queries',
    icon: Volume2,
  },
  {
    mode: 'CORE',
    numberLabel: '03',
    label: 'Core Banking',
    subCountLabel: '6 Subfunctions',
    icon: ShieldCheck,
  },
  {
    mode: 'AI_SUITE',
    numberLabel: '04',
    label: 'Baseline AI Suite',
    subCountLabel: '8 Modules',
    icon: Cpu,
  },
  {
    mode: 'NEXT_GEN',
    numberLabel: '05',
    label: 'Next-Gen Co-Pilot',
    subCountLabel: '7 Workflows',
    icon: MessageSquare,
  },
];

/**
 * Factory Top Navigation Bar
 * Supports both Dark Mode (#101010 Obsidian Canvas) and Light Mode (Daylight Translucent Bone).
 */
export const TopNavigationHeader: React.FC<TopNavigationHeaderProps> = ({
  activeMode,
  isAdminVaultUnlocked,
  onSelectMode,
  themeMode = 'dark',
  onToggleThemeMode,
}) => {
  return (
    <header className="px-4 min-h-[58px] py-2 bg-[#101010]/95 border-b border-[#1d1a18] flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
      {/* Left Brand Identity — 12px Geist Mono Uppercase + 6px #ee6018 Status Pulse */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onSelectMode('HOME_3D')}
          className="flex items-center gap-2 text-left group py-1"
        >
          <span className="factory-status-pulse" />
          <span className="font-mono text-[12px] leading-none uppercase tracking-[0.06em] text-[#eeeeee]">
            JAIN PAY
          </span>
          <span className="font-mono text-[11px] leading-none uppercase tracking-[-0.02em] text-[#8a8380] hidden 2xl:inline">
            / BCNF • SSI • 12 TABLES
          </span>
        </button>
      </div>

      {/* Center: 5 Primary Functions Navigation Bar — 12px Geist weight 400 uppercase, 3px radius */}
      <nav
        aria-label="Primary Functions Navigation"
        className="flex items-center gap-1 shrink-0"
      >
        {PRIMARY_FUNCTIONS.map((fn) => {
          const Icon = fn.icon;
          const isActive = activeMode === fn.mode;
          return (
            <button
              key={fn.mode}
              type="button"
              onClick={() => onSelectMode(fn.mode)}
              className={`py-1.5 px-2 rounded-[3px] text-[11px] font-normal uppercase tracking-[-0.015em] flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#1d1a18] text-[#eeeeee] border border-[#3d3a39]'
                  : 'bg-transparent text-[#8a8380] border border-transparent hover:text-[#eeeeee] hover:border-[#3d3a39]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isActive ? 'bg-[#ee6018]' : 'bg-[#4d4947]'
                }`}
              />
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-[#ee6018]' : 'text-[#8a8380]'
                }`}
              />
              <span className="font-mono text-[11px] text-[#b8b3b0]">
                {fn.numberLabel}
              </span>
              <span>{fn.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] hidden 2xl:inline ${
                  isActive
                    ? 'bg-[#101010] text-[#a0ca92] border border-[#3d3a39]'
                    : 'text-[#8a8380]'
                }`}
              >
                {fn.subCountLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right: Theme Mode Toggle (Light / Dark) + High-Emphasis Admin Vault Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleThemeMode && (
          <button
            type="button"
            data-testid="theme-mode-toggle"
            onClick={onToggleThemeMode}
            aria-label={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="py-1.5 px-2.5 rounded-[3px] bg-[#1d1a18] text-[#eeeeee] border border-[#3d3a39] hover:border-[#ee6018] text-[11px] font-mono uppercase tracking-[-0.02em] flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#ee6018] shrink-0" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#ee6018] shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectMode('ADMIN_VAULT')}
          className={`py-1.5 px-2.5 rounded-[3px] text-[11px] font-mono uppercase tracking-[-0.02em] flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeMode === 'ADMIN_VAULT'
              ? 'bg-[#eeeeee] text-[#101010] border border-[#3d3a39]'
              : 'bg-[#fafafa] text-[#101010] border border-[#3d3a39] hover:bg-[#eeeeee]'
          }`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Admin Vault</span>
          <span
            className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono uppercase ${
              isAdminVaultUnlocked
                ? 'bg-[#101010] text-[#a0ca92]'
                : 'bg-[#101010] text-[#ee6018]'
            }`}
          >
            {isAdminVaultUnlocked ? 'OPEN' : 'LOCKED'}
          </span>
        </button>
      </div>
    </header>
  );
};
