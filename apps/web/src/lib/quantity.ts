/**
 * Shared quantity clamping & validation utilities for ProductDetailPage and CartPage.
 * Keeps frontend draft input normalization consistent while server inventory checks remain authoritative.
 */

export function normalizeStockLimit(stockQuantity: number | null | undefined): number {
  const numeric = Number(stockQuantity ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.floor(numeric);
}

/**
 * Clamp a numeric quantity safely inside [1, stockQuantity] (or 1 when stockQuantity <= 0).
 */
export function clampQuantity(value: number, stockQuantity: number | null | undefined): number {
  const maxStock = normalizeStockLimit(stockQuantity);
  if (maxStock <= 0) {
    return 1;
  }
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 1;
  }
  const intVal = Math.trunc(value);
  return Math.min(maxStock, Math.max(1, intVal));
}

/**
 * Resolve a user-typed quantity draft on blur / Enter / submit.
 * - Empty or non-numeric draft restores clamped fallbackQuantity.
 * - Zero or negative numeric entries normalize to 1.
 * - Values exceeding stockQuantity clamp down to stockQuantity.
 */
export function resolveCommittedQuantity(
  rawDraft: string,
  stockQuantity: number | null | undefined,
  fallbackQuantity = 1,
): number {
  const trimmed = rawDraft.trim();
  if (!trimmed) {
    return clampQuantity(fallbackQuantity, stockQuantity);
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return clampQuantity(fallbackQuantity, stockQuantity);
  }
  const intVal = Math.trunc(parsed);
  if (intVal <= 0) {
    return 1;
  }
  return clampQuantity(intVal, stockQuantity);
}

/**
 * Extract human-readable error message from Axios or standard Error instances.
 */
export function extractQuantityErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { error?: { message?: string }; message?: string } };
      message?: string;
    };
    const apiMessage =
      maybeAxios.response?.data?.error?.message || maybeAxios.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    if (typeof maybeAxios.message === 'string' && maybeAxios.message.trim().length > 0) {
      return maybeAxios.message;
    }
  }
  return fallbackMessage;
}
