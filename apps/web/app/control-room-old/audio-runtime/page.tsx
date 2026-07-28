import type { ReactNode } from 'react';
import { AudioRuntime, createAudioRuntimeCommand } from '@ubos/shared';

const runtime = new AudioRuntime();
runtime.dispatch(createAudioRuntimeCommand('CREATE_AUDIO_CHANNEL', { channel: { id: 'mic-1', label: 'Mic 1', kind: 'mic' } }));
runtime.dispatch(createAudioRuntimeCommand('ASSIGN_CHANNEL_TO_BUS', { channelId: 'mic-1', busId: 'master' }));
const state = runtime.state;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-slate-800 bg-slate-950 p-4"><h2 className="text-sm font-semibold text-cyan-200">{title}</h2><div className="mt-3 text-sm text-slate-300">{children}</div></section>;
}

export default function AudioRuntimePage() {
  const channels = Object.values(state.channels);
  const buses = Object.values(state.buses);
  return <main className="min-h-screen bg-slate-950 p-6 text-slate-100"><div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3"><header className="lg:col-span-3"><p className="text-xs uppercase tracking-widest text-cyan-300">Phase 22</p><h1 className="text-3xl font-bold">Audio DSP & Mixing Runtime</h1><p className="text-slate-400">Audio runtime unavailable · No DSP engine connected · Metering unavailable · Metadata only</p></header><Panel title="Audio Runtime Dashboard"><p>Status: {state.health.status}</p><p>Adapter connected: {String(state.health.adapterConnected)}</p><p>Channels: {channels.length}</p></Panel><Panel title="Channel Runtime Panel">{channels.map((c) => <p key={c.id}>{c.label}: gain {c.gain}, muted {String(c.muted)}, solo {String(c.solo)}, meter unavailable</p>)}</Panel><Panel title="Bus Routing Panel">{buses.map((b) => <p key={b.id}>{b.label}: {b.channelIds.join(', ') || 'no channels'}</p>)}</Panel><Panel title="Master Bus Panel"><p>Gain: {state.mix.masterGain}</p><p>Muted: {String(state.mix.masterMuted)}</p><p>Peak: unavailable</p></Panel><Panel title="Monitor Panel"><p>{state.monitor.label}</p><p>Metering unavailable</p></Panel><Panel title="Audio Queue"><p>Queued commands: {state.queue.length}</p></Panel><Panel title="Audio Runtime Health">{state.health.warnings.map((w) => <p key={w}>{w}</p>)}</Panel><Panel title="Audio Runtime History"><p>Snapshots: {state.history.length}</p><p>Last command: {state.lastCommand}</p></Panel><Panel title="Audio Inspector"><pre className="overflow-auto text-xs">{JSON.stringify({ master: state.masterBus, monitor: state.monitor }, null, 2)}</pre></Panel></div></main>;
}
