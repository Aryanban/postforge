import { useEffect, useState } from 'react';
import { api, OFFLINE_STATUS, type BackendStatus } from '../lib/api/client';

/**
 * Tracks backend availability, re-checking on mount and every 30s. The app
 * stays fully usable when the backend is offline (native-intent fallback).
 */
export function useBackend(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>(OFFLINE_STATUS);

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

  return status;
}
