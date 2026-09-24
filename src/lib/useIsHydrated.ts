'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` during SSR and the first client render, `true` afterwards.
 *
 * Components that read persisted zustand state (cart, wishlist, auth) need this
 * so server and client markup agree. Prefer it over the `useState` +
 * `useEffect(() => setMounted(true))` pattern, which triggers a cascading
 * re-render and is flagged by `react-hooks/set-state-in-effect`.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
