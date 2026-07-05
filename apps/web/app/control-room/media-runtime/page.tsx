import { BroadcastPanel, StatusBadge } from '@ubos/ui';
import { MediaRuntime, createMediaPlaybackCommand } from '@ubos/shared';

const runtime = new MediaRuntime();
runtime.dispatch(createMediaPlaybackCommand('LOAD_MEDIA', {
  asset: {
    id: 'metadata-demo-asset',
    name: 'Metadata-safe demo asset',
    type: 'video',
    status: 'ready',
    durationMs: 90000,
    programState: 'idle',
    previewState: 'idle',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
  },
}));
runtime.dispatch(createMediaPlaybackCommand('PREPARE_MEDIA'));
runtime.dispatch(createMediaPlaybackCommand('STAGE_MEDIA_PREVIEW', { asset: runtime.state.currentMediaAsset }));
runtime.dispatch(createMediaPlaybackCommand('LOAD_PLAYLIST', {
  playlist: {
    id: 'playlist-demo',
    name: 'Runtime rundown',
    items: [{ id: 'playlist-item-1', assetId: 'metadata-demo-asset', label: 'Intro metadata' }],
    currentIndex: 0,
    mode: 'sequential',
    status: 'ready',
  },
}));

export default function MediaRuntimePage() {
  const state = runtime.state;
  const health = runtime.health;
  const metrics = runtime.metrics;

  return (
    <main className="space-y-ubos-3 p-ubos-4">
      <BroadcastPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Media Runtime Dashboard</h1>
            <p className="text-sm text-ubos-fg-muted">Metadata-safe playback orchestration. No decoding, streaming, recording, WebRTC, device capture, or DOM player is connected.</p>
          </div>
          <StatusBadge variant="warning">Playback runtime unavailable</StatusBadge>
        </div>
      </BroadcastPanel>
      <section className="grid gap-3 lg:grid-cols-2">
        <BroadcastPanel><h2 className="font-semibold">Playback Sessions</h2><dl className="mt-2 grid grid-cols-2 gap-2 text-sm"><dt>Active media session</dt><dd>{state.sessionId}</dd><dt>Playback state</dt><dd>{state.playbackState}</dd><dt>Active media</dt><dd>{state.currentMediaAsset?.name ?? 'None'}</dd><dt>Position</dt><dd>{state.playbackPositionMs}ms / {state.durationMs ?? 'unknown'}ms</dd><dt>Volume</dt><dd>{state.volume}</dd><dt>Speed</dt><dd>{state.speed}x</dd></dl></BroadcastPanel>
        <BroadcastPanel><h2 className="font-semibold">Playlist Runtime</h2><p className="mt-2 text-sm">{state.playlistRuntime.playlist?.name ?? 'No playlist loaded'} · {state.playlistRuntime.currentItem?.label ?? 'No current item'} · {state.playlistRuntime.mode}</p></BroadcastPanel>
        <BroadcastPanel><h2 className="font-semibold">Clip Runtime</h2><p className="mt-2 text-sm">{state.clipRuntime.currentClip?.name ?? 'No clip selected'} · in {state.clipRuntime.inPointMs}ms · out {state.clipRuntime.outPointMs ?? 'metadata unavailable'}</p></BroadcastPanel>
        <BroadcastPanel><h2 className="font-semibold">Media Queue</h2><p className="mt-2 text-sm">Queue size: {state.queue.length}. Last command: {state.lastCommand ?? 'None'}.</p></BroadcastPanel>
        <BroadcastPanel><h2 className="font-semibold">Media Runtime Health</h2><ul className="mt-2 list-disc pl-5 text-sm text-ubos-fg-muted">{health.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></BroadcastPanel>
        <BroadcastPanel><h2 className="font-semibold">Media Runtime History</h2><p className="mt-2 text-sm">Snapshots: {state.history.length}. Commands executed: {metrics.commandsExecuted}. Dropped: {metrics.droppedCommands}.</p></BroadcastPanel>
        <BroadcastPanel><h2 className="font-semibold">Media Runtime Inspector</h2><pre className="mt-2 overflow-auto rounded bg-black/20 p-2 text-xs">{JSON.stringify({ previewMedia: state.previewMedia?.id ?? null, programMedia: state.programMedia?.id ?? null, containsRuntimeHandles: state.containsRuntimeHandles }, null, 2)}</pre></BroadcastPanel>
      </section>
    </main>
  );
}
