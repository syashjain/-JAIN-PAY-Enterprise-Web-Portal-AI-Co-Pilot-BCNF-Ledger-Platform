/**
 * @file src/config/envConfig.ts
 * @description Centralized environment configuration, cryptographic parameters,
 * PostgreSQL 16.4+ / PgBouncer / HikariCP infrastructure settings, and
 * corporate Fintech 3D Spatial Mesh tokens.
 */

const metaEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, string | boolean | undefined>)
    : {};

export const ENV_CONFIG = {
  /** Application runtime metadata */
  app: {
    name: 'JAIN PAY — 3D Architecture & AI Showcase',
    subtitle: '3D Fintech Spatial Mesh • Zero-Trust AI • PostgreSQL 16+ BCNF',
    apiBaseUrl: String(metaEnv.VITE_API_BASE_URL || '/api/v1'),
    isSandboxDemoMode: metaEnv.VITE_SANDBOX_DEMO_MODE !== 'false',
  },

  /** Zero-Trust Cryptographic & Rate-Limiting Thresholds */
  security: {
    defaultDemoPin: '1234',
    defaultSaltHex: '9f8e7d6c5b4a39281726354455667788',
    evaluatorAdminPasskey: 'ADMIN-2026',
    pbkdf2Iterations: 10000,
    pbkdf2Algorithm: 'PBKDF2-HMAC-SHA256',
    pinMaxFailedAttempts: 3,
    pinLockoutDurationMs: 30_000,
    defaultRlsTenantId: 'usr_yash_01',
    defaultWalletAccountId: 'acc_yash_wallet',
    defaultSettlementAccountId: 'acc_npci_settlement',
    defaultTreasuryAccountId: 'acc_rewards_treasury',
  },

  /** PostgreSQL 16.4+ Cluster, PgBouncer & HikariCP Sizing Configuration */
  database: {
    engineVersion: 'PostgreSQL 16.4+',
    defaultIsolationLevel: 'SERIALIZABLE' as const,
    pgBouncerPort: 6432,
    pgBouncerPoolMode: 'transaction' as const,
    hikariCpFormula: 'connections = (core_count * 2) + effective_spindle_count',
    hikariCpMaxPoolSize: 17, // 8 vCPU * 2 + 1 NVMe spindle
  },

  /** Custom Minimalist Corporate Fintech 3D Spatial Canvas Configuration */
  fintech3D: {
    voidBackgroundHex: '#050507',
    primaryColor: '#FF5E00',
    amberColor: '#FF8800',
    platinumColor: '#D4D4D8',
    nodeCount: 40,
    gridColumns: 24,
    gridRows: 16,
  },
} as const;
