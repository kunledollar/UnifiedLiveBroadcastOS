'use client';

import { useEffect, useRef } from 'react';

type ForensicsState = {
  enabled?: boolean;
  renders: Record<string, number>;
  stateWrites: Record<string, { total: number; semantic: number; noop: number; reference: number }>;
};

declare global {
  interface Window { __UBOS_RENDER_FORENSICS__?: ForensicsState; __UBOS_RENDER_FORENSICS_FLAGS__?: Record<string, boolean>; __UBOS_CONTROL_ROOM_DIAGNOSTICS__?: ForensicsState; }
}

function getState(): ForensicsState | null {
  if (typeof window === 'undefined') return null;
  const state = window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__ ?? window.__UBOS_RENDER_FORENSICS__;
  if (!state?.enabled) return null;
  state.renders ??= {};
  state.stateWrites ??= {};
  return state;
}

export function ubosForensicsFlag(name: string) {
  if (typeof window === 'undefined') return false;
  const query = new URLSearchParams(window.location.search);
  const aliases: Record<string, string> = { 'mixer-disabled': 'disableAudio', 'audio-meter-disabled': 'disableAudio', 'recording-poll-disabled': 'disableRecording', 'scene-reconciliation-disabled': 'disableScenes' };
  return Boolean(window.__UBOS_RENDER_FORENSICS_FLAGS__?.[name] || query.get(name) === '1' || query.get(aliases[name] ?? '') === '1' || window.localStorage.getItem(`ubos:render-forensics:${name}`) === '1');
}

export function useRenderForensics(component: string) {
  const lastRender = useRef(0);
  const state = getState();
  if (state) state.renders[component] = (state.renders[component] ?? 0) + 1;
  useEffect(() => { lastRender.current = performance.now(); });
}

export function recordForensicsStateWrite(name: string, previous: unknown, next: unknown) {
  const state = getState();
  if (!state) return;
  const bucket = (state.stateWrites[name] ??= { total: 0, semantic: 0, noop: 0, reference: 0 });
  bucket.total += 1;
  if (Object.is(previous, next)) bucket.noop += 1;
  else {
    bucket.reference += typeof previous === 'object' && typeof next === 'object' ? 1 : 0;
    bucket.semantic += JSON.stringify(previous) === JSON.stringify(next) ? 0 : 1;
  }
}
