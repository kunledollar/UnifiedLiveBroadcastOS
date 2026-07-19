'use client';

import { useEffect, useRef } from 'react';

type ChangeBucket = { changes: number; primitive: number; objectIdentity: number; functionIdentity: number; arrayIdentity: number; semantic: number };
type UpdateBucket = { calls: number; identityOnly: number; semantic: number; componentsInvalidated: string[]; location?: string };

type ForensicsState = {
  enabled?: boolean;
  renders: Record<string, number>;
  stateWrites: Record<string, { total: number; semantic: number; noop: number; reference: number }>;
  propChanges?: Record<string, Record<string, ChangeBucket>>;
  providerChanges?: Record<string, { changes: number; fields: Record<string, ChangeBucket> }>;
  stateUpdateSources?: Record<string, UpdateBucket>;
  subscriptionSources?: Record<string, UpdateBucket>;
  rafSources?: Record<string, UpdateBucket>;
};

declare global { interface Window { __UBOS_RENDER_FORENSICS__?: ForensicsState; } }

function getState(): ForensicsState | null {
  if (typeof window === 'undefined') return null;
  const state = (window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__ as unknown as ForensicsState | undefined) ?? window.__UBOS_RENDER_FORENSICS__;
  if (!state?.enabled) return null;
  state.renders ??= {};
  state.stateWrites ??= {};
  state.propChanges ??= {};
  state.providerChanges ??= {};
  state.stateUpdateSources ??= {};
  state.subscriptionSources ??= {};
  state.rafSources ??= {};
  return state;
}

export function ubosForensicsFlag(name: string) {
  if (typeof window === 'undefined') return false;
  const query = new URLSearchParams(window.location.search);
  const aliases: Record<string, string> = { 'mixer-disabled': 'disableAudio', 'audio-meter-disabled': 'disableAudio', 'recording-poll-disabled': 'disableRecording', 'scene-reconciliation-disabled': 'disableScenes' };
  return Boolean(window.__UBOS_RENDER_FORENSICS_FLAGS__?.[name] || query.get(name) === '1' || query.get(aliases[name] ?? '') === '1' || window.localStorage.getItem(`ubos:render-forensics:${name}`) === '1');
}

function semanticEqual(previous: unknown, next: unknown) {
  if (Object.is(previous, next)) return true;
  if (typeof previous !== 'object' || !previous || typeof next !== 'object' || !next) return false;
  try { return JSON.stringify(previous) === JSON.stringify(next); } catch { return false; }
}

function recordChange(bucket: ChangeBucket, previous: unknown, next: unknown) {
  bucket.changes += 1;
  if (Array.isArray(next)) bucket.arrayIdentity += 1;
  else if (typeof next === 'function') bucket.functionIdentity += 1;
  else if (typeof next === 'object' && next) bucket.objectIdentity += 1;
  else bucket.primitive += 1;
  if (!semanticEqual(previous, next)) bucket.semantic += 1;
}

/** Shallow props only: values are classified, never retained or printed. */
export function useRenderForensics(component: string, props?: Record<string, unknown>) {
  const lastRender = useRef(0);
  const previousProps = useRef<Record<string, unknown> | null>(null);
  const state = getState();
  if (state) state.renders[component] = (state.renders[component] ?? 0) + 1;
  if (state && props && previousProps.current) {
    const componentChanges = (state.propChanges![component] ??= {});
    for (const key of Object.keys(props)) {
      if (!Object.is(previousProps.current[key], props[key])) {
        recordChange((componentChanges[key] ??= { changes: 0, primitive: 0, objectIdentity: 0, functionIdentity: 0, arrayIdentity: 0, semantic: 0 }), previousProps.current[key], props[key]);
      }
    }
  }
  previousProps.current = props ?? null;
  useEffect(() => { lastRender.current = performance.now(); });
}

/** Records a named Context value without requiring the Context object itself. */
export function useProviderForensics(provider: string, value: Record<string, unknown>) {
  const previous = useRef<Record<string, unknown> | null>(null);
  const state = getState();
  if (state && previous.current && !Object.is(previous.current, value)) {
    const bucket = (state.providerChanges![provider] ??= { changes: 0, fields: {} });
    bucket.changes += 1;
    for (const key of Object.keys(value)) if (!Object.is(previous.current[key], value[key])) recordChange((bucket.fields[key] ??= { changes: 0, primitive: 0, objectIdentity: 0, functionIdentity: 0, arrayIdentity: 0, semantic: 0 }), previous.current[key], value[key]);
  }
  previous.current = value;
}

export function recordForensicsUpdate(source: string, previous: unknown, next: unknown, kind: 'state' | 'subscription' | 'raf' = 'state', component?: string) {
  const state = getState();
  if (!state) return;
  const target = kind === 'raf' ? state.rafSources! : kind === 'subscription' ? state.subscriptionSources! : state.stateUpdateSources!;
  const location = new Error().stack?.split('\n').slice(2, 4).join(' ← ');
  const bucket = (target[source] ??= { calls: 0, identityOnly: 0, semantic: 0, componentsInvalidated: [], ...(location ? { location } : {}) });
  bucket.calls += 1;
  if (semanticEqual(previous, next)) bucket.identityOnly += 1; else bucket.semantic += 1;
  if (component && !bucket.componentsInvalidated.includes(component)) bucket.componentsInvalidated.push(component);
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
