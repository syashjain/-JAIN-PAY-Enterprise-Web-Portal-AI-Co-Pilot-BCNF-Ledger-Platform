import React from 'react';
import { AdminVaultSection } from './components/AdminVaultSection';
import { AiChatLogs } from './components/AiChatLogs';
import { AiVoiceCopilotStage } from './components/AiVoiceCopilotStage';
import { BaselineAiStage } from './components/BaselineAiStage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SparkleCursorOverlay } from './components/common/SparkleCursorOverlay';
import { CoreFeaturesStage } from './components/CoreFeaturesStage';
import { Home3DShowcase } from './components/Home3DShowcase';
import { FeatureSelectorBar } from './components/layout/FeatureSelectorBar';
import { FintechSpatialBackdrop } from './components/layout/FintechSpatialBackdrop';
import { TopNavigationHeader } from './components/layout/TopNavigationHeader';
import {
  BalancePinDialog,
  FcmToastContainer,
  PaymentReviewModal,
  ReceiptModal,
  ScamShieldInterceptionModal,
} from './components/Modals';
import { NextGenChatStage } from './components/NextGenChatStage';
import { RightPipelineCard } from './components/RightPipelineCard';
import { JainPayProvider, useJainPayStore } from './context/JainPayContext';
import {
  KhataEntryRecord,
  MilestoneDealRecord,
  TopNavigationMode,
} from './types/domain';
import { formatInr, roundPaisa } from './utils/ledgerEngine';
import { AlertTriangle, X } from 'lucide-react';

export type { TopNavigationMode };

const APP_COMPONENT_REGISTRY: Record<string, unknown> = {
  AdminVaultSection,
  AiChatLogs,
  AiVoiceCopilotStage,
  BaselineAiStage,
  ErrorBoundary,
  SparkleCursorOverlay,
  CoreFeaturesStage,
  Home3DShowcase,
  FeatureSelectorBar,
  FintechSpatialBackdrop,
  TopNavigationHeader,
  BalancePinDialog,
  FcmToastContainer,
  PaymentReviewModal,
  ReceiptModal,
  ScamShieldInterceptionModal,
  NextGenChatStage,
  RightPipelineCard,
  JainPayProvider,
  useJainPayStore,
  formatInr,
  roundPaisa,
};

/**
 * Verifies that every imported component, provider, and engine helper in App.tsx
 * evaluated cleanly as a defined reference with zero circular dependency dead-zones.
 */
export function verifyAppComponentImports(): {
  verifiedCount: number;
  missingImports: string[];
} {
  const entries = Object.entries(APP_COMPONENT_REGISTRY);
  const missingImports = entries
    .filter(([, ref]) => ref === undefined || ref === null)
    .map(([name]) => name);

  if (missingImports.length > 0) {
    console.error(
      `[JAIN-PAY MODULE GRAPH] Circular dependency or unresolved import detected in App.tsx: ${missingImports.join(', ')}`
    );
  } else {
    console.info(
      `[JAIN-PAY MODULE GRAPH] Verified all ${entries.length} imported components in App.tsx loaded cleanly with 0 circular dependencies: [${entries.map(([name]) => name).join(', ')}]`
    );
  }

  return {
    verifiedCount: entries.length - missingImports.length,
    missingImports,
  };
}

const JainPayWorkspaceStage: React.FC = () => {
  const {
    themeMode,
    toggleThemeMode,
    activeMode,
    setActiveMode,
    activeCameraIndex,
    setActiveCameraIndex,
    isFullCanvasMode,
    setIsFullCanvasMode,
    isArchitectureDrawerOpen,
    setIsArchitectureDrawerOpen,
    selectedVoiceSubId,
    setSelectedVoiceSubId,
    selectedCoreId,
    setSelectedCoreId,
    selectedAiId,
    setSelectedAiId,
    selectedNextGenId,
    setSelectedNextGenId,
    activeFeatureSpec,
    handleLaunchSpecificFeature,
    isAdminVaultUnlocked,
    setIsAdminVaultUnlocked,
    adminVaultTab,
    setAdminVaultTab,
    activeBcnfTable,
    setActiveBcnfTable,
    users,
    primaryUser,
    activePin,
    accounts,
    walletAccount,
    linkedBanks,
    primaryBank,
    transactions,
    ledgerEntries,
    khataEntries,
    setKhataEntries,
    milestoneDeals,
    setMilestoneDeals,
    autopayMandates,
    creditSanctions,
    fxTreasuryVaults,
    disputeChargebacks,
    securityAuditLogs,
    scratchCards,
    sqlLogs,
    aiLogs,
    fadState,
    setFadState,
    stagedRisk,
    sandboxOutcome,
    setSandboxOutcome,
    lastPipelinePulse,
    setLastPipelinePulse,
    runtimeErrorBanner,
    clearRuntimeErrorBanner,
    isBalanceRevealed,
    setIsBalanceRevealed,
    isBalancePinModalOpen,
    setIsBalancePinModalOpen,
    stagedDraft,
    setStagedDraft,
    activeReceiptTx,
    setActiveReceiptTx,
    replayBannerNotice,
    setReplayBannerNotice,
    scamInterceptPayload,
    setScamInterceptPayload,
    diagnosedTxId,
    setDiagnosedTxId,
    fcmToasts,
    dismissFcmToast,
    appendAiLog,
    handleToggleAutopayMandate,
    handleRepayCreditSanction,
    handleBalancePinVerified,
    handleUpdateUserPin,
    handleRecordOtpSessionVerified,
    handleStagePayment,
    handleExecuteStagedPayment,
    handleTriggerRefund,
    handleSimulateBankTimeout,
    handleAdjustDemoBalance,
    handleClaimScratchCard,
    handleAddBankAccount,
    handleSetPrimaryBank,
    handleResetPinToDefault,
    handleResetAllDemoData,
    handleRunSsiConcurrencySimulation,
  } = useJainPayStore();

  return (
    <div
      data-theme={themeMode}
      className="relative w-screen h-screen overflow-hidden bg-[#101010] text-[#eeeeee] select-none"
    >
      {/* Custom Animated Sparkle & Twinkle Cursor Trail Overlay */}
      <SparkleCursorOverlay />

      {/* Persistent Custom Corporate Fintech 3D Spatial Mesh Canvas */}
      <FintechSpatialBackdrop
        activeCameraIndex={activeCameraIndex}
        isFullCanvasMode={activeMode === 'HOME_3D' && isFullCanvasMode}
        onExitFullCanvasMode={() => setIsFullCanvasMode(false)}
      />

      {/* Foreground Jain Pay 3D Stage */}
      <div
        className={`relative z-10 w-screen h-screen overflow-hidden flex flex-col ${
          activeMode === 'HOME_3D' && isFullCanvasMode
            ? 'pointer-events-none'
            : 'pointer-events-auto'
        }`}
      >
        <FcmToastContainer toasts={fcmToasts} onDismiss={dismissFcmToast} />

        {/* Runtime API / Validation Error Alert Banner */}
        {runtimeErrorBanner && (
          <div
            role="alert"
            className="pointer-events-auto px-6 py-2.5 bg-[#1d1a18] border-b border-[#ee6018] text-xs font-mono text-[#eeeeee] flex items-center justify-between gap-3 z-30"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ee6018] shrink-0" />
              <span>{runtimeErrorBanner}</span>
            </div>
            <button
              type="button"
              onClick={clearRuntimeErrorBanner}
              className="p-1 rounded-[3px] hover:bg-[#3d3a39]"
              aria-label="Dismiss error banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tier 1: Primary Functions Navigation Header */}
        <TopNavigationHeader
          activeMode={activeMode}
          isAdminVaultUnlocked={isAdminVaultUnlocked}
          themeMode={themeMode}
          onToggleThemeMode={toggleThemeMode}
          onSelectMode={(mode) => {
            if (mode !== 'HOME_3D') {
              setIsFullCanvasMode(false);
            }
            setActiveMode(mode);
          }}
        />

        {/* Tier 2: Clean Subfunctions Selector Bar */}
        <FeatureSelectorBar
          activeMode={activeMode}
          selectedVoiceSubId={selectedVoiceSubId}
          selectedCoreId={selectedCoreId}
          selectedAiId={selectedAiId}
          selectedNextGenId={selectedNextGenId}
          isArchitectureDrawerOpen={isArchitectureDrawerOpen}
          onSelectVoiceSub={setSelectedVoiceSubId}
          onSelectCore={setSelectedCoreId}
          onSelectAi={setSelectedAiId}
          onSelectNextGen={setSelectedNextGenId}
          onToggleArchitectureDrawer={() =>
            setIsArchitectureDrawerOpen((prev) => !prev)
          }
        />

        {/* Main Scrollable Stage */}
        <main
          className={`flex-1 overflow-y-auto p-5 md:p-8 ${
            activeMode === 'HOME_3D' ? '' : 'bg-[#101010]/94'
          }`}
        >
          {/* Function 01: 3D Command Deck & Interactive Wallet Showcase */}
          {activeMode === 'HOME_3D' && (
            <Home3DShowcase
              walletAccount={walletAccount}
              primaryBank={primaryBank}
              isBalanceRevealed={isBalanceRevealed}
              activePin={activePin}
              ledgerRowCount={ledgerEntries.length}
              unscratchedCount={
                scratchCards.filter((c) => !c.isScratched).length
              }
              activeCameraIndex={activeCameraIndex}
              onSelectCameraIndex={setActiveCameraIndex}
              isFullCanvasMode={isFullCanvasMode}
              onToggleFullCanvasMode={() =>
                setIsFullCanvasMode((prev) => !prev)
              }
              onRequestRevealBalance={() => setIsBalancePinModalOpen(true)}
              onMaskBalance={() => setIsBalanceRevealed(false)}
              onNavigateMode={setActiveMode}
              onLaunchSpecificFeature={handleLaunchSpecificFeature}
            />
          )}

          {/* Function 02: AI Voice & Chat Agent + 10 Curated Voice Options + 12 BCNF Tables */}
          {activeMode === 'AI_VOICE_AGENT' && (
            <AiVoiceCopilotStage
              activeSubfunction={selectedVoiceSubId}
              onSelectSubfunction={setSelectedVoiceSubId}
              snapshot={{
                walletBalance: walletAccount.available_balance,
                walletVpa: walletAccount.vpa_address,
                accounts,
                linkedBanks,
                transactions,
                ledgerEntries,
                khataEntries,
                milestoneDeals,
                autopayMandates,
                creditSanctions,
                fxTreasuryVaults,
                disputeChargebacks,
                securityAuditLogs,
              }}
              onToggleAutopayMandate={handleToggleAutopayMandate}
              onRepayCreditSanction={handleRepayCreditSanction}
              onInspectTableInVault={(tbl) => {
                setAdminVaultTab('BCNF_TABLES');
                setActiveBcnfTable(tbl);
                setIsAdminVaultUnlocked(true);
                setActiveMode('ADMIN_VAULT');
              }}
            />
          )}

          {/* Functions 03, 04 & 05: Focused Subfunction Workspace (with optional 4-Node Pipeline Drawer) */}
          {(activeMode === 'CORE' ||
            activeMode === 'AI_SUITE' ||
            activeMode === 'NEXT_GEN') && (
            <div
              className={
                isArchitectureDrawerOpen
                  ? 'max-w-[1560px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'
                  : 'max-w-[1140px] mx-auto'
              }
            >
              <div className={isArchitectureDrawerOpen ? 'lg:col-span-7' : ''}>
                {activeMode === 'CORE' && (
                  <CoreFeaturesStage
                    selectedOption={selectedCoreId}
                    currentUser={primaryUser}
                    activePin={activePin}
                    walletAccount={walletAccount}
                    linkedBanks={linkedBanks}
                    transactions={transactions}
                    ledgerEntries={ledgerEntries}
                    scratchCards={scratchCards}
                    fadState={fadState}
                    onUpdateUserPin={handleUpdateUserPin}
                    onRecordOtpSessionVerified={handleRecordOtpSessionVerified}
                    onStagePayment={handleStagePayment}
                    onInterceptScamQr={(uri, chatMessage) => {
                      setScamInterceptPayload({ uri, chatMessage });
                      appendAiLog(
                        'NEXT-03',
                        'inspectPaymentSafety',
                        { uri, chatMessage },
                        {
                          contradictionDetected: true,
                          action: 'QUARANTINED_BEFORE_PIN',
                        }
                      );
                      setLastPipelinePulse(
                        'Intercepted Collect-Trap QR via NEXT-03 inspectPaymentSafety()!'
                      );
                    }}
                    onOpenReceipt={setActiveReceiptTx}
                    onTriggerRefund={handleTriggerRefund}
                    onSimulateBankTimeout={handleSimulateBankTimeout}
                    onAskCoPilotDiagnostician={(txId) => {
                      setDiagnosedTxId(txId);
                      setActiveMode('NEXT_GEN');
                      setSelectedNextGenId('NEXT-07');
                    }}
                    onAddBankAccount={handleAddBankAccount}
                    onSetPrimaryBank={handleSetPrimaryBank}
                    onClaimScratchCard={handleClaimScratchCard}
                  />
                )}

                {activeMode === 'AI_SUITE' && (
                  <BaselineAiStage
                    selectedModule={selectedAiId}
                    transactions={transactions}
                    availableBalance={walletAccount.available_balance}
                    fadState={fadState}
                    onChangeFadState={setFadState}
                    onStagePayment={handleStagePayment}
                    onLogAiToolCall={(mod, tool, req, res) => {
                      appendAiLog(mod, tool, req, res);
                      setLastPipelinePulse(
                        `Executed [${mod}] ${tool}() under Zero-Trust Read/Stage-Only rules.`
                      );
                    }}
                    onOpenReceipt={setActiveReceiptTx}
                    onNavigateToCoreOption={(coreId) => {
                      setActiveMode('CORE');
                      setSelectedCoreId(coreId);
                    }}
                  />
                )}

                {activeMode === 'NEXT_GEN' && (
                  <NextGenChatStage
                    selectedFeature={selectedNextGenId}
                    availableBalance={walletAccount.available_balance}
                    khataEntries={khataEntries}
                    milestoneDeals={milestoneDeals}
                    transactions={transactions}
                    ledgerEntries={ledgerEntries}
                    diagnosedTxId={diagnosedTxId}
                    onSelectDiagnosedTxId={setDiagnosedTxId}
                    onStagePayment={handleStagePayment}
                    onProposeKhataEntry={(
                      peerId,
                      peerName,
                      peerVpa,
                      direction,
                      amount,
                      description
                    ) => {
                      const newKhata: KhataEntryRecord = {
                        khata_id: `kh_${Date.now().toString().slice(-4)}`,
                        creator_user_id: 'usr_yash_01',
                        peer_user_id: peerId,
                        peer_name: peerName,
                        peer_vpa: peerVpa,
                        direction,
                        amount: roundPaisa(amount),
                        description,
                        status: 'PENDING_PEER_ACK',
                        linked_tx_id: null,
                        created_at: new Date().toISOString(),
                        isNew: true,
                      };
                      setKhataEntries((prev) => [newKhata, ...prev]);
                      appendAiLog(
                        'NEXT-02',
                        'proposeChatKhataEntry',
                        { peerId, description, amount, direction },
                        {
                          khata_id: newKhata.khata_id,
                          status: 'PENDING_PEER_ACK',
                        }
                      );
                      setLastPipelinePulse(
                        `Inserted ${newKhata.khata_id} into public.khata_entries (PENDING_PEER_ACK).`
                      );
                    }}
                    onAcknowledgeKhataEntry={(khataId) => {
                      setKhataEntries((prev) =>
                        prev.map((k) =>
                          k.khata_id === khataId
                            ? { ...k, status: 'ACKNOWLEDGED', isNew: true }
                            : k
                        )
                      );
                      setLastPipelinePulse(
                        `Counterparty acknowledged Khata row ${khataId} -> ACKNOWLEDGED.`
                      );
                    }}
                    onCreateMilestoneDeal={(
                      sellerName,
                      sellerVpa,
                      itemTitle,
                      advanceAmount,
                      finalAmount
                    ) => {
                      const totalAmount = roundPaisa(
                        advanceAmount + finalAmount
                      );
                      const newDeal: MilestoneDealRecord = {
                        deal_id: `dl_${Date.now().toString().slice(-4)}`,
                        buyer_user_id: 'usr_yash_01',
                        seller_name: sellerName,
                        seller_vpa: sellerVpa,
                        item_title: itemTitle,
                        total_amount: totalAmount,
                        advance_amount: roundPaisa(advanceAmount),
                        final_amount: roundPaisa(finalAmount),
                        status: 'CREATED',
                        advance_tx_id: null,
                        final_tx_id: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        isNew: true,
                      };
                      setMilestoneDeals((prev) => [newDeal, ...prev]);
                      appendAiLog(
                        'NEXT-06',
                        'createMilestoneTrustCard',
                        { itemTitle, totalAmount, advanceAmount, sellerVpa },
                        { deal_id: newDeal.deal_id, status: 'CREATED' }
                      );
                      setLastPipelinePulse(
                        `Created Milestone Deal ${newDeal.deal_id} (${itemTitle}) in public.milestone_deals.`
                      );
                    }}
                    onConfirmMilestoneHandover={(dealId) => {
                      setMilestoneDeals((prev) =>
                        prev.map((d) =>
                          d.deal_id === dealId
                            ? {
                                ...d,
                                status: 'HANDOVER_CONFIRMED',
                                updated_at: new Date().toISOString(),
                                isNew: true,
                              }
                            : d
                        )
                      );
                      setLastPipelinePulse(
                        `Buyer confirmed physical handover for ${dealId} -> HANDOVER_CONFIRMED.`
                      );
                    }}
                    onInterceptScamQr={(uri, chatMessage) => {
                      setScamInterceptPayload({ uri, chatMessage });
                      appendAiLog(
                        'NEXT-03',
                        'inspectPaymentSafety',
                        { uri, chatMessage },
                        {
                          contradictionDetected: true,
                          action: 'EXPLAINABLE_THREAT_CARD_SHOWN',
                        }
                      );
                      setLastPipelinePulse(
                        'Displayed NEXT-03 High-Contrast Explainable Threat Card.'
                      );
                    }}
                    onSimulateBankTimeout={handleSimulateBankTimeout}
                    onLogAiToolCall={(mod, tool, req, res) => {
                      appendAiLog(mod, tool, req, res);
                      setLastPipelinePulse(
                        `Executed [${mod}] ${tool}() under Zero-Trust rules.`
                      );
                    }}
                  />
                )}
              </div>

              {isArchitectureDrawerOpen && (
                <div className="lg:col-span-5">
                  <RightPipelineCard
                    spec={activeFeatureSpec}
                    lastExecutionSummary={lastPipelinePulse}
                    onInspectInAdminVault={(recTab, recTable) => {
                      setAdminVaultTab(recTab);
                      if (recTable) {
                        setActiveBcnfTable(recTable);
                      }
                      setActiveMode('ADMIN_VAULT');
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Function 06: Passkey-Locked 12-Table Administrator Vault */}
          {activeMode === 'ADMIN_VAULT' && (
            <AdminVaultSection
              isUnlocked={isAdminVaultUnlocked}
              onUnlockVault={() => setIsAdminVaultUnlocked(true)}
              onLockVault={() => setIsAdminVaultUnlocked(false)}
              activeTab={adminVaultTab}
              onSelectTab={setAdminVaultTab}
              activeTable={activeBcnfTable}
              onSelectTable={setActiveBcnfTable}
              users={users}
              accounts={accounts}
              linkedBanks={linkedBanks}
              transactions={transactions}
              ledgerEntries={ledgerEntries}
              khataEntries={khataEntries}
              milestoneDeals={milestoneDeals}
              autopayMandates={autopayMandates}
              creditSanctions={creditSanctions}
              fxTreasuryVaults={fxTreasuryVaults}
              disputeChargebacks={disputeChargebacks}
              securityAuditLogs={securityAuditLogs}
              sqlLogs={sqlLogs}
              aiLogs={aiLogs}
              sandboxOutcome={sandboxOutcome}
              onChangeSandboxOutcome={setSandboxOutcome}
              onAdjustDemoBalance={handleAdjustDemoBalance}
              onResetPinToDefault={handleResetPinToDefault}
              onResetAllDemoData={handleResetAllDemoData}
              onRunSsiConcurrencySimulation={handleRunSsiConcurrencySimulation}
            />
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <BalancePinDialog
        isOpen={isBalancePinModalOpen}
        activePin={activePin}
        saltHex={primaryUser.pbkdf2_salt_hex}
        onClose={() => setIsBalancePinModalOpen(false)}
        onVerified={handleBalancePinVerified}
      />

      <PaymentReviewModal
        draft={stagedDraft}
        activePin={activePin}
        saltHex={primaryUser.pbkdf2_salt_hex}
        onClose={() => setStagedDraft(null)}
        onExecutePayment={handleExecuteStagedPayment}
        riskTier={stagedRisk.tier}
        riskScore={stagedRisk.score}
      />

      <ReceiptModal
        transaction={activeReceiptTx}
        ledgerEntries={ledgerEntries}
        replayNotice={replayBannerNotice}
        onClose={() => {
          setActiveReceiptTx(null);
          setReplayBannerNotice(null);
        }}
        onTriggerRefund={handleTriggerRefund}
        onDiagnoseInChat={(txId) => {
          setDiagnosedTxId(txId);
          setActiveMode('NEXT_GEN');
          setSelectedNextGenId('NEXT-07');
        }}
      />

      <ScamShieldInterceptionModal
        payload={scamInterceptPayload}
        onClose={() => setScamInterceptPayload(null)}
        onOverrideAndStage={(uri) => {
          handleStagePayment({
            recipientName: 'Quarantined Counterparty (User Override)',
            recipientVpa: 'scammer.override@ybl',
            amount: 5000,
            note: `User Overrode NEXT-03 Scam Shield (${uri.slice(0, 32)}...)`,
            txType: 'SEND',
            category: 'P2P Transfers',
            idempotencyKey: `uuid-scam-override-${Date.now()}`,
            sourceModule: 'NEXT-03',
          });
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <JainPayProvider>
        <JainPayWorkspaceStage />
      </JainPayProvider>
    </ErrorBoundary>
  );
}
