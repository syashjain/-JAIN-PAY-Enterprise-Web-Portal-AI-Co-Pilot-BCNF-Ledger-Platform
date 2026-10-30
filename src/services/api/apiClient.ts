/**
 * @file src/services/api/apiClient.ts
 * @description Scalable RPC / REST API envelope, standardized error handling,
 * and idempotent request wrapper for Jain Pay financial & AI co-pilot operations.
 */

import { ENV_CONFIG } from '../../config/envConfig';

export type ApiErrorCode =
  | 'AUTH_PIN_MISMATCH_403'
  | 'RATE_LIMIT_LOCKED_429'
  | 'BOLA_IDOR_VIOLATION_403'
  | 'INSUFFICIENT_FUNDS_422'
  | 'SSI_SERIALIZATION_FAILURE_40001'
  | 'NPCI_GATEWAY_TIMEOUT_504'
  | 'DOWNSTREAM_SWITCH_DECLINE_503'
  | 'VALIDATION_ERROR_400'
  | 'INTERNAL_ENGINE_ERROR_500';

export interface ApiMetadata {
  requestId: string;
  idempotencyKey?: string;
  rlsTenantId: string;
  timestamp: string;
  executionMs: number;
}

export interface ApiSuccessResult<TData> {
  ok: true;
  data: TData;
  meta: ApiMetadata;
}

export interface ApiErrorResult {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    remediationHint?: string;
  };
  meta: ApiMetadata;
}

export type ApiResult<TData> = ApiSuccessResult<TData> | ApiErrorResult;

/**
 * Executes a synchronous or asynchronous domain operation inside a standardized
 * API boundary with structured error catching, latency measurement, and RLS metadata.
 */
export function executeWithApiEnvelope<TData>(
  operationName: string,
  fn: () => TData,
  options?: {
    idempotencyKey?: string;
    rlsTenantId?: string;
  }
): ApiResult<TData> {
  const startMs = performance.now();
  const meta: ApiMetadata = {
    requestId: `req_${operationName}_${Date.now().toString(36)}`,
    idempotencyKey: options?.idempotencyKey,
    rlsTenantId: options?.rlsTenantId || ENV_CONFIG.security.defaultRlsTenantId,
    timestamp: new Date().toISOString(),
    executionMs: 0,
  };

  try {
    const data = fn();
    meta.executionMs = Math.max(1, Math.round(performance.now() - startMs));
    return {
      ok: true,
      data,
      meta,
    };
  } catch (err) {
    meta.executionMs = Math.max(1, Math.round(performance.now() - startMs));
    const message =
      err instanceof Error
        ? err.message
        : 'Unexpected engine fault during transaction execution.';
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ENGINE_ERROR_500',
        message,
        remediationHint:
          'Verify BCNF account state invariants or reset demo seed data in the Administrator Vault.',
      },
      meta,
    };
  }
}
