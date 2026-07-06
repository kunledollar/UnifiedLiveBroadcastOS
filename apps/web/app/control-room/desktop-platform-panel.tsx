'use client';

import {
  createAutoUpdateStatus,
  defaultDesktopSettings,
  normalizeDesktopSettings,
} from '@ubos/shared';
import { useMemo } from 'react';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function DesktopPlatformPanel() {
  const isDesktopShell = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
  const settings = useMemo(() => normalizeDesktopSettings(defaultDesktopSettings), []);
  const updateStatus = useMemo(() => createAutoUpdateStatus(settings), [settings]);

  return (
    <section className="pointer-events-none absolute right-4 top-4 z-50 rounded-xl border border-cyan-400/30 bg-slate-950/80 px-4 py-3 text-xs text-slate-200 shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <p className="font-semibold text-cyan-200">Native Desktop Platform</p>
      <p>{isDesktopShell ? 'Hosted by Tauri shell' : 'Web mode; Tauri bridge idle'}</p>
      <p>
        Settings: {settings.theme} theme · updates {updateStatus.channel}
      </p>
    </section>
  );
}
