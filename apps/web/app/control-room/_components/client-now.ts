'use client';

import { useEffect, useState } from 'react';

export function useClientNow(intervalMs?: number) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    if (!intervalMs) return undefined;
    const interval = window.setInterval(update, intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);

  return now;
}

export function formatRelativeAge(iso: string, now: number | null): string {
  if (now === null) return '—';
  const deltaMs = now - Date.parse(iso);
  if (!Number.isFinite(deltaMs)) return 'unavailable';
  const seconds = Math.floor(Math.abs(deltaMs) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}
