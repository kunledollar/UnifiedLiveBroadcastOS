'use client';

import { BroadcastPanel, StatusBadge } from '@ubos/ui';
import type { MediaRuntimeHealth, MediaRuntimeState } from '@ubos/shared';

export function MediaRuntimePanel({ state, health }: { state: MediaRuntimeState; health: MediaRuntimeHealth }) {
  return (
    <BroadcastPanel>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Media Runtime</h3>
        <StatusBadge variant={health.playbackRuntimeUnavailable ? 'warning' : 'success'}>{health.playbackRuntimeUnavailable ? 'Unavailable' : 'Connected'}</StatusBadge>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-ubos-fg-muted">Active media session</dt><dd>{state.sessionId}</dd>
        <dt className="text-ubos-fg-muted">Preview media</dt><dd>{state.previewMedia?.id ?? 'None'}</dd>
        <dt className="text-ubos-fg-muted">Program media</dt><dd>{state.programMedia?.id ?? 'None'}</dd>
        <dt className="text-ubos-fg-muted">Playlist state</dt><dd>{state.playlistRuntime.status}</dd>
        <dt className="text-ubos-fg-muted">Playback state</dt><dd>{state.playbackState}</dd>
        <dt className="text-ubos-fg-muted">Queue size</dt><dd>{state.queue.length}</dd>
        <dt className="text-ubos-fg-muted">Last command</dt><dd>{state.lastCommand ?? 'None'}</dd>
        <dt className="text-ubos-fg-muted">Health</dt><dd>{health.warnings.join(' · ')}</dd>
      </dl>
    </BroadcastPanel>
  );
}
