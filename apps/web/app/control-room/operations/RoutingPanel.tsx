'use client';

import {
  AssetList,
  AssetRow,
  BroadcastButton,
  ConsoleSection,
  InspectorRow,
  StatusBadge,
} from '@ubos/ui';
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
import { useCallback, useMemo, useTransition, type TransitionStartFunction } from 'react';
import { useRouter } from 'next/navigation';
import { useBroadcastRealtime } from '../../../lib/realtime';
import {
  createRoute,
  removeRoute,
  setOnProgramRoute,
  setOnVerticalRoute,
  setRouteMuted,
  setRoutePinned,
  updateRouteLayoutPreset,
} from '../media-route-actions';
import { CompactOpsActions, OperationsPanel } from './OperationsChrome';
import { SceneThumbnail } from '../browsers/BrowserChrome';

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

const isVerticalRoute = (route?: MediaRoute | null) => route?.metadata?.onVertical === true;

function routeHealthVariant(route: MediaRoute | undefined, guest: Guest | undefined) {
  const connected = guest ? connectedStatuses.has(guest.status) : (route?.isActive ?? false);
  if (!route) return 'neutral' as const;
  if (!connected) return 'offline' as const;
  if (route.isMuted) return 'warning' as const;
  return 'success' as const;
}

function RouteRow({
  guest,
  route,
  scenes,
  broadcastId,
  startTransition,
}: {
  guest?: Guest | undefined;
  route?: MediaRoute | undefined;
  scenes: Scene[];
  broadcastId: string;
  startTransition: TransitionStartFunction;
}) {
  const connected = guest ? connectedStatuses.has(guest.status) : (route?.isActive ?? false);
  const title = guest?.displayName ?? route?.displayName ?? 'Unnamed route';
  const onVertical = isVerticalRoute(route);
  const sceneName = route?.sceneId
    ? (scenes.find((scene) => scene.id === route.sceneId)?.name ?? 'Scene assigned')
    : 'No scene';

  const ensureRoute = () => {
    if (route || !guest) return;
    const formData = new FormData();
    formData.set('broadcastId', broadcastId);
    formData.set('guestId', guest.id);
    formData.set('displayName', guest.displayName);
    formData.set('routeType', MediaRouteType.GuestCamera);
    startTransition(async () => {
      await createRoute(formData);
    });
  };

  const healthLabel = !route
    ? 'No active media route'
    : !connected
      ? 'Source offline'
      : route.isMuted
        ? 'Muted'
        : 'Ready';

  return (
    <AssetRow
      thumbnail={<SceneThumbnail label={route ? routeLabels[route.routeType].slice(0, 3) : 'RT'} />}
      title={title}
      subtitle={`${route ? routeLabels[route.routeType] : 'Route'} · ${sceneName}${route?.layoutSlot ? ` · Slot ${route.layoutSlot}` : ''}`}
      status={
        <div className="flex flex-col items-end gap-0.5">
          <StatusBadge variant={routeHealthVariant(route, guest)}>{healthLabel}</StatusBadge>
          {route?.isOnProgram ? <StatusBadge variant="live">PROGRAM</StatusBadge> : null}
          {onVertical ? <StatusBadge variant="warning">VERTICAL</StatusBadge> : null}
          {route?.isPinned ? <StatusBadge variant="preview">PINNED</StatusBadge> : null}
        </div>
      }
      action={
        <CompactOpsActions>
          <BroadcastButton
            size="sm"
            variant="ghost"
            onClick={() =>
              route
                ? startTransition(async () => {
                    await setOnProgramRoute(route.id);
                  })
                : ensureRoute()
            }
          >
            Program
          </BroadcastButton>
          <BroadcastButton
            size="sm"
            variant="ghost"
            disabled={!route?.isOnProgram}
            onClick={() =>
              startTransition(async () => {
                await setOnProgramRoute(null);
              })
            }
          >
            Off PGM
          </BroadcastButton>
          <BroadcastButton
            size="sm"
            variant="ghost"
            onClick={() =>
              route
                ? startTransition(async () => {
                    await setOnVerticalRoute(route.id);
                  })
                : ensureRoute()
            }
          >
            Vertical
          </BroadcastButton>
          <BroadcastButton
            size="sm"
            variant="ghost"
            onClick={() =>
              route
                ? startTransition(async () => {
                    await setRoutePinned(route.id);
                  })
                : ensureRoute()
            }
          >
            {route?.isPinned ? 'Unpin' : 'Pin'}
          </BroadcastButton>
          <BroadcastButton
            size="sm"
            variant="ghost"
            onClick={() =>
              route
                ? startTransition(async () => {
                    await setRouteMuted(route.id);
                  })
                : ensureRoute()
            }
          >
            {route?.isMuted ? 'Unmute' : 'Mute'}
          </BroadcastButton>
          {route ? (
            <BroadcastButton
              size="sm"
              variant="danger"
              onClick={() =>
                startTransition(async () => {
                  await removeRoute(route.id);
                })
              }
            >
              Remove
            </BroadcastButton>
          ) : null}
        </CompactOpsActions>
      }
    />
  );
}

export function RoutingPanel({
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
  const verticalRoute = routes.find(isVerticalRoute);
  const routesByGuest = useMemo(
    () => new Map(routes.filter((route) => route.guestId).map((route) => [route.guestId, route])),
    [routes],
  );
  const orphanRoutes = useMemo(() => {
    const guestIds = new Set(guests.map((guest) => guest.id));
    return routes.filter((route) => !route.guestId || !guestIds.has(route.guestId));
  }, [guests, routes]);
  const hasContent = guests.length > 0 || routes.length > 0;

  return (
    <OperationsPanel
      title="Routing"
      action={
        <span className="text-ubos-metadata text-ubos-fg-muted">
          {isPending ? 'Routing…' : `${routes.length} routes`}
        </span>
      }
    >
      <ConsoleSection title="Program Route">
        <InspectorRow
          label="Program"
          value={activeProgram?.displayName ?? 'No route on Program'}
        />
        <InspectorRow
          label="Layout"
          value={mediaLayoutPresets.find((preset) => preset.id === selectedPreset)?.label ?? '—'}
        />
        <InspectorRow
          label="Vertical"
          value={verticalRoute?.displayName ?? 'No vertical route configured'}
        />
        <div className="mt-ubos-2 flex flex-wrap gap-1">
          {mediaLayoutPresets.map((preset) => (
            <BroadcastButton
              key={preset.id}
              size="sm"
              variant={preset.id === selectedPreset ? 'primary' : 'secondary'}
              disabled={!activeProgram}
              onClick={() =>
                activeProgram &&
                startTransition(async () => {
                  await updateRouteLayoutPreset(activeProgram.id, preset.id);
                })
              }
            >
              {preset.label}
            </BroadcastButton>
          ))}
        </div>
      </ConsoleSection>

      <AssetList
        isEmpty={!hasContent}
        emptyMessage="No active media route"
      >
        {guests.map((guest) => (
          <RouteRow
            key={guest.id}
            guest={guest}
            route={routesByGuest.get(guest.id)}
            scenes={scenes}
            broadcastId={broadcastId}
            startTransition={startTransition}
          />
        ))}
        {orphanRoutes.map((route) => (
          <RouteRow
            key={route.id}
            route={route}
            scenes={scenes}
            broadcastId={broadcastId}
            startTransition={startTransition}
          />
        ))}
      </AssetList>

      {!hasContent ? (
        <p className="text-ubos-metadata text-ubos-fg-muted">
          No guests or routes yet. Invite guests to start routing cameras to program and vertical
          outputs.
        </p>
      ) : null}
    </OperationsPanel>
  );
}

/** @deprecated Use RoutingPanel */
export const MediaRoutingPanel = RoutingPanel;
