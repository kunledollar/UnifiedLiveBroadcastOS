'use client';
import { useEffect, useMemo, useState } from 'react';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';

export type StreamingLifecycleState = 'idle' | 'preparing' | 'connecting' | 'streaming' | 'reconnecting' | 'stopped' | 'failed';
export type StreamingPlatformPreset = 'YouTube' | 'Twitch' | 'Facebook' | 'LinkedIn' | 'Custom RTMP';
export type StreamingDestinationConfig = { id: string; platform: StreamingPlatformPreset; rtmpUrl: string; streamKey: string; enabled: boolean; resolution: string; bitrateKbps: number; audioBitrateKbps: number };
export type StreamingHistoryEntry = { platform: StreamingPlatformPreset; startedAt: string; stoppedAt: string; durationMs: number; state: StreamingLifecycleState; failureReason: string | null };
export type BrowserStreamingPanelState = { lifecycle: StreamingLifecycleState; destination: StreamingDestinationConfig; durationMs: number; startedAt: string | null; stoppedAt: string | null; bitrateEstimateKbps: number; droppedFrameEstimate: number; error: string | null; history: StreamingHistoryEntry[]; browserOnly: boolean; adapters: string[] };
export type StreamingPanelAction =
  | { type: 'updateDestination'; patch: Partial<StreamingDestinationConfig> }
  | { type: 'start' }
  | { type: 'stop' };

export const platformPresets: StreamingPlatformPreset[] = ['YouTube', 'Twitch', 'Facebook', 'LinkedIn', 'Custom RTMP'];

function badgeForState(state: StreamingLifecycleState) {
  if (state === 'streaming') return 'success' as const;
  if (state === 'failed') return 'error' as const;
  if (state === 'preparing' || state === 'connecting' || state === 'reconnecting') return 'warning' as const;
  return 'neutral' as const;
}
function formatDuration(durationMs: number) { const s = Math.floor(durationMs / 1000); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`; }
function maskStreamKey(key: string) { if (!key) return 'Not set'; return key.length <= 4 ? '••••' : `${'•'.repeat(Math.max(8, key.length - 4))}${key.slice(-4)}`; }

export function StreamingRuntimePanel({ state, dispatch }: { state: BrowserStreamingPanelState; dispatch: (action: StreamingPanelAction) => void }) {
  const missingRuntimeReason = 'Real output is unavailable until the server-side native media host reports FFmpeg/FFprobe available, Program media present, valid Custom RTMP/RTMPS destination, and a secret reference.';
  return <div className="space-y-ubos-2">
    <BroadcastPanel>
      <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-semibold">Program Streaming</h3><StatusBadge variant={badgeForState(state.lifecycle)}>{state.lifecycle}</StatusBadge></div>
      <p className="mb-3 rounded-ubos-sm border border-amber-400/40 bg-amber-400/10 p-2 text-ubos-caption text-amber-100">Output controls are disabled unless the server-side native media host is healthy. This panel stores destination metadata only; Custom RTMP/RTMPS transmission requires FFmpeg, FFprobe, Program media, a valid destination, and a secret reference.</p>
      <div className="grid gap-2 text-sm">
        <label className="grid gap-1">Platform<select className="rounded-ubos-sm bg-ubos-midnight p-2" value={state.destination.platform} onChange={(event) => dispatch({ type: 'updateDestination', patch: { platform: event.target.value as StreamingPlatformPreset } })}>{platformPresets.map((preset) => <option key={preset}>{preset}</option>)}</select></label>
        <label className="grid gap-1">RTMP server URL<input className="rounded-ubos-sm bg-ubos-midnight p-2" placeholder="rtmps://example/live" value={state.destination.rtmpUrl} onChange={(event) => dispatch({ type: 'updateDestination', patch: { rtmpUrl: event.target.value } })} /></label>
        <label className="grid gap-1">Stream key<input className="rounded-ubos-sm bg-ubos-midnight p-2" type="password" placeholder="Stream key is masked" value={state.destination.streamKey} onChange={(event) => dispatch({ type: 'updateDestination', patch: { streamKey: event.target.value } })} /></label>
        <div className="text-ubos-caption text-ubos-fg-muted">Masked key preview: {maskStreamKey(state.destination.streamKey)}</div>
        <div className="grid grid-cols-3 gap-2">
          <label className="grid gap-1">Resolution<input className="rounded-ubos-sm bg-ubos-midnight p-2" value={state.destination.resolution} onChange={(event) => dispatch({ type: 'updateDestination', patch: { resolution: event.target.value } })} /></label>
          <label className="grid gap-1">Bitrate<input className="rounded-ubos-sm bg-ubos-midnight p-2" type="number" value={state.destination.bitrateKbps} onChange={(event) => dispatch({ type: 'updateDestination', patch: { bitrateKbps: Number(event.target.value) } })} /></label>
          <label className="grid gap-1">Audio<input className="rounded-ubos-sm bg-ubos-midnight p-2" type="number" value={state.destination.audioBitrateKbps} onChange={(event) => dispatch({ type: 'updateDestination', patch: { audioBitrateKbps: Number(event.target.value) } })} /></label>
        </div>
        <label className="flex items-center gap-2 text-ubos-caption"><input type="checkbox" checked={state.destination.enabled} onChange={(event) => dispatch({ type: 'updateDestination', patch: { enabled: event.target.checked } })} /> Destination enabled</label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2"><button className="rounded-ubos-sm bg-emerald-400 px-2 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled title={missingRuntimeReason} aria-disabled="true">Start Streaming</button><button className="rounded-ubos-sm bg-ubos-midnight px-2 py-2 text-xs font-black uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50" disabled title={missingRuntimeReason} aria-disabled="true">Stop Streaming</button></div><p className="mt-2 text-ubos-caption text-ubos-error-text">{missingRuntimeReason}</p>
      {state.error ? <p className="mt-2 text-ubos-caption text-ubos-error-text">{state.error}</p> : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><dt className="text-ubos-fg-muted">Timer</dt><dd>{formatDuration(state.durationMs)}</dd><dt className="text-ubos-fg-muted">Bitrate estimate</dt><dd>{state.bitrateEstimateKbps} kbps</dd><dt className="text-ubos-fg-muted">Dropped frames</dt><dd>{state.droppedFrameEstimate}</dd><dt className="text-ubos-fg-muted">Adapters</dt><dd>{state.adapters.length ? state.adapters.join(', ') : 'none connected'}</dd></dl>
    </BroadcastPanel>
    <BroadcastPanel><h3 className="mb-2 font-semibold">Streaming History Metadata</h3>{state.history.length ? <div className="space-y-2 text-ubos-caption">{state.history.map((item) => <div key={`${item.platform}:${item.startedAt}`} className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-2"><div className="font-bold">{item.platform} · {item.state}</div><div>{formatDuration(item.durationMs)} · {item.startedAt} → {item.stoppedAt}</div>{item.failureReason ? <div className="text-ubos-error-text">{item.failureReason}</div> : null}</div>)}</div> : <p className="text-ubos-caption text-ubos-fg-muted">No streaming history yet.</p>}</BroadcastPanel>
  </div>;
}
