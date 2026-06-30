'use client';

import { useBroadcastRealtime } from '../../../lib/realtime';

const guestEvents = new Set([
  'guest:admitted',
  'guest:rejected',
  'guest:removed',
  'guest:muted',
  'guest:unmuted',
  'guest:spotlighted',
  'broadcast:statusChanged',
]);

export function GuestRealtimeStatus() {
  const { status, events } = useBroadcastRealtime({ workspaceId: 'demo-workspace', broadcastId: 'demo-broadcast' });
  const latest = events.find((event) => guestEvents.has(event.eventType));
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-200">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">Realtime guest updates</span>
        <span className={status === 'connected' ? 'text-emerald-300' : 'text-amber-200'}>{status}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {latest ? `${latest.eventType} received at ${new Date(latest.timestamp).toLocaleTimeString()}` : 'Waiting for host admission, mute, spotlight, removal, or broadcast-ended events.'}
      </p>
    </div>
  );
}
