'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRenderForensics, recordForensicsStateWrite, ubosForensicsFlag } from '../render-forensics';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { AudioMeter } from './AudioMeter';
import { metersSemanticallyEqual } from './audio-stabilization-utils';

type RouteId = 'program' | 'recording' | 'streaming' | 'monitor';
type MixerSourceType = 'camera' | 'screen' | 'media' | 'browser' | 'guest' | 'master';

type MixerSource = {
  id: string;
  name: string;
  type: MixerSourceType;
  stream: MediaStream | null;
};

type ChannelMetadata = {
  gain: number;
  mute: boolean;
  solo: boolean;
  balance: number;
  routing: Record<RouteId, boolean>;
};

type MeterState = {
  left: number;
  right: number;
  peak: number;
  clipping: boolean;
  channels: number;
  sampleRate: number | null;
};

type HistoryEntry = { id: string; channel: string; event: string; at: string };

type RuntimeNodes = {
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  gain: GainNode;
  panner: StereoPannerNode;
  analyser: AnalyserNode;
  data: Uint8Array<ArrayBuffer>;
};

const routes: RouteId[] = ['program', 'recording', 'streaming', 'monitor'];
const clippingThreshold = 92;
const mixerMeterUpdateMs = 100;

function createDefaultMetadata(type: MixerSourceType): ChannelMetadata {
  return {
    gain: type === 'master' ? 1 : 1,
    mute: false,
    solo: false,
    balance: 0,
    routing: { program: true, recording: true, streaming: true, monitor: type !== 'master' },
  };
}

function emptyMeter(): MeterState {
  return { left: 0, right: 0, peak: 0, clipping: false, channels: 0, sampleRate: null };
}

function sourceKindLabel(type: MixerSourceType) {
  return type === 'master' ? 'Master Bus' : `${type[0]!.toUpperCase()}${type.slice(1)} Source`;
}

export function ProfessionalAudioMixer({
  sources,
  className,
  compact = false,
}: {
  sources: MixerSource[];
  className?: string;
  compact?: boolean;
}) {
  useRenderForensics('ProfessionalAudioMixer');
  const [metadata, setMetadata] = useState<Record<string, ChannelMetadata>>(() =>
    Object.fromEntries(sources.map((source) => [source.id, createDefaultMetadata(source.type)])),
  );
  const [meters, setMeters] = useState<Record<string, MeterState>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const nodesRef = useRef<Record<string, RuntimeNodes>>({});
  const frameRef = useRef<number>(0);

  useEffect(() => {
    setMetadata((current) => {
      let changed = false;
      const next = { ...current };
      for (const source of sources) {
        if (!next[source.id]) {
          next[source.id] = createDefaultMetadata(source.type);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [sources]);

  const appendHistory = useCallback((channel: string, event: string) => {
    setHistory((current) => [
      { id: `${Date.now()}-${channel}-${event}`, channel, event, at: new Date().toISOString() },
      ...current,
    ].slice(0, 8));
  }, []);

  useEffect(() => {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const activeIds = new Set(sources.map((source) => source.id));
    for (const [id, runtime] of Object.entries(nodesRef.current)) {
      if (!activeIds.has(id) || !sources.find((source) => source.id === id)?.stream) {
        runtime.source.disconnect();
        runtime.gain.disconnect();
        runtime.panner.disconnect();
        runtime.analyser.disconnect();
        void runtime.context.close();
        delete nodesRef.current[id];
      }
    }

    for (const source of sources) {
      if (source.type === 'master' || !source.stream?.getAudioTracks().length || nodesRef.current[source.id]) continue;
      const context = new AudioContextConstructor();
      const mediaSource = context.createMediaStreamSource(source.stream);
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      mediaSource.connect(gain);
      gain.connect(panner);
      panner.connect(analyser);
      nodesRef.current[source.id] = {
        context,
        source: mediaSource,
        gain,
        panner,
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>,
      };
    }

    return () => {
      for (const runtime of Object.values(nodesRef.current)) {
        runtime.source.disconnect();
        runtime.gain.disconnect();
        runtime.panner.disconnect();
        runtime.analyser.disconnect();
        void runtime.context.close();
      }
      nodesRef.current = {};
    };
  }, [sources]);

  useEffect(() => {
    for (const [id, runtime] of Object.entries(nodesRef.current)) {
      const meta = metadata[id] ?? createDefaultMetadata('camera');
      runtime.gain.gain.value = meta.mute ? 0 : meta.gain;
      runtime.panner.pan.value = meta.balance;
    }
  }, [metadata]);

  useEffect(() => {
    let lastUpdate = 0;
    const tick = (time: number) => {
      if (time - lastUpdate >= mixerMeterUpdateMs) {
        const nextMeters: Record<string, MeterState> = {};
        let masterPeak = 0;
        for (const source of sources) {
          const runtime = nodesRef.current[source.id];
          if (!runtime) continue;
          runtime.analyser.getByteTimeDomainData(runtime.data);
          let peak = 0;
          for (const value of runtime.data) peak = Math.max(peak, Math.abs(value - 128));
          const raw = Math.min(100, Math.round((peak / 64) * 100));
          const meta = metadata[source.id] ?? createDefaultMetadata(source.type);
          const level = meta.mute ? 0 : Math.min(100, raw * Math.min(meta.gain, 2));
          const leftBias = meta.balance > 0 ? 1 - meta.balance : 1;
          const rightBias = meta.balance < 0 ? 1 + meta.balance : 1;
          nextMeters[source.id] = {
            left: Math.round(level * leftBias),
            right: Math.round(level * rightBias),
            peak: Math.round(level),
            clipping: level >= clippingThreshold,
            channels: source.stream?.getAudioTracks()[0]?.getSettings().channelCount ?? 2,
            sampleRate: runtime.context.sampleRate,
          };
          if (meta.routing.program && !meta.mute) masterPeak = Math.max(masterPeak, level);
        }
        nextMeters.master = {
          left: Math.round(masterPeak),
          right: Math.round(masterPeak),
          peak: Math.round(masterPeak),
          clipping: masterPeak >= clippingThreshold,
          channels: 2,
          sampleRate: Object.values(nodesRef.current)[0]?.context.sampleRate ?? null,
        };
        if (!ubosForensicsFlag('mixer-setter-disabled')) {
          setMeters((current) => {
            const semanticEqual = metersSemanticallyEqual(current, nextMeters);
            recordForensicsStateWrite('ProfessionalAudioMixer.setMeters', current, nextMeters);
            return semanticEqual ? current : nextMeters;
          });
        }
        for (const source of sources) {
          if (nextMeters[source.id]?.clipping) appendHistory(source.name, 'clipping detected');
        }
        lastUpdate = time;
      }
      if (!ubosForensicsFlag('mixer-raf-disabled')) frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [appendHistory, metadata, sources]);

  const soloActive = useMemo(() => Object.values(metadata).some((channel) => channel.solo), [metadata]);
  const updateChannel = (source: MixerSource, patch: Partial<ChannelMetadata>, event: string) => {
    setMetadata((current) => ({
      ...current,
      [source.id]: { ...(current[source.id] ?? createDefaultMetadata(source.type)), ...patch },
    }));
    appendHistory(source.name, event);
  };

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('h-full border-0 shadow-none', className)}>
      <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 px-ubos-2 py-ubos-2', compact && 'py-1')}>
        {!compact ? (
          <div className="flex shrink-0 flex-wrap items-center gap-ubos-2">
            <span className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>Professional Audio Mixer</span>
            <StatusBadge variant="neutral">Web Audio API</StatusBadge>
            <StatusBadge variant={meters.master?.clipping ? 'warning' : 'neutral'}>Master {meters.master?.peak ?? 0}%</StatusBadge>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ubos-fg-primary">Mixer</span>
            <StatusBadge variant={meters.master?.clipping ? 'warning' : 'neutral'}>M {meters.master?.peak ?? 0}%</StatusBadge>
          </div>
        )}
        <div className="ubos-scroll flex min-h-0 flex-1 gap-ubos-2 overflow-x-auto">
          {sources.map((source) => {
            const meta = metadata[source.id] ?? createDefaultMetadata(source.type);
            const meter = meters[source.id] ?? emptyMeter();
            const effectivelyMuted = meta.mute || (soloActive && !meta.solo && source.type !== 'master');
            return (
              <div
                key={source.id}
                className={cn(
                  'flex shrink-0 flex-col gap-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon p-2',
                  compact ? 'w-24' : 'w-36',
                )}
              >
                <div>
                  <p className="ubos-truncate text-xs font-bold uppercase text-ubos-fg-primary" title={source.name}>{source.name}</p>
                  {!compact ? (
                    <>
                      <p className="text-[0.625rem] uppercase text-ubos-fg-muted">{sourceKindLabel(source.type)}</p>
                      <p className="font-mono text-[0.625rem] text-ubos-fg-secondary">Peak {meter.peak}%</p>
                    </>
                  ) : (
                    <p className="font-mono text-[0.625rem] text-ubos-fg-muted">{meter.peak}%</p>
                  )}
                </div>
                <div className="flex justify-center gap-1">
                  <AudioMeter level={effectivelyMuted ? 0 : meter.left} muted={effectivelyMuted} />
                  <AudioMeter level={effectivelyMuted ? 0 : meter.right} muted={effectivelyMuted} />
                </div>
                {meter.clipping ? <span className="rounded bg-ubos-program/20 px-1 text-center text-[0.625rem] font-bold text-ubos-program">CLIP</span> : null}
                <label className="grid gap-0.5 text-[0.625rem] uppercase text-ubos-fg-muted">
                  {compact ? `G${Math.round(meta.gain * 100)}` : `Gain ${Math.round(meta.gain * 100)}%`}
                  <input type="range" min={0} max={2} step={0.01} value={meta.gain} onChange={(event) => updateChannel(source, { gain: Number(event.target.value) }, 'gain changed')} className="h-1" />
                </label>
                {!compact ? (
                  <label className="grid gap-1 text-[0.625rem] uppercase text-ubos-fg-muted">Pan {meta.balance.toFixed(2)}
                    <input type="range" min={-1} max={1} step={0.01} value={meta.balance} onChange={(event) => updateChannel(source, { balance: Number(event.target.value) }, 'balance changed')} />
                  </label>
                ) : null}
                <div className="grid grid-cols-2 gap-1">
                  <button type="button" onClick={() => updateChannel(source, { mute: !meta.mute }, meta.mute ? 'mute cleared' : 'muted')} className={cn('rounded border px-1 py-0.5 text-[0.625rem]', meta.mute ? 'border-ubos-program text-ubos-program' : 'border-ubos-border-subtle')}>M</button>
                  <button type="button" onClick={() => updateChannel(source, { solo: !meta.solo }, meta.solo ? 'solo cleared' : 'soloed')} className={cn('rounded border px-1 py-0.5 text-[0.625rem]', meta.solo ? 'border-ubos-warning text-ubos-warning' : 'border-ubos-border-subtle')}>S</button>
                </div>
                {!compact ? (
                  <>
                    <div className="grid grid-cols-2 gap-1 text-[0.625rem]">
                      {routes.map((route) => (
                        <label key={route} className="flex items-center gap-1 uppercase text-ubos-fg-muted">
                          <input type="checkbox" checked={meta.routing[route]} onChange={(event) => updateChannel(source, { routing: { ...meta.routing, [route]: event.target.checked } }, `${route} route changed`)} />{route.slice(0, 3)}
                        </label>
                      ))}
                    </div>
                    <div className="rounded bg-ubos-midnight p-1 text-[0.625rem] text-ubos-fg-muted">
                      <p>{meter.sampleRate ? `${meter.sampleRate} Hz` : 'No runtime node'}</p>
                      <p>{meter.channels} ch · muted {String(meta.mute)}</p>
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
          {!compact ? (
            <div className="w-56 shrink-0 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-2">
              <p className="text-xs font-bold uppercase">Audio History</p>
              {history.length ? history.map((entry) => <p key={entry.id} className="mt-1 text-[0.625rem] text-ubos-fg-muted">{entry.channel}: {entry.event}</p>) : <p className="mt-2 text-[0.625rem] text-ubos-fg-muted">No events yet.</p>}
            </div>
          ) : null}
        </div>
      </div>
    </BroadcastPanel>
  );
}
