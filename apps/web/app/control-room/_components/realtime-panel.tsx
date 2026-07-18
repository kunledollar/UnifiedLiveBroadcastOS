'use client';

import type { BroadcastRealtimeEvent } from '@ubos/shared';
import type { BroadcastRealtimeStatus } from '../../../lib/realtime';
import { ClientTime } from './client-time';

const statusLabels: Record<BroadcastRealtimeStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  'api-offline': 'API offline',
};

export function RealtimePanel({
  status,
  events,
}: {
  status: BroadcastRealtimeStatus;
  events: BroadcastRealtimeEvent[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 text-sm text-slate-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-black uppercase tracking-[0.18em] text-slate-400">Realtime Sync</h3>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-bold ${status === 'connected' ? 'bg-emerald-400/20 text-emerald-200' : status === 'api-offline' ? 'bg-slate-500/20 text-slate-200' : 'bg-amber-400/20 text-amber-100'}`}
        >
          {statusLabels[status]}
        </span>
      </div>
      <div className="max-h-52 space-y-2 overflow-auto">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500">
            {status === 'api-offline'
              ? 'Realtime API is offline. Local browser media smoke-test mode remains available.'
              : 'Waiting for broadcast events…'}
          </p>
        ) : null}
        {events.map((event, index) => (
          <div
            key={`${event.timestamp}-${event.eventType}-${index}`}
            className="rounded-xl bg-slate-950/70 p-2 text-xs"
          >
            <div className="flex justify-between gap-2">
              <span className="font-mono text-cyan-200">{event.eventType}</span>
              <span className="text-slate-500">
                <ClientTime iso={event.timestamp} />
              </span>
            </div>
            <p className="mt-1 text-slate-400">
              {event.entityType}
              {event.entityId ? ` · ${event.entityId}` : ''} · received
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
