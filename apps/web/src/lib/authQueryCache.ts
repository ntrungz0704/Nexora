import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

/**
 * Canonical allow-list of private / account-scoped TanStack Query key prefixes.
 *
 * Public catalog, product, review listing, banner, brand, post, and system health
 * query keys are intentionally EXCLUDED so public cache is preserved across
 * logout and account transitions.
 */
export const PRIVATE_QUERY_KEY_PREFIXES = [
  'cart',
  'wishlist',
  'wishlist-count',
  'profile',
  'my-orders',
  'customer-addresses',
  'notifications',
  'customer-returns',
  'customer-return-detail',
  'review-eligibility',
  'admin-data',
  'admin-brands',
  'admin-coupons',
  'admin-flash-sales',
  'admin-banners',
  'admin-posts',
  'admin-users',
  'admin-reviews',
] as const;

export type PrivateQueryKeyPrefix = (typeof PRIVATE_QUERY_KEY_PREFIXES)[number];

/**
 * localStorage keys that represent authenticated identity across browser tabs.
 */
export const AUTH_STORAGE_KEYS: ReadonlySet<string> = new Set(['nexora_token', 'nexora_user']);

export type AuthSessionEventType = 'LOGOUT' | 'LOGIN' | 'REGISTER' | 'SESSION_CHANGED';

export interface AuthSessionChangeEvent {
  type: AuthSessionEventType;
  previousUserId: number | null;
  nextUserId: number | null;
}

export type AuthSessionChangeListener = (event: AuthSessionChangeEvent) => void;

const sessionListeners = new Set<AuthSessionChangeListener>();

interface QueryClientBindingEntry {
  refCount: number;
  unsubscribe: () => void;
}

/**
 * Reference-counted WeakMap binding per QueryClient instance.
 * Guarantees:
 * - Zero duplicate auth listeners even when both AppProviders and StorefrontHeader mount.
 * - Unmounting a child (e.g. StorefrontHeader) never unbinds a still-mounted AppProviders root.
 * - Automatic cleanup when all bindings for a QueryClient release (preventing test leaks).
 */
const boundQueryClients = new WeakMap<QueryClient, QueryClientBindingEntry>();

/**
 * Cancels all in-flight private queries and synchronously removes all private
 * cached entries from QueryClient without touching public catalog/content caches
 * or modifying guest cart storage/backend state.
 */
export function clearPrivateQueryCache(queryClient: QueryClient): void {
  for (const prefix of PRIVATE_QUERY_KEY_PREFIXES) {
    // 1. Synchronously cancel in-flight fetch retryers so late responses from the
    //    previous session cannot resolve and re-populate cache after logout/switch.
    void queryClient.cancelQueries({ queryKey: [prefix] }, { silent: true });
    // 2. Synchronously detach and delete matching private queries from QueryCache
    //    to eliminate stale-while-revalidate exposure across accounts.
    queryClient.removeQueries({ queryKey: [prefix] });
  }
}

/**
 * Subscribes a listener to auth session transition events.
 * Returns an idempotent unsubscribe function.
 */
export function subscribeAuthSessionChange(listener: AuthSessionChangeListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

/**
 * Emits an auth session change event synchronously to all active subscribers.
 */
export function emitAuthSessionChange(event: AuthSessionChangeEvent): void {
  for (const listener of Array.from(sessionListeners)) {
    listener(event);
  }
}

/**
 * Binds a QueryClient instance to auth session events with reference-counted deduplication.
 * Calling bind multiple times for the same QueryClient registers only ONE listener.
 */
export function bindQueryClientToAuthEvents(queryClient: QueryClient): () => void {
  const existing = boundQueryClients.get(queryClient);
  if (existing) {
    existing.refCount += 1;
  } else {
    const unsubscribe = subscribeAuthSessionChange(() => {
      clearPrivateQueryCache(queryClient);
    });
    boundQueryClients.set(queryClient, { refCount: 1, unsubscribe });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    const current = boundQueryClients.get(queryClient);
    if (!current) return;

    current.refCount -= 1;
    if (current.refCount <= 0) {
      current.unsubscribe();
      boundQueryClients.delete(queryClient);
    }
  };
}

/**
 * Handles cross-tab browser `storage` events safely:
 * - Reacts ONLY to auth storage keys (`nexora_token`, `nexora_user`) or full `localStorage.clear()` (`key === null`).
 * - Ignores no-op writes (`oldValue === newValue`) and unrelated keys.
 * - Never writes back to localStorage, preventing cross-tab event loops.
 */
export function handleCrossTabAuthStorageEvent(
  event: Pick<StorageEvent, 'key' | 'oldValue' | 'newValue'>,
  queryClient: QueryClient,
): boolean {
  if (event.key !== null && !AUTH_STORAGE_KEYS.has(event.key)) {
    return false;
  }
  if (event.key !== null && event.oldValue === event.newValue) {
    return false;
  }

  clearPrivateQueryCache(queryClient);
  return true;
}

/**
 * React hook that binds the nearest QueryClientProvider's QueryClient to auth session events.
 * Idempotent when nested inside AppProviders thanks to WeakMap reference counting, while also
 * protecting isolated test/render trees that mount QueryClientProvider directly.
 */
export function useAuthQueryCacheSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return bindQueryClientToAuthEvents(queryClient);
  }, [queryClient]);
}

/**
 * Diagnostic helper (primarily for regression tests) to inspect active subscriber count.
 */
export function getAuthSessionListenerCount(): number {
  return sessionListeners.size;
}
