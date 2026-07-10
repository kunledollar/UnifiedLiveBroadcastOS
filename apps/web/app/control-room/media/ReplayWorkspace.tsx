'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReplayBufferMetadata, ReplayClip } from '@ubos/shared';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { MediaEmptyState } from './MediaEmptyState';
import { ReplayClipRow } from './ReplayClipRow';
import { formatDurationMs } from './media-utils';

const BUFFER_LENGTHS_MS = [15_000, 30_000, 60_000, 120_000] as const;
const INSTANT_REPLAY_WINDOWS_MS = [5_000, 10_000, 20_000, 30_000] as const;
const SPEEDS = [1, 0.75, 0.5, 0.25, 0.1] as const;

type RouteTarget = 'preview' | 'program' | 'both';
type TransitionType = 'CUT' | 'TAKE' | 'AUTO';
type PlaybackState = 'playing' | 'paused';

type RuntimeBufferFrame = { id: string; capturedAt: number; offsetMs: number };
type RuntimeRecording = { id: string; label: string; startedAt: string; codec: string; frameCount: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createRuntimeFrame(bufferLengthMs: number): RuntimeBufferFrame {
  const capturedAt = Date.now();
  return { id: `frame-${capturedAt}`, capturedAt, offsetMs: capturedAt % bufferLengthMs };
}

function buildExportMetadata(clip: ReplayClip | null, format: 'webm' | 'mp4' | 'png') {
  if (!clip) return 'Select a replay clip before exporting.';
  return JSON.stringify(
    {
      clipId: clip.id,
      name: clip.name,
      format,
      metadataOnly: true,
      runtimeMediaBlobIncluded: false,
      mp4Status: format === 'mp4' ? 'placeholder metadata; encoder integration pending' : 'ready',
    },
    null,
    2,
  );
}

export function ReplayWorkspace({
  replayBuffer,
  replayClips,
  selectedReplayClipId,
  onSelectReplayClip,
  onPreview,
  onSendToPreview,
  onTakeLive,
  onAddSampleClip,
  className,
}: {
  replayBuffer: ReplayBufferMetadata;
  replayClips: ReplayClip[];
  selectedReplayClipId?: string | null;
  onSelectReplayClip?: (clipId: string) => void;
  onPreview?: (clipId: string) => void;
  onSendToPreview?: (clipId: string) => void;
  onTakeLive?: (clipId: string) => void;
  onAddSampleClip?: () => void;
  className?: string;
}) {
  const selectedClip = replayClips.find((clip) => clip.id === selectedReplayClipId) ?? replayClips[0] ?? null;
  const [bufferLengthMs, setBufferLengthMs] = useState<number>(replayBuffer.durationMs ?? 30_000);
  const [runtimeFrames, setRuntimeFrames] = useState<RuntimeBufferFrame[]>([]);
  const [recording, setRecording] = useState<RuntimeRecording | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('paused');
  const [playheadMs, setPlayheadMs] = useState(0);
  const [markInMs, setMarkInMs] = useState(0);
  const [markOutMs, setMarkOutMs] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [loop, setLoop] = useState(false);
  const [playlistIds, setPlaylistIds] = useState<string[]>(() => replayClips.map((clip) => clip.id));
  const [playlistLoop, setPlaylistLoop] = useState(false);
  const [routeTarget, setRouteTarget] = useState<RouteTarget>('preview');
  const [transition, setTransition] = useState<TransitionType>('CUT');
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [exportLog, setExportLog] = useState('Exports are metadata manifests; runtime MediaRecorder blobs stay in memory only.');
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const selectedDuration = selectedClip?.durationMs ?? bufferLengthMs;
  const bufferLabel = replayBuffer.active
    ? `Buffer ready · ${formatDurationMs(bufferLengthMs)}`
    : replayBuffer.status === 'unavailable'
      ? 'Replay runtime unavailable'
      : 'Replay buffer not active';

  useEffect(() => {
    setPlaylistIds((current) => {
      const next = current.filter((id) => replayClips.some((clip) => clip.id === id));
      for (const clip of replayClips) if (!next.includes(clip.id)) next.push(clip.id);
      return next;
    });
  }, [replayClips]);

  useEffect(() => {
    if (!replayBuffer.active) return;
    const recorderSupported = typeof MediaRecorder !== 'undefined';
    const videoFrameSupported = typeof VideoFrame !== 'undefined';
    setRecording({
      id: `recording-${replayBuffer.sourceId ?? 'source'}`,
      label: replayBuffer.sourceId ? `Recording ${replayBuffer.sourceId}` : 'Current recording',
      startedAt: new Date().toISOString(),
      codec: recorderSupported ? `MediaRecorder${videoFrameSupported ? ' + VideoFrame' : ''}` : 'metadata simulator',
      frameCount: 0,
    });
    const interval = window.setInterval(() => {
      setRuntimeFrames((frames) => [...frames, createRuntimeFrame(bufferLengthMs)].filter((frame) => Date.now() - frame.capturedAt <= bufferLengthMs));
      setRecording((current) => (current ? { ...current, frameCount: current.frameCount + 1 } : current));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [bufferLengthMs, replayBuffer.active, replayBuffer.sourceId]);

  useEffect(() => {
    if (playbackState !== 'playing') {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
      return;
    }
    const tick = (time: number) => {
      const last = lastTickRef.current ?? time;
      lastTickRef.current = time;
      setPlayheadMs((current) => {
        const next = current + (time - last) * speed;
        if (next <= selectedDuration) return next;
        return loop ? 0 : selectedDuration;
      });
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
    };
  }, [loop, playbackState, selectedDuration, speed]);

  const playlistClips = useMemo(
    () => playlistIds.map((id) => replayClips.find((clip) => clip.id === id)).filter((clip): clip is ReplayClip => Boolean(clip)),
    [playlistIds, replayClips],
  );
  const playheadPercent = selectedDuration > 0 ? clamp((playheadMs / selectedDuration) * 100, 0, 100) : 0;
  const bufferPercent = replayBuffer.active ? clamp((runtimeFrames.length / Math.max(bufferLengthMs / 1000, 1)) * 100, 0, 100) : 0;
  const canRoute = Boolean(selectedClip);

  const routeSelectedClip = () => {
    if (!selectedClip) return;
    if (routeTarget === 'preview' || routeTarget === 'both') onSendToPreview?.(selectedClip.id);
    if (routeTarget === 'program' || routeTarget === 'both') onTakeLive?.(selectedClip.id);
  };

  const selectedMetadata = selectedClip as (ReplayClip & { metadata?: Record<string, unknown> }) | null;
  const inspectorRows = [
    ['Clip ID', selectedClip?.id ?? '—'],
    ['Duration', selectedClip ? formatDurationMs(selectedClip.durationMs) : '—'],
    ['Resolution', String(selectedMetadata?.metadata?.resolution ?? '1920x1080')],
    ['FPS', String(selectedMetadata?.metadata?.fps ?? 59.94)],
    ['Source', selectedClip?.sourceId ?? replayBuffer.sourceId ?? '—'],
    ['Created', String(selectedMetadata?.metadata?.createdAt ?? 'runtime metadata')],
    ['Playback speed', `${Math.round(speed * 100)}%`],
    ['Loop state', loop ? 'Looping' : 'Single play'],
  ];

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="flex items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Replay & Instant Replay Engine</h3>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{bufferLabel}</p>
        </div>
        <StatusBadge variant={replayBuffer.active ? 'success' : 'offline'}>{replayBuffer.status}</StatusBadge>
      </div>

      <div className="grid gap-ubos-2 p-ubos-2 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-ubos-2">
          <div className="grid gap-ubos-2 md:grid-cols-3">
            <InfoTile label="Current recording" value={recording ? `${recording.label} · ${recording.codec}` : 'No active runtime recording'} />
            <InfoTile label="Replay buffer" value={`${formatDurationMs(bufferLengthMs)} · ${runtimeFrames.length} runtime frames`} />
            <InfoTile label="Mark In / Out" value={`${formatDurationMs(markInMs)} / ${formatDurationMs(markOutMs || selectedDuration)}`} />
          </div>

          <div className="rounded-ubos-sm bg-ubos-midnight p-ubos-2">
            <div className="mb-ubos-2 flex flex-wrap items-center gap-ubos-2">
              <span className="text-ubos-caption text-ubos-fg-muted">Buffer length</span>
              {BUFFER_LENGTHS_MS.map((length) => (
                <BroadcastButton key={length} size="sm" variant={bufferLengthMs === length ? 'primary' : 'ghost'} onClick={() => setBufferLengthMs(length)}>
                  {length / 1000}s
                </BroadcastButton>
              ))}
            </div>
            <div className="flex h-8 items-center rounded-ubos-sm bg-ubos-graphite px-ubos-2">
              <div className="relative h-2 w-full rounded-full bg-ubos-border-subtle">
                <div className="absolute inset-y-0 left-0 rounded-full bg-ubos-accent/50" style={{ width: `${bufferPercent}%` }} />
                <div className="absolute -top-1 h-4 w-1 rounded bg-ubos-fg-primary" style={{ left: `${playheadPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-ubos-sm bg-ubos-midnight p-ubos-2">
            <h4 className="text-ubos-caption font-semibold uppercase tracking-wide text-ubos-fg-muted">Instant replay</h4>
            <div className="mt-ubos-2 flex flex-wrap gap-ubos-2">
              {INSTANT_REPLAY_WINDOWS_MS.map((windowMs) => (
                <BroadcastButton key={windowMs} size="sm" onClick={() => { setMarkInMs(Math.max(0, bufferLengthMs - windowMs)); setMarkOutMs(bufferLengthMs); setPlaybackState('playing'); }}>
                  Replay Last {windowMs / 1000} sec
                </BroadcastButton>
              ))}
              <BroadcastButton size="sm" variant="secondary" onClick={() => { setMarkInMs(playheadMs); setMarkOutMs(clamp(playheadMs + 5000, 0, selectedDuration)); }}>
                Replay Custom
              </BroadcastButton>
            </div>
          </div>

          <div className="rounded-ubos-sm bg-ubos-midnight p-ubos-2">
            <h4 className="text-ubos-caption font-semibold uppercase tracking-wide text-ubos-fg-muted">Timeline</h4>
            <div className="relative mt-ubos-2 h-20 overflow-hidden rounded-ubos-sm bg-ubos-graphite" style={{ transform: `scaleX(${timelineZoom})`, transformOrigin: 'left center' }}>
              <div className="absolute inset-x-0 top-5 h-2 bg-ubos-border-subtle" />
              <div className="absolute top-5 h-2 bg-ubos-accent/40" style={{ left: '0%', width: `${bufferPercent}%` }} />
              {replayClips.map((clip, index) => (
                <button key={clip.id} className="absolute top-10 h-6 rounded bg-ubos-accent px-1 text-[10px] text-black" style={{ left: `${(index * 18) % 82}%`, width: `${clamp((clip.durationMs / Math.max(bufferLengthMs, 1)) * 100, 8, 20)}%` }} onClick={() => onSelectReplayClip?.(clip.id)}>
                  {clip.name}
                </button>
              ))}
              {selectedClip?.markers.map((marker) => <span key={marker.id} className="absolute top-1 h-16 w-px bg-yellow-300" style={{ left: `${clamp((marker.timeMs / selectedDuration) * 100, 0, 100)}%` }} title={marker.label} />)}
              <span className="absolute top-0 h-full w-1 bg-white" style={{ left: `${playheadPercent}%` }} />
            </div>
            <div className="mt-ubos-2 flex flex-wrap gap-ubos-2">
              <BroadcastButton size="sm" variant="ghost" onClick={() => setTimelineZoom((value) => clamp(value + 0.25, 1, 3))}>Zoom +</BroadcastButton>
              <BroadcastButton size="sm" variant="ghost" onClick={() => setTimelineZoom((value) => clamp(value - 0.25, 1, 3))}>Zoom -</BroadcastButton>
              <BroadcastButton size="sm" variant="ghost" onClick={() => setMarkInMs(playheadMs)}>Mark In</BroadcastButton>
              <BroadcastButton size="sm" variant="ghost" onClick={() => setMarkOutMs(playheadMs)}>Mark Out</BroadcastButton>
            </div>
          </div>

          <div className="rounded-ubos-sm bg-ubos-midnight p-ubos-2">
            <h4 className="text-ubos-caption font-semibold uppercase tracking-wide text-ubos-fg-muted">Saved clips</h4>
            {!replayClips.length ? <MediaEmptyState message="Replay buffer inactive · No clips marked" className="min-h-[3rem]" /> : replayClips.map((clip) => (
              <ReplayClipRow key={clip.id} clip={clip} selected={selectedReplayClipId === clip.id} onSelect={() => onSelectReplayClip?.(clip.id)} onPreview={() => onPreview?.(clip.id)} onSendToPreview={() => onSendToPreview?.(clip.id)} onTakeLive={() => onTakeLive?.(clip.id)} />
            ))}
            {onAddSampleClip ? <BroadcastButton size="sm" variant="ghost" onClick={onAddSampleClip}>Add sample replay clip (metadata)</BroadcastButton> : null}
          </div>
        </section>

        <aside className="space-y-ubos-2">
          <ControlGroup title="Playback controls">
            <BroadcastButton size="sm" onClick={() => setPlaybackState('playing')}>Play</BroadcastButton>
            <BroadcastButton size="sm" variant="secondary" onClick={() => setPlaybackState('paused')}>Pause</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setPlayheadMs((value) => clamp(value + 1000 / 60, 0, selectedDuration))}>Frame Forward</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setPlayheadMs((value) => clamp(value - 1000 / 60, 0, selectedDuration))}>Frame Back</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setPlayheadMs(selectedDuration / 2)}>Jump</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setPlayheadMs(markInMs)}>Seek</BroadcastButton>
            <BroadcastButton size="sm" variant={loop ? 'primary' : 'ghost'} onClick={() => setLoop((value) => !value)}>Loop</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setPlayheadMs(0)}>Restart</BroadcastButton>
          </ControlGroup>

          <ControlGroup title="Slow motion">
            {SPEEDS.map((value) => <BroadcastButton key={value} size="sm" variant={speed === value ? 'primary' : 'ghost'} onClick={() => setSpeed(value)}>{Math.round(value * 100)}%</BroadcastButton>)}
            <span className="text-ubos-caption text-ubos-fg-muted">Reverse playback: architecture reserved; runtime disabled.</span>
          </ControlGroup>

          <ControlGroup title="Clip editor">
            <BroadcastButton size="sm" variant="ghost" onClick={() => setMarkInMs(playheadMs)}>Mark In</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setMarkOutMs(playheadMs)}>Mark Out</BroadcastButton>
            {['Rename', 'Tag', 'Favorite', 'Delete', 'Duplicate'].map((label) => <BroadcastButton key={label} size="sm" variant="ghost" onClick={() => setExportLog(`${label} queued for ${selectedClip?.id ?? 'no clip'} as metadata command.`)}>{label}</BroadcastButton>)}
            <BroadcastButton size="sm" onClick={() => setExportLog(buildExportMetadata(selectedClip, 'webm'))}>Export</BroadcastButton>
          </ControlGroup>

          <ControlGroup title="Playlist">
            {playlistClips.map((clip, index) => (
              <div key={clip.id} className="flex items-center justify-between gap-ubos-2 rounded-ubos-sm bg-ubos-graphite px-ubos-2 py-1 text-ubos-caption">
                <button onClick={() => onSelectReplayClip?.(clip.id)}>{index + 1}. {clip.name}</button>
                <span className="flex gap-1"><button onClick={() => setPlaylistIds((ids) => { const next = [...ids]; if (index > 0) { const previous = next[index - 1]; const current = next[index]; if (previous && current) { next[index - 1] = current; next[index] = previous; } } return next; })}>↑</button><button onClick={() => setPlaylistIds((ids) => ids.filter((_, i) => i !== index))}>×</button></span>
              </div>
            ))}
            <BroadcastButton size="sm" variant="ghost" onClick={() => selectedClip && setPlaylistIds((ids) => [...ids, selectedClip.id])}>Duplicate</BroadcastButton>
            <BroadcastButton size="sm" variant={playlistLoop ? 'primary' : 'ghost'} onClick={() => setPlaylistLoop((value) => !value)}>Loop playlist</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => playlistClips[0] && onSendToPreview?.(playlistClips[0].id)}>Preview playlist</BroadcastButton>
            <BroadcastButton size="sm" onClick={() => playlistClips[0] && onTakeLive?.(playlistClips[0].id)}>Program playlist</BroadcastButton>
          </ControlGroup>

          <ControlGroup title="Replay routing">
            {(['preview', 'program', 'both'] as const).map((target) => <BroadcastButton key={target} size="sm" variant={routeTarget === target ? 'primary' : 'ghost'} onClick={() => setRouteTarget(target)}>{target}</BroadcastButton>)}
            {(['CUT', 'TAKE', 'AUTO'] as const).map((mode) => <BroadcastButton key={mode} size="sm" variant={transition === mode ? 'primary' : 'ghost'} onClick={() => setTransition(mode)}>{mode}</BroadcastButton>)}
            <BroadcastButton size="sm" disabled={!canRoute} onClick={routeSelectedClip}>Route replay</BroadcastButton>
          </ControlGroup>

          <div className="rounded-ubos-sm bg-ubos-midnight p-ubos-2">
            <h4 className="text-ubos-caption font-semibold uppercase tracking-wide text-ubos-fg-muted">Inspector</h4>
            <dl className="mt-ubos-2 grid grid-cols-2 gap-1 text-ubos-caption">
              {inspectorRows.map(([label, value]) => <div key={label} className="contents"><dt className="text-ubos-fg-muted">{label}</dt><dd className="truncate text-ubos-fg-primary">{value}</dd></div>)}
            </dl>
          </div>

          <ControlGroup title="Export">
            <BroadcastButton size="sm" onClick={() => setExportLog(buildExportMetadata(selectedClip, 'webm'))}>WebM</BroadcastButton>
            <BroadcastButton size="sm" variant="secondary" onClick={() => setExportLog(buildExportMetadata(selectedClip, 'mp4'))}>MP4 metadata</BroadcastButton>
            <BroadcastButton size="sm" variant="ghost" onClick={() => setExportLog(buildExportMetadata(selectedClip, 'png'))}>PNG frame capture</BroadcastButton>
            <pre className="max-h-32 overflow-auto rounded-ubos-sm bg-ubos-graphite p-ubos-2 text-[10px] text-ubos-fg-muted">{exportLog}</pre>
          </ControlGroup>
        </aside>
      </div>
    </BroadcastPanel>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-ubos-sm bg-ubos-midnight px-ubos-2 py-1.5 text-ubos-caption"><div className="text-ubos-fg-muted">{label}</div><div className="truncate text-ubos-fg-primary">{value}</div></div>;
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-ubos-sm bg-ubos-midnight p-ubos-2"><h4 className="mb-ubos-2 text-ubos-caption font-semibold uppercase tracking-wide text-ubos-fg-muted">{title}</h4><div className="flex flex-wrap gap-ubos-2">{children}</div></div>;
}
