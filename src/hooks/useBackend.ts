import { useEffect, useState } from 'react';
import { api, OFFLINE_STATUS, type BackendStatus } from '../lib/api/client';

/**
 * Tracks backend availability, re-checking on mount and every 30s. The app
 * stays fully usable when the backend is offline (native-intent fallback).
 */
export interface BackendState extends BackendStatus {
  /** True until the first health check resolves (or times out). */
  checking: boolean;
}

export function useBackend(): BackendState {
  // Starts indeterminate rather than OFFLINE so the status pill does not flash
  // "offline" on first paint when the backend is actually up.
  const [status, setStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    let active = true;
    const check = () =>
      api.health().then(s => {
        if (active) setStatus(s);
      });
    void check();
    const id = setInterval(check, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return { ...OFFLINE_STATUS, ...status, checking: status === null };
}
