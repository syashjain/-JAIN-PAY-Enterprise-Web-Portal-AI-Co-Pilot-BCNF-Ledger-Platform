import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { AiToolCallLog } from '../types/domain';

export interface AiChatLogsProps {
  logs: AiToolCallLog[];
  title?: string;
}

type ModuleScopeFilter = 'ALL' | 'AI_BASELINE' | 'NEXT_GEN';

export const AiChatLogs: React.FC<AiChatLogsProps> = ({
  logs,
  title = 'AI TOOL-CALL TERMINAL DISPATCH LOG',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ModuleScopeFilter>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() =>
    logs[0] ? { [logs[0].id]: true } : {}
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (scopeFilter === 'AI_BASELINE' && !entry.moduleCode.startsWith('AI-')) {
        return false;
      }
      if (scopeFilter === 'NEXT_GEN' && !entry.moduleCode.startsWith('NEXT-')) {
        return false;
      }
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.toLowerCase();
      return (
        entry.moduleCode.toLowerCase().includes(q) ||
        entry.toolName.toLowerCase().includes(q) ||
        entry.timestamp.toLowerCase().includes(q) ||
        JSON.stringify(entry.requestPayload).toLowerCase().includes(q) ||
        JSON.stringify(entry.responsePayload).toLowerCase().includes(q)
      );
    });
  }, [logs, scopeFilter, searchQuery]);

  const avgLatencyMs = useMemo(() => {
    if (filteredLogs.length === 0) return 0;
    const total = filteredLogs.reduce((acc, row) => acc + row.executionMs, 0);
    return Math.round(total / filteredLogs.length);
  }, [filteredLogs]);

  const toggleRow = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyRowJson = (entry: AiToolCallLog, e: React.MouseEvent) => {
    e.stopPropagation();
    const serialized = JSON.stringify(
      {
        id: entry.id,
        timestamp: entry.timestamp,
        moduleCode: entry.moduleCode,
        toolName: entry.toolName,
        executionMs: entry.executionMs,
        requestPayload: entry.requestPayload,
        responsePayload: entry.responsePayload,
      },
      null,
      2
    );
    navigator.clipboard?.writeText(serialized);
    setCopiedId(entry.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === entry.id ? null : prev));
    }, 1600);
  };

  return (
    <div className="bg-[#101010] border border-[#3d3a39] rounded-[10px] overflow-hidden font-mono text-xs text-[#eeeeee]">
      {/* Terminal Header Bar */}
      <div className="bg-[#1d1a18] border-b border-[#3d3a39] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full bg-[#ee6018] inline-block shrink-0"
            aria-hidden="true"
          />
          <Terminal className="w-3.5 h-3.5 text-[#b8b3b0] shrink-0" />
          <span className="text-[12px] uppercase tracking-[-0.02em] text-[#eeeeee]">
            {title}
          </span>
          <span className="text-[11px] uppercase tracking-[-0.02em] text-[#8a8380] border-l border-[#3d3a39] pl-2.5">
            ROWS: {filteredLogs.length} / {logs.length}
          </span>
          <span className="text-[11px] uppercase tracking-[-0.02em] text-[#a0ca92] border-l border-[#3d3a39] pl-2.5">
            AVG LATENCY: {avgLatencyMs}MS
          </span>
        </div>

        {/* Monochromatic Filter & Search Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#101010] border border-[#3d3a39] rounded-[3px] p-0.5">
            {(
              [
                { id: 'ALL', label: 'ALL TOOLS' },
                { id: 'AI_BASELINE', label: 'AI-01..08' },
                { id: 'NEXT_GEN', label: 'NEXT-01..07' },
              ] as const
            ).map((tab) => {
              const active = scopeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScopeFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-[3px] text-[11px] uppercase tracking-[-0.02em] transition-colors ${
                    active
                      ? 'bg-[#fafafa] text-[#101010]'
                      : 'bg-transparent text-[#8a8380] hover:text-[#eeeeee]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8a8380] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="GREP MODULE / TOOL / JSON..."
              aria-label="Filter AI tool call logs"
              className="bg-[#101010] border border-[#3d3a39] rounded-[3px] pl-8 pr-3 py-1 text-[11px] text-[#eeeeee] placeholder-[#8a8380] focus:outline-none focus:border-[#eeeeee] w-56"
            />
          </div>
        </div>
      </div>

      {/* Zero-Trust Invariant Subbar */}
      <div className="bg-[#101010] border-b border-[#3d3a39] px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#b8b3b0]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#a0ca92] shrink-0" />
          <span className="uppercase tracking-[-0.02em]">
            ZERO-TRUST INVARIANT: READ / STAGE-ONLY SCOPE • DIRECT SQL MUTATION ON PUBLIC.ACCOUNTS = FORBIDDEN
          </span>
        </div>
        <span className="text-[#8a8380] uppercase tracking-[-0.02em]">
          CLICK ANY ROW TO INSPECT REQUEST / RESPONSE JSON
        </span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-[#1d1a18] border-b border-[#3d3a39] text-[11px] uppercase tracking-[-0.02em] text-[#b8b3b0]">
        <div className="col-span-2">TIMESTAMP</div>
        <div className="col-span-2">MODULE</div>
        <div className="col-span-3">TOOL INVOCATION</div>
        <div className="col-span-3">SUMMARY PAYLOAD</div>
        <div className="col-span-1 text-right">LATENCY</div>
        <div className="col-span-1 text-right">TRACE</div>
      </div>

      {/* Monochromatic Terminal Data Rows */}
      <div className="divide-y divide-[#3d3a39] max-h-[520px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="px-5 py-10 text-center text-[#8a8380] uppercase tracking-[-0.02em]">
            NO AI TOOL-CALL DISPATCH ROWS MATCH CURRENT FILTER.
          </div>
        ) : (
          filteredLogs.map((entry, idx) => {
            const isExpanded = Boolean(expandedIds[entry.id]);
            const rowBg = idx % 2 === 0 ? 'bg-[#101010]' : 'bg-[#1d1a18]/60';
            const compactPreview = JSON.stringify(entry.responsePayload);

            return (
              <div key={entry.id} className={`${rowBg} transition-colors`}>
                {/* Primary Terminal Row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleRow(entry.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleRow(entry.id);
                    }
                  }}
                  className="grid grid-cols-12 gap-2 px-5 py-2.5 items-center hover:bg-[#1d1a18] cursor-pointer"
                >
                  {/* Timestamp + Status Dot */}
                  <div className="col-span-2 flex items-center gap-2 text-[#8a8380] truncate">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#eeeeee] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#8a8380] shrink-0" />
                    )}
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#a0ca92] shrink-0"
                      title="Zero-Trust Verified"
                    />
                    <span className="truncate">{entry.timestamp}</span>
                  </div>

                  {/* Module Code */}
                  <div className="col-span-2">
                    <span className="inline-block px-2 py-0.5 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] text-[#eeeeee] text-[11px] uppercase tracking-[-0.02em]">
                      {entry.moduleCode}
                    </span>
                  </div>

                  {/* Tool Function Name */}
                  <div className="col-span-3 text-[#eeeeee] truncate">
                    {entry.toolName}()
                  </div>

                  {/* Monochromatic Compact JSON Preview */}
                  <div className="col-span-3 text-[#8a8380] truncate">
                    {compactPreview}
                  </div>

                  {/* Execution Latency */}
                  <div className="col-span-1 text-right text-[#b8b3b0]">
                    {entry.executionMs}ms
                  </div>

                  {/* Copy JSON Action */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => handleCopyRowJson(entry, e)}
                      className="px-2 py-1 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] hover:border-[#eeeeee] text-[#b8b3b0] hover:text-[#eeeeee] flex items-center gap-1 text-[10px] uppercase tracking-[-0.02em]"
                      title="Copy raw tool-call JSON"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#a0ca92]" />
                          <span>OK</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>RAW</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Terminal JSON Inspector */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-2 bg-[#101010] border-t border-[#3d3a39] grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="border border-[#3d3a39] rounded-[3px] bg-[#1d1a18] p-3">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#3d3a39] text-[11px] uppercase tracking-[-0.02em] text-[#b8b3b0]">
                        <span>STDIN // REQUEST PAYLOAD</span>
                        <span className="text-[#8a8380]">{entry.id}</span>
                      </div>
                      <pre className="text-[11px] leading-[1.35] text-[#eeeeee] overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(entry.requestPayload, null, 2)}
                      </pre>
                    </div>

                    <div className="border border-[#3d3a39] rounded-[3px] bg-[#1d1a18] p-3">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#3d3a39] text-[11px] uppercase tracking-[-0.02em] text-[#b8b3b0]">
                        <span>STDOUT // ZERO-TRUST RESPONSE PAYLOAD</span>
                        <span className="text-[#a0ca92]">STAGE_ONLY_OK</span>
                      </div>
                      <pre className="text-[11px] leading-[1.35] text-[#b8b3b0] overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(entry.responsePayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AiChatLogs;
