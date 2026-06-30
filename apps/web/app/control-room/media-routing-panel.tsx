'use client';

import { Badge, Panel } from '@ubos/ui';
import {
  GuestStatus,
  mediaLayoutPresets,
  MediaRouteType,
  type BroadcastRealtimeEvent,
  type Guest,
  type MediaLayoutPreset,
  type MediaRoute,
  type Scene,
} from '@ubos/shared';
import { useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useBroadcastRealtime } from '../../lib/realtime';
import {
  assignGuestToRoute,
  assignRouteToScene,
  createRoute,
  removeRoute,
  setOnProgramRoute,
  setRouteMuted,
  setRoutePinned,
  updateLayoutSlot,
  updateRouteLayoutPreset,
} from './media-route-actions';

const routeLabels: Record<MediaRouteType, string> = {
  guest_camera: 'Guest Camera',
  guest_screen_share: 'Guest Screen',
  host_camera: 'Host Camera',
  media_source: 'Media Source',
  screen_share: 'Screen Share',
  placeholder: 'Placeholder',
};
const connectedStatuses = new Set<GuestStatus>([
  GuestStatus.Connected,
  GuestStatus.OnAir,
  GuestStatus.Muted,
  GuestStatus.GreenRoom,
]);
const actionClass =
  'rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-100 hover:bg-slate-700 disabled:opacity-40';

export function MediaRoutingPanel({
  guests,
  routes,
  scenes,
  broadcastId,
}: {
  guests: Guest[];
  routes: MediaRoute[];
  scenes: Scene[];
  broadcastId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  useBroadcastRealtime(
    { workspaceId: 'demo-workspace', broadcastId },
    useCallback(
      (event: BroadcastRealtimeEvent) => {
        if (event.eventType.startsWith('route:')) router.refresh();
      },
      [router],
    ),
  );
  const activeProgram = routes.find((route) => route.isOnProgram);
  const selectedPreset =
    (activeProgram?.metadata.layoutPreset as MediaLayoutPreset | undefined) ?? 'full_screen';
  const routesByGuest = useMemo(
    () => new Map(routes.filter((route) => route.guestId).map((route) => [route.guestId, route])),
    [routes],
  );
  const ensureRoute = (guest: Guest) =>
    startTransition(async () => {
      const existing = routesByGuest.get(guest.id);
      if (existing) {
        await assignGuestToRoute(existing.id, guest.id);
        return;
      }
      const formData = new FormData();
      formData.set('broadcastId', broadcastId);
      formData.set('guestId', guest.id);
      formData.set('displayName', guest.displayName);
      formData.set('routeType', MediaRouteType.GuestCamera);
      await createRoute(formData);
    });
  const setSlot = (routeId: string) => {
    const slot = window.prompt('Layout slot (for example A, B, PiP, Grid-1)', 'A');
    startTransition(async () => {
      await updateLayoutSlot(routeId, slot || null);
    });
  };
  return (
    <Panel
      title="Media Routing"
      action={
        <span className="text-xs text-slate-400">
          {isPending ? 'Routing…' : `${routes.length} routes`}
        </span>
      }
    >
      <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-slate-950/60 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-200">Program Route</p>
            <p className="font-black text-white">
              {activeProgram?.displayName ?? 'No route on program'}
            </p>
            <p className="text-xs text-slate-400">
              Layout: {mediaLayoutPresets.find((p) => p.id === selectedPreset)?.label}
            </p>
          </div>
          {activeProgram ? <Badge tone="live">On Program</Badge> : <Badge>Standby</Badge>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {mediaLayoutPresets.map((preset) => (
            <button
              key={preset.id}
              className={`rounded-xl border p-2 text-left text-xs font-bold ${preset.id === selectedPreset ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-slate-900 text-slate-300'}`}
              disabled={!activeProgram}
              onClick={() =>
                activeProgram &&
                startTransition(async () => {
                  await updateRouteLayoutPreset(activeProgram.id, preset.id);
                })
              }
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {guests.map((guest) => {
          const route = routesByGuest.get(guest.id);
          const connected = connectedStatuses.has(guest.status);
          return (
            <div key={guest.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{guest.displayName}</p>
                  <p className="text-xs text-slate-400">
                    Camera {connected ? 'ready/connected' : 'not connected'} · WebRTC stays
                    connected off-program
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <Badge tone={connected ? 'success' : 'neutral'}>{guest.status}</Badge>
                  {route?.isOnProgram ? <Badge tone="live">On Program</Badge> : null}
                  {route?.isPinned ? <Badge tone="warning">Pinned</Badge> : null}
                  <Badge tone={route?.isMuted ? 'danger' : 'success'}>
                    {route?.isMuted ? 'Muted' : 'Audio On'}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Route:{' '}
                {route
                  ? `${routeLabels[route.routeType]} · ${route.sceneId ? (scenes.find((s) => s.id === route.sceneId)?.name ?? 'Scene assigned') : 'No scene'} · Slot ${route.layoutSlot ?? '—'}`
                  : 'No route yet'}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <button
                  className={actionClass}
                  onClick={() =>
                    route
                      ? startTransition(async () => {
                          await setOnProgramRoute(route.id);
                        })
                      : ensureRoute(guest)
                  }
                  type="button"
                >
                  Send to Program
                </button>
                <button
                  className={actionClass}
                  disabled={!route?.isOnProgram}
                  onClick={() =>
                    startTransition(async () => {
                      await setOnProgramRoute(null);
                    })
                  }
                  type="button"
                >
                  Remove from Program
                </button>
                <button
                  className={actionClass}
                  onClick={() =>
                    route
                      ? startTransition(async () => {
                          await setRoutePinned(route.id);
                        })
                      : ensureRoute(guest)
                  }
                  type="button"
                >
                  {route?.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  className={actionClass}
                  onClick={() =>
                    route
                      ? startTransition(async () => {
                          await setRouteMuted(route.id);
                        })
                      : ensureRoute(guest)
                  }
                  type="button"
                >
                  {route?.isMuted ? 'Unmute' : 'Mute'}
                </button>
                <select
                  className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-100"
                  value={route?.sceneId ?? ''}
                  disabled={!route}
                  onChange={(e) =>
                    route &&
                    startTransition(async () => {
                      await assignRouteToScene(route.id, e.target.value || null);
                    })
                  }
                >
                  <option value="">Assign Scene</option>
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.name}
                    </option>
                  ))}
                </select>
                <button
                  className={actionClass}
                  disabled={!route}
                  onClick={() => route && setSlot(route.id)}
                  type="button"
                >
                  Assign Slot
                </button>
                <button
                  className={`${actionClass} bg-rose-500/80 hover:bg-rose-500`}
                  disabled={!route}
                  onClick={() =>
                    route &&
                    startTransition(async () => {
                      await removeRoute(route.id);
                    })
                  }
                  type="button"
                >
                  Remove Route
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
